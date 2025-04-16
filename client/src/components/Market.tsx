import React from 'react';
import Card from './Card';
import { Market as MarketType } from '../lib/game/market';

interface MarketProps {
  market: MarketType;
  onCardClick: (index: number) => void;
  canBuyCards: boolean;
  playerCoins: number;
}

const Market: React.FC<MarketProps> = ({ market, onCardClick, canBuyCards, playerCoins }) => {
  if (market.availableCards.length === 0) {
    return (
      <div className="flex justify-center items-center h-32 border border-gray-700 border-dashed rounded-md bg-gray-900/50">
        <p className="text-gray-500 text-sm">Market is empty</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-400">Available Upgrades</div>
        <div className="bg-gray-900 px-2 py-1 rounded border border-cyan-900">
          <span className="text-cyan-500 font-mono text-sm">₵{playerCoins}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {market.availableCards.map((card, index) => {
          const canAfford = playerCoins >= card.cost;
          
          return (
            <div key={card.id || index} className="transform transition-all hover:z-10" data-testid={`market-card-${card.id ?? index}`}>
              <Card 
                card={card} 
                onClick={() => onCardClick(index)} 
                disabled={!canBuyCards || !canAfford}
              />
              
              {/* Affordability indicator */}
              {!canAfford && canBuyCards && (
                <div className="absolute top-0 right-0 m-1 bg-red-800 text-white text-xs px-1 rounded-sm">
                  Insufficient ₵
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Market stats */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
        <span>{market.availableCards.length} available</span>
        <span>{market.trashedCards.length} trashed</span>
      </div>
    </div>
  );
};

export default Market;