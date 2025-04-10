import React from 'react';

interface ResourceActionsProps {
  onDrawCard: () => void;
  onGainCredit: () => void;
  isPlayerTurn: boolean;
}

const ResourceActions: React.FC<ResourceActionsProps> = ({
  onDrawCard,
  onGainCredit,
  isPlayerTurn
}) => {
  if (!isPlayerTurn) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-3 text-cyan-400">BASIC ACTIONS</h2>
      
      <p className="text-sm text-gray-300 mb-3">
        You can always take these basic actions during your turn.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onDrawCard}
          className="px-4 py-3 bg-gradient-to-r from-blue-800 to-indigo-800 hover:from-blue-700 hover:to-indigo-700
            text-white rounded-md font-mono text-sm flex items-center justify-center"
        >
          <span className="mr-2">🃏</span> DRAW A CARD
        </button>
        
        <button
          onClick={onGainCredit}
          className="px-4 py-3 bg-gradient-to-r from-emerald-800 to-green-800 hover:from-emerald-700 hover:to-green-700
            text-white rounded-md font-mono text-sm flex items-center justify-center"
        >
          <span className="mr-2">💰</span> GAIN 1 CREDIT
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        These actions do not cost action points or credits.
      </div>
    </div>
  );
};

export default ResourceActions;