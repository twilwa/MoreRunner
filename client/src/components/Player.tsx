import React from 'react';
import { Player as PlayerType } from '../lib/game/player';

interface PlayerProps {
  player: PlayerType;
  isActive: boolean;
  turnNumber: number;
  phase: string;
}

const Player: React.FC<PlayerProps> = ({ player, isActive, turnNumber, phase }) => {
  return (
    <div className={`p-4 rounded-lg mb-4 ${isActive ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          {player.name} 
          {isActive && <span className="text-blue-500 ml-2">(Active)</span>}
        </h2>
        
        <div className="flex items-center space-x-2">
          <div className="bg-red-100 px-3 py-1 rounded-full">
            <span className="font-bold">{player.health}</span> ❤️
          </div>
        </div>
      </div>
      
      {isActive && (
        <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
          <div className="bg-green-100 p-2 rounded text-center">
            <div className="font-semibold">Turn</div>
            <div>{turnNumber}</div>
          </div>
          
          <div className="bg-purple-100 p-2 rounded text-center">
            <div className="font-semibold">Phase</div>
            <div className="capitalize">{phase}</div>
          </div>
          
          <div className="bg-yellow-100 p-2 rounded text-center">
            <div className="font-semibold">Actions</div>
            <div>{player.actions}</div>
          </div>
          
          <div className="bg-orange-100 p-2 rounded text-center">
            <div className="font-semibold">Buys</div>
            <div>{player.buys}</div>
          </div>
        </div>
      )}
      
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-100 p-2 rounded text-center">
          <div>Hand</div>
          <div className="font-semibold">{player.hand.length} cards</div>
        </div>
        
        <div className="bg-gray-100 p-2 rounded text-center">
          <div>Deck</div>
          <div className="font-semibold">{player.deck.length} cards</div>
        </div>
        
        <div className="bg-gray-100 p-2 rounded text-center">
          <div>Discard</div>
          <div className="font-semibold">{player.discard.length} cards</div>
        </div>
      </div>
      
      {player.inPlay.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-semibold">In Play:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {player.inPlay.map((card, index) => (
              <div key={index} className="bg-white text-xs px-2 py-1 rounded border">
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
