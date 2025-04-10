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
    <div className="mb-6 border border-cyan-800 rounded-lg p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-cyan-400 flex items-center">
          <span className="text-xl mr-2">⚡</span> 
          DARKNET MARKET
        </h2>
        <div className="bg-yellow-900 border border-yellow-500 px-3 py-1 rounded-full text-sm text-yellow-400">
          Available Credits: <span className="font-bold">{playerCoins}¤</span>
        </div>
      </div>
      
      {market.availableCards.length === 0 ? (
        <div className="flex justify-center items-center h-24 bg-gray-800 rounded-md border border-dashed border-gray-600 text-cyan-400">
          <p>MARKET OFFLINE - CONNECTION ERROR</p>
        </div>
      ) : (
        <div className="flex overflow-x-auto pb-4 gap-3 items-start scrollbar-thin scrollbar-thumb-cyan-800 scrollbar-track-gray-900">
          {market.availableCards.map((card, index) => (
            <div key={index} className="flex-shrink-0 transform transition-transform duration-200 hover:translate-y-[-5px]">
              <Card 
                card={card} 
                onClick={() => onCardClick(index)}
                disabled={!canBuyCards || playerCoins < card.cost}
              />
              {canBuyCards && (
                <div className={`text-center mt-1 text-xs font-bold ${playerCoins >= card.cost ? 'text-green-400' : 'text-red-400'}`}>
                  {playerCoins >= card.cost ? 'AVAILABLE' : 'INSUFFICIENT FUNDS'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs text-red-400">
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
          {market.trashedCards.length} cards in trash heap
        </div>
        
        <div className="text-xs text-cyan-500">
          Market Data Refresh Rate: {Math.floor(Math.random() * 100) + 20}ms
        </div>
      </div>
    </div>
  );
};

export default Market;
