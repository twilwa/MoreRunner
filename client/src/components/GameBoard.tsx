import React, { useState, useEffect } from 'react';
import { useDeckBuilder } from '../lib/stores/useDeckBuilder';
import { useGame } from '../lib/stores/useGame';
import { useAudio } from '../lib/stores/useAudio';
import Hand from './Hand';
import Market from './Market';
import Player from './Player';
import ActionButtons from './ActionButtons';
import GameLog from './GameLog';
import DeckViewer from './DeckViewer';
import CardConfirmationModal from './CardConfirmationModal';
import LocationCard from './LocationCard';
import ResourceActions from './ResourceActions';
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
    gainCredit
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
  const [activeTab, setActiveTab] = useState<'opponent' | 'market' | 'hand'>('hand');
  
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
  
  // Open confirmation modal for playing a card
  const openCardConfirmation = (cardIndex: number) => {
    // Only show confirmation for cards that can be played
    if (isPlayerTurn && gameState.phase === 'action' && activePlayer.actions > 0) {
      setSelectedCardIndex(cardIndex);
      setIsCardConfirmOpen(true);
    } else {
      // Show why the card can't be played
      if (!isPlayerTurn) {
        addLogMessage('Cannot play cards during opponent\'s turn.');
      } else if (gameState.phase !== 'action') {
        addLogMessage(`Cannot play cards during ${gameState.phase} phase.`);
      } else if (activePlayer.actions <= 0) {
        addLogMessage('No actions remaining. End the action phase.');
      }
    }
  };
  
  // Handle card play confirmation
  const handleCardPlayConfirm = (targets: CardTarget[]) => {
    if (selectedCardIndex !== null) {
      // Play the card with the selected targets
      playCard(selectedCardIndex);
      
      // Add log message with targeting information
      const cardName = activePlayer.hand[selectedCardIndex]?.name || 'Unknown card';
      if (targets.length > 0) {
        const targetNames = targets.map(t => t.name).join(', ');
        addLogMessage(`You played ${cardName} targeting ${targetNames}.`);
      } else {
        addLogMessage(`You played ${cardName}.`);
      }
      
      // Reset the confirmation state
      setIsCardConfirmOpen(false);
      setSelectedCardIndex(null);
      setSelectedCardTargets([]);
    }
  };
  
  // Handlers for game actions
  const handlePlayCard = (cardIndex: number) => {
    // Instead of immediately playing, open confirmation
    openCardConfirmation(cardIndex);
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
      case 'opponent':
        return (
          <div className="space-y-4">
            {/* Opponent info */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
              <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">OPPONENT</h2>
              <div className="p-4">
                <Player 
                  player={otherPlayer} 
                  isActive={!isPlayerTurn}
                  turnNumber={gameState.turnNumber}
                  phase={gameState.phase}
                />
              </div>
            </div>
            
            {/* Game logs */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
              <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">SYSTEM LOG</h2>
              <div className="p-4">
                <GameLog logs={gameState.logs.slice(-5)} />
              </div>
            </div>
          </div>
        );
      case 'market':
        return (
          <div className="space-y-4">
            {/* Market */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
              <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">DATAMARKET</h2>
              <div className="p-4">
                <Market 
                  market={gameState.market} 
                  onCardClick={handleBuyCard}
                  canBuyCards={canBuyCards}
                  playerCoins={activePlayer.credits}
                />
              </div>
            </div>
          </div>
        );
      case 'hand':
      default:
        return (
          <div className="space-y-4">
            {/* Player info */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
              <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">YOUR STATUS</h2>
              <div className="p-4">
                <Player 
                  player={activePlayer} 
                  isActive={isPlayerTurn}
                  turnNumber={gameState.turnNumber}
                  phase={gameState.phase}
                />
              </div>
            </div>
            
            {/* Player hand */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
              <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">YOUR HAND</h2>
              <div className="p-4">
                <Hand 
                  cards={activePlayer.hand} 
                  onCardClick={handlePlayCard}
                  canPlayCards={canPlayCards}
                />
              </div>
            </div>
            
            {/* Player in-play cards */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
              <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">INSTALLED PROGRAMS</h2>
              <div className="p-4">
                <Hand 
                  cards={activePlayer.inPlay} 
                  onCardClick={() => {}}
                  canPlayCards={false}
                  title="In Play"
                />
              </div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 overflow-y-auto overflow-x-hidden">
      {/* Sound toggle */}
      <button 
        onClick={toggleMute}
        className="fixed top-4 right-4 text-cyan-400 hover:text-cyan-300 z-50 w-12 h-12 flex items-center justify-center bg-gray-800/80 rounded-full shadow-lg"
      >
        <span className="text-xl">{isMuted ? '🔇' : '🔊'}</span>
      </button>
      
      <div className="max-w-screen-2xl mx-auto pb-24 md:pb-6">
        <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm py-4 px-8 mb-6 text-center shadow-lg">
          <h1 className="text-4xl font-bold text-cyan-400 tracking-wide">NETRUNNER</h1>
          <div className="mt-2 text-sm text-cyan-600 font-mono">TURN {gameState.turnNumber} • {gameState.phase.toUpperCase()} PHASE</div>
        </header>
        
        <div className="md:flex md:px-6">
          {/* Left side - Location */}
          <div className="md:w-1/3 md:pr-6 p-4">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
              <h2 className="text-2xl font-bold text-cyan-400 p-4 border-b border-gray-700/50">CURRENT LOCATION</h2>
              <div className="p-4">
                <LocationCard 
                  location={locationDeck?.currentLocation || null}
                  onDrawNextLocation={drawLocation}
                  canDrawNextLocation={isPlayerTurn}
                  hasFoundObjective={locationDeck?.hasFoundObjective || false}
                  hasReachedExit={locationDeck?.hasReachedExit || false}
                />
              </div>
            </div>
          </div>
          
          {/* Right side - Game content */}
          <div className="md:w-2/3 md:pl-6">
            {/* Desktop layout - 2 columns */}
            <div className="hidden md:grid md:grid-cols-2 gap-6 p-4">
              {/* Left column - Game Info */}
              <div className="space-y-6 max-h-full">
                {/* Opponent info */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
                  <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">OPPONENT</h2>
                  <div className="p-4">
                    <Player 
                      player={otherPlayer} 
                      isActive={!isPlayerTurn}
                      turnNumber={gameState.turnNumber}
                      phase={gameState.phase}
                    />
                  </div>
                </div>
                
                {/* Game logs */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
                  <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">SYSTEM LOG</h2>
                  <div className="p-4">
                    <GameLog logs={gameState.logs.slice(-5)} />
                  </div>
                </div>
                
                {/* Action controls */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
                  <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">CONTROLS</h2>
                  <div className="p-4">
                    <ActionButtons 
                      onEndPhase={handleEndPhase}
                      currentPhase={gameState.phase}
                      isPlayerTurn={isPlayerTurn}
                      onViewDeck={handleViewDeck}
                    />
                  </div>
                </div>
              </div>
              
              {/* Right column - Player & Market */}
              <div className="space-y-6 max-h-full">
                {/* Player info */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
                  <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">YOUR STATUS</h2>
                  <div className="p-4">
                    <Player 
                      player={activePlayer} 
                      isActive={isPlayerTurn}
                      turnNumber={gameState.turnNumber}
                      phase={gameState.phase}
                    />
                  </div>
                </div>
                
                {/* Market */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
                  <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">DATAMARKET</h2>
                  <div className="p-4">
                    <Market 
                      market={gameState.market} 
                      onCardClick={handleBuyCard}
                      canBuyCards={canBuyCards}
                      playerCoins={activePlayer.credits}
                    />
                  </div>
                </div>
                
                {/* Resource Actions */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
                  <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">BASIC ACTIONS</h2>
                  <div className="p-4">
                    <ResourceActions
                      onDrawCard={drawCard}
                      onGainCredit={gainCredit}
                      isPlayerTurn={isPlayerTurn}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cards section - full width in desktop */}
            <div className="hidden md:block p-4">
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50">
                <h2 className="text-xl font-bold text-cyan-400 p-4 border-b border-gray-700/50">YOUR CARDS</h2>
                <div className="grid grid-cols-2 gap-6 p-6">
                  {/* Player hand */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-cyan-400">HAND</h3>
                    <Hand 
                      cards={activePlayer.hand} 
                      onCardClick={handlePlayCard}
                      canPlayCards={canPlayCards}
                    />
                  </div>
                  
                  {/* Player in-play cards */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-cyan-400">INSTALLED PROGRAMS</h3>
                    <Hand 
                      cards={activePlayer.inPlay} 
                      onCardClick={() => {}}
                      canPlayCards={false}
                      title="In Play"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile layout - Tabs */}
            <div className="md:hidden px-2">
              {/* Tab content */}
              {renderTabContent()}
              
              {/* Resource Actions for mobile */}
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50 mt-4">
                <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">BASIC ACTIONS</h2>
                <div className="p-4">
                  <ResourceActions
                    onDrawCard={drawCard}
                    onGainCredit={gainCredit}
                    isPlayerTurn={isPlayerTurn}
                  />
                </div>
              </div>
              
              {/* Action buttons always visible on mobile */}
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 shadow-xl border border-gray-700/50 mt-4">
                <h2 className="text-lg font-semibold p-4 border-b border-gray-700/50 text-cyan-400">CONTROLS</h2>
                <div className="p-4">
                  <ActionButtons 
                    onEndPhase={handleEndPhase}
                    currentPhase={gameState.phase}
                    isPlayerTurn={isPlayerTurn}
                    onViewDeck={handleViewDeck}
                  />
                </div>
              </div>
              
              {/* Mobile tab navigation - Fixed at bottom */}
              <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-cyan-900 shadow-lg z-20">
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
                    onClick={() => { setActiveTab('opponent'); }}
                    className={`flex-1 py-4 px-2 text-center ${activeTab === 'opponent' ? 'bg-cyan-900 text-white' : 'text-cyan-500'}`}
                  >
                    <div className="text-xl mb-1">👤</div>
                    <div className="text-xs">OPPONENT</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Deck Viewer Modal */}
      <DeckViewer 
        isOpen={isDeckViewerOpen}
        onClose={() => setIsDeckViewerOpen(false)}
        playerDeck={activePlayer.deck}
        playerDiscard={activePlayer.discard}
      />
      
      {/* Card Confirmation Modal */}
      <CardConfirmationModal 
        isOpen={isCardConfirmOpen}
        card={getSelectedCard()}
        onClose={() => setIsCardConfirmOpen(false)}
        onConfirm={handleCardPlayConfirm}
        possibleTargets={getPossibleTargets()}
        playerName={activePlayer.name}
        opponentName={otherPlayer.name}
      />
    </div>
  );
};

export default GameBoard;