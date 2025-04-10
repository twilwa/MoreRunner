import React, { useEffect, useRef } from 'react';
import { GameLog as LogType } from '../lib/game/game';

interface GameLogProps {
  logs: LogType[];
}

const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
  
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">Game Log</h2>
      <div 
        ref={logContainerRef}
        className="bg-gray-100 rounded-md p-3 h-40 overflow-y-auto text-sm"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center italic">No game events yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1 last:mb-0">
              <span className="text-gray-500 text-xs mr-2">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameLog;
