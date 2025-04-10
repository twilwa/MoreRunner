import React from 'react';
import { Location, LocationThreat } from '../lib/game/location';

interface LocationCardProps {
  location: Location | null;
  onDrawNextLocation: () => void;
  canDrawNextLocation: boolean;
  hasFoundObjective: boolean;
  hasReachedExit: boolean;
}

const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onDrawNextLocation,
  canDrawNextLocation,
  hasFoundObjective,
  hasReachedExit
}) => {
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

  // Render a threat item
  const renderThreat = (threat: LocationThreat, index: number) => {
    return (
      <div key={index} className="bg-gray-800 rounded p-2 mb-2 last:mb-0">
        <div className="flex justify-between items-center">
          <div className="font-bold text-sm">{threat.name}</div>
          <div className="flex space-x-2">
            <span className="px-2 py-0.5 bg-orange-900 text-orange-100 rounded text-xs">
              Danger: {threat.dangerLevel}
            </span>
            <span className="px-2 py-0.5 bg-blue-900 text-blue-100 rounded text-xs">
              Defense: {threat.defenseValue}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">{threat.description}</p>
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

        {/* Threats section */}
        {location.threats.length > 0 && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold mb-2 text-red-400">SECURITY THREATS:</h3>
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