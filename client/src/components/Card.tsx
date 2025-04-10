import React from 'react';
import { Card as CardType } from '../lib/game/cards';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled = false }) => {
  // Get keyword colors with cyberpunk theme
  const getKeywordColor = (keyword: string) => {
    switch(keyword) {
      case 'Virus': return 'bg-red-600';
      case 'ICE': return 'bg-blue-600';
      case 'Stealth': return 'bg-indigo-700';
      case 'Weapon': return 'bg-red-800';
      case 'Memory': return 'bg-purple-700';
      case 'Hardware': return 'bg-yellow-600';
      case 'Program': return 'bg-green-700';
      case 'Cyberware': return 'bg-cyan-700';
      case 'Basic': return 'bg-gray-600';
      case 'Common': return 'bg-gray-500';
      case 'Rare': return 'bg-yellow-500';
      case 'Epic': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };
  
  // Get faction colors
  const getFactionColor = (faction: string) => {
    switch(faction) {
      case 'Corp': return 'border-blue-500';
      case 'Runner': return 'border-green-500';
      case 'Street': return 'border-red-500';
      case 'Neutral': return 'border-gray-500';
      default: return 'border-gray-400';
    }
  };

  // Determine if card is face-down
  const isFaceDown = card.isFaceDown;
  
  // Get card type styling
  const getCardTypeStyle = () => {
    switch(card.cardType) {
      case 'Program': return 'border-green-400';
      case 'Trap': return 'border-red-400';
      case 'Install': return 'border-blue-400';
      case 'Hardware': return 'border-yellow-400';
      case 'Event': return 'border-purple-400';
      default: return 'border-gray-400';
    }
  };
  
  // Get risk level indicator
  const getRiskIndicator = () => {
    if (card.riskLevel === undefined) return null;
    
    const riskColor = card.riskLevel === 1 ? 'bg-yellow-500' :
                      card.riskLevel === 2 ? 'bg-orange-500' : 'bg-red-500';
    
    return (
      <div className={`absolute top-1 right-1 ${riskColor} rounded-full w-3 h-3`} 
           title={`Risk Level: ${card.riskLevel}`}></div>
    );
  };

  return (
    <div 
      className={`rounded-md shadow-md bg-gray-800 p-3 w-40 h-60 flex flex-col overflow-hidden transition-transform
        border-2 ${getFactionColor(card.faction)} ${getCardTypeStyle()}
        ${onClick && !disabled ? 'cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-cyan-800/50' : ''} 
        ${disabled ? 'opacity-70' : ''}
        relative`}
      onClick={disabled ? undefined : onClick}
    >
      {isFaceDown ? (
        <div className="flex items-center justify-center h-full w-full">
          <div className="text-cyan-500 text-xl font-bold">FACE DOWN</div>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 to-purple-900/30"></div>
        </div>
      ) : (
        <>
          {getRiskIndicator()}
          {card.canFuse && (
            <div className="absolute top-1 left-1 bg-cyan-400 rounded-full w-3 h-3" title="Can be fused"></div>
          )}
          
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold truncate text-cyan-300">{card.name}</h3>
            <div className="flex items-center justify-center rounded-full bg-cyan-900 border border-cyan-400 w-6 h-6 text-xs font-semibold text-cyan-300">
              {card.cost}
            </div>
          </div>
          
          <div className="text-xs text-cyan-600 mb-1">{card.cardType}</div>
          
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
          
          <p className="text-xs text-cyan-100 flex-grow">{card.description}</p>
          
          <div className="mt-auto">
            {card.effects.map((effect, index) => {
              let effectText = '';
              let effectClass = 'text-cyan-400';
              
              switch(effect.type) {
                case 'gain_credits':
                case 'gain_resources':
                  effectText = `+${effect.value} Credit${effect.value !== 1 ? 's' : ''}`;
                  effectClass = 'text-yellow-400';
                  break;
                case 'damage_opponent':
                  if (effect.value > 0) {
                    effectText = `${effect.value} Damage`;
                    effectClass = 'text-red-400';
                  } else {
                    effectText = `${Math.abs(effect.value)} Shield`;
                    effectClass = 'text-blue-400';
                  }
                  break;
                case 'draw_cards':
                  effectText = `Draw ${effect.value}`;
                  effectClass = 'text-purple-400';
                  break;
                case 'gain_action':
                  effectText = `+${effect.value} Action${effect.value !== 1 ? 's' : ''}`;
                  effectClass = 'text-green-400';
                  break;
                case 'push_luck':
                  effectText = `Risk ${effect.value}`;
                  effectClass = 'text-red-500';
                  break;
                case 'set_trap':
                  effectText = 'Set Trap';
                  effectClass = 'text-orange-400';
                  break;
                default:
                  effectText = effect.type.replace(/_/g, ' ');
              }
              
              if (effect.synergy) {
                effectText += ` (+${effect.synergy.bonus} with ${effect.synergy.keyword})`;
              }
              
              return (
                <div key={index} className={`text-xs ${effectClass} mb-1`}>{effectText}</div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Card;
