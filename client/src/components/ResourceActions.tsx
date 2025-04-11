import React from 'react';

interface ResourceActionsProps {
  onDrawCard: () => void;
  onGainCredit: () => void;
  onShuffleDiscard: () => void;
  isPlayerTurn: boolean;
  compact?: boolean;
  hasCardsInDiscard?: boolean;  // To disable the button when discard is empty
}

const ResourceActions: React.FC<ResourceActionsProps> = ({
  onDrawCard,
  onGainCredit,
  onShuffleDiscard,
  isPlayerTurn,
  compact = false,
  hasCardsInDiscard = false
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

        <button
          onClick={onShuffleDiscard}
          title="Shuffle discard pile into deck"
          disabled={!hasCardsInDiscard}
          className={`w-8 h-8 ${hasCardsInDiscard ? 'bg-purple-700 hover:bg-purple-600' : 'bg-gray-700 cursor-not-allowed'} 
            text-white rounded-md flex items-center justify-center`}
        >
          <span>🔄</span>
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

      {/* Add a full width shuffle discard button in its own row */}
      <div className="mt-2">
        <button
          onClick={onShuffleDiscard}
          disabled={!hasCardsInDiscard}
          className={`w-full px-3 py-2 ${hasCardsInDiscard ? 
            'bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700' : 
            'bg-gray-700 cursor-not-allowed'} 
            text-white rounded-md font-mono text-sm flex items-center justify-center`}
        >
          <span className="mr-2">🔄</span> SHUFFLE DISCARD
        </button>
      </div>
    </div>
  );
};

export default ResourceActions;