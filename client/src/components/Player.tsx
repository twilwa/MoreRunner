import React from 'react';
import { Player as PlayerType } from '../lib/game/player';

interface PlayerProps {
  player: PlayerType;
  isActive: boolean;
  turnNumber: number;
  phase: string;
  onViewDeck?: () => void;
}

const Player: React.FC<PlayerProps> = ({ player, isActive, turnNumber, phase, onViewDeck }) => {
  // Function to calculate total cards in player's possession
  const totalCards = () => {
    return player.deck.length + player.hand.length + player.discard.length + player.inPlay.length;
  };

  // Display faction reputation as icon and level
  const renderFactionReputation = (faction: keyof PlayerType['factionReputation'], color: string) => {
    const level = player.factionReputation[faction];
    return (
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-xs">{level}</span>
      </div>
    );
  };

  return (
    <div className={`rounded-lg ${isActive ? 'ring-2 ring-cyan-500 bg-gray-800/80' : 'bg-gray-800/40'}`}>
      {/* Player header */}
      <div className="flex justify-between items-center p-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-cyan-500 animate-pulse' : 'bg-gray-600'}`}></div>
          <h3 className="font-bold truncate max-w-[120px]" title={player.name}>
            {player.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onViewDeck && (
            <button 
              onClick={onViewDeck}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-cyan-300 border border-gray-600"
            >
              View Deck
            </button>
          )}
          <div className="text-xs text-gray-400">
            {isActive ? `${phase} PHASE` : 'WAITING'}
          </div>
        </div>
      </div>
      
      {/* Player stats */}
      <div className="grid grid-cols-2 gap-2 p-2">
        {/* Resources */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">CREDITS:</span>
            <span className="text-sm font-mono text-cyan-400">₵{player.credits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">ACTIONS:</span>
            <span className="text-sm font-mono">{player.actions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">BUYS:</span>
            <span className="text-sm font-mono">{player.buys}</span>
          </div>
        </div>
        
        {/* Cards & Health */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">HEALTH:</span>
            <span className="text-sm font-mono text-red-400">{player.health}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">DECK:</span>
            <span className="text-sm font-mono">{player.deck.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-400">DISCARD:</span>
            <span className="text-sm font-mono">{player.discard.length}</span>
          </div>
        </div>
      </div>
      
      {/* Faction reputation */}
      <div className="p-2 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-1">FACTION STANDING:</div>
        <div className="flex justify-between">
          {renderFactionReputation('Corp', 'bg-blue-500')}
          {renderFactionReputation('Runner', 'bg-green-500')}
          {renderFactionReputation('Street', 'bg-red-500')}
        </div>
      </div>
    </div>
  );
};

export default Player;