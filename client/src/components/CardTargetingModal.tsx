import React, { useState, useEffect } from 'react';
import { EnhancedCard } from '../lib/game/components';
import Card from './Card';
import { cardExecutionService } from '../lib/game/cardExecutionService';
import { useDeckBuilder } from '../lib/stores/useDeckBuilder';
import { useIsMobile } from '../hooks/use-is-mobile';

// Simplified version of target entity interface
interface TargetEntity {
  id: string;
  name: string;
  type: string;
  health?: number;
  faction?: string;
  description?: string;
}

interface CardTargetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTargetSelect: (targets: TargetEntity[]) => void;
}

const CardTargetingModal: React.FC<CardTargetingModalProps> = ({
  isOpen,
  onClose,
  onTargetSelect
}) => {
  const [selectedTargets, setSelectedTargets] = useState<TargetEntity[]>([]);
  const { gameState, locationDeck } = useDeckBuilder();
  const isMobile = useIsMobile();
  
  // Get execution context to determine what card is being played and what targets are valid
  const context = cardExecutionService.getExecutionContext();
  const card = context?.card || null;
  
  // Reset selection when modal opens/closes
  useEffect(() => {
    setSelectedTargets([]);
  }, [isOpen]);
  
  if (!isOpen || !card || !gameState) {
    return null;
  }
  
  // Get potential targets based on the target component type
  const getPotentialTargets = (): TargetEntity[] => {
    // First, find the targeting component type in the card
    const targetComponent = card.components?.find(comp => 
      comp.type === 'SingleEntityTarget' || 
      comp.type === 'MultiEntityTarget'
    );
    
    if (!targetComponent) {
      console.log("No targeting component found in card:", card);
      return [];
    }
    
    console.log("Found targeting component:", targetComponent.type);
    
    const targets: TargetEntity[] = [];
    
    // Add location threats as targets
    if (locationDeck?.currentLocation) {
      locationDeck.currentLocation.threats.forEach(threat => {
        // Add specific logic to filter threats based on component conditions (if needed)
        const shouldAdd = true; // Default to including all threats
        
        // If we have a SingleEntityTarget with a filter
        if (targetComponent.type === 'SingleEntityTarget' && 
            targetComponent.targetType === 'threat' && 
            targetComponent.filter) {
          // This is a simplified check, we can't directly call the filter function
          // as it's not accessible here in this simplified model
          // In a full implementation, we would check against the filter criteria
        }
        
        if (shouldAdd) {
          targets.push({
            id: threat.id,
            name: threat.name,
            type: 'threat',
            // Use defenseValue as health since LocationThreat doesn't have health property
            health: threat.defenseValue,
            // LocationThreat doesn't have faction so we'll use a default
            faction: 'Corp',
            description: `Danger Level: ${threat.dangerLevel}`
          });
        }
      });
    }
    
    // Add opponent as target
    if (gameState.players.length > 1) {
      const opponentIndex = gameState.activePlayerIndex === 0 ? 1 : 0;
      const opponent = gameState.players[opponentIndex];
      targets.push({
        id: `player_${opponentIndex}`,
        name: opponent.name,
        type: 'opponent',
        health: opponent.health,
        description: `Credits: ${opponent.credits}`
      });
    }
    
    // Add player as target (self-targeting)
    const player = gameState.players[gameState.activePlayerIndex];
    targets.push({
      id: `player_${gameState.activePlayerIndex}`,
      name: player.name,
      type: 'player',
      health: player.health,
      description: `Credits: ${player.credits}`
    });
    
    return targets;
  };
  
  const potentialTargets = getPotentialTargets();
  
  const toggleTarget = (target: TargetEntity, event?: React.MouseEvent | React.TouchEvent) => {
    // Stop event propagation to prevent issues on mobile
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log(`Target ${target.name} (${target.id}) clicked/tapped`);
    
    // Find if target is already selected
    const isSelected = selectedTargets.some(t => t.id === target.id);
    
    if (isSelected) {
      // Remove from selection
      console.log(`Removing ${target.name} from selection`);
      setSelectedTargets(selectedTargets.filter(t => t.id !== target.id));
    } else {
      // Add to selection
      console.log(`Adding ${target.name} to selection`);
      setSelectedTargets([...selectedTargets, target]);
    }
  };
  
  const handleConfirm = () => {
    if (selectedTargets.length > 0) {
      console.log("CardTargetingModal: Confirming target selection:", selectedTargets);
      // Call the onTargetSelect callback to pass targets back to parent component
      onTargetSelect(selectedTargets);
      console.log("CardTargetingModal: onTargetSelect callback completed");
      // Close the modal
      onClose();
      console.log("CardTargetingModal: Modal closed");
    } else {
      console.log("CardTargetingModal: Cannot confirm with no targets selected");
    }
  };
  
  // Helper to get icon for target type
  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'player': return '👤';
      case 'opponent': return '🤖';
      case 'threat': return '⚠️';
      default: return '❓';
    }
  };
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 
      ${isOpen ? 'visible' : 'invisible'}`}
      // Add touch detection for mobile - to catch touches/taps that might be missed
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`bg-gray-800 rounded-lg p-4 sm:p-6 ${isMobile ? 'w-[95%]' : 'max-w-lg w-full mx-4'} border border-cyan-700 shadow-xl`}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-cyan-400">Target Selection</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 p-2"
          >
            ✕
          </button>
        </div>
        
        {/* Card being played */}
        <div className={`mb-4 ${isMobile ? 'hidden' : 'block'}`}>
          <h3 className="text-sm font-medium text-gray-300 mb-2">Playing:</h3>
          <div className="flex justify-center">
            <Card card={card} disabled={true} />
          </div>
        </div>
        
        {/* Mobile version shows just card name */}
        {isMobile && (
          <div className="mb-4 text-center">
            <span className="px-3 py-1 bg-cyan-900/50 rounded-full text-cyan-300 text-xs font-mono">
              {card.name}
            </span>
          </div>
        )}
        
        {/* Targeting instructions */}
        <div className="mb-4 text-center">
          <p className="text-cyan-300 font-mono text-sm sm:text-base">
            {isMobile ? 'SELECT TARGET' : `Select target for ${card.name}`}
          </p>
          <div className="bg-gray-700 p-2 sm:p-3 rounded mt-2 border border-cyan-900 text-left">
            {!isMobile && (
              <p className="text-gray-300 text-sm">
                {card.description || "Choose a valid target to continue execution."}
              </p>
            )}
            <p className="text-cyan-400 text-sm mt-1">
              {`Selected: ${selectedTargets.length}/${potentialTargets.length > 0 ? 1 : 0} required targets`}
            </p>
          </div>
        </div>
        
        {/* Target selection */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Possible Targets:</h3>
          <div className={`space-y-2 ${isMobile ? 'max-h-36' : 'max-h-48'} overflow-y-auto pr-2`}>
            {potentialTargets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No valid targets available</p>
            ) : (
              potentialTargets.map(target => (
                <div 
                  key={target.id}
                  data-testid={`target-option-${target.id}`}
                  onClick={(e) => toggleTarget(target, e)}
                  onTouchStart={(e) => {
                    // Prevent default behavior on mobile
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    toggleTarget(target, e);
                    // Add a delay to ensure the toggle happens
                    setTimeout(() => {
                      console.log("Touch action completed for target", target.name);
                    }, 50);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleTarget(target, e);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`w-full p-3 rounded cursor-pointer transition-colors flex items-center
                    ${selectedTargets.some(t => t.id === target.id) 
                      ? 'bg-cyan-900 border border-cyan-500 active:bg-cyan-700' 
                      : 'bg-gray-700 border border-gray-600 hover:bg-gray-600 active:bg-gray-500'}`}
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
            data-testid="targeting-cancel-btn"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            data-testid="targeting-confirm-btn"
            onClick={handleConfirm}
            disabled={selectedTargets.length === 0}
            className={`flex-1 px-4 py-3 rounded text-sm sm:text-base
              ${selectedTargets.length > 0 
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

export default CardTargetingModal;