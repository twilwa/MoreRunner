import React from 'react';
import { Card as CardType } from '../lib/game/cards';
import Card from './Card';

interface DeckViewerProps {
  isOpen: boolean;
  onClose: () => void;
  playerDeck: CardType[];
  playerDiscard: CardType[];
}

const DeckViewer: React.FC<DeckViewerProps> = ({ 
  isOpen, 
  onClose, 
  playerDeck, 
  playerDiscard 
}) => {
  // If not open, don't render anything
  if (!isOpen) return null;
  
  // Count the cards by type
  const cardTypeCount = playerDeck.reduce<{[key: string]: number}>((acc, card) => {
    acc[card.cardType] = (acc[card.cardType] || 0) + 1;
    return acc;
  }, {});
  
  // Count the cards by faction
  const factionCount = playerDeck.reduce<{[key: string]: number}>((acc, card) => {
    acc[card.faction] = (acc[card.faction] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border-2 border-cyan-900 rounded-lg max-w-4xl w-full max-h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-cyan-900 bg-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400">DECK ANALYZER</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {/* Content area with tabs */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Deck statistics */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">DECK PROFILE</h3>
              
              {/* Card counts */}
              <div className="bg-gray-800 p-4 rounded mb-4">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">CARD COUNTS</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Deck:</span>
                    <span className="text-sm font-mono">{playerDeck.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Discard:</span>
                    <span className="text-sm font-mono">{playerDiscard.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Total:</span>
                    <span className="text-sm font-mono">{playerDeck.length + playerDiscard.length}</span>
                  </div>
                </div>
              </div>
              
              {/* Card type breakdown */}
              <div className="bg-gray-800 p-4 rounded mb-4">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">CARD TYPES</h4>
                <div className="space-y-2">
                  {Object.entries(cardTypeCount).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{type}:</span>
                      <div className="flex items-center">
                        <div 
                          className="h-2 bg-cyan-600" 
                          style={{ width: `${Math.min(count * 10, 100)}px` }}
                        ></div>
                        <span className="text-sm font-mono ml-2">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Faction breakdown */}
              <div className="bg-gray-800 p-4 rounded">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">FACTION ALIGNMENT</h4>
                <div className="space-y-2">
                  {Object.entries(factionCount).map(([faction, count]) => {
                    let barColor = '';
                    switch (faction) {
                      case 'Corp': 
                        barColor = 'bg-blue-600'; 
                        break;
                      case 'Runner': 
                        barColor = 'bg-green-600'; 
                        break;
                      case 'Street': 
                        barColor = 'bg-red-600'; 
                        break;
                      default: 
                        barColor = 'bg-gray-600';
                    }
                    
                    return (
                      <div key={faction} className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">{faction}:</span>
                        <div className="flex items-center">
                          <div 
                            className={`h-2 ${barColor}`} 
                            style={{ width: `${Math.min(count * 10, 100)}px` }}
                          ></div>
                          <span className="text-sm font-mono ml-2">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Right column - Card list */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">YOUR COLLECTION</h3>
              
              {/* Combine and sort all cards */}
              <div className="space-y-4">
                {/* Cards in deck */}
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">IN DECK ({playerDeck.length})</h4>
                  {playerDeck.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Deck is empty</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {playerDeck.map((card, index) => (
                        <div key={index} className="transform scale-75 origin-top-left -ml-4 -mt-4 first:ml-0 first:mt-0">
                          <Card card={card} disabled={true} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Cards in discard */}
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">IN DISCARD ({playerDiscard.length})</h4>
                  {playerDiscard.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Discard pile is empty</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {playerDiscard.map((card, index) => (
                        <div key={index} className="transform scale-75 origin-top-left -ml-4 -mt-4 first:ml-0 first:mt-0">
                          <Card card={card} disabled={true} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-cyan-900 bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-white font-mono
              bg-cyan-800 hover:bg-cyan-700
              shadow-md border border-cyan-700 w-full"
          >
            CLOSE ANALYZER
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeckViewer;