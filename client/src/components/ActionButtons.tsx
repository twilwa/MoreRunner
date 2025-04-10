import React from 'react';

interface ActionButtonsProps {
  onEndPhase: () => void;
  currentPhase: string;
  isPlayerTurn: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onEndPhase, currentPhase, isPlayerTurn }) => {
  if (!isPlayerTurn) {
    return null;
  }
  
  let buttonText = 'End Phase';
  let buttonColor = 'bg-blue-500 hover:bg-blue-600';
  
  if (currentPhase === 'action') {
    buttonText = 'End Action Phase';
  } else if (currentPhase === 'buy') {
    buttonText = 'End Buy Phase';
  } else if (currentPhase === 'game_over') {
    buttonText = 'Game Over';
    buttonColor = 'bg-gray-500 cursor-not-allowed';
  }
  
  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={currentPhase !== 'game_over' ? onEndPhase : undefined}
        disabled={currentPhase === 'game_over'}
        className={`px-4 py-2 rounded-md text-white font-medium ${buttonColor}`}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default ActionButtons;
