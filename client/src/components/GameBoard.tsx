import React, { useState } from 'react';
import { useDeckBuilder } from '../lib/stores/useDeckBuilder';
import { useGame } from '../lib/stores/useGame';
import { useAudio } from '../lib/stores/useAudio';
import { DropResult } from 'react-beautiful-dnd';
import Hand from './Hand';
import Market from './Market';
import Player from './Player';
import ActionButtons from './ActionButtons';
import GameLog from './GameLog';
import DeckViewer from './DeckViewer';
import LocationCard from './LocationCard';
import ResourceActions from './ResourceActions';
import DraggableHand from './DraggableHand';
import ExecuteButton from './ExecuteButton';
import { Card as CardType } from '../lib/game/cards';



const GameBoard: React.FC = () => {
  const { 
    gameState, 
    locationDeck,
    playCard, 
    buyCard, 
    endPhase, 
    addLogMessage,
    drawLocation,
    drawCard,
    gainCredit,
    queueCard,
    returnQueuedCard,
    reorderQueuedCards,
    executeQueuedCards
  } = useDeckBuilder();
  const { phase } = useGame();
  const { toggleMute, isMuted } = useAudio();
  
  // State for the DeckViewer modal
  const [isDeckViewerOpen, setIsDeckViewerOpen] = useState(false);
  
  // State for mobile layout
  const [activeTab, setActiveTab] = useState<'log' | 'market' | 'hand'>('hand');
  
  // Only show game if state is initialized and in playing phase
  if (!gameState || phase !== 'playing') {
    return <div className="flex items-center justify-center h-screen">Loading game...</div>;
  }
  
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const otherPlayerIndex = gameState.activePlayerIndex === 0 ? 1 : 0;
  const otherPlayer = gameState.players[otherPlayerIndex];
  const isPlayerTurn = gameState.activePlayerIndex === 0;
  
  // GAME ACTION HANDLERS
  
  // Handlers for game actions
  const handleQueueCard = (cardIndex: number) => {
    // Queue a card anytime during player's turn
    if (isPlayerTurn && activePlayer.actions > 0) {
      queueCard(cardIndex);
    } else {
      // Show why the card can't be queued
      if (!isPlayerTurn) {
        addLogMessage('Cannot queue cards during opponent\'s turn.');
      } else if (activePlayer.actions <= 0) {
        addLogMessage('No actions remaining for this turn.');
      }
    }
  };
  
  // Handle clicking a card in the queue to return it to hand
  const handleReturnQueuedCard = (cardIndex: number) => {
    if (isPlayerTurn) {
      returnQueuedCard(cardIndex);
    } else {
      addLogMessage('Cannot modify queue during opponent\'s turn.');
    }
  };
  
  // Handle drag-and-drop reordering of cards in the queue
  const handleDragEnd = (result: DropResult) => {
    // Drop outside of the droppable area
    if (!result.destination) {
      return;
    }
    
    // No change in position
    if (result.destination.index === result.source.index) {
      return;
    }
    
    // Reorder the cards in the queue
    if (isPlayerTurn) {
      reorderQueuedCards(result.source.index, result.destination.index);
    } else {
      addLogMessage('Cannot reorder cards during opponent\'s turn.');
    }
  };
  
  // Execute all queued cards in order (without ending the action phase)
  const handleExecuteQueuedCards = () => {
    if (isPlayerTurn) {
      if (activePlayer.inPlay.length > 0) {
        executeQueuedCards();
        addLogMessage('Executed all queued cards. You can continue to play more cards.');
      } else {
        addLogMessage('No cards in queue to execute.');
      }
    }
  };
  
  const handleBuyCard = (cardIndex: number) => {
    // Allow buying cards during player's turn, regardless of phase
    if (isPlayerTurn && activePlayer.buys > 0) {
      const card = gameState.market.availableCards[cardIndex];
      if (card && activePlayer.credits >= card.cost) {
        buyCard(cardIndex);
        
        // Add log message
        const cardName = card.name || 'Unknown card';
        addLogMessage(`You bought ${cardName} for ${card.cost} credits.`);
      } else {
        addLogMessage('Insufficient credits to purchase this card.');
      }
    } else {
      // Show why the card can't be bought
      if (!isPlayerTurn) {
        addLogMessage('Cannot buy cards during opponent\'s turn.');
      } else if (activePlayer.buys <= 0) {
        addLogMessage('No buys remaining for this turn.');
      }
    }
  };
  
  const handleEndPhase = () => {
    // Execute any queued cards first if ending action phase with cards in queue
    if (gameState.phase === 'action' && isPlayerTurn && activePlayer.inPlay.length > 0) {
      executeQueuedCards();
      addLogMessage('Executing all queued programs.');
    }
    
    endPhase();
    
    // Add log message based on phase
    if (gameState.phase === 'action') {
      addLogMessage('You ended your action phase.');
    } else if (gameState.phase === 'buy') {
      addLogMessage('You ended your buy phase.');
    } else if (gameState.phase === 'cleanup') {
      addLogMessage('You ended your turn.');
    }
  };
  
  const handleViewDeck = () => {
    setIsDeckViewerOpen(true);
  };
  
  // Determine if player can perform actions (removed phase restrictions)
  const canPlayCards = isPlayerTurn && activePlayer.actions > 0;
  const canBuyCards = isPlayerTurn && activePlayer.buys > 0;
  
  // Render the appropriate tab content for mobile layout
  const renderTabContent = () => {
    switch (activeTab) {
      case 'log':
        return (
          <div className="space-y-4">
            {/* Game logs */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-64 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-2 text-cyan-400">SYSTEM LOG</h2>
              <GameLog logs={gameState.logs} />
            </div>

            {/* Player queued cards (Active Programs) */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-cyan-400">ACTIVE PROGRAMS</h2>
                {gameState.phase === 'action' && isPlayerTurn && (
                  <ExecuteButton 
                    onExecute={handleExecuteQueuedCards}
                    disabled={!isPlayerTurn}
                    count={activePlayer.inPlay.length}
                  />
                )}
              </div>
              <div className="min-h-[140px] relative w-full overflow-hidden">
                <div className="w-full pr-2">
                  <DraggableHand 
                    cards={activePlayer.inPlay} 
                    onCardClick={handleReturnQueuedCard}
                    onDragEnd={handleDragEnd}
                    canPlayCards={isPlayerTurn}
                    title="Drag to reorder • Click to return to hand"
                    isQueue={true}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'market':
        return (
          <div className="space-y-4">
            {/* Market */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-2 text-cyan-400">DATAMARKET</h2>
              <Market 
                market={gameState.market} 
                onCardClick={handleBuyCard}
                canBuyCards={canBuyCards}
                playerCoins={activePlayer.credits}
              />
            </div>
          </div>
        );
      case 'hand':
      default:
        return (
          <div className="space-y-4">
            {/* Player info */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <Player 
                player={activePlayer} 
                isActive={isPlayerTurn}
                turnNumber={gameState.turnNumber}
                phase={gameState.phase}
              />
            </div>
            
            {/* Player hand with compact resource actions */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-cyan-400">YOUR HAND</h2>
                <ResourceActions
                  onDrawCard={drawCard}
                  onGainCredit={gainCredit}
                  isPlayerTurn={isPlayerTurn}
                  compact={true}
                />
              </div>
              <Hand 
                cards={activePlayer.hand} 
                onCardClick={handleQueueCard}
                canPlayCards={canPlayCards}
              />
            </div>
            
            {/* Player queued cards (Active Programs) */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-cyan-400">ACTIVE PROGRAMS</h2>
                {gameState.phase === 'action' && isPlayerTurn && (
                  <ExecuteButton 
                    onExecute={handleExecuteQueuedCards}
                    disabled={!isPlayerTurn}
                    count={activePlayer.inPlay.length}
                  />
                )}
              </div>
              <div className="min-h-[140px] relative w-full overflow-hidden">
                <div className="w-full pr-2">
                  <DraggableHand 
                    cards={activePlayer.inPlay} 
                    onCardClick={handleReturnQueuedCard}
                    onDragEnd={handleDragEnd}
                    canPlayCards={isPlayerTurn}
                    title="Drag to reorder • Click to return to hand"
                    isQueue={true}
                  />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex flex-col overflow-hidden">
      {/* Sound toggle */}
      <button 
        onClick={toggleMute}
        className="fixed top-4 right-4 text-cyan-400 hover:text-cyan-300 z-20 w-10 h-10 flex items-center justify-center bg-gray-800/80 rounded-full"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      
      {/* Fixed Header */}
      <header className="flex-none bg-gray-900 p-4 border-b border-gray-800 text-center">
        <h1 className="text-3xl font-bold text-cyan-400 tracking-wide">NETRUNNER</h1>
        <div className="mt-2 text-sm text-cyan-600">TURN {gameState.turnNumber} • {gameState.phase.toUpperCase()} PHASE</div>
      </header>
      
      {/* Main Content - This is the only scrollable area */}
      <div className="flex-grow overflow-y-auto pb-24 md:pb-8">
        <div className="container mx-auto max-w-screen-xl px-2 md:px-4">
          {/* Current Location - Full width on desktop and mobile */}
          <div className="p-4">
            <h2 className="text-xl font-bold text-cyan-400 mb-3">CURRENT LOCATION</h2>
            <LocationCard 
              location={locationDeck?.currentLocation || null}
              onDrawNextLocation={drawLocation}
              canDrawNextLocation={isPlayerTurn}
              hasFoundObjective={locationDeck?.hasFoundObjective || false}
              hasReachedExit={locationDeck?.hasReachedExit || false}
            />
          </div>
          
          {/* Desktop layout - New structure with wider Active Programs */}
          <div className="hidden md:grid md:grid-cols-12 gap-6 p-4">
            {/* Left column - System Log and Hand (6 cols) */}
            <div className="col-span-6 space-y-4">
              {/* Game logs */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-64 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-2 text-cyan-400">SYSTEM LOG</h2>
                <GameLog logs={gameState.logs} />
              </div>
              
              {/* Player hand with compact resource actions */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-cyan-400">YOUR HAND</h2>
                  <ResourceActions
                    onDrawCard={drawCard}
                    onGainCredit={gainCredit}
                    isPlayerTurn={isPlayerTurn}
                    compact={true}
                  />
                </div>
                <Hand 
                  cards={activePlayer.hand} 
                  onCardClick={handleQueueCard}
                  canPlayCards={canPlayCards}
                />
              </div>
            </div>
            
            {/* Right area - Market and Player (6 cols) */}
            <div className="col-span-6 space-y-4">
              {/* Player info with View Deck button */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <Player 
                  player={activePlayer} 
                  isActive={isPlayerTurn}
                  turnNumber={gameState.turnNumber}
                  phase={gameState.phase}
                  onViewDeck={handleViewDeck}
                />
              </div>
              
              {/* Market */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-lg font-semibold mb-2 text-cyan-400">DATAMARKET</h2>
                <Market 
                  market={gameState.market} 
                  onCardClick={handleBuyCard}
                  canBuyCards={canBuyCards}
                  playerCoins={activePlayer.credits}
                />
              </div>
              
              {/* Phase change buttons */}
              {gameState.phase !== 'action' && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <ActionButtons 
                    onEndPhase={handleEndPhase}
                    currentPhase={gameState.phase}
                    isPlayerTurn={isPlayerTurn}
                    onViewDeck={handleViewDeck}
                  />
                </div>
              )}
            </div>
            
            {/* Active Programs - Full width for better visualization */}
            <div className="col-span-12 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-cyan-400">ACTIVE PROGRAMS</h2>
                {gameState.phase === 'action' && isPlayerTurn && (
                  <ExecuteButton 
                    onExecute={handleExecuteQueuedCards}
                    disabled={!isPlayerTurn}
                    count={activePlayer.inPlay.length}
                  />
                )}
              </div>
              <div className="min-h-[170px] relative w-full overflow-hidden">
                <div className="w-full pr-2">
                  <DraggableHand 
                    cards={activePlayer.inPlay} 
                    onCardClick={handleReturnQueuedCard}
                    onDragEnd={handleDragEnd}
                    canPlayCards={isPlayerTurn}
                    title="Drag to reorder • Click to return to hand"
                    isQueue={true}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile layout - Tabs */}
          <div className="md:hidden px-2">
            {/* Tab content */}
            {renderTabContent()}
            
            {/* Action buttons always visible on mobile */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4 mb-20">
              {gameState.phase === 'action' && isPlayerTurn ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <h3 className="text-green-400 font-bold tracking-wider text-sm">ACTION PHASE: Queue cards, then execute</h3>
                  </div>
                  
                  <p className="text-sm text-green-300 text-center font-mono mb-4">TAP CARDS IN HAND to play them and gain advantages</p>
                  
                  <ExecuteButton 
                    onExecute={handleExecuteQueuedCards}
                    disabled={!isPlayerTurn}
                    count={activePlayer.inPlay.length}
                  />
                </div>
              ) : (
                <ActionButtons 
                  onEndPhase={handleEndPhase}
                  currentPhase={gameState.phase}
                  isPlayerTurn={isPlayerTurn}
                  onViewDeck={handleViewDeck}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile tab navigation - Fixed at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-cyan-900 shadow-lg z-20">
        <div className="flex justify-around">
          <button
            onClick={() => { setActiveTab('hand'); }}
            className={`flex-1 py-4 px-2 text-center ${activeTab === 'hand' ? 'bg-cyan-900 text-white' : 'text-cyan-500'}`}
          >
            <div className="text-xl mb-1">👐</div>
            <div className="text-xs">HAND</div>
          </button>
          <button
            onClick={() => { setActiveTab('market'); }}
            className={`flex-1 py-4 px-2 text-center ${activeTab === 'market' ? 'bg-cyan-900 text-white' : 'text-cyan-500'}`}
          >
            <div className="text-xl mb-1">🛒</div>
            <div className="text-xs">MARKET</div>
          </button>
          <button
            onClick={() => { setActiveTab('log'); }}
            className={`flex-1 py-4 px-2 text-center ${activeTab === 'log' ? 'bg-cyan-900 text-white' : 'text-cyan-500'}`}
          >
            <div className="text-xl mb-1">📜</div>
            <div className="text-xs">LOG</div>
          </button>
        </div>
      </div>
      
      {/* Deck Viewer Modal */}
      <DeckViewer 
        isOpen={isDeckViewerOpen}
        onClose={() => setIsDeckViewerOpen(false)}
        playerDeck={activePlayer.deck}
        playerDiscard={activePlayer.discard}
      />

    </div>
  );
};

export default GameBoard;
