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
  
  let buttonText = 'EXECUTE_PHASE_END';
  let buttonBg = 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500';
  let buttonBorder = 'border-cyan-400';
  
  if (currentPhase === 'action') {
    buttonText = '>> EXECUTE_ACTION_END';
  } else if (currentPhase === 'buy') {
    buttonText = '>> EXECUTE_PURCHASE_END';
    buttonBg = 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500';
    buttonBorder = 'border-yellow-400';
  } else if (currentPhase === 'game_over') {
    buttonText = 'CONNECTION_TERMINATED';
    buttonBg = 'bg-gradient-to-r from-red-800 to-red-600 cursor-not-allowed';
    buttonBorder = 'border-red-400';
  }
  
  return (
    <div className="mt-6 flex justify-center">
      <button
        onClick={currentPhase !== 'game_over' ? onEndPhase : undefined}
        disabled={currentPhase === 'game_over'}
        className={`px-6 py-3 rounded-md text-white font-mono tracking-wide ${buttonBg} transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-cyan-700/50 border-2 ${buttonBorder}`}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default ActionButtons;
