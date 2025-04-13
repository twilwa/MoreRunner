// Card Execution Service
// This file handles execution of cards with components

import { 
  EnhancedCard, 
  GameContext, 
  executeCardComponents,
  InQueueZone,
  InDiscardZone,
  InMarketZone,
  InDeckZone,
  InHandZone,
  InPlayZone,
  CardZone
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
    console.log(`Queueing card ${card.name} for execution`);
    
    // Make a copy of the card to avoid modifying the original
    const cardCopy = { ...card, components: [...(card.components || [])] };
    
    // Remove any existing zone components before adding the inQueue zone
    if (cardCopy.components) {
      // Also remove any CreditCost components - credit costs only apply in market
      cardCopy.components = cardCopy.components.filter(comp => 
        comp.type !== 'inMarketZone' && 
        comp.type !== 'inDeckZone' && 
        comp.type !== 'inHandZone' && 
        comp.type !== 'inQueueZone' &&
        comp.type !== 'inPlayZone' &&
        comp.type !== 'inDiscardZone' &&
        // Important: Remove CreditCost components to ensure they don't apply in queue
        comp.type !== 'CreditCost'
      );
      
      // Add the inQueue zone component with position = current queue length
      const queuePosition = this.executionState.queue.length;
      cardCopy.components.push(new InQueueZone(queuePosition));
      
      console.log(`Added InQueueZone component with position ${queuePosition} to ${cardCopy.name}, removed any credit costs`);
    }
    
    this.executionState.queue.push(cardCopy);
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
      console.log("Cannot execute next card:", 
                  "queue empty:", this.executionState.queue.length === 0,
                  "index out of bounds:", this.executionState.currentIndex >= this.executionState.queue.length,
                  "execution paused:", this.executionState.isPaused);
      return false;
    }
    
    // Get the current card
    const currentCard = this.executionState.queue[this.executionState.currentIndex];
    console.log("Executing card:", currentCard.name, "at index:", this.executionState.currentIndex);
    
    // Get the enhanced version of the card if available
    const enhancedCard = currentCard.components 
      ? currentCard 
      : getEnhancedCard(currentCard.id) || currentCard;
    
    // Log if we found an enhanced version
    if (enhancedCard !== currentCard) {
      console.log("Using enhanced version of card:", enhancedCard.name);
    }
    
    // Create context for execution
    const context: GameContext = {
      card: enhancedCard,
      player: gameState.players[gameState.activePlayerIndex],
      opponents: gameState.players.filter((_: unknown, i: number) => i !== gameState.activePlayerIndex),
      targets: [],
      cardsInPlay: gameState.players.reduce((all: Card[], p: {inPlay: Card[]}) => [...all, ...p.inPlay], [] as Card[]),
      executionPaused: false,
      awaitingTargetSelection: false,
      targetsConfirmed: false, // Initialize the new targetsConfirmed flag to false
      queuePosition: this.executionState.currentIndex,
      gameState,
      log: addLogMessage
    };
    
    // Store the context
    this.executionState.context = context;
    
    // Execute the card's components
    if (enhancedCard.components) {
      console.log(`Executing components for card: ${enhancedCard.name}`);
      
      // IMPORTANT: Make sure CreditCost components are not present in the queue
      // Credit costs are only checked when buying cards from the market
      enhancedCard.components = enhancedCard.components.filter(comp => 
        comp.type !== 'CreditCost'
      );
      
      // Log component types before execution for debugging
      if (enhancedCard.components) {
        console.log("Components to execute:", enhancedCard.components.map(c => c.type));
      }
      
      executeCardComponents(enhancedCard, context);
      
      // Check if execution was paused (e.g., for target selection)
      console.log(`After components execution - executionPaused: ${context.executionPaused}, awaitingTargetSelection: ${context.awaitingTargetSelection}`);
      
      if (context.executionPaused) {
        console.log(`PAUSING EXECUTION for ${enhancedCard.name} - needs target selection: ${context.awaitingTargetSelection}`);
        this.executionState.isPaused = true;
        this.executionState.awaitingTargetSelection = context.awaitingTargetSelection;
        
        // Add a helpful log message
        addLogMessage(`Waiting for you to select targets for ${enhancedCard.name}...`);
        
        return false; // Execution did not complete
      }
    } else {
      // If card doesn't use component system, use traditional effects
      addLogMessage(`Executing ${currentCard.name} using traditional effects.`);
      // Add empty components array to ensure it's a proper EnhancedCard
      enhancedCard.components = [];
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
    
    // If execution is already paused, we do nothing
    if (this.executionState.isPaused) {
      console.log("Execution is paused, not proceeding with card execution");
      return allComplete;
    }
    
    console.log("Starting execution of cards, queue length:", this.executionState.queue.length, 
                "current index:", this.executionState.currentIndex);
    
    // While there are cards to execute and execution isn't paused
    while (
      this.executionState.currentIndex < this.executionState.queue.length && 
      !this.executionState.isPaused
    ) {
      const currentCard = this.executionState.queue[this.executionState.currentIndex];
      console.log(`Executing card: ${currentCard.name}, index: ${this.executionState.currentIndex}`);
      
      allComplete = this.executeNextCard(gameState, addLogMessage);
      
      // Log status after executing a card
      console.log("After executing card, isPaused:", this.executionState.isPaused,
                  "awaitingTargetSelection:", this.executionState.awaitingTargetSelection,
                  "currentIndex:", this.executionState.currentIndex);
                  
      // If execution is paused for targeting, stop and return early
      if (this.executionState.isPaused && this.executionState.awaitingTargetSelection) {
        console.log("Execution paused for target selection - stopping all execution until targets provided");
        addLogMessage(`Waiting for you to select targets for ${currentCard.name}...`);
        return false;
      }
    }
    
    return allComplete;
  }
  
  // Provide targets for a paused execution
  provideTargets(targets: any[], callback?: TargetSelectionCallback): void {
    console.log("provideTargets called with targets:", targets);
    
    // Store the selected targets
    this.executionState.selectedTargets = targets;
    
    // Store the callback if provided
    if (callback) {
      console.log("Storing callback for later use");
      this.executionState.targetSelectionCallback = callback;
    }
    
    // If we have a context, update it with the selected targets
    if (this.executionState.context) {
      console.log("Current execution context before updates:", {
        card: this.executionState.context.card.name,
        executionPaused: this.executionState.context.executionPaused,
        awaitingTargetSelection: this.executionState.context.awaitingTargetSelection,
        targetsConfirmed: this.executionState.context.targetsConfirmed || false
      });
      
      // Update the context with selected targets
      this.executionState.context.targets = targets;
      this.executionState.context.executionPaused = false;
      this.executionState.context.awaitingTargetSelection = false;
      
      // Also set the targetsConfirmed flag to true
      // This is part of the new flow: choose targets > pay costs > execute effects
      this.executionState.context.targetsConfirmed = true;
      console.log(`Setting targetsConfirmed flag to true for ${this.executionState.context.card.name}`);
      
      console.log("Updated execution context:", {
        card: this.executionState.context.card.name,
        executionPaused: this.executionState.context.executionPaused,
        awaitingTargetSelection: this.executionState.context.awaitingTargetSelection,
        targetsConfirmed: this.executionState.context.targetsConfirmed,
        targets: this.executionState.context.targets.map(t => t.name || t.id)
      });
    } else {
      console.error("No execution context available when providing targets");
    }
    
    // Resume execution
    this.executionState.isPaused = false;
    this.executionState.awaitingTargetSelection = false;
    
    console.log("Targets provided, resuming execution for index:", this.executionState.currentIndex);
    
    // Resume execution for the current card with the provided targets
    if (this.executionState.context && this.executionState.context.gameState) {
      // Create a safe log function that won't cause infinite recursion
      const addLogMessage = (message: string) => {
        // Use direct console.log for debugging instead of the context log function
        // to avoid potential circular reference and stack overflow
        console.log(`LOG: ${message}`);
        
        // Only call the context log if it's a direct function, not another wrapper
        if (this.executionState.context) {
          // Add a flag to the original log function to avoid recursion
          const safeLog = this.executionState.context.gameState.addLog || 
                         ((state: any, msg: string) => {
                           console.log("Fallback log:", msg);
                           return state;
                         });
                         
          // Update game state with the log message
          this.executionState.context.gameState = safeLog(
            this.executionState.context.gameState,
            message
          );
        }
      };
      
      // Resume execution of the current card
      this.executeNextCard(this.executionState.context.gameState, addLogMessage);
      
      // If we're not paused after resuming the current card, continue with the rest of the queue
      if (!this.executionState.isPaused) {
        this.executeAllCards(this.executionState.context.gameState, addLogMessage);
      }
    } else {
      console.error("Cannot resume execution: Missing context or gameState");
    }
    
    // Call the callback if provided
    if (this.executionState.targetSelectionCallback) {
      this.executionState.targetSelectionCallback(targets);
      this.executionState.targetSelectionCallback = null;
    }
  }
  
  // Cancel the current execution
  cancelExecution(): void {
    // We want to keep the queue but reset execution state
    const currentQueue = [...this.executionState.queue];
    const currentIndex = this.executionState.currentIndex;
    
    // Reset flags but don't clear the queue completely
    this.executionState.isPaused = false;
    this.executionState.awaitingTargetSelection = false;
    this.executionState.selectedTargets = [];
    
    // If we have a context, update it
    if (this.executionState.context) {
      this.executionState.context.executionPaused = false;
      this.executionState.context.awaitingTargetSelection = false;
      this.executionState.context = null;
    }
    
    // Preserve the queue and index
    this.executionState.queue = currentQueue;
    this.executionState.currentIndex = currentIndex;
    
    // Add logging
    console.log("Execution canceled, queue preserved:", currentQueue);
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
  
  // Helper method to move a card from one zone to another
  moveCardToZone(card: EnhancedCard, fromZone: CardZone, toZone: CardZone): EnhancedCard {
    console.log(`Moving card ${card.name} from ${fromZone} to ${toZone}`);
    
    // Make a copy of the card to avoid modifying the original
    const cardCopy = { ...card, components: [...(card.components || [])] };
    
    // Remove any existing zone components
    cardCopy.components = cardCopy.components.filter(comp => {
      // Remove zone components
      if (
        comp.type === 'inMarketZone' || 
        comp.type === 'inDeckZone' || 
        comp.type === 'inHandZone' || 
        comp.type === 'inQueueZone' ||
        comp.type === 'inPlayZone' ||
        comp.type === 'inDiscardZone' ||
        // Also check for class-based component types
        comp.type === 'InMarketZone' || 
        comp.type === 'InDeckZone' || 
        comp.type === 'InHandZone' || 
        comp.type === 'InQueueZone' ||
        comp.type === 'InPlayZone' ||
        comp.type === 'InDiscardZone'
      ) {
        return false;
      }
      
      // Remove CreditCost when moving to queue (only matters in market)
      if (toZone === 'inQueue' && comp.type === 'CreditCost') {
        console.log(`Removing CreditCost component from ${card.name} when moving to queue`);
        return false;
      }
      
      return true;
    });
    
    // Add the appropriate zone component based on the target zone
    switch (toZone) {
      case 'inMarket':
        cardCopy.components.push(new InMarketZone());
        break;
      case 'inDeck':
        cardCopy.components.push(new InDeckZone());
        break;
      case 'inHand':
        cardCopy.components.push(new InHandZone());
        break;
      case 'inQueue':
        cardCopy.components.push(new InQueueZone());
        break;
      case 'inPlay':
        cardCopy.components.push(new InPlayZone());
        break;
      case 'inDiscard':
        cardCopy.components.push(new InDiscardZone());
        break;
      default:
        console.error(`Unknown zone: ${toZone}`);
    }
    
    console.log(`Added ${toZone} component to ${cardCopy.name}`);
    return cardCopy;
  }
}

// Singleton instance
export const cardExecutionService = new CardExecutionService();