import React, { useState } from 'react';
import { Location, LocationThreat } from '../lib/game/location';
import { Card as CardType } from '../lib/game/cards';
import Card from './Card';

interface EntityStatus {
  threatId: string;
  actionPotentials: boolean[]; // Array of action potential dots (true = active)
  playedCards: CardType[]; // Cards played by this entity
}

interface LocationCardProps {
  location: Location | null;
  onDrawNextLocation: () => void;
  canDrawNextLocation: boolean;
  hasFoundObjective: boolean;
  hasReachedExit: boolean;
  entityStatuses?: EntityStatus[]; // Optional tracking of entity action potentials and cards
}

const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onDrawNextLocation,
  canDrawNextLocation,
  hasFoundObjective,
  hasReachedExit,
  entityStatuses = []
}) => {
  const [selectedThreat, setSelectedThreat] = useState<number | null>(null);
  
  if (!location) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
        <p className="text-gray-400">No location data available.</p>
        {canDrawNextLocation && (
          <button
            onClick={onDrawNextLocation}
            className="mt-4 px-4 py-2 bg-cyan-800 hover:bg-cyan-700 text-white rounded"
          >
            Start Mission
          </button>
        )}
      </div>
    );
  }

  // Get background styling based on location type
  const getLocationStyles = () => {
    switch (location.type) {
      case 'entrance':
        return 'from-blue-900 to-indigo-900 border-blue-700';
      case 'server_room':
        return 'from-green-900 to-emerald-900 border-green-700';
      case 'exit':
        return 'from-purple-900 to-indigo-900 border-purple-700';
      case 'security':
        return 'from-red-900 to-rose-900 border-red-700';
      case 'objective':
        return 'from-yellow-900 to-amber-900 border-yellow-700';
      default:
        return 'from-gray-800 to-gray-900 border-gray-700';
    }
  };

  // Get difficulty badge styling
  const getDifficultyBadge = () => {
    switch (location.difficulty) {
      case 'easy':
        return 'bg-green-700 text-green-100';
      case 'medium':
        return 'bg-yellow-700 text-yellow-100';
      case 'hard':
        return 'bg-red-700 text-red-100';
      default:
        return 'bg-gray-700 text-gray-100';
    }
  };

  // Handle clicking on a threat
  const handleThreatClick = (index: number) => {
    if (selectedThreat === index) {
      setSelectedThreat(null); // Toggle off if clicking the same threat
    } else {
      setSelectedThreat(index); // Select the new threat
    }
  };

  // Generate action potential dots based on entity type/speed
  const getActionPotentials = (threat: LocationThreat) => {
    // Determine number of dots based on threat danger level (lower = faster = fewer dots)
    // Range from 1-4 dots
    const numDots = Math.max(1, Math.min(4, Math.ceil(threat.dangerLevel * 0.8)));
    
    // For now we'll simulate all dots as inactive (no cards played yet)
    return Array(numDots).fill(false);
  };
  
  // Render a threat item
  const renderThreat = (threat: LocationThreat, index: number) => {
    const isSelected = selectedThreat === index;
    const isDead = threat.isDead || threat.defenseValue <= 0;
    
    // Check if we have entity status data for this threat
    const entityStatus = entityStatuses.find(status => status.threatId === threat.id);
    
    // Use stored action potentials or generate default ones
    const actionPotentials = entityStatus?.actionPotentials || getActionPotentials(threat);
    
    // Check if entity has played cards
    const playedCards = entityStatus?.playedCards || [];
    const hasPlayedCards = playedCards.length > 0;
    
    return (
      <div 
        key={index} 
        className={`bg-gray-800 rounded p-2 mb-2 last:mb-0 cursor-pointer transition-all duration-200
          ${isDead ? 'opacity-60 grayscale' : ''}
          ${isSelected ? 'border border-cyan-600' : 'hover:bg-gray-750'}`}
        onClick={() => handleThreatClick(index)}
      >
        <div className="flex justify-between items-center">
          <div className="font-bold text-sm flex items-center">
            {threat.name}
            {isDead && (
              <span className="ml-2 text-xs bg-gray-700 text-red-400 px-2 py-0.5 rounded">
                OFFLINE
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <span className="px-2 py-0.5 bg-orange-900 text-orange-100 rounded text-xs">
              ATK: {threat.attack}
            </span>
            <span className={`px-2 py-0.5 ${isDead ? 'bg-red-900 text-red-100' : 'bg-blue-900 text-blue-100'} rounded text-xs`}>
              DEF: {isDead ? 0 : threat.defenseValue}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">{threat.description}</p>
        
        {/* Action potential indicators */}
        <div className="flex items-center space-x-1 mt-2">
          <span className="text-xs text-gray-400">Action Potential:</span>
          <div className="flex space-x-1">
            {!isDead ? (
              actionPotentials.map((isActive, dotIndex) => (
                <div 
                  key={dotIndex}
                  className={`w-3 h-3 rounded-full ${isActive 
                    ? 'bg-red-500' 
                    : 'bg-gray-600'
                  }`}
                />
              ))
            ) : (
              <span className="text-xs text-red-400">System disabled</span>
            )}
          </div>
        </div>
        
        {/* Entity's played cards */}
        <div className="mt-2 min-h-8 border-t border-gray-700/50 pt-1">
          {hasPlayedCards ? (
            <div className="flex flex-wrap gap-1">
              {playedCards.map((card, cardIndex) => (
                <div key={cardIndex} className="scale-[0.6] origin-top-left">
                  <Card card={card} disabled={true} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400">No active cards</div>
          )}
        </div>
        
        {isSelected && (
          <div className="mt-2 p-2 bg-gray-700/50 rounded text-xs">
            <div className="flex space-x-6 justify-around mb-2">
              <div className="flex flex-col items-center">
                <span className="text-cyan-400">Attack</span>
                <span className="text-lg font-mono text-orange-400">{threat.attack}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-cyan-400">Defense</span>
                <span className="text-lg font-mono text-blue-400">{threat.defenseValue}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-cyan-400">Danger</span>
                <span className="text-lg font-mono text-red-400">{threat.dangerLevel}</span>
              </div>
            </div>
            <div className="text-xs border-t border-gray-600 pt-1 mt-1">
              <span className="text-gray-300 italic">Tip: Each dot represents an action potential that fills over time.</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-gradient-to-br ${getLocationStyles()} rounded-lg overflow-hidden border`}>
      {/* Location header */}
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold">{location.name}</h2>
          <div className="flex space-x-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyBadge()}`}>
              {location.difficulty.toUpperCase()}
            </span>
            {location.hasObjective && (
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-700 text-yellow-100">
                OBJECTIVE
              </span>
            )}
            {location.isExit && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-700 text-purple-100">
                EXIT
              </span>
            )}
          </div>
        </div>

        {/* Mission status indicators */}
        <div className="flex flex-col items-end">
          <div className={`flex items-center mb-1 ${hasFoundObjective ? 'text-yellow-500' : 'text-gray-500'}`}>
            <span className="text-xs">Objective Found</span>
            <span className="ml-2">{hasFoundObjective ? '✓' : '✗'}</span>
          </div>
          <div className={`flex items-center ${hasReachedExit ? 'text-green-500' : 'text-gray-500'}`}>
            <span className="text-xs">Exit Reached</span>
            <span className="ml-2">{hasReachedExit ? '✓' : '✗'}</span>
          </div>
        </div>
      </div>

      {/* Location content */}
      <div className="p-3">
        <p className="text-sm text-gray-300 mb-3">{location.description}</p>

        {/* Entities section */}
        {location.threats.length > 0 && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold mb-2 text-cyan-400">IN LOCATION:</h3>
            <div className="space-y-2">
              {location.threats.map((threat, index) => renderThreat(threat, index))}
            </div>
          </div>
        )}

        {/* Rewards section */}
        <div className="bg-gray-800/50 rounded p-2 mb-3">
          <h3 className="text-sm font-semibold mb-1 text-green-400">POTENTIAL REWARDS:</h3>
          <div className="flex space-x-4">
            {location.rewards.credits > 0 && (
              <div className="flex items-center">
                <span className="text-cyan-500 font-mono">₵{location.rewards.credits}</span>
                <span className="ml-1 text-xs text-gray-400">credits</span>
              </div>
            )}
            {location.rewards.drawCards > 0 && (
              <div className="flex items-center">
                <span className="text-cyan-500 font-mono">+{location.rewards.drawCards}</span>
                <span className="ml-1 text-xs text-gray-400">cards</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation button */}
        {canDrawNextLocation && (
          <button
            onClick={onDrawNextLocation}
            className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-mono rounded flex items-center justify-center"
          >
            <span className="mr-1">►</span> MOVE TO NEXT LOCATION
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationCard;