import React, { useEffect, useRef } from 'react';
import { GameLog as LogType } from '../lib/game/game';

interface GameLogProps {
  logs: LogType[];
}

const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  // Reference to the log container for auto-scrolling
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logContainerRef.current) {
      const container = logContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [logs]);
  
  if (logs.length === 0) {
    return (
      <div className="text-gray-500 italic text-sm text-center">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="font-mono text-xs space-y-1 h-full overflow-y-auto" ref={logContainerRef}>
      {logs.map((log, index) => {
        // Format timestamp
        const date = new Date(log.timestamp);
        const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        
        return (
          <div key={index} className="pb-1 border-b border-gray-800">
            <div className="text-cyan-700">[{time}]</div>
            <div className="text-gray-300">{log.message}</div>
          </div>
        );
      })}
    </div>
  );
};

export default GameLog;