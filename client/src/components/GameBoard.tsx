import React, { useEffect } from 'react';
import { useDeckBuilder } from '../lib/stores/useDeckBuilder';
import { useGame } from '../lib/stores/useGame';
import Hand from './Hand';
import Market from './Market';
import Player from './Player';
import ActionButtons from './ActionButtons';
import GameLog from './GameLog';
import { useAudio } from '../lib/stores/useAudio';

const GameBoard: React.FC = () => {
  const { gameState, playCard, buyCard, endPhase } = useDeckBuilder();
  const { phase } = useGame();
  const { toggleMute, isMuted } = useAudio();
  
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
    playCard(cardIndex);
  };
  
  const handleBuyCard = (cardIndex: number) => {
    buyCard(cardIndex);
  };
  
  const handleEndPhase = () => {
    endPhase();
  };
  
  // Determine if player can perform actions
  const canPlayCards = isPlayerTurn && gameState.phase === 'action' && activePlayer.actions > 0;
  const canBuyCards = isPlayerTurn && gameState.phase === 'buy' && activePlayer.buys > 0;
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4">
      {/* Sound toggle */}
      <button 
        onClick={toggleMute}
        className="absolute top-4 right-4 text-cyan-400 hover:text-cyan-300 z-10"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      
      <div className="container mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-cyan-400 tracking-wide">NETRUNNER</h1>
          <div className="mt-2 text-sm text-cyan-600">TURN {gameState.turnNumber} • {gameState.phase.toUpperCase()} PHASE</div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
};

export default GameBoard;