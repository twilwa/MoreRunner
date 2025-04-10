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
  
  // Format messages to be more cyberpunk-themed
  const formatMessage = (message: string) => {
    // Add highlighting for game events based on content
    if (message.includes('damage')) {
      return message.replace(/(\d+) damage/g, '<span class="text-red-400 font-bold">$1 damage</span>');
    } else if (message.includes('credits')) {
      return message.replace(/(\d+) credits/g, '<span class="text-yellow-400 font-bold">$1¤</span>');
    } else if (message.includes('discard')) {
      return message.replace(/(discard.*card)/g, '<span class="text-red-400">$1</span>');
    } else if (message.includes('draw')) {
      return message.replace(/(draw.*card)/g, '<span class="text-purple-400">$1</span>');
    } else if (message.includes('buys')) {
      return message.replace(/(bought)/g, '<span class="text-yellow-400 font-bold">$1</span>');
    } else if (message.includes('played')) {
      return message.replace(/(played)/g, '<span class="text-green-400 font-bold">$1</span>');
    } else if (message.includes('phase')) {
      return message.replace(/(phase)/g, '<span class="text-cyan-400 font-bold">$1</span>');
    } else if (message.includes('turn')) {
      return message.replace(/(Turn \d+)/g, '<span class="text-blue-400 font-bold">$1</span>');
    }
    
    return message;
  };
  
  return (
    <div className="mb-6 relative">
      <div className="flex items-center mb-3">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        <h2 className="text-lg font-semibold text-green-400 font-mono tracking-wide">SYSTEM LOG</h2>
        <div className="ml-auto text-xs text-green-700 font-mono">
          {logs.length} entries | SYS.0x{Math.floor(Math.random() * 10000).toString(16).padStart(4, '0')}
        </div>
      </div>
      
      <div className="relative">
        {/* Terminal decoration elements */}
        <div className="absolute top-0 left-0 w-full flex justify-between px-2 py-1 bg-gray-800 rounded-t-md border-t border-l border-r border-green-900 text-xs text-green-700 font-mono z-10">
          <div>netwatch_v2.6.4</div>
          <div className="flex space-x-2">
            <div>●</div>
            <div>●</div>
            <div>●</div>
          </div>
        </div>
        
        <div 
          ref={logContainerRef}
          className="bg-gray-900 rounded-md border border-green-900 p-3 pt-8 h-48 overflow-y-auto text-sm font-mono text-green-300 shadow-lg shadow-green-900/20"
          style={{ 
            backgroundImage: 'linear-gradient(rgba(0, 20, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 20, 0, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {logs.length === 0 ? (
            <div className="text-green-500 text-center border border-green-800 p-2 bg-gray-900 rounded">
              <span className="animate-pulse">█</span> System idle. Awaiting network activity...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 last:mb-0 hover:bg-green-900/10 transition-colors px-1 rounded">
                <span className="text-green-600 text-xs mr-2 font-bold">
                  [{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                </span>
                <span dangerouslySetInnerHTML={{ __html: formatMessage(log.message) }}></span>
              </div>
            ))
          )}
          
          {/* Blinking cursor at the end */}
          <div className="text-green-400 animate-pulse inline-block">█</div>
        </div>
      </div>
    </div>
  );
};

export default GameLog;
