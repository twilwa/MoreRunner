import React, { useState, useEffect } from 'react';
import { EnhancedCard } from '../lib/game/components';
import Card from './Card';
import { GameContext } from '../lib/game/components';

// Enhanced version of CardTarget to support more target types
export interface EnhancedCardTarget {
  id: string;
  name: string;
  type: 'player' | 'opponent' | 'threat' | 'card' | 'resource';
  // Additional properties that might be on the target
  health?: number;
  credits?: number;
  actions?: number;
  faction?: string;
  keywords?: string[];
  // Visual properties for UI
  description?: string;
  image?: string;
}

interface EnhancedCardConfirmationModalProps {
  isOpen: boolean;
  card: EnhancedCard | null;
  context: GameContext | null;
  onClose: () => void;
  onConfirm: (targets: EnhancedCardTarget[]) => void;
  possibleTargets: EnhancedCardTarget[];
  // Allow for multiple target selection
  maxTargets?: number;
  minTargets?: number;
  message?: string;
}

const EnhancedCardConfirmationModal: React.FC<EnhancedCardConfirmationModalProps> = ({
  isOpen,
  card,
  context,
  onClose,
  onConfirm,
  possibleTargets,
  maxTargets = 1,
  minTargets = 1,
  message = "Select target(s) for this card"
}) => {
  const [selectedTargets, setSelectedTargets] = useState<EnhancedCardTarget[]>([]);

  // Reset selected targets when modal opens/closes or card changes
  useEffect(() => {
    setSelectedTargets([]);
  }, [isOpen, card]);

  if (!isOpen || !card) {
    return null;
  }

  const toggleTarget = (target: EnhancedCardTarget) => {
    const isSelected = selectedTargets.some(t => t.id === target.id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedTargets(selectedTargets.filter(t => t.id !== target.id));
    } else {
      // Add to selection if we haven't reached max targets
      if (selectedTargets.length < maxTargets) {
        setSelectedTargets([...selectedTargets, target]);
      }
    }
  };

  const handleConfirm = () => {
    // Only allow confirmation if we have at least minTargets selected
    if (selectedTargets.length >= minTargets) {
      onConfirm(selectedTargets);
    }
  };

  // Helper to get the icon based on target type
  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'player': return '👤';
      case 'opponent': return '🤖';
      case 'threat': return '⚠️';
      case 'card': return '🃏';
      case 'resource': return '💰';
      default: return '❓';
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 
      ${isOpen ? 'visible' : 'invisible'}`}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 border border-cyan-700 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-cyan-400">Card Execution</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        {/* Card being played */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Playing:</h3>
          <div className="flex justify-center">
            <Card card={card} disabled={true} />
          </div>
        </div>
        
        {/* Context message */}
        <div className="mb-4 text-center">
          <p className="text-cyan-300 font-mono">
            {message}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {`Selected: ${selectedTargets.length}/${maxTargets} (Min: ${minTargets})`}
          </p>
        </div>
        
        {/* Target selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Possible Targets:</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {possibleTargets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No valid targets available</p>
            ) : (
              possibleTargets.map(target => (
                <div 
                  key={target.id}
                  onClick={() => toggleTarget(target)}
                  className={`p-3 rounded cursor-pointer transition-colors flex items-center
                    ${selectedTargets.some(t => t.id === target.id) 
                      ? 'bg-cyan-900 border border-cyan-500' 
                      : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'}`}
                >
                  <div className="mr-3 text-xl">{getTargetIcon(target.type)}</div>
                  <div className="flex-grow">
                    <div className="font-medium text-gray-200">{target.name}</div>
                    {target.description && (
                      <div className="text-xs text-gray-400">{target.description}</div>
                    )}
                  </div>
                  {target.health !== undefined && (
                    <div className="ml-2 px-2 py-1 bg-red-900 rounded text-xs">
                      HP: {target.health}
                    </div>
                  )}
                  {target.credits !== undefined && (
                    <div className="ml-2 px-2 py-1 bg-yellow-900 rounded text-xs">
                      ¢: {target.credits}
                    </div>
                  )}
                  {selectedTargets.some(t => t.id === target.id) && (
                    <div className="ml-2 text-cyan-400">✓</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedTargets.length < minTargets}
            className={`flex-1 px-4 py-2 rounded
              ${selectedTargets.length >= minTargets 
                ? 'bg-gradient-to-r from-cyan-800 to-blue-800 hover:from-cyan-700 hover:to-blue-700 text-white' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCardConfirmationModal;