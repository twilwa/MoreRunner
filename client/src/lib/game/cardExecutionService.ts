// Card Execution Service
// This file handles execution of cards with components

import { 
  EnhancedCard, 
  GameContext, 
  executeCardComponents 
} from './components';
import { Card } from './cards';
import { getEnhancedCard } from './enhancedCards';

// Interface for target selection callback
export interface TargetSelectionCallback {
  (targets: any[]): void;
}

// Card execution state
interface ExecutionState {
  queue: EnhancedCard[];
  currentIndex: number;
  isPaused: boolean;
  awaitingTargetSelection: boolean;
  selectedTargets: any[];
  context: GameContext | null;
  targetSelectionCallback: TargetSelectionCallback | null;
}

// Simple execution service
export class CardExecutionService {
  private executionState: ExecutionState = {
    queue: [],
    currentIndex: 0,
    isPaused: false,
    awaitingTargetSelection: false,
    selectedTargets: [],
    context: null,
    targetSelectionCallback: null
  };
  
  // Add a card to the execution queue
  queueCard(card: EnhancedCard): void {
    this.executionState.queue.push(card);
  }
  
  // Remove a card from the execution queue
  removeCard(index: number): EnhancedCard | null {
    if (index >= 0 && index < this.executionState.queue.length) {
      return this.executionState.queue.splice(index, 1)[0];
    }
    return null;
  }
  
  // Reorder cards in the queue
  reorderCards(fromIndex: number, toIndex: number): void {
    if (
      fromIndex >= 0 && 
      fromIndex < this.executionState.queue.length &&
      toIndex >= 0 && 
      toIndex < this.executionState.queue.length
    ) {
      const card = this.executionState.queue.splice(fromIndex, 1)[0];
      this.executionState.queue.splice(toIndex, 0, card);
    }
  }
  
  // Execute the next card in the queue
  executeNextCard(gameState: any, addLogMessage: (message: string) => void): boolean {
    // Check if queue is empty or execution is already paused
    if (
      this.executionState.queue.length === 0 || 
      this.executionState.currentIndex >= this.executionState.queue.length ||
      this.executionState.isPaused
    ) {
      return false;
    }
    
    // Get the current card
    const currentCard = this.executionState.queue[this.executionState.currentIndex];
    
    // Get the enhanced version of the card if available
    const enhancedCard = currentCard.components 
      ? currentCard 
      : getEnhancedCard(currentCard.id) || currentCard;
    
    // Create context for execution
    const context: GameContext = {
      card: enhancedCard,
      player: gameState.players[gameState.activePlayerIndex],
      opponents: gameState.players.filter((_: unknown, i: number) => i !== gameState.activePlayerIndex),
      targets: [],
      cardsInPlay: gameState.players.reduce((all: Card[], p: {inPlay: Card[]}) => [...all, ...p.inPlay], [] as Card[]),
      executionPaused: false,
      awaitingTargetSelection: false,
      queuePosition: this.executionState.currentIndex,
      gameState,
      log: addLogMessage
    };
    
    // Store the context
    this.executionState.context = context;
    
    // Execute the card's components
    if (enhancedCard.components) {
      executeCardComponents(enhancedCard, context);
      
      // Check if execution was paused (e.g., for target selection)
      if (context.executionPaused) {
        this.executionState.isPaused = true;
        this.executionState.awaitingTargetSelection = context.awaitingTargetSelection;
        
        return false; // Execution did not complete
      }
    } else {
      // If card doesn't use component system, use traditional effects
      addLogMessage(`Executing ${currentCard.name} using traditional effects.`);
      // Apply traditional effects here...
    }
    
    // Move to next card
    this.executionState.currentIndex++;
    
    // Check if we're done with the queue
    if (this.executionState.currentIndex >= this.executionState.queue.length) {
      // Reset the execution state
      this.resetExecutionState();
      addLogMessage("Finished executing all cards in the queue.");
      return true; // Execution complete
    }
    
    return false; // More cards to execute
  }
  
  // Execute all cards in the queue
  executeAllCards(gameState: any, addLogMessage: (message: string) => void): boolean {
    let allComplete = false;
    
    // While there are cards to execute and execution isn't paused
    while (
      this.executionState.currentIndex < this.executionState.queue.length && 
      !this.executionState.isPaused
    ) {
      allComplete = this.executeNextCard(gameState, addLogMessage);
    }
    
    return allComplete;
  }
  
  // Provide targets for a paused execution
  provideTargets(targets: any[], callback?: TargetSelectionCallback): void {
    // Store the selected targets
    this.executionState.selectedTargets = targets;
    
    // Store the callback if provided
    if (callback) {
      this.executionState.targetSelectionCallback = callback;
    }
    
    // If we have a context, update it with the selected targets
    if (this.executionState.context) {
      this.executionState.context.targets = targets;
      this.executionState.context.executionPaused = false;
      this.executionState.context.awaitingTargetSelection = false;
    }
    
    // Resume execution
    this.executionState.isPaused = false;
    this.executionState.awaitingTargetSelection = false;
    
    // Call the callback if provided
    if (this.executionState.targetSelectionCallback) {
      this.executionState.targetSelectionCallback(targets);
      this.executionState.targetSelectionCallback = null;
    }
  }
  
  // Cancel the current execution
  cancelExecution(): void {
    this.resetExecutionState();
  }
  
  // Reset the execution state
  resetExecutionState(): void {
    this.executionState = {
      queue: [],
      currentIndex: 0,
      isPaused: false,
      awaitingTargetSelection: false,
      selectedTargets: [],
      context: null,
      targetSelectionCallback: null
    };
  }
  
  // Check if execution is paused
  isExecutionPaused(): boolean {
    return this.executionState.isPaused;
  }
  
  // Check if awaiting target selection
  isAwaitingTargetSelection(): boolean {
    return this.executionState.awaitingTargetSelection;
  }
  
  // Get the current execution context
  getExecutionContext(): GameContext | null {
    return this.executionState.context;
  }
  
  // Get the current queue of cards
  getQueue(): EnhancedCard[] {
    return [...this.executionState.queue];
  }
  
  // Get the current execution index
  getCurrentIndex(): number {
    return this.executionState.currentIndex;
  }
  
  // Cancel execution, resetting the state when a user cancels a target selection
  cancelExecution(): void {
    this.executionState.isPaused = false;
    this.executionState.awaitingTargetSelection = false;
    this.executionState.selectedTargets = [];
    
    // If we have a context, update it
    if (this.executionState.context) {
      this.executionState.context.executionPaused = false;
      this.executionState.context.awaitingTargetSelection = false;
    }
    
    // Do not reset the queue or current index, as we may want to continue execution later
  }
}

// Singleton instance
export const cardExecutionService = new CardExecutionService();