// Integration Example for the Component-Based Card System
// This is a demonstration of how to integrate the component system into the game

import React, { useState } from 'react';
import { ENHANCED_MALICIOUS_CODE } from './enhancedCards';
import { cardExecutionService } from './cardExecutionService';
import EnhancedCardConfirmationModal, { EnhancedCardTarget } from '../../components/EnhancedCardConfirmationModal';

// Example game state
const exampleGameState = {
  players: [
    {
      id: 'player1',
      name: 'Runner',
      hand: [],
      deck: [],
      discard: [],
      inPlay: [],
      credits: 10,
      actions: 3,
      health: 20
    },
    {
      id: 'ai',
      name: 'Corporation',
      hand: [],
      deck: [],
      discard: [],
      inPlay: [],
      credits: 15,
      actions: 0,
      health: 25
    }
  ],
  activePlayerIndex: 0,
  turnNumber: 1,
  phase: 'action',
  logs: [],
  locationThreats: [
    {
      id: 'threat1',
      name: 'Security Guard',
      health: 5,
      faction: 'Corp',
      dangerLevel: 2,
      actionPotentials: [true, false, false]
    },
    {
      id: 'threat2',
      name: 'Firewall System',
      health: 8,
      faction: 'Corp',
      dangerLevel: 3,
      actionPotentials: [true, true, false, false]
    }
  ]
};

// Example component for using the card execution system
export const CardExecutionExample: React.FC = () => {
  const [gameState, setGameState] = useState(exampleGameState);
  const [logs, setLogs] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Example targets for the modal
  const possibleTargets: EnhancedCardTarget[] = gameState.locationThreats.map(threat => ({
    id: threat.id,
    name: threat.name,
    type: 'threat',
    health: threat.health,
    faction: threat.faction,
    description: `Danger Level: ${threat.dangerLevel}`
  }));
  
  // Function to add a log message
  const addLogMessage = (message: string) => {
    setLogs(prev => [...prev, message]);
    console.log('Game Log:', message);
  };
  
  // Function to handle playing the Malicious Code card
  const handlePlayMaliciousCode = () => {
    // Queue the card for execution
    cardExecutionService.queueCard(ENHANCED_MALICIOUS_CODE);
    
    // Start execution
    cardExecutionService.executeNextCard(gameState, addLogMessage);
    
    // If execution paused for target selection, open the modal
    if (cardExecutionService.isAwaitingTargetSelection()) {
      setIsModalOpen(true);
    }
  };
  
  // Function to handle target selection and continue execution
  const handleTargetSelection = (targets: EnhancedCardTarget[]) => {
    // Convert UI targets to game targets
    const gameTargets = targets.map(target => {
      // Find the corresponding game object
      if (target.type === 'threat') {
        return gameState.locationThreats.find(threat => threat.id === target.id);
      }
      return null;
    }).filter(Boolean); // Remove any null values
    
    // Provide the targets to the execution service
    cardExecutionService.provideTargets(gameTargets);
    
    // Close the modal
    setIsModalOpen(false);
    
    // Continue execution
    cardExecutionService.executeNextCard(gameState, addLogMessage);
    
    // Update game state with changes (in a real implementation, this would happen as part of the execution)
    const newState = { ...gameState };
    setGameState(newState);
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Card Execution Example</h1>
      
      {/* Card display */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Card:</h2>
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="font-mono">
            <div className="font-bold">{ENHANCED_MALICIOUS_CODE.name}</div>
            <div className="text-sm mb-2">Cost: {ENHANCED_MALICIOUS_CODE.cost} | {ENHANCED_MALICIOUS_CODE.faction}</div>
            <div className="text-xs">{ENHANCED_MALICIOUS_CODE.description}</div>
            <div className="text-xs mt-2">Keywords: {ENHANCED_MALICIOUS_CODE.keywords.join(', ')}</div>
          </div>
          <button 
            onClick={handlePlayMaliciousCode}
            className="mt-4 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded text-white"
          >
            Play Card
          </button>
        </div>
      </div>
      
      {/* Game state display */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-2">Player:</h2>
          <div className="p-4 bg-gray-800 rounded-lg">
            <div>Name: {gameState.players[0].name}</div>
            <div>Credits: {gameState.players[0].credits}</div>
            <div>Actions: {gameState.players[0].actions}</div>
            <div>Health: {gameState.players[0].health}</div>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Opponent:</h2>
          <div className="p-4 bg-gray-800 rounded-lg">
            <div>Name: {gameState.players[1].name}</div>
            <div>Credits: {gameState.players[1].credits}</div>
            <div>Health: {gameState.players[1].health}</div>
          </div>
        </div>
      </div>
      
      {/* Location threats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Location Threats:</h2>
        <div className="space-y-2">
          {gameState.locationThreats.map(threat => (
            <div key={threat.id} className="p-4 bg-gray-800 rounded-lg flex justify-between">
              <div>
                <div className="font-medium">{threat.name}</div>
                <div className="text-sm">Faction: {threat.faction}</div>
                <div className="text-sm">Danger Level: {threat.dangerLevel}</div>
              </div>
              <div className="text-xl font-bold">HP: {threat.health}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Game logs */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Game Logs:</h2>
        <div className="p-4 bg-gray-800 rounded-lg h-40 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 text-sm">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Target selection modal */}
      <EnhancedCardConfirmationModal
        isOpen={isModalOpen}
        card={ENHANCED_MALICIOUS_CODE}
        context={cardExecutionService.getExecutionContext()}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleTargetSelection}
        possibleTargets={possibleTargets}
        message="Select a target for Malicious Code"
      />
    </div>
  );
};

export default CardExecutionExample;