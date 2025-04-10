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
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Deck Builder Prototype</h1>
      
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
        playerCoins={activePlayer.coins}
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
      <div className="mt-8 text-center text-sm text-gray-500">
        {phase === 'game_over' ? (
          <p className="font-bold text-lg">Game Over!</p>
        ) : (
          <p>
            {phase === 'action' && 'Play action cards or end action phase.'}
            {phase === 'buy' && 'Buy cards from the market or end buy phase.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
