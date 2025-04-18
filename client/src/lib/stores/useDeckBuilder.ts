import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import {
  GameState,
  GamePhase,
  initializeGame,
  playCardFromHand,
  buyCardFromMarket,
  endPhase,
  addLog,
} from "../game/game";
import {
  LocationDeck,
  initializeLocationDeck,
  drawNextLocation,
  Location,
  LocationThreat,
  moveToPreviousLocation,
} from "../game/location";
import { Card as CardType } from "../game/cards";
import { refillMarket } from "../game/market";
import {
  cardExecutionService,
  TargetSelectionCallback,
} from "../game/cardExecutionService";
import { getEnhancedCard } from "../game/enhancedCards";
import { Component, EnhancedCard } from "../game/components";
import { useIdentity } from './useIdentity';
import type { PlayerInit } from '../game/game';
import { set } from "react-hook-form";

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

  // Helper for card enhancement
  enhanceCard: (card: CardType) => EnhancedCard;

  // Game initialization
  initializeGame: (playerNames: string[]) => void;

  // Game actions
  playCard: (cardIndex: number) => void;
  buyCard: (cardIndex: number) => void;
  endPhase: () => void;
  drawLocation: () => void;
  drawCard: () => void;
  gainCredit: () => void;
  gainAction: () => void;
  shuffleDiscard: () => void;
  moveToPreviousLocation: () => void;

  // Card action queue system
  queueCard: (cardId: string) => void;
  returnQueuedCard: (cardIndex: number) => void;
  reorderQueuedCards: (fromIndex: number, toIndex: number) => void;
  executeQueuedCards: () => void;

  // Entity status management
  updateEntityActionPotential: (
    threatId: string,
    newPotentials: boolean[],
  ) => void;
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

    // Helper function to enhance a single card with components
    enhanceCard: (card: CardType): EnhancedCard => {
      // First try to get a pre-defined enhanced version
      const enhancedVersion = getEnhancedCard(card.id);

      if (enhancedVersion) {
        // Return the enhanced version if it exists
        return { ...enhancedVersion };
      } else {
        // Otherwise, convert the basic card to an EnhancedCard with empty components array
        return {
          ...card,
          components: [] // Ensure it has an empty components array to satisfy EnhancedCard interface
        };
      }
    },

    initializeGame: (playerNames) => {
      // Get selected identity from the identity store
      const { selectedIdentity } = useIdentity.getState();
      // Prepare player descriptors for initialization
      const playerInits: PlayerInit[] = playerNames.map((name, idx) => {
        if (idx === 0 && selectedIdentity) {
          return { name, identity: selectedIdentity };
        }
        return { name };
      });
      const gameState = initializeGame(playerInits);
      const locationDeck = initializeLocationDeck();
      const { enhanceCard } = get();

      if (gameState && gameState.players) {
        console.log("Enhancing cards in all decks and hands...");

        // Enhance all players' cards
        gameState.players.forEach((player: { deck: CardType[]; hand: CardType[]; discard: CardType[]; }) => {
          // Enhance deck cards
          player.deck = player.deck.map(enhanceCard);

          // Enhance hand cards
          player.hand = player.hand.map(enhanceCard);

          // Enhance discard pile cards
          player.discard = player.discard.map(enhanceCard);
        });

        // Also enhance the market cards
        if (gameState.market && gameState.market.availableCards) {
          gameState.market.availableCards =
            gameState.market.availableCards.map(enhanceCard);
        }
      }

      // Update the game state with enhanced cards
      console.log("Enhanced cards added to game state");
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
      const { gameState, locationDeck } = get();
      if (!gameState || !locationDeck) return;
      const player = gameState.players[gameState.activePlayerIndex];
      if (player.actions <= 0) {
        set({ gameState: addLog(gameState, "You don't have enough actions to move to the next location.") });
        return;
      }
      const newLocationDeck = drawNextLocation(locationDeck);
      // Only allow if location actually changed
      if (newLocationDeck.currentLocation !== locationDeck.currentLocation) {
        player.actions -= 1;
        set({
          locationDeck: newLocationDeck,
          gameState: { ...gameState },
        });
      } else {
        set({ gameState: addLog(gameState, "No next location to move to.") });
      }
    },

    drawCard: () => {
      const { gameState, enhanceCard } = get();
      if (!gameState) return;

      // Get the active player
      const activePlayer = gameState.players[gameState.activePlayerIndex];

      // Check if the deck is empty
      if (activePlayer.deck.length === 0) {
        // In a deck-builder, the discard pile is separate from the deck
        // Cards stay in the discard pile until a specific card or effect
        // instructs you to shuffle your discard into your deck

        // Log message about empty deck
        const updatedGameState = addLog(
          gameState,
          `Your deck is empty. Use the "Shuffle Discard" action to recycle your discard pile.`,
        );
        set({ gameState: updatedGameState });
        return;
      }

      // Draw a card
      const drawnCard = activePlayer.deck.pop();
      if (drawnCard) {
        // Enhance the card with components before adding it to hand
        const enhancedDrawnCard = enhanceCard(drawnCard);

        // Add the enhanced card to hand
        activePlayer.hand.push(enhancedDrawnCard);

        // Log message
        let updatedGameState = addLog(
          gameState,
          `You drew ${enhancedDrawnCard.name}.`,
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
      const updatedGameState = addLog(gameState, `You gained 1 credit.`);
      set({ gameState: updatedGameState });
    },

    gainAction: () => {
      const { gameState } = get();
      if (!gameState) return;

      // Get the active player
      const activePlayer = gameState.players[gameState.activePlayerIndex];

      // Add one action to the player
      activePlayer.actions += 1;

      // Log message
      const updatedGameState = addLog(gameState, `You gained 1 action.`);
      set({ gameState: updatedGameState });
    },

    shuffleDiscard: () => {
      const { gameState } = get();
      if (!gameState) return;

      // Get the active player
      const activePlayer = gameState.players[gameState.activePlayerIndex];

      // Only proceed if the discard pile has cards
      if (activePlayer.discard.length === 0) {
        const updatedGameState = addLog(
          gameState,
          `Your discard pile is empty.`,
        );
        set({ gameState: updatedGameState });
        return;
      }

      // Add discard pile to the deck
      activePlayer.deck = [...activePlayer.deck, ...activePlayer.discard];
      activePlayer.discard = [];

      // Shuffle the deck
      for (let i = activePlayer.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activePlayer.deck[i], activePlayer.deck[j]] = [
          activePlayer.deck[j],
          activePlayer.deck[i],
        ];
      }

      // Log message
      const updatedGameState = addLog(
        gameState,
        `You shuffled your discard pile into your deck.`,
      );
      set({ gameState: updatedGameState });
    },

    moveToPreviousLocation: () => {
      const { gameState, locationDeck } = get();
      if (!gameState || !locationDeck) return;
      const player = gameState.players[gameState.activePlayerIndex];
      if (player.actions <= 0) {
        set({ gameState: addLog(gameState, "You don't have enough actions to backtrack.") });
        return;
      }
      // Move to previous location
      const newLocationDeck = moveToPreviousLocation(locationDeck);
      // Only allow if location actually changed
      if (newLocationDeck.currentLocation !== locationDeck.currentLocation) {
        player.actions -= 1;
        set({
          locationDeck: newLocationDeck,
          gameState: { ...gameState },
        });
      } else {
        set({ gameState: addLog(gameState, "No previous location to backtrack to.") });
      }
    },

    addLogMessage: (message) => {
      const { gameState } = get();
      if (!gameState) return;

      const updatedGameState = addLog(gameState, message);
      set({ gameState: updatedGameState });
    },

    // Queue a card from hand to the inPlay area
    queueCard: (cardId) => {
      const { gameState, enhanceCard } = get();
      if (!gameState) return;

      const activePlayer = gameState.players[gameState.activePlayerIndex];

      // Find the card in hand by id
      const cardIndex = activePlayer.hand.findIndex(card => card.id === cardId);
      if (cardIndex === -1) return;

      // Take the card from hand and check requirements
      const card = activePlayer.hand[cardIndex];

      // Check if player has actions left
      if (activePlayer.actions <= 0) {
        const updatedGameState = addLog(
          gameState,
          `Cannot queue ${card.name} - no actions left.`,
        );
        set({ gameState: updatedGameState });
        return;
      }

        // Get the enhanced card version to use with our component system
        // enhanceCard adds components, handling and validates costs via InQueueZone component
        const cardWithComponents = enhanceCard(card);

        // IMPORTANT: We no longer check credit costs for cards going into the queue
        // Credit costs are ONLY checked when buying cards from the market
        // When queueing cards from hand, we ONLY check action costs, not credit costs

        // This is a change to how the zone system works:
        // - InMarketZone: Validates CREDIT costs when buying cards
        // - InHandZone: Validates ACTION availability when playing cards
        // - InQueueZone: Validates ACTION costs during execution

        // We already checked actions above, so we don't need to do any additional cost checking here
        // The component system will handle execution validation through the cardExecutionService

        // All checks passed - add to queue
        // Remove the card from hand
        activePlayer.hand.splice(cardIndex, 1);

        // Use the previously created enhanced card from line 370
        // No need to re-enhance the card, reuse the variable

        // Move the card from hand to play zone using our zone transition system
        // The enhanceCard method ensures it returns a proper EnhancedCard
        const cardWithZone = cardExecutionService.moveCardToZone(
          cardWithComponents,
          'inHand',  // from zone
          'inPlay'   // to zone
        );

        // Add transitioned card to inPlay (queued cards)
        activePlayer.inPlay.push(cardWithZone);

      // Log message - no longer include credit cost information in queue messages
      // This is part of separating credit costs (market only) from action costs (queue only)
      const updatedGameState = addLog(
        gameState,
        `You queued ${cardWithComponents.name} for execution.`,
      );
      set({ gameState: updatedGameState });
    },

    // Return a queued card from inPlay back to hand
    returnQueuedCard: (cardIndex) => {
      const { gameState, enhanceCard } = get();
      if (!gameState) return;

      const activePlayer = gameState.players[gameState.activePlayerIndex];

      // Check if the card index is valid
      if (cardIndex >= 0 && cardIndex < activePlayer.inPlay.length) {
        const card = activePlayer.inPlay[cardIndex];

        // Remove from inPlay
        activePlayer.inPlay.splice(cardIndex, 1);

        // Make sure the card has components by enhancing it
        const enhancedCard = enhanceCard(card);

        // Move the card from play zone to hand zone using our zone transition system
        const cardWithZone = cardExecutionService.moveCardToZone(
          enhancedCard,
          'inPlay',  // from zone
          'inHand'   // to zone
        );

        // Add the transitioned card back to hand
        activePlayer.hand.push(cardWithZone);

        // Log message
        const updatedGameState = addLog(
          gameState,
          `You returned ${enhancedCard.name} to your hand.`,
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
          `You reordered your action queue.`,
        );
        set({ gameState: updatedGameState });
      }
    },

    // Execute all queued cards in order and then run AI turn
    // @ts-ignore: Temporarily suppressing errors to maintain functionality
    executeQueuedCards: () => {
      const { gameState, locationDeck, entityStatuses } = get();
      if (!gameState || !locationDeck) return;

      const activePlayer = gameState.players[gameState.activePlayerIndex];

      // Check if there are cards to execute
      if (activePlayer.inPlay.length === 0) {
        const noCardsGameState = addLog(
          gameState,
          `No cards queued for execution.`,
        );
        set({ gameState: noCardsGameState });
        return;
      }

      // In our updated entity-component system, we no longer need queue-level credit checks
      // Credit costs are only validated during market purchases
      // Action costs are validated when a card is executed from the queue

      // Get all queued cards for execution
      const queuedCards = [...activePlayer.inPlay];
      // Define both variable names to avoid runtime errors
      let executionGameState = addLog(
        gameState,
        `Executing ${queuedCards.length} card${queuedCards.length > 1 ? "s" : ""} from the queue...`,
      );
      let updatedGameState = executionGameState; // Make sure both variables are initialized

      // Use imported cardExecutionService and related utilities from top of file

      // Track entity statuses
      let updatedEntityStatuses = [...entityStatuses];

      // First, check if we have any enhanced cards that need to use the component system
      const hasEnhancedCards = queuedCards.some(
        (card) => card.components || getEnhancedCard(card.id),
      );

      // If we have enhanced cards, use the component-based execution service
      if (hasEnhancedCards) {
        // Reset the execution service
        cardExecutionService.resetExecutionState();

        // Queue each card for execution
        queuedCards.forEach((card) => {
          // Try to get the enhanced version from our library
          const enhancedVersion = getEnhancedCard(card.id);

          if (enhancedVersion) {
            // Use the pre-built enhanced card
            cardExecutionService.queueCard(enhancedVersion);
          } else {
            // If no enhanced version exists, create a minimal enhanced version of the card
            // This ensures we satisfy the TypeScript EnhancedCard requirement
            const minimalEnhancedCard = {
              ...card,
              components: [] // Empty components array to match EnhancedCard interface
            };
            cardExecutionService.queueCard(minimalEnhancedCard);
          }
        });

        // Create a log function
        const addLogMessage = (message: string) => {
          executionGameState = addLog(executionGameState, message);
        };

        // Execute all cards in the queue until paused or completed
        // Loop through the queue to process each card in sequence
        let queueCompleted = false;
        let executionPaused = false;

        // Execute all cards until we finish the queue or pause for targeting
        console.log("Executing all queued cards...");
        const allExecutionComplete = cardExecutionService.executeAllCards(executionGameState, addLogMessage);

        // Update our state flags based on the execution result
        queueCompleted = allExecutionComplete;
        executionPaused = cardExecutionService.isExecutionPaused();

        console.log(`Card execution complete: finished=${queueCompleted}, paused=${executionPaused}`);

        // Check if execution was paused for target selection
        if (cardExecutionService.isExecutionPaused()) {
          // Store the current state
          set({ gameState: updatedGameState });

          // If this is awaiting target selection, we should show a modal or UI for selection
          if (cardExecutionService.isAwaitingTargetSelection()) {
            // In the real implementation, we would show a UI for target selection
            // For now, let's just log that we need targeting
            const context = cardExecutionService.getExecutionContext();
            if (context) {
              updatedGameState = addLog(
                updatedGameState,
                `Waiting for target selection for ${context.card.name}...`,
              );
              set({ gameState: updatedGameState });
            }

            // Return early, execution will continue when targets are provided
            return;
          }
        }

        // Check if the queue was completed
        if (cardExecutionService.getCurrentIndex() >= cardExecutionService.getQueue().length) {
          console.log("Card execution completed successfully");

          // Cards should be moved to discard automatically by the component system
          // We just need to make sure the play area is cleared and update game state

          // Clear any remaining cards (should already be handled by component system)
          activePlayer.inPlay = [];

          // Update the game state with any changes from execution
          // Note: Cards should already be moved to discard by the component system
          updatedGameState = { ...executionGameState };

          // Consume an action point
        } else {
          console.log("Card execution paused or incomplete - not advancing to AI turn");
          set({ gameState: updatedGameState });
          return; // Don't proceed to AI turn if execution didn't complete
        }
        activePlayer.actions--;
      } else {
        // Use the original effect-based execution for backward compatibility

        // Process each card
        queuedCards.forEach((card, index) => {
          // Log execution of the card
          updatedGameState = addLog(
            updatedGameState,
            `Executing card ${index + 1}/${queuedCards.length}: ${card.name}`,
          );

          // Process card effects
          // For each effect in the card
          card.effects.forEach((effect) => {
            switch (effect.type) {
              case "gain_credits":
                activePlayer.credits += effect.value;
                updatedGameState = addLog(
                  updatedGameState,
                  `Gained ${effect.value} credits.`,
                );
                break;

              case "damage_opponent":
                // Apply damage to opponent
                const opponentIndex = gameState.activePlayerIndex === 0 ? 1 : 0;
                updatedGameState.players[opponentIndex].health -= effect.value;
                updatedGameState = addLog(
                  updatedGameState,
                  `Dealt ${effect.value} damage to opponent.`,
                );
                break;

              case "draw_cards":
                // Draw cards - count how many we actually draw
                let cardsDrawn = 0;
                for (let i = 0; i < effect.value; i++) {
                  // Check if there are cards left to draw
                  if (activePlayer.deck.length === 0) {
                    // No more cards to draw from deck
                    updatedGameState = addLog(
                      updatedGameState,
                      `Your deck is empty. Can't draw more cards.`,
                    );
                    break;
                  }

                  // Draw a card if possible
                  const drawnCard = activePlayer.deck.pop();
                  if (drawnCard) {
                    activePlayer.hand.push(drawnCard);
                    cardsDrawn++;
                  }
                }

                // Log how many cards were actually drawn
                if (cardsDrawn > 0) {
                  updatedGameState = addLog(
                    updatedGameState,
                    `Drew ${cardsDrawn} card${cardsDrawn > 1 ? "s" : ""}.`,
                  );
                }
                break;

              // Add other effect types as needed
              default:
                updatedGameState = addLog(
                  updatedGameState,
                  `Applied ${effect.type} effect.`,
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
      }

      // After execution, tick up action potential for all entities (current + visited locations)
      const allLocations = [locationDeck.currentLocation, ...locationDeck.visitedLocations].filter(Boolean);
      updatedEntityStatuses = [...entityStatuses];
      allLocations.forEach((loc) => {
        loc.threats.forEach((threat) => {
          if (threat.isDead || threat.defenseValue <= 0) return;
          const idx = updatedEntityStatuses.findIndex(s => s.threatId === threat.id);
          let potentials = idx >= 0 ? [...updatedEntityStatuses[idx].actionPotentials] : [];
          // Find the first false and set it to true (tick up by 1)
          const firstInactive = potentials.indexOf(false);
          if (firstInactive !== -1) {
            potentials[firstInactive] = true;
          } else if (potentials.length > 0 && potentials.every(v => v === true)) {
            // Already full, do nothing
          } else {
            // If no potentials, initialize based on threat dangerLevel
            const numDots = Math.max(1, Math.min(4, Math.ceil(threat.dangerLevel * 0.8)));
            potentials = Array(numDots).fill(false);
            potentials[0] = true;
          }
          if (idx >= 0) {
            updatedEntityStatuses[idx] = { ...updatedEntityStatuses[idx], actionPotentials: potentials };
          } else {
            updatedEntityStatuses.push({ threatId: threat.id, actionPotentials: potentials, playedCards: [] });
          }
        });
      });
      set({ entityStatuses: updatedEntityStatuses });

      // Run the AI turn after executing all cards
      updatedGameState = addLog(
        updatedGameState,
        `Your turn is over. Processing location entities...`,
      );

      // Update action potentials for entities
      const threats = locationDeck.currentLocation.threats;

      // For each threat, advance its action potential
      threats.forEach((threat) => {
        // Find current status for this threat
        const entityStatusIndex = updatedEntityStatuses.findIndex(
          (status) => status.threatId === threat.id,
        );

        if (entityStatusIndex >= 0) {
          const currentStatus = updatedEntityStatuses[entityStatusIndex];
          const updatedPotentials = [...currentStatus.actionPotentials];

          // Find first inactive dot and activate it
          const inactiveIndex = updatedPotentials.findIndex((pot) => !pot);
          if (inactiveIndex >= 0) {
            updatedPotentials[inactiveIndex] = true;

            // Update the entity status with new action potentials
            updatedEntityStatuses[entityStatusIndex] = {
              ...currentStatus,
              actionPotentials: updatedPotentials,
            };

            // Log action potential increase
            updatedGameState = addLog(
              updatedGameState,
              `${threat.name} is charging up its action potential.`,
            );
          }

          // Check if all action potentials are active
          const allActive = updatedPotentials.every((pot) => pot);
          if (allActive) {
            // Log that this entity will act on next turn
            updatedGameState = addLog(
              updatedGameState,
              `${threat.name} has reached full action potential and will act soon!`,
            );
          }
        }
      });

      // Update the entity statuses
      set({ entityStatuses: updatedEntityStatuses });

      // Simulate AI turn with entities at the location playing cards
      setTimeout(() => {
        // Switch to the AI player to handle the AI turn
        const aiPlayerIndex = 1; // Assuming the AI is the second player
        updatedGameState.activePlayerIndex = aiPlayerIndex;

        // Get the current location and its threats/entities
        const currentLocation = locationDeck.currentLocation;
        const locationThreats = currentLocation.threats || [];

        // Log the start of location entity actions
        updatedGameState = addLog(
          updatedGameState,
          `The entities at ${currentLocation.name} are responding to your actions...`,
        );

        // Have entities with full action potentials play cards
        if (locationThreats.length > 0) {
          // Get latest entity statuses
          const latestEntityStatuses = [...updatedEntityStatuses];

          // Track entities that have full action potential
          const activatedEntities: LocationThreat[] = [];

          // Filter out dead entities
          const aliveThreats = locationThreats.filter(
            (threat) =>
              !threat.isDead && threat.defenseValue > 0,
          );

          if (aliveThreats.length === 0) {
            updatedGameState = addLog(
              updatedGameState,
              `All entities at this location have been neutralized.`,
            );
          }

          // Check which entities should fully activate
          aliveThreats.forEach((threat) => {
            // Mark threats with defenseValue <= 0 as dead
            if (threat.defenseValue <= 0) {
              threat.isDead = true;
              updatedGameState = addLog(
                updatedGameState,
                `${threat.name} has been neutralized.`,
              );
              return; // Skip dead threats
            }

            const entityStatus = latestEntityStatuses.find(
              (status) => status.threatId === threat.id,
            );

            if (entityStatus) {
              // Check if all action potentials are active
              const allActive = entityStatus.actionPotentials.every(
                (pot) => pot,
              );

              if (allActive) {
                // This entity should activate
                activatedEntities.push(threat);

                // Reset its action potentials for next cycle
                const resetPotentials = entityStatus.actionPotentials.map(
                  () => false,
                );
                updatedEntityStatuses = updatedEntityStatuses.map((status) =>
                  status.threatId === threat.id
                    ? { ...status, actionPotentials: resetPotentials }
                    : status,
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
              description:
                "A card played by a location entity that has reached full action potential.",
              cost: 0,
              faction: "Corp",
              cardType: "Action",
              keywords: ["ICE", "Weapon"],
              isFaceDown: false, // Face up for activated entities
              playedBy: threat.name,
              effects: [{ type: "damage_player", value: threat.attack }],
            };

            // Add the card to the AI player's inPlay area at the FRONT (to be resolved first)
            updatedGameState.players[aiPlayerIndex].inPlay.unshift(
              entityCard,
            );

            // Add the card to entity's played cards
            const entityStatusIndex = updatedEntityStatuses.findIndex(
              (status) => status.threatId === threat.id,
            );

            if (entityStatusIndex >= 0) {
              updatedEntityStatuses[entityStatusIndex] = {
                ...updatedEntityStatuses[entityStatusIndex],
                playedCards: [
                  ...updatedEntityStatuses[entityStatusIndex].playedCards,
                  entityCard,
                ],
              };
            }

            // Log the entity playing a card
            updatedGameState = addLog(
              updatedGameState,
              `${threat.name} has reached full potential and executes an attack!`,
            );
          });

          // Have any remaining entities potentially play facedown cards
          aliveThreats
            .filter(
              (threat) =>
                !activatedEntities.some((ae) => ae.id === threat.id) &&
                !(threat.isDead || threat.defenseValue <= 0),
            )
            .forEach((threat, index) => {
              // Only 30% chance to play a card if not fully activated
              if (Math.random() < 0.3) {
                // Create a placeholder facedown card for this entity
                const entityCard: CardType = {
                  id: `entity-card-${Date.now()}-passive-${index}`,
                  name: `${threat.name}'s Card`,
                  description:
                    "A face-down card played by a location entity.",
                  cost: 0,
                  faction: "Corp",
                  cardType: "Action",
                  keywords: ["ICE"],
                  isFaceDown: true,
                  playedBy: threat.name,
                  effects: [
                    // Weaker effect for non-activated entities
                    {
                      type: "damage_player",
                      value: Math.max(1, Math.floor(threat.attack / 2)),
                    },
                  ],
                };

                // Add to AI inPlay AFTER activated cards
                updatedGameState.players[aiPlayerIndex].inPlay.push(
                  entityCard,
                );

                // Log the entity playing a card
                updatedGameState = addLog(
                  updatedGameState,
                  `${threat.name} played a face-down card.`,
                );
              }
            });
        } else {
          updatedGameState = addLog(
            updatedGameState,
            `No entities at this location to respond.`,
          );
        }
      });

      // Simulate the AI processing after entities play cards
      setTimeout(() => {
        // Refill the market with new cards
        if (updatedGameState.market) {
          // Check if any market spots are empty
          const emptySlots =
            updatedGameState.market.availableCards.length <
            updatedGameState.market.maxSize;

          if (emptySlots) {
            // Refill the market with new random cards
            updatedGameState.market = refillMarket(updatedGameState.market);

            updatedGameState = addLog(
              updatedGameState,
              `The DataMarket refreshed with new products.`,
            );
          }
        }

        // End AI turn and switch back to player
        updatedGameState.activePlayerIndex = 0; // Switch back to player

        // Check if the player's deck is empty
        const player = updatedGameState.players[0];
        if (player.deck.length === 0) {
          // Notify player if they have cards in their discard pile that can be shuffled
          if (player.discard.length > 0) {
            updatedGameState = addLog(
              updatedGameState,
              `Your deck is empty but you have ${player.discard.length} cards in your discard pile. Use "Shuffle Discard" to recycle these cards.`,
            );
          } else {
            updatedGameState = addLog(
              updatedGameState,
              `Your deck and discard pile are both empty.`,
            );
          }
        }

        // Refresh player's actions and buys
        player.actions = 1;
        player.buys = 1;

        updatedGameState = addLog(
          updatedGameState,
          `Your turn begins. You have ${player.actions} action and unlimited buys.`,
        );

        set({ gameState: updatedGameState });
      }, 1500); // Delay to simulate AI thinking
    },
    updateEntityActionPotential: (threatId, newPotentials) => {},
    addEntityPlayedCard: (threatId, card) => {},
    clearEntityPlayedCards: (threatId) => {},
    resetGame: () => {},
  })),
);
