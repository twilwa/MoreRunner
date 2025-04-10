import React from 'react';

interface ResourceActionsProps {
  onDrawCard: () => void;
  onGainCredit: () => void;
  isPlayerTurn: boolean;
  compact?: boolean;
}

const ResourceActions: React.FC<ResourceActionsProps> = ({
  onDrawCard,
  onGainCredit,
  isPlayerTurn,
  compact = false
}) => {
  if (!isPlayerTurn) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex space-x-2 items-center">
        <button
          onClick={onDrawCard}
          title="Draw a card"
          className="w-8 h-8 bg-blue-700 hover:bg-blue-600 text-white rounded-md flex items-center justify-center"
        >
          <span>🃏</span>
        </button>
        
        <button
          onClick={onGainCredit}
          title="Gain 1 credit"
          className="w-8 h-8 bg-green-700 hover:bg-green-600 text-white rounded-md flex items-center justify-center"
        >
          <span>💰</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-3 text-cyan-400">BASIC ACTIONS</h2>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onDrawCard}
          className="px-3 py-2 bg-gradient-to-r from-blue-800 to-indigo-800 hover:from-blue-700 hover:to-indigo-700
            text-white rounded-md font-mono text-sm flex items-center justify-center"
        >
          <span className="mr-2">🃏</span> DRAW
        </button>
        
        <button
          onClick={onGainCredit}
          className="px-3 py-2 bg-gradient-to-r from-emerald-800 to-green-800 hover:from-emerald-700 hover:to-green-700
            text-white rounded-md font-mono text-sm flex items-center justify-center"
        >
          <span className="mr-2">💰</span> CREDIT
        </button>
      </div>
    </div>
  );
};

export default ResourceActions;