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
import { Card as CardType } from '../lib/game/cards';

// Define the target type used in card confirmation
interface CardTarget {
  id: string;
  name: string;
  type: 'player' | 'card' | 'resource';
}

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
  
  // State for the card confirmation modal
  const [isCardConfirmOpen, setIsCardConfirmOpen] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedCardTargets, setSelectedCardTargets] = useState<CardTarget[]>([]);
  
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
  
  // Get the selected card (for confirmation modal)
  const getSelectedCard = (): CardType | null => {
    if (selectedCardIndex === null) return null;
    return activePlayer.hand[selectedCardIndex] || null;
  };
  
  // Prepare possible targets for card actions
  const getPossibleTargets = (): CardTarget[] => {
    const targets: CardTarget[] = [];
    
    // Add players as targets
    targets.push({
      id: `player-${activePlayer.id}`,
      name: activePlayer.name,
      type: 'player'
    });
    
    targets.push({
      id: `player-${otherPlayer.id}`,
      name: otherPlayer.name,
      type: 'player'
    });
    
    // Add opponent's cards in play as targets
    otherPlayer.inPlay.forEach((card, idx) => {
      targets.push({
        id: `card-opponent-${idx}`,
        name: card.name,
        type: 'card'
      });
    });
    
    // Return all possible targets
    return targets;
  };
  
  // Handlers for game actions
  const handleQueueCard = (cardIndex: number) => {
    // Queue a card for the action phase
    if (isPlayerTurn && gameState.phase === 'action' && activePlayer.actions > 0) {
      queueCard(cardIndex);
    } else {
      // Show why the card can't be queued
      if (!isPlayerTurn) {
        addLogMessage('Cannot queue cards during opponent\'s turn.');
      } else if (gameState.phase !== 'action') {
        addLogMessage(`Cannot queue cards during ${gameState.phase} phase.`);
      } else if (activePlayer.actions <= 0) {
        addLogMessage('No actions remaining. End the action phase.');
      }
    }
  };
  
  // Handle clicking a card in the queue to return it to hand
  const handleReturnQueuedCard = (cardIndex: number) => {
    if (isPlayerTurn && gameState.phase === 'action') {
      returnQueuedCard(cardIndex);
    } else {
      addLogMessage('Cannot modify queue during opponent\'s turn or outside action phase.');
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
    if (isPlayerTurn && gameState.phase === 'action') {
      reorderQueuedCards(result.source.index, result.destination.index);
    } else {
      addLogMessage('Cannot reorder cards during opponent\'s turn or outside action phase.');
    }
  };
  
  // Execute all queued cards in order when ending the action phase
  const handleExecuteQueuedCards = () => {
    if (isPlayerTurn && gameState.phase === 'action') {
      if (activePlayer.inPlay.length > 0) {
        executeQueuedCards();
      }
    }
  };
  
  const handleBuyCard = (cardIndex: number) => {
    // Only buy if player can perform buys
    if (isPlayerTurn && gameState.phase === 'buy' && activePlayer.buys > 0) {
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
      } else if (gameState.phase !== 'buy') {
        addLogMessage(`Cannot buy cards during ${gameState.phase} phase.`);
      } else if (activePlayer.buys <= 0) {
        addLogMessage('No buys remaining. End the buy phase.');
      }
    }
  };
  
  const handleEndPhase = () => {
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
  
  // Determine if player can perform actions
  const canPlayCards = isPlayerTurn && gameState.phase === 'action' && activePlayer.actions > 0;
  const canBuyCards = isPlayerTurn && gameState.phase === 'buy' && activePlayer.buys > 0;
  
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

            {/* Player in-play cards */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-2 text-cyan-400">ACTIVE PROGRAMS</h2>
              <Hand 
                cards={activePlayer.inPlay} 
                onCardClick={() => {}}
                canPlayCards={false}
                title="In Play"
              />
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
            
            {/* Player in-play cards */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-2 text-cyan-400">ACTIVE PROGRAMS</h2>
              <Hand 
                cards={activePlayer.inPlay} 
                onCardClick={() => {}}
                canPlayCards={false}
                title="In Play"
              />
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
          
          {/* Desktop layout - 3 columns */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 p-4">
            {/* Left column - Game Logs & Actions */}
            <div className="space-y-4">
              {/* Game logs */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-64 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-2 text-cyan-400">SYSTEM LOG</h2>
                <GameLog logs={gameState.logs} />
              </div>
              
              {/* Action buttons */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <ActionButtons 
                  onEndPhase={handleEndPhase}
                  currentPhase={gameState.phase}
                  isPlayerTurn={isPlayerTurn}
                  onViewDeck={handleViewDeck}
                />
              </div>
              
              {/* Active Programs */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-lg font-semibold mb-2 text-cyan-400">ACTIVE PROGRAMS</h2>
                <DraggableHand 
                  cards={activePlayer.inPlay} 
                  onCardClick={handleReturnQueuedCard}
                  onDragEnd={handleDragEnd}
                  canPlayCards={gameState.phase === 'action' && isPlayerTurn}
                  title="Drag to reorder • Click to return to hand"
                />
              </div>
            </div>
            
            {/* Middle column - Market */}
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
            
            {/* Right column - Player & Hand */}
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
            </div>
          </div>
          
          {/* Mobile layout - Tabs */}
          <div className="md:hidden px-2">
            {/* Tab content */}
            {renderTabContent()}
            
            {/* Action buttons always visible on mobile */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4 mb-20">
              <ActionButtons 
                onEndPhase={handleEndPhase}
                currentPhase={gameState.phase}
                isPlayerTurn={isPlayerTurn}
                onViewDeck={handleViewDeck}
              />
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
