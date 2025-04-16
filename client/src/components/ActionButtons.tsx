import React from 'react';

interface ActionButtonsProps {
  onEndPhase: () => void;
  currentPhase: string;
  isPlayerTurn: boolean;
  onViewDeck: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onEndPhase, 
  currentPhase, 
  isPlayerTurn,
  onViewDeck
}) => {
  // Only show action buttons during player's turn
  if (!isPlayerTurn) {
    return (
      <div className="text-center py-4 bg-gray-800/80 rounded-lg border border-yellow-900">
        <div className="animate-pulse flex justify-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <p className="text-yellow-400 font-mono text-sm">OPPONENT'S TURN</p>
        </div>
        
        <div className="mt-4">
          <button
            onClick={onViewDeck}
            className="px-4 py-2 w-full rounded-md text-white font-mono text-sm
              bg-gray-700 hover:bg-gray-600
              shadow-md border border-gray-600"
          >
            VIEW YOUR DECK
          </button>
        </div>
      </div>
    );
  }

  // Set button text and styles based on current phase
  let buttonText = '';
  let actionDescription = '';
  let buttonColor = '';
  let phaseIndicator = '';
  
  switch (currentPhase) {
    case 'action':
      buttonText = 'EXECUTE';
      actionDescription = 'TAP CARDS IN HAND to play them and gain advantages';
      buttonColor = 'from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 border-green-700';
      phaseIndicator = 'ACTION PHASE: Queue cards, then execute';
      break;
    case 'buy':
      buttonText = 'END BUY PHASE';
      actionDescription = 'TAP CARDS IN MARKET to purchase new programs';
      buttonColor = 'from-blue-800 to-blue-900 hover:from-blue-700 hover:to-blue-800 border-blue-700';
      phaseIndicator = 'BUY PHASE: Purchase cards';
      break;
    case 'cleanup':
      buttonText = 'END TURN';
      actionDescription = 'End your turn and draw a new hand';
      buttonColor = 'from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 border-purple-700';
      phaseIndicator = 'CLEANUP PHASE: End turn';
      break;
    default:
      buttonText = 'WAIT...';
      actionDescription = 'Processing...';
      buttonColor = 'from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border-gray-700';
      phaseIndicator = 'PROCESSING...';
  }

  return (
    <div className="p-4 bg-gray-800/80 rounded-lg border border-cyan-900 space-y-4">
      {/* Phase indicator with pulsing dot */}
      <div className="flex items-center justify-center mb-2">
        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse mr-2"></div>
        <h3 className="text-cyan-400 font-bold tracking-wider text-sm">{phaseIndicator}</h3>
      </div>
      
      <p className="text-sm text-cyan-300 text-center font-mono">{actionDescription}</p>
      
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={onEndPhase}
          className={`px-6 py-4 rounded-md text-white font-mono text-md
            bg-gradient-to-r ${buttonColor}
            transform transition-all duration-200
            shadow-lg active:scale-95`}
        >
          {buttonText}
        </button>
        
        <button
          onClick={onViewDeck}
          className="px-4 py-2 rounded-md text-white font-mono text-sm
            bg-gray-700 hover:bg-gray-600 
            shadow-md border border-gray-600"
        >
          VIEW YOUR DECK
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;