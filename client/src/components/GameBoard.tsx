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

const GameBoard: React.FC = () => {
  const { gameState, playCard, buyCard, endPhase, addLogMessage } = useDeckBuilder();
  const { phase } = useGame();
  const { toggleMute, isMuted, playCardPlay, playCardBuy, playButton } = useAudio();
  
  // State for the DeckViewer modal
  const [isDeckViewerOpen, setIsDeckViewerOpen] = useState(false);
  
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
  
  // Handlers for game actions
  const handlePlayCard = (cardIndex: number) => {
    // Only play if player can perform actions
    if (isPlayerTurn && gameState.phase === 'action' && activePlayer.actions > 0) {
      playCard(cardIndex);
      playCardPlay();
      
      // Add log message
      const cardName = activePlayer.hand[cardIndex]?.name || 'Unknown card';
      addLogMessage(`You played ${cardName}.`);
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
  
  const handleBuyCard = (cardIndex: number) => {
    // Only buy if player can perform buys
    if (isPlayerTurn && gameState.phase === 'buy' && activePlayer.buys > 0) {
      const card = gameState.market.availableCards[cardIndex];
      if (card && activePlayer.credits >= card.cost) {
        buyCard(cardIndex);
        playCardBuy();
        
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
    playButton();
    
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
    playButton();
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
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <Player 
                player={otherPlayer} 
                isActive={!isPlayerTurn}
                turnNumber={gameState.turnNumber}
                phase={gameState.phase}
              />
            </div>
            
            {/* Game logs */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-64 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-2 text-cyan-400">SYSTEM LOG</h2>
              <GameLog logs={gameState.logs} />
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
            
            {/* Player hand */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-2 text-cyan-400">YOUR HAND</h2>
              <Hand 
                cards={activePlayer.hand} 
                onCardClick={handlePlayCard}
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
    <div className="min-h-screen bg-gray-900 text-gray-200 pb-20 md:pb-4 md:p-4">
      {/* Sound toggle */}
      <button 
        onClick={toggleMute}
        className="fixed top-4 right-4 text-cyan-400 hover:text-cyan-300 z-10 w-10 h-10 flex items-center justify-center bg-gray-800/80 rounded-full"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      
      <div className="container mx-auto">
        <header className="mb-6 p-4 text-center">
          <h1 className="text-3xl font-bold text-cyan-400 tracking-wide">NETRUNNER</h1>
          <div className="mt-2 text-sm text-cyan-600">TURN {gameState.turnNumber} • {gameState.phase.toUpperCase()} PHASE</div>
        </header>
        
        {/* Desktop layout - 3 columns */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 p-4">
          {/* Left column - Opponent & Logs */}
          <div className="space-y-4">
            {/* Opponent info */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <Player 
                player={otherPlayer} 
                isActive={!isPlayerTurn}
                turnNumber={gameState.turnNumber}
                phase={gameState.phase}
              />
            </div>
            
            {/* Game logs */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-64 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-2 text-cyan-400">SYSTEM LOG</h2>
              <GameLog logs={gameState.logs} />
            </div>
          </div>
          
          {/* Middle column - Market & Actions */}
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
            
            {/* Action buttons */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <ActionButtons 
                onEndPhase={handleEndPhase}
                currentPhase={gameState.phase}
                isPlayerTurn={isPlayerTurn}
                onViewDeck={handleViewDeck}
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
            
            {/* Player hand */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-2 text-cyan-400">YOUR HAND</h2>
              <Hand 
                cards={activePlayer.hand} 
                onCardClick={handlePlayCard}
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
        </div>
        
        {/* Mobile layout - Tabs */}
        <div className="md:hidden px-2">
          {/* Tab content */}
          {renderTabContent()}
          
          {/* Action buttons always visible on mobile */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
            <ActionButtons 
              onEndPhase={handleEndPhase}
              currentPhase={gameState.phase}
              isPlayerTurn={isPlayerTurn}
              onViewDeck={handleViewDeck}
            />
          </div>
          
          {/* Mobile tab navigation - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-cyan-900 shadow-lg z-20">
            <div className="flex justify-around">
              <button
                onClick={() => { setActiveTab('hand'); playButton(); }}
                className={`flex-1 py-4 px-2 text-center ${activeTab === 'hand' ? 'bg-cyan-900 text-white' : 'text-cyan-500'}`}
              >
                <div className="text-xl mb-1">👐</div>
                <div className="text-xs">HAND</div>
              </button>
              <button
                onClick={() => { setActiveTab('market'); playButton(); }}
                className={`flex-1 py-4 px-2 text-center ${activeTab === 'market' ? 'bg-cyan-900 text-white' : 'text-cyan-500'}`}
              >
                <div className="text-xl mb-1">🛒</div>
                <div className="text-xs">MARKET</div>
              </button>
              <button
                onClick={() => { setActiveTab('opponent'); playButton(); }}
                className={`flex-1 py-4 px-2 text-center ${activeTab === 'opponent' ? 'bg-cyan-900 text-white' : 'text-cyan-500'}`}
              >
                <div className="text-xl mb-1">👤</div>
                <div className="text-xs">OPPONENT</div>
              </button>
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
    </div>
  );
};

export default GameBoard;