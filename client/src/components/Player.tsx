import React from 'react';
import { Player as PlayerType } from '../lib/game/player';

interface PlayerProps {
  player: PlayerType;
  isActive: boolean;
  turnNumber: number;
  phase: string;
}

const Player: React.FC<PlayerProps> = ({ player, isActive, turnNumber, phase }) => {
  // Function to calculate total cards in player's possession
  const totalCards = () => {
    return player.deck.length + player.hand.length + player.discard.length + player.inPlay.length;
  };

  // Display faction reputation as icon and level
  const renderFactionReputation = (faction: keyof PlayerType['factionReputation'], color: string, label: string) => {
    const level = player.factionReputation[faction];
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <span className="text-lg font-mono">{level}</span>
        </div>
        <span className="text-xs mt-1 text-cyan-400/80">{label}</span>
      </div>
    );
  };

  return (
    <div className={`rounded-xl ${isActive ? 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40 ring-1 ring-cyan-500/40' : 'bg-gray-800/20'}`}>
      {/* Player header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-cyan-500 animate-pulse' : 'bg-gray-600'}`}></div>
          <h3 className="font-bold text-lg truncate max-w-[150px]" title={player.name}>
            {player.name}
          </h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-cyan-700/70 text-white' : 'bg-gray-700/70 text-gray-300'}`}>
          {isActive ? `${phase} PHASE` : 'WAITING'}
        </div>
      </div>
      
      {/* Player stats */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {/* Resources */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400">💰</div>
            <div>
              <div className="text-lg font-mono text-white">₵{player.credits}</div>
              <div className="text-xs text-cyan-400/80">CREDITS</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400">🎮</div>
            <div>
              <div className="text-lg font-mono text-white">{player.actions}</div>
              <div className="text-xs text-cyan-400/80">ACTIONS</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400">🛒</div>
            <div>
              <div className="text-lg font-mono text-white">{player.buys}</div>
              <div className="text-xs text-cyan-400/80">BUYS</div>
            </div>
          </div>
        </div>
        
        {/* Cards & Health */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center text-red-400">❤️</div>
            <div>
              <div className="text-lg font-mono text-white">{player.health}</div>
              <div className="text-xs text-cyan-400/80">HEALTH</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400">🃏</div>
            <div>
              <div className="text-lg font-mono text-white">{player.hand.length}</div>
              <div className="text-xs text-cyan-400/80">CARDS IN HAND</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center text-amber-400">📊</div>
            <div>
              <div className="text-lg font-mono text-white">{totalCards()}</div>
              <div className="text-xs text-cyan-400/80">TOTAL CARDS</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Card Counts */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-gray-800/30">
        <div className="text-center">
          <div className="font-mono text-white">{player.deck.length}</div>
          <div className="text-xs text-cyan-400/80">DECK</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-white">{player.discard.length}</div>
          <div className="text-xs text-cyan-400/80">DISCARD</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-white">{player.inPlay.length}</div>
          <div className="text-xs text-cyan-400/80">IN PLAY</div>
        </div>
      </div>
      
      {/* Faction reputation */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="text-sm text-cyan-400 mb-3">FACTION STANDING</div>
        <div className="flex justify-between">
          {renderFactionReputation('Corp', 'bg-blue-500', 'CORP')}
          {renderFactionReputation('Runner', 'bg-green-500', 'RUNNER')}
          {renderFactionReputation('Street', 'bg-red-500', 'STREET')}
        </div>
      </div>
    </div>
  );
};

export default Player;