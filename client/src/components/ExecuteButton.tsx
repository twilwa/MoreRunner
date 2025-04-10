import React from 'react';

interface ExecuteButtonProps {
  onExecute: () => void;
  disabled?: boolean;
  count: number;
}

const ExecuteButton: React.FC<ExecuteButtonProps> = ({ 
  onExecute, 
  disabled = false,
  count
}) => {
  return (
    <button
      onClick={onExecute}
      disabled={disabled || count === 0}
      className={`
        px-4 py-2 rounded-md font-mono text-sm font-bold
        transition-all duration-200
        flex items-center justify-center gap-2
        ${count > 0 && !disabled
          ? 'bg-gradient-to-r from-green-700 to-green-900 hover:from-green-600 hover:to-green-800 text-white shadow-lg shadow-green-900/30 border border-green-600'
          : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}
      `}
    >
      <span className="text-lg">⚡</span>
      <span>EXECUTE {count > 0 ? `(${count})` : ''}</span>
    </button>
  );
};

export default ExecuteButton;