import React from 'react';
import { Card as CardType } from '../lib/game/cards';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled = false }) => {
  // Get keyword colors
  const getKeywordColor = (keyword: string) => {
    switch(keyword) {
      case 'Fire': return 'bg-red-500';
      case 'Water': return 'bg-blue-400';
      case 'Earth': return 'bg-green-600';
      case 'Air': return 'bg-cyan-300';
      case 'Arcane': return 'bg-purple-500';
      case 'Basic': return 'bg-gray-400';
      case 'Common': return 'bg-gray-300';
      case 'Rare': return 'bg-yellow-400';
      case 'Epic': return 'bg-purple-300';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div 
      className={`rounded-md shadow-md bg-white p-3 w-40 h-56 flex flex-col overflow-hidden transition-transform 
        ${onClick && !disabled ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''} 
        ${disabled ? 'opacity-70' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold truncate">{card.name}</h3>
        <div className="flex items-center justify-center rounded-full bg-yellow-100 w-6 h-6 text-xs font-semibold">
          {card.cost}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-2">
        {card.keywords.map((keyword, index) => (
          <span 
            key={index} 
            className={`text-xs px-1 rounded ${getKeywordColor(keyword)} text-white`}
          >
            {keyword}
          </span>
        ))}
      </div>
      
      <p className="text-xs text-gray-600 flex-grow">{card.description}</p>
      
      <div className="mt-auto">
        {card.effects.map((effect, index) => {
          let effectText = '';
          switch(effect.type) {
            case 'gain_resources':
              effectText = `+${effect.value} Coin${effect.value !== 1 ? 's' : ''}`;
              break;
            case 'damage_opponent':
              effectText = effect.value > 0 
                ? `${effect.value} Damage` 
                : `${Math.abs(effect.value)} Block`;
              break;
            case 'draw_cards':
              effectText = `Draw ${effect.value}`;
              break;
            case 'gain_action':
              effectText = `+${effect.value} Action${effect.value !== 1 ? 's' : ''}`;
              break;
            default:
              effectText = effect.type.replace('_', ' ');
          }
          
          if (effect.synergy) {
            effectText += ` (+${effect.synergy.bonus} with ${effect.synergy.keyword})`;
          }
          
          return (
            <div key={index} className="text-xs italic mb-1">{effectText}</div>
          );
        })}
      </div>
    </div>
  );
};

export default Card;
