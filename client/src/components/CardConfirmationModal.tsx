import React, { useState } from 'react';
import { Card as CardType } from '../lib/game/cards';
import Card from './Card';

interface CardTarget {
  id: string;
  name: string;
  type: 'player' | 'card' | 'resource';
}

interface CardConfirmationModalProps {
  isOpen: boolean;
  card: CardType | null;
  onClose: () => void;
  onConfirm: (targets: CardTarget[]) => void;
  possibleTargets: CardTarget[];
  playerName: string;
  opponentName: string;
}

const CardConfirmationModal: React.FC<CardConfirmationModalProps> = ({
  isOpen,
  card,
  onClose,
  onConfirm,
  possibleTargets,
  playerName,
  opponentName
}) => {
  // Selected targets state
  const [selectedTargets, setSelectedTargets] = useState<CardTarget[]>([]);
  
  // If not open or no card, don't render
  if (!isOpen || !card) return null;
  
  // Get required target count
  const getRequiredTargetCount = (): number => {
    // Analyze card effects to determine how many targets are needed
    // This is a simplification - in a real implementation, 
    // you'd analyze each effect type to determine target requirements
    const hasTargetedEffect = card.effects.some(effect => 
      ['damage_opponent', 'force_discard', 'copy_card', 'trash_cards'].includes(effect.type)
    );
    
    return hasTargetedEffect ? 1 : 0;
  };
  
  const requiredTargets = getRequiredTargetCount();
  const canConfirm = selectedTargets.length >= requiredTargets;
  
  // Toggle target selection
  const toggleTarget = (target: CardTarget) => {
    if (selectedTargets.some(t => t.id === target.id)) {
      // Remove target if already selected
      setSelectedTargets(prev => prev.filter(t => t.id !== target.id));
    } else {
      // Add target if not already at max
      if (requiredTargets === 0 || selectedTargets.length < requiredTargets) {
        setSelectedTargets(prev => [...prev, target]);
      }
    }
  };
  
  // Handle confirmation
  const handleConfirm = () => {
    onConfirm(selectedTargets);
    // Reset selected targets
    setSelectedTargets([]);
  };
  
  // Close and reset
  const handleClose = () => {
    setSelectedTargets([]);
    onClose();
  };
  
  // Determine if the card requires targeting
  const needsTargeting = requiredTargets > 0;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-cyan-900 rounded-lg max-w-md w-full max-h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-cyan-900 bg-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400">CONFIRM ACTION</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {/* Content area */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-4">
              <Card card={card} disabled={true} />
            </div>
            
            <p className="text-cyan-300 mb-2">
              Are you sure you want to play <span className="font-bold">{card.name}</span>?
            </p>
            
            {needsTargeting && (
              <p className="text-yellow-500 text-sm mb-4">
                This card requires {requiredTargets} target{requiredTargets !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
          
          {/* Target selection - only show if targeting is needed */}
          {needsTargeting && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">SELECT TARGET</h3>
              
              <div className="space-y-2">
                {/* Player targets first */}
                {possibleTargets
                  .filter(target => target.type === 'player')
                  .map((target) => {
                    const isSelected = selectedTargets.some(t => t.id === target.id);
                    
                    return (
                      <button
                        key={target.id}
                        onClick={() => toggleTarget(target)}
                        className={`w-full p-3 rounded-md text-left flex justify-between items-center
                          ${isSelected 
                            ? 'bg-cyan-900 border-2 border-cyan-400' 
                            : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                          }`}
                      >
                        <span>
                          {target.name === playerName ? 'You' : target.name}
                          <span className="ml-2 text-xs text-gray-400">(Player)</span>
                        </span>
                        {isSelected && (
                          <span className="text-cyan-400">Selected</span>
                        )}
                      </button>
                    );
                  })}
                
                {/* Card targets next */}
                {possibleTargets
                  .filter(target => target.type === 'card')
                  .map((target) => {
                    const isSelected = selectedTargets.some(t => t.id === target.id);
                    
                    return (
                      <button
                        key={target.id}
                        onClick={() => toggleTarget(target)}
                        className={`w-full p-3 rounded-md text-left flex justify-between items-center
                          ${isSelected 
                            ? 'bg-cyan-900 border-2 border-cyan-400' 
                            : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                          }`}
                      >
                        <span>
                          {target.name}
                          <span className="ml-2 text-xs text-gray-400">(Card)</span>
                        </span>
                        {isSelected && (
                          <span className="text-cyan-400">Selected</span>
                        )}
                      </button>
                    );
                  })}
                
                {/* Resource targets last */}
                {possibleTargets
                  .filter(target => target.type === 'resource')
                  .map((target) => {
                    const isSelected = selectedTargets.some(t => t.id === target.id);
                    
                    return (
                      <button
                        key={target.id}
                        onClick={() => toggleTarget(target)}
                        className={`w-full p-3 rounded-md text-left flex justify-between items-center
                          ${isSelected 
                            ? 'bg-cyan-900 border-2 border-cyan-400' 
                            : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                          }`}
                      >
                        <span>
                          {target.name}
                          <span className="ml-2 text-xs text-gray-400">(Resource)</span>
                        </span>
                        {isSelected && (
                          <span className="text-cyan-400">Selected</span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with buttons */}
        <div className="p-4 border-t border-cyan-900 bg-gray-800 flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 rounded-md font-mono
              bg-gray-700 hover:bg-gray-600 text-white
              shadow-md border border-gray-600"
          >
            CANCEL
          </button>
          
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 rounded-md font-mono
              ${canConfirm 
                ? 'bg-gradient-to-r from-green-700 to-cyan-700 hover:from-green-600 hover:to-cyan-600 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
              shadow-md border border-cyan-700`}
            disabled={!canConfirm}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardConfirmationModal;