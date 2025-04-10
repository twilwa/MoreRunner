import React from 'react';
import { Card as CardType } from '../lib/game/cards';
import Card from './Card';

interface HandProps {
  cards: CardType[];
  onCardClick: (index: number) => void;
  canPlayCards: boolean;
  title?: string;
}

const Hand: React.FC<HandProps> = ({ cards, onCardClick, canPlayCards, title = "MEMORY BUFFER" }) => {
  if (cards.length === 0) {
    return (
      <div className="mb-4 relative">
        <div className="flex items-center mb-3">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
          <h2 className="text-lg font-semibold text-purple-400 font-mono">{title}</h2>
        </div>
        
        <div className="flex justify-center items-center h-20 bg-gray-800 rounded-md border border-dashed border-purple-700 text-purple-400">
          <div className="flex flex-col items-center">
            <p className="text-purple-500 font-mono">STATUS: EMPTY</p>
            <p className="text-xs mt-1 text-purple-700">Memory allocation: 0/5</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 relative">
      <div className="flex items-center mb-3 justify-between">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
          <h2 className="text-lg font-semibold text-purple-400 font-mono">{title}</h2>
        </div>
        
        <div className="text-xs text-purple-500 font-mono">
          MEM USAGE: {cards.length}/5 {cards.length >= 5 ? '(WARNING: FULL)' : ''}
        </div>
      </div>
      
      <div className="flex items-start justify-center pb-6 relative">
        <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-purple-900/20 to-cyan-900/20 rounded-lg border border-purple-900"></div>
        
        <div className="flex overflow-x-auto gap-3 py-4 px-6 items-start scrollbar-thin scrollbar-thumb-purple-800 scrollbar-track-gray-900 z-10">
          {cards.map((card, index) => (
            <div 
              key={index} 
              className={`flex-shrink-0 transform transition-all duration-200 
                ${canPlayCards ? 'hover:translate-y-[-10px] hover:scale-105' : ''}
                ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}
              style={{
                transformOrigin: 'bottom center',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <Card 
                card={card} 
                onClick={() => onCardClick(index)} 
                disabled={!canPlayCards}
              />
              {canPlayCards && (
                <div className="text-center mt-1">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hand;
