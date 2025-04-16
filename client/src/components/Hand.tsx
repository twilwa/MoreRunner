import React from 'react';
import Card from './Card';
import { Card as CardType } from '../lib/game/cards';

interface HandProps {
  cards: CardType[];
  onCardClick: (id: string) => void;
  canPlayCards: boolean;
  title?: string;
}

const Hand: React.FC<HandProps> = ({ cards, onCardClick, canPlayCards, title }) => {
  if (cards.length === 0) {
    return (
      <div className="flex justify-center items-center h-32 border border-gray-700 border-dashed rounded-md bg-gray-900/50">
        <p className="text-gray-500 text-sm">{title || 'Hand'} is empty</p>
      </div>
    );
  }

  return (
    <div>
    <div>
      <div className="flex flex-wrap gap-2 justify-center">

        {cards.map((card) => (
          <div
            key={card.id}
            className={`transform transition-all hover:z-10`}
            data-testid={`hand-card-${card.id}`}
            onClick={() => onCardClick(card.id)}

            role="button"
            tabIndex={0}
          >
            <Card
              card={card}
              disabled={!canPlayCards}
            />
          </div>
        ))}
      </div>

      {/* Card count */}
      <div className="mt-2 text-center text-xs text-gray-500">
        {cards.length} card{cards.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default Hand;
