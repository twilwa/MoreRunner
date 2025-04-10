import React from 'react';

interface ActionButtonsProps {
  onEndPhase: () => void;
  currentPhase: string;
  isPlayerTurn: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onEndPhase, 
  currentPhase, 
  isPlayerTurn 
}) => {
  // Only show action buttons during player's turn
  if (!isPlayerTurn) {
    return (
      <div className="text-center py-2">
        <p className="text-yellow-400 font-mono text-sm">WAITING FOR OPPONENT...</p>
      </div>
    );
  }

  // Set button text based on current phase
  let buttonText = '';
  let actionDescription = '';
  
  switch (currentPhase) {
    case 'action':
      buttonText = 'END ACTION PHASE';
      actionDescription = 'Play programs from your hand to gain advantages.';
      break;
    case 'buy':
      buttonText = 'END BUY PHASE';
      actionDescription = 'Purchase new programs from the market to improve your deck.';
      break;
    case 'cleanup':
      buttonText = 'END TURN';
      actionDescription = 'End your turn and draw a new hand.';
      break;
    default:
      buttonText = 'WAIT...';
      actionDescription = 'Processing...';
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <p className="text-sm text-cyan-300 text-center">{actionDescription}</p>
      
      <button
        onClick={onEndPhase}
        className="px-6 py-3 w-full rounded-md text-white font-mono
          bg-gradient-to-r from-cyan-800 to-blue-900 hover:from-cyan-700 hover:to-blue-800
          transform transition-all duration-200
          shadow-md border border-cyan-700"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default ActionButtons;