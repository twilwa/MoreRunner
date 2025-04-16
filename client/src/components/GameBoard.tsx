import React, { useState, useEffect } from 'react';
import { useDeckBuilder } from '../lib/stores/useDeckBuilder';
import { useGame } from '../lib/stores/useGame';
import { useAudio } from '../lib/stores/useAudio';
import { useIdentity } from '../lib/stores/useIdentity';
import { DropResult } from 'react-beautiful-dnd';
import Hand from './Hand';
import Market from './Market';
import Player from './Player';
import ActionButtons from './ActionButtons';
import GameLog from './GameLog';
import DeckViewer from './DeckViewer';
import LocationCard from './LocationCard';
import ResourceActions from './ResourceActions';
import DraggableHand from './DraggableHand';
import ExecuteButton from './ExecuteButton';
import CardTargetingModal from './CardTargetingModal';
import IdentitySelectionModal from './IdentitySelectionModal';
import { Card as CardType } from '../lib/game/cards';
import { LocationThreat } from '../lib/game/location';
import { EntityStatus } from '../lib/stores/useDeckBuilder';
import { cardExecutionService } from '../lib/game/cardExecutionService';



const GameBoard: React.FC = () => {
  const { 
    gameState, 
    locationDeck,
    entityStatuses,
    playCard, 
    buyCard, 
    endPhase, 
    addLogMessage,
    drawLocation,
    drawCard,
    gainCredit,
    gainAction,
    shuffleDiscard,
    queueCard,
    returnQueuedCard,
    reorderQueuedCards,
    executeQueuedCards,
    updateEntityActionPotential,
    addEntityPlayedCard,
    clearEntityPlayedCards
  } = useDeckBuilder();
  const { phase } = useGame();
  const { toggleMute, isMuted } = useAudio();
  const { selectedIdentity, setIdentity } = useIdentity();
  
  // State for the DeckViewer modal
  const [isDeckViewerOpen, setIsDeckViewerOpen] = useState(false);
  
  // State for mobile layout
  const [activeTab, setActiveTab] = useState<'log' | 'market' | 'hand'>('hand');
  
  // State for card targeting modal
  const [isTargetingModalOpen, setIsTargetingModalOpen] = useState(false);
  
  // State for identity selection modal
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  
  // Effect to initialize entity statuses when a new location is loaded
  useEffect(() => {
    if (locationDeck?.currentLocation) {
      const { threats } = locationDeck.currentLocation;
      
      // Initialize entity statuses for all threats in current location
      threats.forEach(threat => {
        // Determine number of action potentials based on threat danger level
        const numPotentials = Math.max(1, Math.min(4, Math.ceil(threat.dangerLevel * 0.8)));
        const initialPotentials = Array(numPotentials).fill(false);
        
        // Update entity status for this threat
        updateEntityActionPotential(threat.id, initialPotentials);
      });
    }
  }, [locationDeck?.currentLocation?.id]); // Only run when the location ID changes
  
  // Effect to check if we need to show targeting modal
  useEffect(() => {
    // Check if card execution service is awaiting target selection
    console.log("Checking for awaiting target selection:", 
                cardExecutionService.isExecutionPaused(), 
                cardExecutionService.isAwaitingTargetSelection());
    
    if (cardExecutionService.isExecutionPaused() && cardExecutionService.isAwaitingTargetSelection()) {
      console.log("Execution is awaiting target selection - showing modal");
      setIsTargetingModalOpen(true);
    } else {
      setIsTargetingModalOpen(false);
    }
  }, [
    gameState?.turnNumber, 
    gameState?.logs.length, 
    gameState?.phase, 
    cardExecutionService.isAwaitingTargetSelection(),
    cardExecutionService.isExecutionPaused()
  ]); // Check after game state updates or execution state changes
  
  // Show identity selection modal on mount if no identity is selected
  useEffect(() => {
    if (!selectedIdentity) {
      setIsIdentityModalOpen(true);
    }
  }, [selectedIdentity]);
  
  // Only show game if state is initialized and in playing phase
  if (!gameState || phase !== 'playing') {
    return null;
  }

  // Get the active player (assume player 0 is the user)
  const activePlayer = gameState.players[0];
  const identity = activePlayer.identity;

  if (isIdentityModalOpen) {
    return (
      <IdentitySelectionModal
        isOpen={isIdentityModalOpen}
        onSelect={identity => {
          setIdentity(identity);
          setIsIdentityModalOpen(false);
        }}
        onClose={() => setIsIdentityModalOpen(false)}
      />
    );
  }

  const otherPlayerIndex = gameState.activePlayerIndex === 0 ? 1 : 0;
  const otherPlayer = gameState.players[otherPlayerIndex];
  const isPlayerTurn = gameState.activePlayerIndex === 0;
  
  // GAME ACTION HANDLERS
  
  // Handlers for game actions
  const handleQueueCard = (cardIndex: number) => {
    // Queue a card anytime during player's turn
    if (isPlayerTurn && activePlayer.actions > 0) {
      queueCard(cardIndex);
    } else {
      // Show why the card can't be queued
      if (!isPlayerTurn) {
        addLogMessage('Cannot queue cards during opponent\'s turn.');
      } else if (activePlayer.actions <= 0) {
        addLogMessage('No actions remaining for this turn.');
      }
    }
  };
  
  // Handle clicking a card in the queue to return it to hand
  const handleReturnQueuedCard = (cardIndex: number) => {
    if (isPlayerTurn) {
      returnQueuedCard(cardIndex);
    } else {
      addLogMessage('Cannot modify queue during opponent\'s turn.');
    }
  };
  
  // Handle drag-and-drop reordering of cards in the queue
  const handleDragEnd = (result: DropResult) => {
    // Drop outside of the droppable area
    if (!result.destination) {
      return;
    }
    
    // No change in position
    if (result.destination.index === result.source.index) {
      return;
    }
    
    // Reorder the cards in the queue
    if (isPlayerTurn) {
      reorderQueuedCards(result.source.index, result.destination.index);
    } else {
      addLogMessage('Cannot reorder cards during opponent\'s turn.');
    }
  };
  
  // Execute all queued cards in order (without ending the action phase)
  const handleExecuteQueuedCards = () => {
    if (isPlayerTurn) {
      if (activePlayer.inPlay.length > 0) {
        executeQueuedCards();
        
        // Check if execution was paused for targeting
        if (cardExecutionService.isExecutionPaused()) {
          console.log("Execution paused, awaiting targets:", cardExecutionService.isAwaitingTargetSelection());
          if (cardExecutionService.isAwaitingTargetSelection()) {
            setIsTargetingModalOpen(true);
          }
        } else {
          addLogMessage('Executed all queued cards. You can continue to play more cards.');
        }
      } else {
        addLogMessage('No cards in queue to execute.');
      }
    }
  };
  
  const handleBuyCard = (cardIndex: number) => {
    // Allow buying cards during player's turn, regardless of phase
    if (isPlayerTurn && activePlayer.buys > 0) {
      const card = gameState.market.availableCards[cardIndex];
      if (card) {
        // Credit costs are now validated by the component system
        // This avoids redundant credit checks that bypass our entity-component system
        buyCard(cardIndex);
        
        // Add log message
        const cardName = card.name || 'Unknown card';
        addLogMessage(`You bought ${cardName} for ${card.cost} credits.`);
      } else {
        addLogMessage('Card not available in the market.');
      }
    } else {
      // Show why the card can't be bought
      if (!isPlayerTurn) {
        addLogMessage('Cannot buy cards during opponent\'s turn.');
      } else if (activePlayer.buys <= 0) {
        addLogMessage('No buys remaining for this turn.');
      }
    }
  };
  
  const handleEndPhase = () => {
    // Execute any queued cards first if player has cards in queue
    if (isPlayerTurn && activePlayer.inPlay.length > 0) {
      executeQueuedCards();
      
      // If the execution was paused for targeting, we need to handle it
      // before ending the phase
      if (cardExecutionService.isExecutionPaused()) {
        console.log("End phase - execution paused, awaiting targets:", cardExecutionService.isAwaitingTargetSelection());
        if (cardExecutionService.isAwaitingTargetSelection()) {
          setIsTargetingModalOpen(true);
          // Don't end the phase yet, wait for targets to be selected
          addLogMessage('Card execution requires target selection. Please select targets before ending phase.');
          return;
        }
      }
      
      addLogMessage('Executing all queued programs.');
    }
    
    endPhase();
    
    // Add log message based on phase
    if (gameState.phase === 'action') {
      addLogMessage('You ended your action phase.');
    } else if (gameState.phase === 'buy') {
      addLogMessage('You ended your buy phase.');
    } else if (gameState.phase === 'cleanup') {
      addLogMessage('You ended your turn.');
    }
  };
  
  const handleViewDeck = () => {
    setIsDeckViewerOpen(true);
  };
  
  // Handle target selection from the targeting modal
  const handleTargetSelection = (targets: any[]) => {
    console.log("Target selection handler called with targets:", targets);
    
    if (cardExecutionService.isAwaitingTargetSelection()) {
      console.log("Execution service is awaiting target selection, providing targets");
      
      // Provide the selected targets to the execution service
      // The improved provideTargets method will automatically resume execution
      cardExecutionService.provideTargets(targets);
      
      console.log("Targets provided to execution service, execution will resume automatically");
    }
  };
  
  // Determine if player can perform actions (removed phase restrictions)
  const canPlayCards = isPlayerTurn && activePlayer.actions > 0;
  const canBuyCards = isPlayerTurn && activePlayer.buys > 0;
  
  // Render the appropriate tab content for mobile layout
  const renderTabContent = () => {
    switch (activeTab) {
      case 'log':
        return (
          <div className="space-y-4">
            {/* Game logs */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-64 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-2 text-cyan-400">SYSTEM LOG</h2>
              <GameLog logs={gameState.logs} />
            </div>
          </div>
        );
      case 'market':
        return (
          <div className="space-y-4">
            {/* Market */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-2 text-cyan-400">DATAMARKET</h2>
              <Market 
                market={gameState.market} 
                onCardClick={handleBuyCard}
                canBuyCards={canBuyCards}
                playerCoins={activePlayer.credits}
              />
            </div>
          </div>
        );
      case 'hand':
      default:
        return (
          <div className="space-y-4">
            {/* Player info */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <Player 
                player={activePlayer} 
                isActive={isPlayerTurn}
                turnNumber={gameState.turnNumber}
                phase={gameState.phase}
              />
            </div>
            
            {/* Player hand with compact resource actions */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-cyan-400">YOUR HAND</h2>
                <ResourceActions
                  onDrawCard={drawCard}
                  onGainCredit={gainCredit}
                  onGainAction={gainAction}
                  onShuffleDiscard={shuffleDiscard}
                  isPlayerTurn={isPlayerTurn}
                  compact={true}
                  hasCardsInDiscard={activePlayer.discard.length > 0}
                />
              </div>
              <Hand 
                cards={activePlayer.hand} 
                onCardClick={handleQueueCard}
                canPlayCards={canPlayCards}
              />
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="h-screen bg-gray-900 text-gray-200 flex flex-col overflow-hidden" data-testid="game-board">
      {/* Display Runner Identity at the top */}
      {identity && (
        <div className="flex items-center justify-center py-2 mb-2 bg-cyan-900 bg-opacity-80 rounded-lg shadow border border-cyan-700">
          {/* Avatar placeholder removed since avatarUrl is not in RunnerIdentity */}
          <div>
            <div className="text-cyan-300 font-bold text-lg">{identity.name}</div>
            <div className="text-cyan-100 text-xs italic">{identity.faction}</div>
            <div className="text-cyan-200 text-sm mt-1 max-w-xs">{identity.description}</div>
            {identity.ability && (
              <div className="text-cyan-400 text-sm mt-1 font-semibold">Ability: {identity.ability}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Sound toggle */}
      <button 
        onClick={toggleMute}
        className="fixed top-4 right-4 text-cyan-400 hover:text-cyan-300 z-20 w-10 h-10 flex items-center justify-center bg-gray-800/80 rounded-full"
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      
      {/* Fixed Header */}
      <header className="flex-none bg-gray-900 p-4 border-b border-gray-800 text-center">
        <h1 className="text-3xl font-bold text-cyan-400 tracking-wide">NETRUNNER</h1>
        <div className="mt-2 text-sm text-cyan-600">TURN {gameState.turnNumber} • {gameState.phase.toUpperCase()} PHASE</div>
      </header>
      
      {/* Main Content - This is the only scrollable area */}
      <div className="flex-grow overflow-y-auto pb-24 md:pb-8">
        <div className="container mx-auto max-w-screen-xl px-2 md:px-4">
          {/* Current Location - Full width on desktop and mobile */}
          <div className="p-4">
            <h2 className="text-xl font-bold text-cyan-400 mb-3">CURRENT LOCATION</h2>
            <LocationCard 
              location={locationDeck?.currentLocation || null}
              onDrawNextLocation={drawLocation}
              canDrawNextLocation={isPlayerTurn}
              hasFoundObjective={locationDeck?.hasFoundObjective || false}
              hasReachedExit={locationDeck?.hasReachedExit || false}
              entityStatuses={entityStatuses}
            />
          </div>
          
          {/* Active Programs - Full width right below Location for targeting (visible on all devices) */}
          <div className="p-4">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-cyan-400">ACTIVE PROGRAMS</h2>
                {isPlayerTurn && (
                  <ExecuteButton 
                    onExecute={handleExecuteQueuedCards}
                    disabled={!isPlayerTurn}
                    count={activePlayer.inPlay.length}
                  />
                )}
              </div>
              <div className="min-h-[170px] relative w-full overflow-hidden">
                <div className="w-full pr-2">
                  <DraggableHand 
                    cards={activePlayer.inPlay} 
                    onCardClick={handleReturnQueuedCard}
                    onDragEnd={handleDragEnd}
                    canPlayCards={isPlayerTurn}
                    title="Drag to reorder • Click to return to hand"
                    isQueue={true}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop layout - Columns for other components */}
          <div className="hidden md:grid md:grid-cols-12 gap-6 p-4">
            {/* Left column - System Log and Hand (6 cols) */}
            <div className="col-span-6 space-y-4">
              {/* Game logs */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-64 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-2 text-cyan-400">SYSTEM LOG</h2>
                <GameLog logs={gameState.logs} />
              </div>
              
              {/* Player hand with compact resource actions */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-cyan-400">YOUR HAND</h2>
                  <ResourceActions
                    onDrawCard={drawCard}
                    onGainCredit={gainCredit}
                    onGainAction={gainAction}
                    onShuffleDiscard={shuffleDiscard}
                    isPlayerTurn={isPlayerTurn}
                    compact={true}
                    hasCardsInDiscard={activePlayer.discard.length > 0}
                  />
                </div>
                <Hand 
                  cards={activePlayer.hand} 
                  onCardClick={handleQueueCard}
                  canPlayCards={canPlayCards}
                />
              </div>
            </div>
            
            {/* Right area - Market and Player (6 cols) */}
            <div className="col-span-6 space-y-4">
              {/* Player info with View Deck button */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <Player 
                  player={activePlayer} 
                  isActive={isPlayerTurn}
                  turnNumber={gameState.turnNumber}
                  phase={gameState.phase}
                  onViewDeck={handleViewDeck}
                />
              </div>
              
              {/* Market */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h2 className="text-lg font-semibold mb-2 text-cyan-400">DATAMARKET</h2>
                <Market 
                  market={gameState.market} 
                  onCardClick={handleBuyCard}
                  canBuyCards={canBuyCards}
                  playerCoins={activePlayer.credits}
                />
              </div>
              
              {/* Phase change buttons - only show when not player's turn */}
              {!isPlayerTurn && (
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <ActionButtons 
                    onEndPhase={handleEndPhase}
                    currentPhase={gameState.phase}
                    isPlayerTurn={isPlayerTurn}
                    onViewDeck={handleViewDeck}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile layout - Tabs */}
          <div className="md:hidden px-2">
            {/* Tab content */}
            {renderTabContent()}
            
            {/* Action buttons always visible on mobile */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4 mb-20">
              {isPlayerTurn ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse mr-2"></div>
                    <h3 className="text-cyan-400 font-bold tracking-wider text-sm">QUEUE CARDS: Add cards and execute them</h3>
                  </div>
                  
                  <p className="text-sm text-cyan-300 text-center font-mono mb-4">TAP CARDS IN HAND to queue, or BUY CARDS from the market</p>
                  
                  <ExecuteButton 
                    onExecute={handleExecuteQueuedCards}
                    disabled={!isPlayerTurn}
                    count={activePlayer.inPlay.length}
                  />
                </div>
              ) : (
                <ActionButtons 
                  onEndPhase={handleEndPhase}
                  currentPhase={gameState.phase}
                  isPlayerTurn={isPlayerTurn}
                  onViewDeck={handleViewDeck}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile tab navigation - Fixed at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-cyan-900 shadow-lg z-20">
        <div className="flex justify-around">
          <button
            onClick={() => { setActiveTab('hand'); }}
            className={`flex-1 py-4 px-2 text-center ${activeTab === 'hand' ? 'bg-cyan-900 text-white' : 'text-cyan-500'}`}
          >
            <div className="text-xl mb-1">👐</div>
            <div className="text-xs">HAND</div>
          </button>
          <button
            onClick={() => { setActiveTab('market'); }}
            className={`flex-1 py-4 px-2 text-center ${activeTab === 'market' ? 'bg-cyan-900 text-white' : 'text-cyan-500'}`}
          >
            <div className="text-xl mb-1">🛒</div>
            <div className="text-xs">MARKET</div>
          </button>
          <button
            onClick={() => { setActiveTab('log'); }}
            className={`flex-1 py-4 px-2 text-center ${activeTab === 'log' ? 'bg-cyan-900 text-white' : 'text-cyan-500'}`}
          >
            <div className="text-xl mb-1">📜</div>
            <div className="text-xs">LOG</div>
          </button>
        </div>
      </div>
      
      {/* Deck Viewer Modal */}
      <DeckViewer 
        isOpen={isDeckViewerOpen}
        onClose={() => setIsDeckViewerOpen(false)}
        playerDeck={activePlayer.deck}
        playerDiscard={activePlayer.discard}
      />

      {/* Identity Selection Modal */}
      <IdentitySelectionModal
        isOpen={isIdentityModalOpen}
        onSelect={identity => {
          setIdentity(identity);
          setIsIdentityModalOpen(false);
          addLogMessage(`Selected identity: ${identity.name}`);
        }}
        onClose={() => setIsIdentityModalOpen(false)}
      />

      {/* Card Targeting Modal */}
      <CardTargetingModal
        isOpen={isTargetingModalOpen}
        onClose={() => {
          setIsTargetingModalOpen(false);
          cardExecutionService.cancelExecution();
          addLogMessage('Card execution canceled.');
        }}
        onTargetSelect={handleTargetSelection}
      />

    </div>
  );
};

export default GameBoard;
