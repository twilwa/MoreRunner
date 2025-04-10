import React, { useState, useEffect } from 'react';
import GameBoard from './components/GameBoard';
import StartScreen from './components/StartScreen';
import { useGame } from './lib/stores/useGame';
import { useDeckBuilder } from './lib/stores/useDeckBuilder';
import '@fontsource/inter';

// Define a type for the AI thinking state
type AIThinking = {
  isThinking: boolean;
  actionType: 'playing' | 'buying' | null;
  message: string;
};

function App() {
  // Game phase from useGame store
  const { phase, start, restart } = useGame();
  
  // Access deck builder store for AI opponent logic
  const { gameState, playCard, buyCard, endPhase, addLogMessage } = useDeckBuilder();
  
  // AI thinking state
  const [aiThinking, setAIThinking] = useState<AIThinking>({
    isThinking: false,
    actionType: null,
    message: ''
  });
  
  // Function to handle starting the game
  const handleStartGame = () => {
    start();
  };
  
  // Function to reset and restart the game
  const handleRestartGame = () => {
    restart();
  };
  
  // AI opponent logic - runs when it's the AI's turn
  useEffect(() => {
    if (!gameState) return;
    
    const isAITurn = gameState.activePlayerIndex === 1;
    const currentPhase = gameState.phase;
    
    // Only proceed if it's the AI's turn and we're not already thinking
    if (isAITurn && !aiThinking.isThinking) {
      // Add small delay to make it feel like the AI is thinking
      const thinkingTime = 1000 + Math.random() * 1000;
      
      if (currentPhase === 'action') {
        // AI is deciding which card to play
        setAIThinking({
          isThinking: true,
          actionType: 'playing',
          message: 'analyzing action options...'
        });
        
        // Add thinking message to the system log
        addLogMessage('SENTINEL AI is analyzing action options...');
        
        setTimeout(() => {
          const aiPlayer = gameState.players[gameState.activePlayerIndex];
          
          // Basic AI logic: play a random card if possible, otherwise end phase
          if (aiPlayer.hand.length > 0 && aiPlayer.actions > 0) {
            // Play random card
            const randomCardIndex = Math.floor(Math.random() * aiPlayer.hand.length);
            playCard(randomCardIndex);
            addLogMessage(`SENTINEL AI evaluates strategy and deploys a program.`);
          } else {
            // No cards or actions, end phase
            endPhase();
            addLogMessage(`SENTINEL AI ends action phase.`);
          }
          
          setAIThinking({
            isThinking: false,
            actionType: null,
            message: ''
          });
        }, thinkingTime);
      } 
      else if (currentPhase === 'buy') {
        // AI is deciding which card to buy
        setAIThinking({
          isThinking: true,
          actionType: 'buying',
          message: 'calculating purchases...'
        });
        
        // Add thinking message to the system log
        addLogMessage('SENTINEL AI is calculating purchases...');
        
        setTimeout(() => {
          const aiPlayer = gameState.players[gameState.activePlayerIndex];
          const market = gameState.market;
          
          // Find affordable cards
          const affordableCardIndices = market.availableCards
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => card.cost <= aiPlayer.credits)
            .map(({ index }) => index);
          
          // Basic AI logic: buy the most expensive affordable card, otherwise end phase
          if (affordableCardIndices.length > 0 && aiPlayer.buys > 0) {
            // Find the most expensive card (simple strategy)
            const mostExpensiveCardIndex = affordableCardIndices.reduce((prevIndex, currIndex) => {
              const prevCost = market.availableCards[prevIndex].cost;
              const currCost = market.availableCards[currIndex].cost;
              return currCost > prevCost ? currIndex : prevIndex;
            }, affordableCardIndices[0]);
            
            buyCard(mostExpensiveCardIndex);
            addLogMessage(`SENTINEL AI acquires new assets from the market.`);
          } else {
            // No affordable cards or no buys left, end phase
            endPhase();
            addLogMessage(`SENTINEL AI ends purchase phase.`);
          }
          
          setAIThinking({
            isThinking: false,
            actionType: null,
            message: ''
          });
        }, thinkingTime);
      }
      else {
        // For any other phase, just end it
        setTimeout(() => {
          if (currentPhase === 'cleanup') {
            addLogMessage('SENTINEL AI ends turn.');
          }
          endPhase();
        }, 500);
      }
    }
  }, [gameState, aiThinking, playCard, buyCard, endPhase, addLogMessage]);
  
  // Show loading state if no game phase is set
  if (phase === null) {
    return <div>Loading...</div>;
  }
  
  // Show the appropriate screen based on game phase
  return (
    <div className="min-h-screen bg-gray-900">
      {phase === 'ready' ? (
        <StartScreen onStartGame={handleStartGame} />
      ) : (
        <div className="relative">
          <GameBoard />

          
          {/* Game over overlay with restart button */}
          {gameState?.phase === 'game_over' && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40">
              <div className="bg-gray-900 border-2 border-red-700 p-8 rounded-lg max-w-md text-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">CONNECTION TERMINATED</h2>
                <p className="text-gray-300 mb-6">The network connection has been severed. All operations have ceased.</p>
                
                <button
                  onClick={handleRestartGame}
                  className="px-6 py-3 rounded-md text-white font-mono tracking-wide
                    bg-gradient-to-r from-red-700 to-pink-700 hover:from-red-600 hover:to-pink-600
                    transform transition-all duration-200 hover:scale-105 
                    shadow-lg border-2 border-red-500"
                >
                  REBOOT SYSTEM
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
