import React from 'react';
import { Market as MarketType } from '../lib/game/market';
import Card from './Card';

interface MarketProps {
  market: MarketType;
  onCardClick: (index: number) => void;
  canBuyCards: boolean;
  playerCoins: number;
}

const Market: React.FC<MarketProps> = ({ market, onCardClick, canBuyCards, playerCoins }) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">Market</h2>
        <div className="bg-yellow-100 px-3 py-1 rounded-full text-sm">
          Available Coins: <span className="font-bold">{playerCoins}</span>
        </div>
      </div>
      
      {market.availableCards.length === 0 ? (
        <div className="flex justify-center items-center h-24 bg-gray-100 rounded-md border border-dashed border-gray-300">
          <p className="text-gray-500">Market is empty</p>
        </div>
      ) : (
        <div className="flex overflow-x-auto pb-4 gap-3 items-start">
          {market.availableCards.map((card, index) => (
            <div key={index} className="flex-shrink-0">
              <Card 
                card={card} 
                onClick={() => onCardClick(index)}
                disabled={!canBuyCards || playerCoins < card.cost}
              />
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-1">
        {market.trashedCards.length} card(s) in market trash pile
      </div>
    </div>
  );
};

export default Market;
