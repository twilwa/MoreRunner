import React from 'react';
import { Card as CardType, CardFaction, CardKeyword } from '../lib/game/cards';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  // Card can display who played it if it's on the board
  showPlayedBy?: boolean;
  // Explicitly pass data-testid as a prop for standalone card views
  'data-testid'?: string;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled = false, showPlayedBy = false, 'data-testid': dataTestId }) => {
  // Get faction-specific colors
  const getFactionColors = (faction: CardFaction) => {
    switch (faction) {
      case 'Corp':
        return {
          bg: 'from-blue-900 to-indigo-900',
          border: 'border-blue-700',
          text: 'text-blue-300',
          highlight: 'bg-blue-800'
        };
      case 'Runner':
        return {
          bg: 'from-green-900 to-emerald-900',
          border: 'border-green-700',
          text: 'text-green-300',
          highlight: 'bg-green-800'
        };
      case 'Street':
        return {
          bg: 'from-red-900 to-rose-900',
          border: 'border-red-700',
          text: 'text-red-300',
          highlight: 'bg-red-800'
        };
      case 'Neutral':
      default:
        return {
          bg: 'from-gray-800 to-gray-900',
          border: 'border-gray-700',
          text: 'text-gray-300',
          highlight: 'bg-gray-800'
        };
    }
  };

  // Get keyword-specific indicator colors
  const getKeywordColor = (keyword: CardKeyword) => {
    switch (keyword) {
      case 'Virus':
        return 'bg-red-500';
      case 'ICE':
        return 'bg-blue-500';
      case 'Stealth':
        return 'bg-purple-500';
      case 'Weapon':
        return 'bg-orange-500';
      case 'Memory':
        return 'bg-yellow-500';
      case 'Hardware':
        return 'bg-gray-500';
      case 'Program':
        return 'bg-green-500';
      case 'Cyberware':
        return 'bg-cyan-500';
      case 'Rare':
        return 'bg-pink-500';
      case 'Epic':
        return 'bg-purple-500';
      case 'Basic':
      case 'Common':
      default:
        return 'bg-gray-500';
    }
  };

  const colors = getFactionColors(card.faction);
  
  // If the card is face down, show the back of the card
  if (card.isFaceDown) {
    return (
      <div 
        className={`relative w-40 h-56 rounded-md border-2 ${disabled ? 'opacity-60' : ''} 
          bg-gradient-to-b from-gray-900 to-gray-950 border-cyan-900 cursor-default
          transform transition-all shadow-lg overflow-hidden`}
        onClick={!disabled && onClick ? onClick : undefined}
      >
        {/* Show which entity played this card if available */}
        {card.playedBy && (
          <div className="absolute top-3 left-0 right-0 text-center">
            <div className="bg-red-900/70 py-1 px-2 mx-auto inline-block rounded-full">
              <span className="text-xs text-red-300 font-bold">FROM: {card.playedBy}</span>
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-900 to-blue-900 flex items-center justify-center">
            <div className="text-cyan-500 font-bold">ENCRYPTED</div>
          </div>
        </div>
        
        <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-cyan-700 font-mono">
          SECURE PROGRAM
        </div>
      </div>
    );
  }

  return (
    <div 
      {...(dataTestId && { 'data-testid': dataTestId })}
      className={`relative w-40 h-56 rounded-md border ${
        disabled ? 'opacity-60 cursor-default' : 'cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-cyan-900/20'
      } bg-gradient-to-b ${colors.bg} ${colors.border}
      transform transition-all duration-200 shadow-lg overflow-hidden`}
      onClick={!disabled && onClick ? onClick : undefined}
    >
      {/* Show which entity played this card if available and showPlayedBy is true */}
      {showPlayedBy && card.playedBy && (
        <div className="absolute -top-2 left-0 right-0 text-center z-10">
          <div className="bg-red-900/80 py-0.5 px-2 mx-auto inline-block rounded-full border border-red-700">
            <span className="text-[9px] text-red-100 font-bold">{card.playedBy}</span>
          </div>
        </div>
      )}
      
      {/* Card header */}
      <div className={`p-2 flex justify-between items-center border-b ${colors.border}`}>
        <div className="font-bold text-sm truncate max-w-[100px]" title={card.name}>
          {card.name}
        </div>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-gray-900 ${colors.text} text-xs font-bold`}>
          {card.cost}
        </div>
      </div>
      
      {/* Card type & faction */}
      <div className={`px-2 py-1 text-xs flex justify-between ${colors.highlight}`}>
        <div>{card.cardType}</div>
        <div>{card.faction}</div>
      </div>
      
      {/* Card keywords */}
      <div className="p-2 flex flex-wrap gap-1">
        {card.keywords.map((keyword, index) => (
          <span 
            key={index} 
            className={`text-[9px] px-1 rounded ${getKeywordColor(keyword)} text-white uppercase font-bold tracking-tight`}
          >
            {keyword}
          </span>
        ))}
      </div>
      
      {/* Card description */}
      <div className="p-2 text-xs text-gray-300 h-24 overflow-y-auto">
        {card.description}
      </div>
      
      {/* Effects summary at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-1 text-[10px] bg-black/50 text-cyan-400 font-mono">
        {card.effects.map((effect, index) => (
          <div key={index} className="truncate">
            {effect.type.replace('_', ' ')}: {effect.value}
            {effect.synergy && ` + ${effect.synergy.bonus} with ${effect.synergy.keyword}`}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Card;