import React, { useState } from 'react';
import { useDeckBuilder } from '../lib/stores/useDeckBuilder';

interface StartScreenProps {
  onStartGame: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  const [playerName, setPlayerName] = useState('NETRUNNER');
  const { initializeGame } = useDeckBuilder();
  
  const handleStartGame = () => {
    // Initialize with player and AI opponent
    initializeGame([playerName, 'SENTINEL AI']);
    // Call the callback to transition to game screen
    onStartGame();
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-cyan-300 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-cyan-400 tracking-tight">NETRUNNER</h1>
          <p className="text-xl text-cyan-500 mb-6">Cyberpunk Deck Builder</p>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-700 to-transparent mb-6"></div>
          
          <p className="mb-6 text-sm text-gray-400">
            In a world dominated by megacorporations and rogue hackers, build your deck, 
            deploy programs, and outmaneuver your opponents in this tactical deck building game.
          </p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-cyan-900 shadow-lg shadow-cyan-900/20 mb-6">
          <div className="mb-4">
            <label htmlFor="playerName" className="block text-sm font-medium text-cyan-500 mb-2">
              NETRUNNER HANDLE:
            </label>
            <input
              type="text"
              id="playerName"
              className="w-full px-4 py-2 rounded bg-gray-900 border border-cyan-700 text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-600 font-mono"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={15}
            />
          </div>
          
          <div className="flex flex-col space-y-3 mt-6">
            <button
              onClick={handleStartGame}
              className="w-full px-6 py-3 rounded-md text-white font-mono tracking-wide
                bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
                transform transition-all duration-200 hover:scale-105 
                shadow-lg hover:shadow-cyan-700/50 border-2 border-cyan-400"
            >
              INITIALIZE CONNECTION
            </button>
          </div>
        </div>
        
        <div className="text-xs text-center text-gray-500 font-mono">
          <p>SYSTEM VERSION 2.6.4 | ENCRYPTION: ENABLED</p>
          <p className="mt-1">WARNING: Unauthorized access is prohibited. System will log all connections.</p>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;