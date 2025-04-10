import React, { useEffect } from 'react';
import { useDeckBuilder } from '../lib/stores/useDeckBuilder';
import Player from './Player';
import Hand from './Hand';
import Market from './Market';
import GameLog from './GameLog';
import ActionButtons from './ActionButtons';

const GameBoard: React.FC = () => {
  const { 
    gameState, 
    initializeGame, 
    playCard, 
    buyCard, 
    endPhase 
  } = useDeckBuilder();
  
  // Initialize the game on mount
  useEffect(() => {
    initializeGame(['Player 1', 'Player 2']);
  }, [initializeGame]);
  
  if (!gameState) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading Game...</h1>
          <p>Preparing the deck builder prototype...</p>
        </div>
      </div>
    );
  }
  
  const { 
    players, 
    activePlayerIndex, 
    market, 
    phase, 
    turnNumber,
    logs
  } = gameState;
  
  const activePlayer = players[activePlayerIndex];
  const otherPlayers = players.filter((_, index) => index !== activePlayerIndex);
  
  // Handle card play action
  const handlePlayCard = (cardIndex: number) => {
    if (phase === 'action' && activePlayer.actions > 0) {
      playCard(cardIndex);
    }
  };
  
  // Handle card buy action
  const handleBuyCard = (cardIndex: number) => {
    if (phase === 'buy' && activePlayer.buys > 0) {
      buyCard(cardIndex);
    }
  };
  
  // Determine if we can play cards in the current phase
  const canPlayCards = phase === 'action' && activePlayer.actions > 0;
  
  // Determine if we can buy cards in the current phase
  const canBuyCards = phase === 'buy' && activePlayer.buys > 0;
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-gray-900 text-cyan-300 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-cyan-400">NETRUNNER: Cyberpunk Deck Builder</h1>
      
      {/* Other players */}
      <div className="mb-6">
        {otherPlayers.map((player, index) => (
          <Player 
            key={index} 
            player={player} 
            isActive={false}
            turnNumber={turnNumber}
            phase={phase}
          />
        ))}
      </div>
      
      {/* Market */}
      <Market 
        market={market} 
        onCardClick={handleBuyCard} 
        canBuyCards={canBuyCards} 
        playerCoins={activePlayer.credits}
      />
      
      {/* Game Log */}
      <GameLog logs={logs} />
      
      {/* Active Player */}
      <Player 
        player={activePlayer} 
        isActive={true}
        turnNumber={turnNumber}
        phase={phase}
      />
      
      {/* Player Hand */}
      <Hand 
        cards={activePlayer.hand} 
        onCardClick={handlePlayCard} 
        canPlayCards={canPlayCards}
      />
      
      {/* Action Buttons */}
      <ActionButtons 
        onEndPhase={endPhase} 
        currentPhase={phase}
        isPlayerTurn={true}
      />
      
      {/* Game State Text */}
      <div className="mt-8 text-center text-sm">
        {phase === 'game_over' ? (
          <div className="bg-red-900/30 p-4 rounded-lg border border-red-700 max-w-md mx-auto">
            <p className="font-bold text-lg text-red-500 animate-pulse mb-2">CONNECTION TERMINATED</p>
            <p className="text-red-400 font-mono">System error: 0x00DE4D</p>
            <p className="text-red-400 mt-2">All network connections have been severed. Reboot required.</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 p-4 rounded-lg border border-cyan-900 max-w-md mx-auto">
            <div className="text-cyan-400 font-mono flex items-center justify-center mb-2">
              <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full mr-2 animate-pulse"></span>
              SYSTEM STATUS: ACTIVE - {phase.toUpperCase()} PHASE
            </div>
            <p className="text-cyan-300 font-mono">
              {phase === 'action' && 'DIRECTIVE: Deploy programs or terminate action protocol.'}
              {phase === 'buy' && 'DIRECTIVE: Acquire assets from marketplace or terminate transaction protocol.'}
            </p>
            <div className="mt-3 flex justify-between text-xs text-cyan-700 font-mono">
              <span>NET ID: {Math.floor(Math.random() * 1000000).toString(16).padStart(6, '0')}</span>
              <span>ENCRYPTION: ACTIVE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
