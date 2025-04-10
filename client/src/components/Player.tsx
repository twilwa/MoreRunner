import React from 'react';
import { Player as PlayerType } from '../lib/game/player';

interface PlayerProps {
  player: PlayerType;
  isActive: boolean;
  turnNumber: number;
  phase: string;
}

const Player: React.FC<PlayerProps> = ({ player, isActive, turnNumber, phase }) => {
  // Function to render faction reputation bars
  const renderReputationBars = () => {
    return (
      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
        {Object.entries(player.factionReputation).map(([faction, value]) => {
          // Determine color based on faction
          const colorClass = 
            faction === 'Corp' ? 'from-blue-700 to-blue-500' :
            faction === 'Runner' ? 'from-green-700 to-green-500' : 
            'from-red-700 to-red-500'; // Street
          
          return (
            <div key={faction} className="flex flex-col">
              <div className="flex justify-between">
                <span className="text-xs text-cyan-400">{faction}</span>
                <span className="text-xs text-cyan-300">{value}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${colorClass}`} 
                  style={{ width: `${value}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className={`p-4 rounded-lg mb-4 ${isActive 
      ? 'bg-gray-800 border border-cyan-600 shadow-lg shadow-cyan-800/30' 
      : 'bg-gray-900 border border-gray-700'}`}>
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-bold ${isActive ? 'text-cyan-400' : 'text-gray-400'}`}>
          {player.name} 
          {isActive && <span className="text-cyan-500 ml-2">[ACTIVE]</span>}
        </h2>
        
        <div className="flex items-center space-x-2">
          <div className="bg-red-900 border border-red-500 px-3 py-1 rounded-full text-red-400">
            <span className="font-bold">{player.health}</span> HP
          </div>
          <div className="bg-yellow-900 border border-yellow-500 px-3 py-1 rounded-full text-yellow-400">
            <span className="font-bold">{player.credits}</span> ¤
          </div>
        </div>
      </div>
      
      {renderReputationBars()}
      
      {isActive && (
        <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
          <div className="bg-green-900 border border-green-600 p-2 rounded text-center text-green-400">
            <div className="font-semibold">Turn</div>
            <div>{turnNumber}</div>
          </div>
          
          <div className="bg-purple-900 border border-purple-600 p-2 rounded text-center text-purple-400">
            <div className="font-semibold">Phase</div>
            <div className="capitalize">{phase}</div>
          </div>
          
          <div className="bg-blue-900 border border-blue-600 p-2 rounded text-center text-blue-400">
            <div className="font-semibold">Actions</div>
            <div>{player.actions}</div>
          </div>
          
          <div className="bg-yellow-900 border border-yellow-600 p-2 rounded text-center text-yellow-400">
            <div className="font-semibold">Buys</div>
            <div>{player.buys}</div>
          </div>
        </div>
      )}
      
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-800 border border-gray-600 p-2 rounded text-center text-gray-300">
          <div>Hand</div>
          <div className="font-semibold">{player.hand.length} cards</div>
        </div>
        
        <div className="bg-gray-800 border border-gray-600 p-2 rounded text-center text-gray-300">
          <div>Deck</div>
          <div className="font-semibold">{player.deck.length} cards</div>
        </div>
        
        <div className="bg-gray-800 border border-gray-600 p-2 rounded text-center text-gray-300">
          <div>Discard</div>
          <div className="font-semibold">{player.discard.length} cards</div>
        </div>
      </div>
      
      {/* Installed cards */}
      {player.installedCards && player.installedCards.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-semibold text-blue-400">Installed:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {player.installedCards.map((card, index) => (
              <div key={index} className="bg-blue-900 text-xs px-2 py-1 rounded border border-blue-500 text-blue-300">
                {card.name}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Face down cards */}
      {player.faceDownCards && player.faceDownCards.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-semibold text-red-400">Face Down:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {player.faceDownCards.map((_, index) => (
              <div key={index} className="bg-red-900 text-xs px-2 py-1 rounded border border-red-500 text-red-300">
                [HIDDEN]
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* In play cards */}
      {player.inPlay.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-semibold text-cyan-400">In Play:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {player.inPlay.map((card, index) => (
              <div key={index} className="bg-cyan-900 text-xs px-2 py-1 rounded border border-cyan-500 text-cyan-300">
                {card.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
