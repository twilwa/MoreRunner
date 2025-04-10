import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { GameState, GamePhase, initializeGame, playCardFromHand, buyCardFromMarket, endPhase, addLog } from '../game/game';
import { LocationDeck, initializeLocationDeck, drawNextLocation, Location } from '../game/location';
import { Card as CardType } from '../game/cards';

interface DeckBuilderState {
  gameState: GameState | null;
  locationDeck: LocationDeck | null;
  
  // Game initialization
  initializeGame: (playerNames: string[]) => void;
  
  // Game actions
  playCard: (cardIndex: number) => void;
  buyCard: (cardIndex: number) => void;
  endPhase: () => void;
  drawLocation: () => void;
  drawCard: () => void;
  gainCredit: () => void;
  
  // Card action queue system
  queueCard: (cardIndex: number) => void;
  returnQueuedCard: (cardIndex: number) => void;
  reorderQueuedCards: (fromIndex: number, toIndex: number) => void;
  executeQueuedCards: () => void;
  
  // Utility
  addLogMessage: (message: string) => void;
  resetGame: () => void;
}

export const useDeckBuilder = create<DeckBuilderState>()(
  subscribeWithSelector((set, get) => ({
    gameState: null,
    locationDeck: null,
    
    initializeGame: (playerNames) => {
      const gameState = initializeGame(playerNames);
      const locationDeck = initializeLocationDeck();
      set({ gameState, locationDeck });
    },
    
    playCard: (cardIndex) => {
      const { gameState } = get();
      if (!gameState) return;
      
      const updatedGameState = playCardFromHand(gameState, cardIndex);
      set({ gameState: updatedGameState });
    },
    
    buyCard: (cardIndex) => {
      const { gameState } = get();
      if (!gameState) return;
      
      const updatedGameState = buyCardFromMarket(gameState, cardIndex);
      set({ gameState: updatedGameState });
    },
    
    endPhase: () => {
      const { gameState } = get();
      if (!gameState) return;
      
      const updatedGameState = endPhase(gameState);
      set({ gameState: updatedGameState });
    },
    
    drawLocation: () => {
      const { locationDeck, gameState } = get();
      if (!locationDeck || !gameState) return;
      
      // Draw the next location
      const updatedLocationDeck = drawNextLocation(locationDeck);
      
      // Get the current location that was just drawn
      const currentLocation = updatedLocationDeck.currentLocation;
      
      // Add a log message about the new location
      let updatedGameState = gameState;
      if (currentLocation) {
        // Log the location discovery
        updatedGameState = addLog(
          updatedGameState, 
          `You've entered ${currentLocation.name}.`
        );
        
        // Apply location rewards if any
        if (currentLocation.rewards.credits > 0) {
          // Add credits to the player
          const player = updatedGameState.players[0]; // Assuming player is at index 0
          player.credits += currentLocation.rewards.credits;
          
          updatedGameState = addLog(
            updatedGameState, 
            `You found ${currentLocation.rewards.credits} credits!`
          );
        }
        
        // Draw cards if the location provides them
        if (currentLocation.rewards.drawCards > 0) {
          // Create a log message first, then we'll handle actual card drawing separately
          updatedGameState = addLog(
            updatedGameState, 
            `Location allows you to draw ${currentLocation.rewards.drawCards} card(s).`
          );
        }
        
        // Check for objectives and exits
        if (currentLocation.hasObjective && !updatedLocationDeck.hasFoundObjective) {
          updatedGameState = addLog(
            updatedGameState, 
            `You've found the objective! Now you need to reach the exit.`
          );
        }
        
        if (currentLocation.isExit && updatedLocationDeck.hasFoundObjective) {
          updatedGameState = addLog(
            updatedGameState, 
            `Mission complete! You've reached the exit with the objective.`
          );
        } else if (currentLocation.isExit && !updatedLocationDeck.hasFoundObjective) {
          updatedGameState = addLog(
            updatedGameState, 
            `You've reached the exit, but you haven't found the objective yet!`
          );
        }
      }
      
      set({ 
        locationDeck: updatedLocationDeck,
        gameState: updatedGameState
      });
    },
    
    drawCard: () => {
      const { gameState } = get();
      if (!gameState) return;
      
      // Get the active player
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      
      // Check if the deck is empty
      if (activePlayer.deck.length === 0) {
        // If there are cards in the discard pile, shuffle them into the deck
        if (activePlayer.discard.length > 0) {
          activePlayer.deck = [...activePlayer.discard];
          activePlayer.discard = [];
          
          // Shuffle the deck
          for (let i = activePlayer.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [activePlayer.deck[i], activePlayer.deck[j]] = [activePlayer.deck[j], activePlayer.deck[i]];
          }
          
          // Log message
          const updatedGameState = addLog(
            gameState, 
            `Your deck was empty. Discard pile shuffled into deck.`
          );
          set({ gameState: updatedGameState });
        } else {
          // Both deck and discard are empty
          const updatedGameState = addLog(
            gameState, 
            `Cannot draw a card. Both deck and discard pile are empty.`
          );
          set({ gameState: updatedGameState });
          return;
        }
      }
      
      // Draw a card
      const drawnCard = activePlayer.deck.pop();
      if (drawnCard) {
        activePlayer.hand.push(drawnCard);
        
        // Log message
        const updatedGameState = addLog(
          gameState, 
          `You drew ${drawnCard.name}.`
        );
        set({ gameState: updatedGameState });
      }
    },
    
    gainCredit: () => {
      const { gameState } = get();
      if (!gameState) return;
      
      // Get the active player
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      
      // Add one credit to the player
      activePlayer.credits += 1;
      
      // Log message
      const updatedGameState = addLog(
        gameState, 
        `You gained 1 credit.`
      );
      set({ gameState: updatedGameState });
    },
    
    addLogMessage: (message) => {
      const { gameState } = get();
      if (!gameState) return;
      
      const updatedGameState = addLog(gameState, message);
      set({ gameState: updatedGameState });
    },
    
    // Queue a card from hand to the inPlay area (for action phase)
    queueCard: (cardIndex) => {
      const { gameState } = get();
      if (!gameState) return;
      
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      
      // Check if player can play cards
      if (gameState.phase !== 'action' || activePlayer.actions <= 0) {
        const updatedGameState = addLog(
          gameState, 
          `Cannot queue cards during ${gameState.phase} phase or without actions.`
        );
        set({ gameState: updatedGameState });
        return;
      }
      
      // Take the card from hand and add to inPlay area
      if (cardIndex >= 0 && cardIndex < activePlayer.hand.length) {
        const card = activePlayer.hand[cardIndex];
        
        // Remove the card from hand
        activePlayer.hand.splice(cardIndex, 1);
        
        // Add to inPlay (queued cards)
        activePlayer.inPlay.push(card);
        
        // Log message
        const updatedGameState = addLog(
          gameState, 
          `You queued ${card.name} for execution.`
        );
        set({ gameState: updatedGameState });
      }
    },
    
    // Return a queued card from inPlay back to hand
    returnQueuedCard: (cardIndex) => {
      const { gameState } = get();
      if (!gameState) return;
      
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      
      // Check if the card index is valid
      if (cardIndex >= 0 && cardIndex < activePlayer.inPlay.length) {
        const card = activePlayer.inPlay[cardIndex];
        
        // Remove from inPlay
        activePlayer.inPlay.splice(cardIndex, 1);
        
        // Add back to hand
        activePlayer.hand.push(card);
        
        // Log message
        const updatedGameState = addLog(
          gameState, 
          `You returned ${card.name} to your hand.`
        );
        set({ gameState: updatedGameState });
      }
    },
    
    // Reorder queued cards in the inPlay area
    reorderQueuedCards: (fromIndex, toIndex) => {
      const { gameState } = get();
      if (!gameState) return;
      
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      
      // Validate indices
      if (
        fromIndex >= 0 && 
        fromIndex < activePlayer.inPlay.length && 
        toIndex >= 0 && 
        toIndex < activePlayer.inPlay.length
      ) {
        // Get the card that's being moved
        const card = activePlayer.inPlay[fromIndex];
        
        // Remove from original position
        activePlayer.inPlay.splice(fromIndex, 1);
        
        // Insert at new position
        activePlayer.inPlay.splice(toIndex, 0, card);
        
        // Log message
        const updatedGameState = addLog(
          gameState, 
          `You reordered your action queue.`
        );
        set({ gameState: updatedGameState });
      }
    },
    
    // Execute all queued cards in order
    executeQueuedCards: () => {
      const { gameState } = get();
      if (!gameState) return;
      
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      
      // Check if there are cards to execute
      if (activePlayer.inPlay.length === 0) {
        const updatedGameState = addLog(
          gameState, 
          `No cards queued for execution.`
        );
        set({ gameState: updatedGameState });
        return;
      }
      
      // Apply effects for each card in the queue
      let updatedGameState = gameState;
      const queuedCards = [...activePlayer.inPlay];
      
      // Clear the inPlay area before processing
      activePlayer.inPlay = [];
      
      // Process each card
      queuedCards.forEach((card, index) => {
        // Log execution of the card
        updatedGameState = addLog(
          updatedGameState, 
          `Executing card ${index + 1}/${queuedCards.length}: ${card.name}`
        );
        
        // Process card effects
        // For each effect in the card
        card.effects.forEach(effect => {
          switch(effect.type) {
            case 'gain_credits':
              activePlayer.credits += effect.value;
              updatedGameState = addLog(
                updatedGameState, 
                `Gained ${effect.value} credits.`
              );
              break;
              
            case 'damage_opponent':
              // Apply damage to opponent
              const opponentIndex = gameState.activePlayerIndex === 0 ? 1 : 0;
              updatedGameState.players[opponentIndex].health -= effect.value;
              updatedGameState = addLog(
                updatedGameState, 
                `Dealt ${effect.value} damage to opponent.`
              );
              break;
              
            case 'draw_cards':
              // Draw cards
              for (let i = 0; i < effect.value; i++) {
                // Similar logic to drawCard but without individual logs
                if (activePlayer.deck.length === 0) {
                  if (activePlayer.discard.length > 0) {
                    activePlayer.deck = [...activePlayer.discard];
                    activePlayer.discard = [];
                    
                    // Shuffle the deck
                    for (let i = activePlayer.deck.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [activePlayer.deck[i], activePlayer.deck[j]] = [activePlayer.deck[j], activePlayer.deck[i]];
                    }
                  } else {
                    // Can't draw more
                    break;
                  }
                }
                
                const drawnCard = activePlayer.deck.pop();
                if (drawnCard) {
                  activePlayer.hand.push(drawnCard);
                }
              }
              
              updatedGameState = addLog(
                updatedGameState, 
                `Drew ${effect.value} cards.`
              );
              break;
              
            // Add other effect types as needed
            default:
              updatedGameState = addLog(
                updatedGameState, 
                `Applied ${effect.type} effect.`
              );
          }
        });
        
        // Add card to discard after processing
        activePlayer.discard.push(card);
      });
      
      // Consume an action point
      activePlayer.actions--;
      
      set({ gameState: updatedGameState });
    },
    
    resetGame: () => {
      set({ 
        gameState: null,
        locationDeck: null
      });
    }
  }))
);
