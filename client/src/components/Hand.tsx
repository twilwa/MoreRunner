import React from 'react';
import { Card as CardType } from '../lib/game/cards';
import Card from './Card';

interface HandProps {
  cards: CardType[];
  onCardClick: (index: number) => void;
  canPlayCards: boolean;
  title?: string;
}

const Hand: React.FC<HandProps> = ({ cards, onCardClick, canPlayCards, title = "Your Hand" }) => {
  if (cards.length === 0) {
    return (
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <div className="flex justify-center items-center h-16 bg-gray-100 rounded-md border border-dashed border-gray-300">
          <p className="text-gray-500">No cards in hand</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="flex overflow-x-auto pb-4 gap-2 items-start">
        {cards.map((card, index) => (
          <div key={index} className="flex-shrink-0">
            <Card 
              card={card} 
              onClick={() => onCardClick(index)} 
              disabled={!canPlayCards}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hand;
