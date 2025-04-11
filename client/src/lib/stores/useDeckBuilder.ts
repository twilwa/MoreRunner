import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { GameState, GamePhase, initializeGame, playCardFromHand, buyCardFromMarket, endPhase, addLog } from '../game/game';
import { LocationDeck, initializeLocationDeck, drawNextLocation, Location, LocationThreat } from '../game/location';
import { Card as CardType } from '../game/cards';
import { refillMarket } from '../game/market';

// Define the entity status type for tracking action potentials and played cards
export interface EntityStatus {
  threatId: string;
  actionPotentials: boolean[]; // Array of action potential dots (true = active)
  playedCards: CardType[]; // Cards played by this entity
}

interface DeckBuilderState {
  gameState: GameState | null;
  locationDeck: LocationDeck | null;
  entityStatuses: EntityStatus[]; // Track entity action potentials and played cards
  
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
  
  // Entity status management
  updateEntityActionPotential: (threatId: string, newPotentials: boolean[]) => void;
  addEntityPlayedCard: (threatId: string, card: CardType) => void;
  clearEntityPlayedCards: (threatId: string) => void;
  
  // Utility
  addLogMessage: (message: string) => void;
  resetGame: () => void;
}

export const useDeckBuilder = create<DeckBuilderState>()(
  subscribeWithSelector((set, get) => ({
    gameState: null,
    locationDeck: null,
    entityStatuses: [],
    
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
        let updatedGameState = addLog(
          gameState, 
          `You drew ${drawnCard.name}.`
        );
        
        // We'll only check for empty deck after execution, allowing players to run out of cards during their turn
        
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
    
    // Queue a card from hand to the inPlay area
    queueCard: (cardIndex) => {
      const { gameState } = get();
      if (!gameState) return;
      
      const activePlayer = gameState.players[gameState.activePlayerIndex];
      
      // Check if player has actions left
      if (activePlayer.actions <= 0) {
        const updatedGameState = addLog(
          gameState, 
          `Cannot queue cards without actions left.`
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
    
    // Execute all queued cards in order and then run AI turn
    executeQueuedCards: () => {
      const { gameState, entityStatuses } = get();
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
      
      // Track entity statuses
      let updatedEntityStatuses = [...entityStatuses];
      
      // Apply effects for each card in the queue
      let updatedGameState = gameState;
      const queuedCards = [...activePlayer.inPlay];
      
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
                    
                    updatedGameState = addLog(
                      updatedGameState, 
                      `Shuffled discard pile back into the deck.`
                    );
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
      
      // Clear the queue after all cards are processed
      activePlayer.inPlay = [];
      
      // Consume an action point
      activePlayer.actions--;
      
      // Run the AI turn after executing all cards
      updatedGameState = addLog(
        updatedGameState, 
        `Your turn is over. Processing location entities...`
      );
      
      // Update action potentials for entities
      const { locationDeck } = get();
      if (locationDeck?.currentLocation) {
        const threats = locationDeck.currentLocation.threats;
        
        // For each threat, advance its action potential
        threats.forEach(threat => {
          // Find current status for this threat
          const entityStatusIndex = updatedEntityStatuses.findIndex(
            status => status.threatId === threat.id
          );
          
          if (entityStatusIndex >= 0) {
            const currentStatus = updatedEntityStatuses[entityStatusIndex];
            const updatedPotentials = [...currentStatus.actionPotentials];
            
            // Find first inactive dot and activate it
            const inactiveIndex = updatedPotentials.findIndex(pot => !pot);
            if (inactiveIndex >= 0) {
              updatedPotentials[inactiveIndex] = true;
              
              // Update the entity status with new action potentials
              updatedEntityStatuses[entityStatusIndex] = {
                ...currentStatus,
                actionPotentials: updatedPotentials
              };
              
              // Log action potential increase
              updatedGameState = addLog(
                updatedGameState,
                `${threat.name} is charging up its action potential.`
              );
            }
            
            // Check if all action potentials are active
            const allActive = updatedPotentials.every(pot => pot);
            if (allActive) {
              // Log that this entity will act on next turn
              updatedGameState = addLog(
                updatedGameState,
                `${threat.name} has reached full action potential and will act soon!`
              );
            }
          }
        });
      }
      
      // Update the entity statuses
      set({ entityStatuses: updatedEntityStatuses });
      
      // Simulate AI turn with entities at the location playing cards
      setTimeout(() => {
        // Switch to the AI player to handle the AI turn
        const aiPlayerIndex = 1; // Assuming the AI is the second player
        updatedGameState.activePlayerIndex = aiPlayerIndex;
        
        // Get the current location and its threats/entities
        const { locationDeck } = get();
        if (locationDeck && locationDeck.currentLocation) {
          const currentLocation = locationDeck.currentLocation;
          const locationThreats = currentLocation.threats || [];
          
          // Log the start of location entity actions
          updatedGameState = addLog(
            updatedGameState, 
            `The entities at ${currentLocation.name} are responding to your actions...`
          );
          
          // Have entities with full action potentials play cards
          if (locationThreats.length > 0) {
            // Get latest entity statuses
            const latestEntityStatuses = [...updatedEntityStatuses];
            
            // Track entities that have full action potential
            const activatedEntities: LocationThreat[] = [];
            
            // Check which entities should fully activate
            locationThreats.forEach(threat => {
              const entityStatus = latestEntityStatuses.find(
                status => status.threatId === threat.id
              );
              
              if (entityStatus) {
                // Check if all action potentials are active
                const allActive = entityStatus.actionPotentials.every(pot => pot);
                
                if (allActive) {
                  // This entity should activate
                  activatedEntities.push(threat);
                  
                  // Reset its action potentials for next cycle
                  const resetPotentials = entityStatus.actionPotentials.map(() => false);
                  updatedEntityStatuses = updatedEntityStatuses.map(status => 
                    status.threatId === threat.id 
                      ? { ...status, actionPotentials: resetPotentials } 
                      : status
                  );
                }
              }
            });
            
            // Update entity statuses with reset action potentials
            set({ entityStatuses: updatedEntityStatuses });
            
            // Process entities with full action potential first
            activatedEntities.forEach((threat, index) => {
              // Create a card for this activated entity
              const entityCard: CardType = {
                id: `entity-card-${Date.now()}-${index}`,
                name: `${threat.name}'s Attack`,
                description: "A card played by a location entity that has reached full action potential.",
                cost: 0,
                faction: "Corp",
                cardType: "Action",
                keywords: ["ICE", "Weapon"],
                isFaceDown: false, // Face up for activated entities
                playedBy: threat.name,
                effects: [
                  { type: "damage_player", value: threat.attack }
                ]
              };
              
              // Add the card to the AI player's inPlay area at the FRONT (to be resolved first)
              updatedGameState.players[aiPlayerIndex].inPlay.unshift(entityCard);
              
              // Add the card to entity's played cards
              const entityStatusIndex = updatedEntityStatuses.findIndex(
                status => status.threatId === threat.id
              );
              
              if (entityStatusIndex >= 0) {
                updatedEntityStatuses[entityStatusIndex] = {
                  ...updatedEntityStatuses[entityStatusIndex],
                  playedCards: [...updatedEntityStatuses[entityStatusIndex].playedCards, entityCard]
                };
              }
              
              // Log the entity playing a card
              updatedGameState = addLog(
                updatedGameState, 
                `${threat.name} has reached full potential and executes an attack!`
              );
            });
            
            // Have any remaining entities potentially play facedown cards
            locationThreats
              .filter(threat => !activatedEntities.some(ae => ae.id === threat.id))
              .forEach((threat, index) => {
                // Only 30% chance to play a card if not fully activated
                if (Math.random() < 0.3) {
                  // Create a placeholder facedown card for this entity
                  const entityCard: CardType = {
                    id: `entity-card-${Date.now()}-passive-${index}`,
                    name: `${threat.name}'s Card`,
                    description: "A face-down card played by a location entity.",
                    cost: 0,
                    faction: "Corp",
                    cardType: "Action",
                    keywords: ["ICE"],
                    isFaceDown: true,
                    playedBy: threat.name,
                    effects: [
                      // Weaker effect for non-activated entities
                      { type: "damage_player", value: Math.max(1, Math.floor(threat.attack / 2)) }
                    ]
                  };
                  
                  // Add to AI inPlay AFTER activated cards
                  updatedGameState.players[aiPlayerIndex].inPlay.push(entityCard);
                  
                  // Log the entity playing a card
                  updatedGameState = addLog(
                    updatedGameState, 
                    `${threat.name} played a face-down card.`
                  );
                }
              });
          } else {
            updatedGameState = addLog(
              updatedGameState, 
              `No entities at this location to respond.`
            );
          }
        }
        
        // Simulate the AI processing after entities play cards
        setTimeout(() => {
          // Refill the market with new cards
          if (updatedGameState.market) {
            // Check if any market spots are empty
            const emptySlots = updatedGameState.market.availableCards.length < updatedGameState.market.maxSize;
            
            if (emptySlots) {
              // Refill the market with new random cards
              updatedGameState.market = refillMarket(updatedGameState.market);
              
              updatedGameState = addLog(
                updatedGameState, 
                `The DataMarket refreshed with new products.`
              );
            }
          }
          
          // End AI turn and switch back to player
          updatedGameState.activePlayerIndex = 0; // Switch back to player
          
          // Check if the player's deck is empty and has cards in discard pile
          const player = updatedGameState.players[0];
          if (player.deck.length === 0 && player.discard.length > 0) {
            // Shuffle the discard pile back into the deck
            player.deck = [...player.discard];
            player.discard = [];
            
            // Shuffle the deck
            for (let i = player.deck.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
            }
            
            updatedGameState = addLog(
              updatedGameState, 
              `Your discard pile was shuffled back into your deck.`
            );
          }
          
          // Refresh player's actions and buys
          player.actions = 1;
          player.buys = 1;
          
          updatedGameState = addLog(
            updatedGameState, 
            `Your turn begins. You have ${player.actions} action and unlimited buys.`
          );
          
          set({ gameState: updatedGameState });
        }, 1500); // Delay to simulate AI thinking
      }, 1000); // Initial delay before AI turn starts
      
      set({ gameState: updatedGameState });
    },
    
    // Entity status management
    updateEntityActionPotential: (threatId, newPotentials) => {
      const { entityStatuses } = get();
      const existingIndex = entityStatuses.findIndex(status => status.threatId === threatId);
      
      let updatedStatuses = [...entityStatuses];
      
      if (existingIndex >= 0) {
        // Update existing entity status
        updatedStatuses[existingIndex] = {
          ...updatedStatuses[existingIndex],
          actionPotentials: newPotentials
        };
      } else {
        // Create new entity status
        updatedStatuses.push({
          threatId,
          actionPotentials: newPotentials,
          playedCards: []
        });
      }
      
      set({ entityStatuses: updatedStatuses });
    },
    
    addEntityPlayedCard: (threatId, card) => {
      const { entityStatuses } = get();
      const existingIndex = entityStatuses.findIndex(status => status.threatId === threatId);
      
      let updatedStatuses = [...entityStatuses];
      
      if (existingIndex >= 0) {
        // Add card to existing entity
        updatedStatuses[existingIndex] = {
          ...updatedStatuses[existingIndex],
          playedCards: [...updatedStatuses[existingIndex].playedCards, card]
        };
      } else {
        // Create new entity status with this card
        updatedStatuses.push({
          threatId,
          actionPotentials: [],  // Default empty action potentials
          playedCards: [card]
        });
      }
      
      set({ entityStatuses: updatedStatuses });
    },
    
    clearEntityPlayedCards: (threatId) => {
      const { entityStatuses } = get();
      const existingIndex = entityStatuses.findIndex(status => status.threatId === threatId);
      
      if (existingIndex >= 0) {
        // Clear played cards for this entity
        let updatedStatuses = [...entityStatuses];
        updatedStatuses[existingIndex] = {
          ...updatedStatuses[existingIndex],
          playedCards: []
        };
        
        set({ entityStatuses: updatedStatuses });
      }
    },
    
    resetGame: () => {
      set({ 
        gameState: null,
        locationDeck: null,
        entityStatuses: []
      });
    }
  }))
);
