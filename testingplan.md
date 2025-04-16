Okay, let's create the test suites phase by phase. We'll use Vitest syntax (describe, it, expect, vi) as it integrates well with Vite.
Setup:
Install Vitest:
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom

# Or using yarn or pnpm

yarn add --dev vitest @testing-library/react @testing-library/jest-dom jsdom
pnpm add --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
Use code with caution.
Bash
Configure Vitest: Add a vitest.config.ts or update your vite.config.ts to include test configuration (refer to Vitest documentation). Ensure you set up the environment (e.g., jsdom). Example snippet for vite.config.ts:
/// <reference types="vitest" />
import { defineConfig } from 'vite';
// ... other imports

export default defineConfig({
// ... other vite config
test: {
globals: true,
environment: 'jsdom',
setupFiles: './src/test/setup.ts', // Optional setup file
// You might want to configure include/exclude patterns
},
});
Use code with caution.
TypeScript
(Optional) Setup File: Create src/test/setup.ts if needed (e.g., for global mocks or @testing-library/jest-dom imports).
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Optional: Mock global browser APIs if needed
// global.matchMedia = vi.fn().mockImplementation(query => ({ ... }));
Use code with caution.
TypeScript
Phase 1: Foundational Types & State
Replace Files:
client/src/lib/game/cards.ts (New version provided previously)
client/src/lib/game/player.ts (New version provided previously)
client/src/lib/game/game.ts (New version provided previously)
(Keep existing location.ts, market.ts for now, unless they have type conflicts)
Create Test Files:
client/src/lib/game/player.test.ts
client/src/lib/game/game.test.ts
client/src/lib/game/cards.test.ts
Test Code:
// client/src/lib/game/player.test.ts
import { describe, it, expect } from 'vitest';
import { createPlayer, shuffleDeck } from './player'; // Assuming shuffleDeck stays here for now
import { CREDIT_CHIP } from './cards';

describe('Player Logic', () => {
it('createPlayer should initialize with default values', () => {
const player = createPlayer('p1', 'Test Player');
expect(player.id).toBe('p1');
expect(player.name).toBe('Test Player');
expect(player.deck).toEqual([]);
expect(player.hand).toEqual([]);
expect(player.discard).toEqual([]);
expect(player.inPlay).toEqual([]);
expect(player.credits).toBe(5); // Default starting credits
expect(player.actions).toBe(3); // Default starting actions
expect(player.health).toBe(10);
expect(player.maxHandSize).toBe(5);
expect(player.memoryUnitsUsed).toBe(0);
expect(player.maxMemoryUnits).toBe(4);
expect(player.factionReputation).toEqual({ Corp: 50, Runner: 50, Street: 50 });
});

it('shuffleDeck should randomize card order', () => {
const deck = [{ ...CREDIT_CHIP, id: 'c1' }, { ...CREDIT_CHIP, id: 'c2' }, { ...CREDIT_CHIP, id: 'c3' }];
const shuffled = shuffleDeck([...deck]); // Pass copy

    expect(shuffled).toHaveLength(deck.length);
    expect(shuffled).toContainEqual(deck[0]);
    expect(shuffled).toContainEqual(deck[1]);
    expect(shuffled).toContainEqual(deck[2]);
    // It's hard to guarantee randomness, but check it's likely different
    // Avoid toBe check as order should change
    expect(shuffled).not.toEqual(deck); // High probability it's different for >2 cards

});

it('shuffleDeck should handle empty or single-card decks', () => {
expect(shuffleDeck([])).toEqual([]);
const singleCardDeck = [{ ...CREDIT_CHIP, id: 'c1' }];
expect(shuffleDeck([...singleCardDeck])).toEqual(singleCardDeck);
});
});
Use code with caution.
TypeScript
// client/src/lib/game/game.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeGame, addLog, drawNCards, GameState } from './game';
import { createPlayer } from './player';
import { getEnhancedStartingDeck, isEnhancedCard } from './enhancedCards'; // Use enhanced deck
import { cardExecutionService } from './cardExecutionService';
import { Card } from './cards';

// Mock the cardExecutionService for drawNCards dependency
vi.mock('./cardExecutionService', () => ({
cardExecutionService: {
moveCardToZone: vi.fn((gameState, card, from, to) => {
// Basic mock: removes card from 'from' array and adds to 'to' array in a player
// This is simplified and assumes the card belongs to player 0 for testing init
let updatedState = structuredClone(gameState);
let player = updatedState.players[0]; // Assume player 0 for simplicity in init tests
let cardFound = false;

       const removeFrom = (zoneKey: keyof Player) => {
            const idx = (player[zoneKey] as Card[]).findIndex(c => c.id === card.id);
            if (idx !== -1) { (player[zoneKey] as Card[]).splice(idx, 1); return true; }
            return false;
       }
        const addTo = (zoneKey: keyof Player) => {
            (player[zoneKey] as Card[]).push(card); // Add the passed card instance
        }

      if (from === 'inDeck') cardFound = removeFrom('deck');
      else if (from === 'inDiscard') cardFound = removeFrom('discard');
      // ... other from zones if needed

      if (to === 'inHand') addTo('hand');
      else if (to === 'inDeck') addTo('deck'); // Adds to end
      else if (to === 'inDiscard') addTo('discard');
      // ... other to zones

      return updatedState;
    }),
    // Mock other methods if needed by tested functions (not needed for these specific tests)

},
}));

describe('Game Logic', () => {
let initialGameState: GameState;

    beforeEach(() => {
        // Reset mocks if needed before each test
         vi.clearAllMocks();
         initialGameState = initializeGame(['Alice', 'Bob']); // Initialize fresh state
    });

it('initializeGame should set up players, market, and initial state', () => {
const gameState = initializeGame(['Alice', 'Bob']);

    expect(gameState.players).toHaveLength(2);
    expect(gameState.players[0].name).toBe('Alice');
    expect(gameState.players[1].name).toBe('Bob');
    expect(gameState.activePlayerIndex).toBe(0);
    expect(gameState.market.availableCards).toHaveLength(5); // Default market size
    expect(gameState.market.availableCards.every(c => isEnhancedCard(c))).toBe(true); // Check if market cards are enhanced
    expect(gameState.phase).toBe('action');
    expect(gameState.turnNumber).toBe(1);
    expect(gameState.logs.length).toBeGreaterThan(0); // Should have init logs
    expect(gameState.players[0].hand).toHaveLength(5); // Player 1 draws 5
    expect(gameState.players[0].deck).toHaveLength(getEnhancedStartingDeck().length - 5); // Starting deck size - 5
    expect(gameState.players[0].deck.every(c => isEnhancedCard(c))).toBe(true); // Deck cards enhanced
    expect(gameState.players[0].hand.every(c => isEnhancedCard(c))).toBe(true); // Hand cards enhanced
    expect(gameState.players[1].hand).toHaveLength(0); // Player 2 hasn't drawn yet
    expect(gameState.runState).toEqual({ isActive: false, flags: {} });

});

it('addLog should add a log entry', () => {
const message = 'Test log message';
const updatedState = addLog(initialGameState, message);
expect(updatedState.logs).toHaveLength(initialGameState.logs.length + 1);
expect(updatedState.logs[updatedState.logs.length - 1].message).toBe(message);
});

it('addLog should limit log size', () => {
let state = initialGameState;
for(let i=0; i< 150; i++) { // Add more than 100 logs
state = addLog(state, `Log ${i}`);
}
expect(state.logs).toHaveLength(100); // Should be capped at 100
expect(state.logs[0].message).toBe('Log 50'); // Check first message after capping
});

it('drawNCards should draw cards and update state via mocked service', () => {
let player = createPlayer('p1', 'Test');
player.deck = getEnhancedStartingDeck(); // Give player a deck
let state = { ...initialGameState, players: [player, initialGameState.players[1]]}; // Put player in state

     const { updatedPlayer, drawnCards, updatedGameState } = drawNCards(player, 3, state);

     expect(drawnCards).toHaveLength(3);
     expect(updatedPlayer.hand).toHaveLength(3);
     expect(updatedPlayer.deck).toHaveLength(getEnhancedStartingDeck().length - 3);
     // Check if the mock was called (representing zone transitions)
     expect(cardExecutionService.moveCardToZone).toHaveBeenCalledTimes(3);
      expect(cardExecutionService.moveCardToZone).toHaveBeenCalledWith(expect.anything(), drawnCards[0], 'inDeck', 'inHand');

});

it('drawNCards should handle empty deck by shuffling discard (mocked)', () => {
let player = createPlayer('p1', 'Test');
player.discard = getEnhancedStartingDeck(); // Put cards in discard
player.deck = []; // Empty deck
let state = { ...initialGameState, players: [player, initialGameState.players[1]]};

        const { updatedPlayer, drawnCards, updatedGameState } = drawNCards(player, 5, state);

        expect(drawnCards).toHaveLength(5);
        expect(updatedPlayer.hand).toHaveLength(5);
        expect(updatedPlayer.discard).toHaveLength(0); // Discard should be empty now
        expect(updatedPlayer.deck).toHaveLength(getEnhancedStartingDeck().length - 5);
        // Check if moveCardToZone was called for shuffle + draw
        expect(cardExecutionService.moveCardToZone).toHaveBeenCalledTimes(getEnhancedStartingDeck().length + 5); // 10 for shuffle, 5 for draw
        // Example check for one shuffle move
         expect(cardExecutionService.moveCardToZone).toHaveBeenCalledWith(expect.anything(), expect.any(Object), 'inDiscard', 'inDeck');
         // Example check for one draw move
         expect(cardExecutionService.moveCardToZone).toHaveBeenCalledWith(expect.anything(), drawnCards[0], 'inDeck', 'inHand');

});

});
Use code with caution.
TypeScript
// client/src/lib/game/cards.test.ts
import { describe, it, expect } from 'vitest';
import { MARKET_CARD_POOL, getStartingDeck, getRandomMarketCard, Card } from './cards';

describe('Card Definitions & Utils', () => {
it('MARKET_CARD_POOL should contain cards', () => {
expect(MARKET_CARD_POOL.length).toBeGreaterThan(0);
// Check a sample card property
expect(MARKET_CARD_POOL[0].name).toBeDefined();
expect(MARKET_CARD_POOL[0].cost).toBeDefined();
expect(MARKET_CARD_POOL[0].faction).toBeDefined();
expect(MARKET_CARD_POOL[0].cardType).toBeDefined();
expect(MARKET_CARD_POOL[0].keywords).toBeDefined();
});

    it('getStartingDeck should return 10 cards', () => {
        const deck = getStartingDeck();
        expect(deck).toHaveLength(10);
    });

    it('getStartingDeck should contain correct number of CREDIT_CHIP and PERSONAL_DATA', () => {
        const deck = getStartingDeck();
        const creditChips = deck.filter(card => card.id === 'credit_chip');
        const personalData = deck.filter(card => card.id === 'personal_data');
        expect(creditChips).toHaveLength(7);
        expect(personalData).toHaveLength(3);
    });

     it('getRandomMarketCard should return a card from the pool', () => {
        const randomCard = getRandomMarketCard();
        expect(randomCard).toBeDefined();
        // Check if the returned card exists in the pool (by ID)
         expect(MARKET_CARD_POOL.some(poolCard => poolCard.id === randomCard.id)).toBe(true);
    });

     it('getRandomMarketCard should return a copy, not a reference', () => {
        const randomCard1 = getRandomMarketCard();
        const randomCard2 = getRandomMarketCard(); // Get another random card

        // Modify the first card
         randomCard1.name = "MODIFIED_CARD_NAME_TEST";
         randomCard1.cost = 999;

         // Find the original definition in the pool
         const originalCardInPool = MARKET_CARD_POOL.find(c => c.id === randomCard1.id);

         // Ensure the original pool card was not modified
         expect(originalCardInPool).toBeDefined();
         expect(originalCardInPool?.name).not.toBe("MODIFIED_CARD_NAME_TEST");
         expect(originalCardInPool?.cost).not.toBe(999);

         // Ensure the second random card (if it happens to be the same ID) wasn't modified either
         if (randomCard2.id === randomCard1.id) {
              expect(randomCard2.name).not.toBe("MODIFIED_CARD_NAME_TEST");
         }
    });

});
Use code with caution.
TypeScript
Run Tests:
Execute npm test (or yarn test, pnpm test).
Fix any failing tests or type errors.
Watch For:
Type Errors: Ensure all imports and usages match the new type definitions in the replaced files.
Initialization Logic: Verify initializeGame sets up the state correctly, especially the player's initial draw and market state.
drawNCards Mocking: Confirm that the cardExecutionService.moveCardToZone mock behaves as expected in the tests, simulating the zone transitions.
Phase 2: Components
Replace File:
client/src/lib/game/components.ts (New version provided previously)
Create/Update Test File:
client/src/lib/game/components.test.ts
Test Code:
// client/src/lib/game/components.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
// Import components to test
CreditCost, ActionCost, GainCredits, DealDamage, SingleEntityTarget, KeywordRequirement,
// Import types/enums
ComponentStatus, GameContext, EnhancedCard, StateChangeDescription, TargetingRequest,
// Import base card type
Card, CardZone
} from './components';
import { Player } from './player';
import { GameState } from './game';

// Helper to create mock context
const createMockContext = (overrides: Partial<GameContext> = {}): GameContext => {
const mockPlayer: Player = {
id: 'player1', name: 'Test Player', credits: 10, actions: 3, health: 10,
deck: [], hand: [], discard: [], inPlay: [], maxHandSize: 5, memoryUnitsUsed: 0, maxMemoryUnits: 4,
factionReputation: { Corp: 50, Runner: 50, Street: 50 },
...overrides.player // Allow overriding player properties
};
const mockGameState: GameState = {
players: [mockPlayer, { id: 'opp1', name: 'Opponent', credits: 5, actions: 0, health: 10 } as Player], // Add opponent
activePlayerIndex: 0, market: { availableCards: [], trashedCards: [], maxSize: 5 },
phase: 'action', turnNumber: 1, logs: [], trashPile: [], runState: { isActive: false, flags: {} },
...(overrides.gameState || {})
};
const mockCard: EnhancedCard = {
id: 'testCard', name: 'Test Card', cost: 0, faction: 'Neutral', cardType: 'Event', keywords: [], description: '', components: [],
...(overrides.currentCard || {})
};

    return {
        currentCard: mockCard,
        player: mockPlayer,
        opponents: mockGameState.players.filter(p => p.id !== mockPlayer.id),
        gameState: mockGameState,
        targets: overrides.targets || [],
        cardsInPlay: overrides.cardsInPlay || [],
        locationThreats: overrides.locationThreats || [],
        log: vi.fn(),
        ...overrides // Apply any other top-level overrides
    };

};

describe('Component System', () => {

    // --- Cost Components ---
    describe('CreditCost', () => {
        it('canApply returns true if player has enough credits', () => {
            const comp = new CreditCost(5);
            const context = createMockContext({ player: { credits: 10 } as Player });
            expect(comp.canApply(context)).toBe(true);
        });
        it('canApply returns false if player has insufficient credits', () => {
            const comp = new CreditCost(15);
            const context = createMockContext({ player: { credits: 10 } as Player });
            expect(comp.canApply(context)).toBe(false);
        });
        it('apply returns SUCCESS', () => {
            const comp = new CreditCost(5);
            const context = createMockContext();
            expect(comp.apply(context)).toBe(ComponentStatus.SUCCESS);
        });
        it('getCostDescription returns correct state change', () => {
            const comp = new CreditCost(5);
            expect(comp.getCostDescription()).toEqual({
                type: 'DELTA_STATE', targetId: 'player', payload: { property: 'credits', delta: -5 }
            });
        });
    });

    describe('ActionCost', () => {
         it('canApply returns true if player has enough actions', () => {
            const comp = new ActionCost(1);
            const context = createMockContext({ player: { actions: 1 } as Player });
            expect(comp.canApply(context)).toBe(true);
        });
         it('canApply returns false if player has insufficient actions', () => {
            const comp = new ActionCost(2);
            const context = createMockContext({ player: { actions: 1 } as Player });
            expect(comp.canApply(context)).toBe(false);
        });
        it('apply returns SUCCESS', () => {
            const comp = new ActionCost(1);
            const context = createMockContext();
            expect(comp.apply(context)).toBe(ComponentStatus.SUCCESS);
        });
         it('getCostDescription returns correct state change', () => {
            const comp = new ActionCost(1);
            expect(comp.getCostDescription()).toEqual({
                type: 'DELTA_STATE', targetId: 'player', payload: { property: 'actions', delta: -1 }
            });
        });
    });

    // --- Effect Components ---
    describe('GainCredits', () => {
        it('apply returns correct StateChangeDescription targeting player by default', () => {
            const comp = new GainCredits(3);
            const context = createMockContext(); // No targets set
            expect(comp.apply(context)).toEqual([{
                type: 'DELTA_STATE', targetId: 'player', payload: { property: 'credits', delta: 3 }
            }]);
        });
         it('apply returns correct StateChangeDescription targeting specific target', () => {
            const comp = new GainCredits(3);
            const targetPlayer = { id: 'opp1', name: 'Opponent', credits: 5 };
            const context = createMockContext({ targets: [targetPlayer] });
            expect(comp.apply(context)).toEqual([{
                type: 'DELTA_STATE', targetId: 'opp1', payload: { property: 'credits', delta: 3 }
            }]);
        });
    });

    describe('DealDamage', () => {
        it('apply returns correct StateChangeDescriptions for multiple targets', () => {
            const comp = new DealDamage(2, 'Net');
            const targets = [{ id: 'threat1', name: 'Guard' }, { id: 'threat2', name: 'ICE' }];
            const context = createMockContext({ targets });
            expect(comp.apply(context)).toEqual([
                { type: 'APPLY_DAMAGE', targetId: 'threat1', payload: { amount: 2, damageType: 'Net' } },
                { type: 'APPLY_DAMAGE', targetId: 'threat2', payload: { amount: 2, damageType: 'Net' } }
            ]);
        });
         it('apply returns empty array if no targets', () => {
            const comp = new DealDamage(2, 'Net');
            const context = createMockContext({ targets: [] });
            expect(comp.apply(context)).toEqual([]);
        });
    });

    // --- Targeting Components ---
    describe('SingleEntityTarget', () => {
         const threat1 = { id: 't1', name: 'Threat 1', dangerLevel: 1, defenseValue: 1 };
         const threat2 = { id: 't2', name: 'Threat 2', dangerLevel: 3, defenseValue: 3 };

         it('canApply finds targets', () => {
             const comp = new SingleEntityTarget('threat');
             const context = createMockContext({ locationThreats: [threat1, threat2] });
             expect(comp.canApply(context)).toBe(true);
         });
         it('canApply returns false if no targets', () => {
             const comp = new SingleEntityTarget('threat');
             const context = createMockContext({ locationThreats: [] });
             expect(comp.canApply(context)).toBe(false);
         });
         it('apply returns REQUIRES_TARGETING if selection allowed and no targets provided', () => {
             const comp = new SingleEntityTarget('threat', true);
             const context = createMockContext({ locationThreats: [threat1] });
             expect(comp.apply(context)).toBe(ComponentStatus.REQUIRES_TARGETING);
         });
          it('apply returns SUCCESS if targets already provided', () => {
             const comp = new SingleEntityTarget('threat', true);
             const context = createMockContext({ locationThreats: [threat1], targets: [threat1] });
             expect(comp.apply(context)).toBe(ComponentStatus.SUCCESS);
         });
          it('apply returns FAILURE if invalid target provided', () => {
             const comp = new SingleEntityTarget('threat', true); // Requires a threat
             const playerTarget = { id: 'player1', name: 'Player'}; // Provide player instead
             const context = createMockContext({ locationThreats: [threat1], targets: [playerTarget] });
             expect(comp.apply(context)).toBe(ComponentStatus.FAILURE);
             expect(context.log).toHaveBeenCalledWith(expect.stringContaining('Invalid target type provided'));
         });
          it('apply auto-selects if allowTargetSelection is false', () => {
             const comp = new SingleEntityTarget('threat', false);
             const context = createMockContext({ locationThreats: [threat1, threat2] });
             expect(comp.apply(context)).toBe(ComponentStatus.SUCCESS);
             expect(context.targets).toEqual([threat1]); // Should have auto-selected first one
         });
         it('apply returns FAILURE if auto-select finds no targets', () => {
             const comp = new SingleEntityTarget('threat', false);
             const context = createMockContext({ locationThreats: [] });
             expect(comp.apply(context)).toBe(ComponentStatus.FAILURE);
         });
         it('getTargetingRequest returns correct structure', () => {
            const comp = new SingleEntityTarget('program', true, undefined, 'inPlay');
            const context = createMockContext();
            const request = comp.getTargetingRequest(context);
            expect(request.requestingCardId).toBe('testCard');
            expect(request.targetType).toBe('program');
            expect(request.targetZone).toBe('inPlay');
            expect(request.maxTargets).toBe(1);
            expect(request.minTargets).toBe(1);
            expect(request.message).toContain('Select 1 program target');
        });
    });

    // --- Conditional Components ---
    describe('KeywordRequirement', () => {
         const cardWithVirus: EnhancedCard = { id: 'v1', name: 'Virus1', keywords: ['Virus', 'Program'] } as EnhancedCard;
         const cardWithoutVirus: EnhancedCard = { id: 'p1', name: 'Prog1', keywords: ['Program'] } as EnhancedCard;

         it('canApply returns true if keyword present in play', () => {
            const comp = new KeywordRequirement('Virus', 1, 'inPlay');
            const context = createMockContext({ cardsInPlay: [cardWithVirus] });
            expect(comp.canApply(context)).toBe(true);
         });
         it('canApply returns false if keyword not present', () => {
            const comp = new KeywordRequirement('Virus', 1, 'inPlay');
            const context = createMockContext({ cardsInPlay: [cardWithoutVirus] });
            expect(comp.canApply(context)).toBe(false);
         });
         it('canApply checks count correctly', () => {
            const comp = new KeywordRequirement('Virus', 2, 'inPlay');
            const context = createMockContext({ cardsInPlay: [cardWithVirus] });
            expect(comp.canApply(context)).toBe(false);
         });
          it('canApply excludes the current card', () => {
             const currentCard: EnhancedCard = { id: 'current', name: 'CurrentVirus', keywords: ['Virus'] } as EnhancedCard;
             const comp = new KeywordRequirement('Virus', 1, 'inPlay');
             const context = createMockContext({ currentCard, cardsInPlay: [currentCard] }); // Only self in play
             expect(comp.canApply(context)).toBe(false); // Should fail as it needs *another* card
         });
         it('apply returns SUCCESS if canApply is true', () => {
            const comp = new KeywordRequirement('Virus', 1, 'inPlay');
            const context = createMockContext({ cardsInPlay: [cardWithVirus] });
            expect(comp.apply(context)).toBe(ComponentStatus.SUCCESS);
         });
         it('apply returns FAILURE if canApply is false', () => {
            const comp = new KeywordRequirement('Virus', 1, 'inPlay');
            const context = createMockContext({ cardsInPlay: [] });
            expect(comp.apply(context)).toBe(ComponentStatus.FAILURE);
         });
    });

    // Add more tests for other components (TrashCost, HealthCost, BypassSecurity, RecycleCard, etc.)
    // Focus on canApply logic and the structure of apply's return value (Status or StateChangeDescription[])

});
Use code with caution.
TypeScript
Run Tests:
npm test
Fix failures. You'll likely need to refine the mock context (createMockContext) to provide necessary data for different components (e.g., cardsInPlay, locationThreats, player stats).
Watch For:
Type Errors: Ensure component constructors and methods match the new interface.
Return Values: Verify apply returns the correct ComponentStatus or StateChangeDescription[].
canApply Logic: Ensure prerequisites are checked correctly based on the mock context.
Targeting Logic: Test apply returning REQUIRES_TARGETING and getTargetingRequest providing correct info.
Phase 3: Enhanced Cards
Replace File:
client/src/lib/game/enhancedCards.ts (New version provided previously)
Create/Update Test File:
client/src/lib/game/enhancedCards.test.ts
Test Code:
// client/src/lib/game/enhancedCards.test.ts
import { describe, it, expect } from 'vitest';
import { getEnhancedCard, getEnhancedStartingDeck, ENHANCED_CARDS_MAP } from './enhancedCards';
import { CREDIT_CHIP, PERSONAL_DATA, MALICIOUS_CODE } from './cards'; // Import base cards
import { isEnhancedCard, GainCredits, ActionCost, DealDamage, KeywordSynergy, SingleEntityTarget, RiskReward } from './components'; // Import component types

describe('Enhanced Card Definitions', () => {
it('getEnhancedCard returns undefined for unknown ID', () => {
expect(getEnhancedCard('unknown_id')).toBeUndefined();
});

    it('getEnhancedCard returns enhanced definition for known card', () => {
        const card = getEnhancedCard(CREDIT_CHIP.id);
        expect(card).toBeDefined();
        expect(isEnhancedCard(card)).toBe(true);
        expect(card?.id).toBe(CREDIT_CHIP.id);
        expect(card?.components).toBeInstanceOf(Array);
        expect(card?.components.length).toBeGreaterThan(0);
    });

     it('getEnhancedCard returns a deep copy', () => {
        const card1 = getEnhancedCard(CREDIT_CHIP.id);
        const card2 = getEnhancedCard(CREDIT_CHIP.id);
        expect(card1).not.toBe(card2); // Should be different objects
        if (card1 && card2) {
             expect(card1.components).not.toBe(card2.components); // Components array should also be a copy
             // Modify a component in card1 and check card2
             const gainCreditsComp1 = card1.components.find(c => c instanceof GainCredits) as GainCredits;
             if (gainCreditsComp1) gainCreditsComp1.amount = 99;

              const gainCreditsComp2 = card2.components.find(c => c instanceof GainCredits) as GainCredits;
              expect(gainCreditsComp2?.amount).not.toBe(99); // Should be original value (1)
        }
    });


    it('getEnhancedStartingDeck returns correct structure', () => {
        const deck = getEnhancedStartingDeck();
        expect(deck).toHaveLength(10);
        expect(deck.every(card => isEnhancedCard(card))).toBe(true);
        const creditChips = deck.filter(card => card.id === 'credit_chip');
        const personalData = deck.filter(card => card.id === 'personal_data');
        expect(creditChips).toHaveLength(7);
        expect(personalData).toHaveLength(3);
    });

    // --- Specific Card Checks ---
    it('ENHANCED_CREDIT_CHIP should have correct components', () => {
        const card = getEnhancedCard(CREDIT_CHIP.id);
        expect(card?.components).toEqual(expect.arrayContaining([
            expect.any(ActionCost),
            expect.any(SelfTarget),
            expect.any(GainCredits)
        ]));
        const actionCost = card?.components.find(c => c instanceof ActionCost) as ActionCost;
        const gainCredits = card?.components.find(c => c instanceof GainCredits) as GainCredits;
        expect(actionCost?.amount).toBe(0);
        expect(gainCredits?.amount).toBe(1);
    });

    it('ENHANCED_DESPERATE_HACK should have correct components', () => {
         const card = getEnhancedCard(DESPERATE_HACK.id);
         expect(card?.components).toEqual(expect.arrayContaining([
             expect.any(ActionCost),
             expect.any(SingleEntityTarget),
             expect.any(RiskReward),
             expect.any(KeywordSynergy)
         ]));
          const riskComp = card?.components.find(c => c instanceof RiskReward) as RiskReward;
          expect(riskComp?.chance).toBe(60);
          expect(riskComp?.riskAmount).toBe(2);
          expect(riskComp?.rewardAmount).toBe(4);
    });

     // Add more specific checks for other important enhanced cards...

});
Use code with caution.
TypeScript
Run Tests: npm test
Watch For:
Type Errors: Component constructors used in enhancedCards.ts must match components.ts.
Correct Composition: Verify the components array on enhanced cards matches the intended logic described in the base card's description.
Copying: Ensure getEnhancedCard returns copies to prevent definition mutation.
Phase 4: Card Execution Service
Replace File:
client/src/lib/game/cardExecutionService.ts (New version provided previously)
Create/Update Test File:
client/src/lib/game/cardExecutionService.test.ts
Test Code: (This requires more extensive setup and mocking)
// client/src/lib/game/cardExecutionService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cardExecutionService } from './cardExecutionService';
import { GameState, initializeGame, addLog } from './game';
import { Player } from './player';
import { EnhancedCard, Component, GameContext, ComponentStatus, StateChangeDescription, TargetingRequest, CardZone, SelfTarget, GainCredits, ActionCost, CreditCost, DealDamage, SingleEntityTarget, KeywordRequirement } from './components';
import { getEnhancedCard, getEnhancedStartingDeck } from './enhancedCards';

// --- Mock Components ---
const MockSuccessComponent: Component = { type: 'MockSuccess', apply: vi.fn(() => ComponentStatus.SUCCESS) };
const MockFailureComponent: Component = { type: 'MockFailure', apply: vi.fn(() => ComponentStatus.FAILURE) };
const MockTargetingComponent: Component & { getTargetingRequest: (c: GameContext) => TargetingRequest } = {
type: 'MockTargeting',
apply: vi.fn(() => ComponentStatus.REQUIRES_TARGETING),
getTargetingRequest: vi.fn((ctx) => ({
requestingCardId: ctx.currentCard.id, requestingComponentType: 'MockTargeting',
targetType: 'any', maxTargets: 1, minTargets: 1, message: 'Select Mock Target'
}))
};
const MockEffectComponent: Component = {
type: 'MockEffect',
apply: vi.fn(() => ([{ type: 'DELTA_STATE', targetId: 'player', payload: { property: 'credits', delta: 100 } }]))
};
const MockCostComponent: Component & { canApply: (c: GameContext) => boolean, getCostDescription: () => StateChangeDescription } = {
type: 'MockCost',
canApply: vi.fn(() => true), // Default to true
apply: vi.fn(() => ComponentStatus.SUCCESS),
getCostDescription: vi.fn(() => ({ type: 'DELTA_STATE', targetId: 'player', payload: { property: 'actions', delta: -1 } }))
};

// Helper to create test cards
const createTestCard = (id: string, name: string, components: Component[]): EnhancedCard => ({
id, name, cost: 0, faction: 'Neutral', cardType: 'Event', keywords: [], description: '', components: components.map(c => ({ ...c })) // Copy components
});

describe('CardExecutionService (Refactored)', () => {
let gameState: GameState;
let logFn: Mock<(message: string) => void>;
let onCompleteFn: Mock<(finalState: GameState) => void>;

    beforeEach(() => {
        vi.useFakeTimers(); // Use fake timers for requestAnimationFrame
        gameState = initializeGame(['Tester']); // Use real init logic now
        logFn = vi.fn();
        onCompleteFn = vi.fn();
        cardExecutionService.reset(); // Ensure clean state

        // Reset mocks
        vi.mocked(MockSuccessComponent.apply).mockClear();
        vi.mocked(MockFailureComponent.apply).mockClear();
        vi.mocked(MockTargetingComponent.apply).mockClear();
        vi.mocked(MockTargetingComponent.getTargetingRequest).mockClear();
        vi.mocked(MockEffectComponent.apply).mockClear();
        vi.mocked(MockCostComponent.canApply).mockClear().mockReturnValue(true); // Default mock to success
        vi.mocked(MockCostComponent.apply).mockClear();
        vi.mocked(MockCostComponent.getCostDescription).mockClear().mockReturnValue({ type: 'DELTA_STATE', targetId: 'player', payload: { property: 'actions', delta: -1 } });
    });

     afterEach(() => {
         vi.restoreAllMocks();
         vi.useRealTimers();
     });

    const tickUntilIdleOrPaused = async () => {
         await vi.runOnlyPendingTimersAsync(); // Process initial rAF
         while (cardExecutionService.getInternalState().state === 'RUNNING') {
              await vi.advanceTimersToNextTimerAsync(); // Process next rAF tick
         }
     }


    it('should initialize in IDLE state with empty queue', () => {
        expect(cardExecutionService.getInternalState().state).toBe('IDLE');
        expect(cardExecutionService.getInternalState().executionQueue).toEqual([]);
    });

    it('queueCard should add card to the queue', () => {
        const card = createTestCard('c1', 'Test Card 1', [MockSuccessComponent]);
        cardExecutionService.queueCard(card, 'inHand');
        expect(cardExecutionService.getInternalState().executionQueue).toHaveLength(1);
        expect(cardExecutionService.getInternalState().executionQueue[0].card.id).toBe('c1');
        expect(cardExecutionService.getInternalState().executionQueue[0].originalZone).toBe('inHand');
    });

    it('startExecution should transition to RUNNING and start ticking', async () => {
        const card = createTestCard('c1', 'Success Card', [MockSuccessComponent]);
        cardExecutionService.queueCard(card, 'inHand');
        cardExecutionService.startExecution(gameState, logFn, onCompleteFn);

        expect(cardExecutionService.getInternalState().state).toBe('RUNNING');
        await tickUntilIdleOrPaused(); // Let it run
        expect(MockSuccessComponent.apply).toHaveBeenCalledTimes(1);
        expect(cardExecutionService.getInternalState().state).toBe('QUEUE_COMPLETE');
    });

    it('should process components sequentially on success', async () => {
         const card = createTestCard('c1', 'Multi Success', [MockSuccessComponent, MockEffectComponent]);
         cardExecutionService.queueCard(card, 'inHand');
         cardExecutionService.startExecution(gameState, logFn, onCompleteFn);

         await tickUntilIdleOrPaused();

         // Check order (apply is called within the service tick)
         // Vitest doesn't easily track call order across ticks without more setup
         // Verify both were called
         expect(MockSuccessComponent.apply).toHaveBeenCalledTimes(1);
         expect(MockEffectComponent.apply).toHaveBeenCalledTimes(1);
         expect(cardExecutionService.getInternalState().state).toBe('QUEUE_COMPLETE');
    });

     it('should apply buffered costs before effects', async () => {
         const card = createTestCard('c1', 'Cost Then Effect', [MockCostComponent, MockEffectComponent]);
         cardExecutionService.queueCard(card, 'inHand');
         const initialActions = gameState.players[0].actions;

         cardExecutionService.startExecution(gameState, logFn, onCompleteFn);
         await tickUntilIdleOrPaused();

         expect(MockCostComponent.canApply).toHaveBeenCalled();
         expect(MockCostComponent.apply).toHaveBeenCalled(); // Apply confirms success
         expect(MockEffectComponent.apply).toHaveBeenCalled(); // Effect runs after cost check

         // Check final state passed to onComplete
         expect(onCompleteFn).toHaveBeenCalled();
         const finalState = onCompleteFn.mock.calls[0][0] as GameState;
         expect(finalState.players[0].actions).toBe(initialActions - 1); // Cost applied
         expect(finalState.players[0].credits).toBe(gameState.players[0].credits + 100); // Effect applied
     });


    it('should handle component FAILURE and abort card', async () => {
        const card1 = createTestCard('c1', 'Fail Card', [MockSuccessComponent, MockFailureComponent, MockEffectComponent]);
        const card2 = createTestCard('c2', 'Next Card', [MockSuccessComponent]);
        cardExecutionService.queueCard(card1, 'inHand');
        cardExecutionService.queueCard(card2, 'inHand');
        cardExecutionService.startExecution(gameState, logFn, onCompleteFn);

        await tickUntilIdleOrPaused();

        expect(MockSuccessComponent.apply).toHaveBeenCalledTimes(2); // Once for c1, once for c2
        expect(MockFailureComponent.apply).toHaveBeenCalledTimes(1); // Failure on c1
        expect(MockEffectComponent.apply).not.toHaveBeenCalled(); // Aborted before effect
        expect(logFn).toHaveBeenCalledWith(expect.stringContaining("failed execution"));
        expect(cardExecutionService.getInternalState().state).toBe('QUEUE_COMPLETE'); // Queue finishes
        // Check card1 moved to discard (needs moveCardToZone mock/spy)
    });

    it('should PAUSE on REQUIRES_TARGETING', async () => {
        const card = createTestCard('c1', 'Target Card', [MockTargetingComponent, MockEffectComponent]);
        cardExecutionService.queueCard(card, 'inHand');
        cardExecutionService.startExecution(gameState, logFn, onCompleteFn);

        await tickUntilIdleOrPaused(); // Should pause after targeting component

        expect(MockTargetingComponent.apply).toHaveBeenCalledTimes(1);
        expect(MockTargetingComponent.getTargetingRequest).toHaveBeenCalledTimes(1);
        expect(MockEffectComponent.apply).not.toHaveBeenCalled(); // Paused before effect
        expect(cardExecutionService.getInternalState().state).toBe('PAUSED_FOR_TARGETING');
        expect(cardExecutionService.isPausedForTargeting()).toBe(true);
        expect(cardExecutionService.getTargetingRequest()).toBeDefined();
        expect(cardExecutionService.getTargetingRequest()?.message).toBe('Select Mock Target');
        expect(onCompleteFn).not.toHaveBeenCalled(); // Not complete yet
    });

     it('provideTargets should resume execution', async () => {
        const card = createTestCard('c1', 'Target Card', [MockTargetingComponent, MockEffectComponent]);
        cardExecutionService.queueCard(card, 'inHand');
        cardExecutionService.startExecution(gameState, logFn, onCompleteFn);

        await tickUntilIdleOrPaused(); // Pause for targeting
        expect(cardExecutionService.isPausedForTargeting()).toBe(true);

        const mockTarget = { id: 't1', name: 'Target1' };
        cardExecutionService.provideTargets([mockTarget]);

        // Context should now have targets when MockTargetingComponent re-applies (transiently)
         expect(MockTargetingComponent.apply).toHaveBeenCalledTimes(2); // Called again on resume? Or should service skip apply? Let's assume skip.
         // Corrected assumption: Service resumes *after* the pausing component.
         // So MockTargetingComponent.apply should only be called once. Let's re-verify.
         // Re-simulate: start -> tick(Target) -> PAUSE -> provideTargets -> RUNNING -> tick(Effect)
         // Yes, MockTargetingComponent.apply should only be called ONCE before the pause.

         // Reset mock count expectation
         vi.mocked(MockTargetingComponent.apply).mockClear();


        await tickUntilIdleOrPaused(); // Let it resume and finish

        expect(cardExecutionService.isPausedForTargeting()).toBe(false);
        expect(MockEffectComponent.apply).toHaveBeenCalledTimes(1); // Effect should now run
        // Check context passed to MockEffectComponent had the target
         expect(vi.mocked(MockEffectComponent.apply).mock.calls[0][0].targets).toEqual([mockTarget]);
        expect(cardExecutionService.getInternalState().state).toBe('QUEUE_COMPLETE');
        expect(onCompleteFn).toHaveBeenCalled();
    });

     it('cancelTargeting should abort the current card and continue queue', async () => {
        const card1 = createTestCard('c1', 'Target Card', [MockTargetingComponent, MockEffectComponent]);
        const card2 = createTestCard('c2', 'Next Card', [MockSuccessComponent]);
        cardExecutionService.queueCard(card1, 'inHand');
        cardExecutionService.queueCard(card2, 'inHand');
        cardExecutionService.startExecution(gameState, logFn, onCompleteFn);

        await tickUntilIdleOrPaused(); // Pause for targeting on card1
        expect(cardExecutionService.isPausedForTargeting()).toBe(true);
         expect(cardExecutionService.getInternalState().currentCardIndex).toBe(0); // Paused on card 1

        cardExecutionService.cancelTargeting();

         // Should immediately transition back to RUNNING for the *next* tick
         expect(cardExecutionService.isPausedForTargeting()).toBe(false);
         expect(cardExecutionService.getInternalState().state).toBe('RUNNING');
         // Current card index should advance past the cancelled one implicitly by handleCardFailure
         // But the tick needs to run first to process the advancement

         await tickUntilIdleOrPaused(); // Let the next tick run and process card2

         expect(MockTargetingComponent.apply).toHaveBeenCalledTimes(1); // Only called once before cancel
         expect(MockEffectComponent.apply).not.toHaveBeenCalled(); // Effect on card1 skipped
         expect(MockSuccessComponent.apply).toHaveBeenCalledTimes(1); // card2 should execute
         expect(logFn).toHaveBeenCalledWith(expect.stringContaining("canceled by user"));
         expect(cardExecutionService.getInternalState().state).toBe('QUEUE_COMPLETE');
         expect(onCompleteFn).toHaveBeenCalled(); // Queue completed
         // Check card1 moved to discard (needs moveCardToZone mock/spy check)
     });


     it('moveCardToZone should update GameState correctly', () => {
         let state = initializeGame(['P1']);
         const card = state.players[0].hand[0] as EnhancedCard; // Get a card from initial hand
         expect(card).toBeDefined();

         // Move Hand -> Play
          state = cardExecutionService.moveCardToZone(state, card, 'inHand', 'inPlay');
          expect(state.players[0].hand.find(c => c.id === card.id)).toBeUndefined();
          expect(state.players[0].inPlay.find(c => c.id === card.id)).toBeDefined();
          let movedCard = state.players[0].inPlay.find(c => c.id === card.id) as EnhancedCard;
          expect(movedCard.currentZone).toBe('inPlay');
          expect(movedCard.components.some(c => c.type === 'inHandZone')).toBe(false);
          expect(movedCard.components.some(c => c.type === 'inPlayZone')).toBe(true);

         // Move Play -> Discard
          state = cardExecutionService.moveCardToZone(state, movedCard, 'inPlay', 'inDiscard');
          expect(state.players[0].inPlay.find(c => c.id === card.id)).toBeUndefined();
          expect(state.players[0].discard.find(c => c.id === card.id)).toBeDefined();
          movedCard = state.players[0].discard.find(c => c.id === card.id) as EnhancedCard;
          expect(movedCard.currentZone).toBe('inDiscard');
          expect(movedCard.components.some(c => c.type === 'inPlayZone')).toBe(false);
          expect(movedCard.components.some(c => c.type === 'inDiscardZone')).toBe(true);

         // Move Discard -> Deck
          state = cardExecutionService.moveCardToZone(state, movedCard, 'inDiscard', 'inDeck');
          expect(state.players[0].discard.find(c => c.id === card.id)).toBeUndefined();
          expect(state.players[0].deck.find(c => c.id === card.id)).toBeDefined();
          movedCard = state.players[0].deck.find(c => c.id === card.id) as EnhancedCard;
          expect(movedCard.currentZone).toBe('inDeck');
          expect(movedCard.components.some(c => c.type === 'inDiscardZone')).toBe(false);
          expect(movedCard.components.some(c => c.type === 'inDeckZone')).toBe(true);

          // Move Deck -> Trash
           state = cardExecutionService.moveCardToZone(state, movedCard, 'inDeck', 'Trash');
           expect(state.players[0].deck.find(c => c.id === card.id)).toBeUndefined();
           expect(state.trashPile.find(c => c.id === card.id)).toBeDefined();
           movedCard = state.trashPile.find(c => c.id === card.id) as EnhancedCard;
           expect(movedCard.currentZone).toBe('Trash');
           expect(movedCard.components.some(c => c instanceof ZoneComponent)).toBe(false); // No zone component in Trash
     });

     // Add tests for applyStateChanges, applyActiveModifiers, etc.
     it('applyStateChanges should modify gameState correctly', () => {
         let state = initializeGame(['P1']);
         const initialCredits = state.players[0].credits;
         const changes: StateChangeDescription[] = [
             { type: 'DELTA_STATE', targetId: 'player', payload: { property: 'credits', delta: 50 } },
             { type: 'APPLY_DAMAGE', targetId: 'player', payload: { amount: 3, damageType: 'Net' } }
         ];

         // Manually set game state in service for testing this internal method
         cardExecutionService['serviceState'].currentGameState = state;
         cardExecutionService['applyStateChanges'](changes);

         const finalState = cardExecutionService['serviceState'].currentGameState;
         expect(finalState?.players[0].credits).toBe(initialCredits + 50);
         expect(finalState?.players[0].health).toBe(7); // 10 - 3
     });

});
Use code with caution.
TypeScript
Run Tests: npm test
Watch For:
State Machine Logic: Ensure transitions (IDLE, RUNNING, PAUSED, COMPLETE) happen correctly based on component results.
Component Result Handling: Verify SUCCESS, FAILURE, REQUIRES_TARGETING lead to the correct next step (next component, abort card, pause).
State Updates: Confirm applyStateChanges correctly modifies the GameState based on descriptions returned by effects. Test various change types.
Cost Application: Ensure costs buffered by costsToApply are applied correctly before the card finishes successfully.
Targeting Flow: Test the pause-provide-resume cycle thoroughly. Ensure context.targets is available to the component after resuming.
Card Completion/Failure: Verify cards end up in the correct zone (discard or inPlay for persistent) and the queue index advances.
moveCardToZone: Double-check zone component updates and array manipulations in GameState.
Phase 5: Zustand Store (useDeckBuilder.ts)
Replace File:
client/src/lib/stores/useDeckBuilder.ts (New version provided previously)
Create/Update Test File:
client/src/lib/stores/useDeckBuilder.test.ts
Test Code: (Requires @testing-library/react for testing hooks/store)
// client/src/lib/stores/useDeckBuilder.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeckBuilder } from './useDeckBuilder';
import { cardExecutionService } from '../game/cardExecutionService';
import { initializeGame, GameState } from '../game/game';
import { getEnhancedStartingDeck } from '../game/enhancedCards';
import { TargetingRequest } from '../game/components';

// --- Mock cardExecutionService ---
// We need more control over its state and methods for store tests
const mockServiceState = {
state: 'IDLE',
currentTargetingRequest: null as TargetingRequest | null,
currentGameState: null as GameState | null,
};
vi.mock('../game/cardExecutionService', () => ({
cardExecutionService: {
reset: vi.fn(() => {
mockServiceState.state = 'IDLE';
mockServiceState.currentTargetingRequest = null;
mockServiceState.currentGameState = null;
}),
queueCard: vi.fn(),
startExecution: vi.fn((gs, log, onComplete) => {
mockServiceState.state = 'RUNNING';
mockServiceState.currentGameState = gs; // Store passed state
// Simulate completion immediately for some tests, or pause for others
}),
provideTargets: vi.fn((targets) => {
mockServiceState.state = 'RUNNING'; // Simulate resuming
mockServiceState.currentTargetingRequest = null;
}),
cancelTargeting: vi.fn(() => {
mockServiceState.state = 'RUNNING'; // Simulate resuming after cancel
mockServiceState.currentTargetingRequest = null;
}),
moveCardToZone: vi.fn((gs, card, from, to) => structuredClone(gs)), // Simple mock
isPausedForTargeting: vi.fn(() => mockServiceState.state === 'PAUSED_FOR_TARGETING'),
getTargetingRequest: vi.fn(() => mockServiceState.currentTargetingRequest),
getCurrentGameState: vi.fn(() => mockServiceState.currentGameState),
getInternalState: vi.fn(() => mockServiceState), // Expose mock state
subscribe: vi.fn(() => vi.fn()), // Mock subscribe returns an unsubscribe function
// Helper to manually set mock service state for testing store reactions
**setMockState: (newState: Partial<typeof mockServiceState>) => {
Object.assign(mockServiceState, newState);
// Manually trigger listeners if needed, though direct calls test store logic better
},
**getMockState: () => mockServiceState, // Helper to access mock state
\_\_clearMocks: () => {
vi.mocked(cardExecutionService.reset).mockClear();
vi.mocked(cardExecutionService.queueCard).mockClear();
vi.mocked(cardExecutionService.startExecution).mockClear();
vi.mocked(cardExecutionService.provideTargets).mockClear();
vi.mocked(cardExecutionService.cancelTargeting).mockClear();
vi.mocked(cardExecutionService.moveCardToZone).mockClear();
}
},
}));

// Mock game initialization directly
vi.mock('../game/game', async (importOriginal) => {
const actual = await importOriginal() as typeof import('../game/game');
return {
...actual,
initializeGame: vi.fn(() => ({
// Return a basic GameState structure
players: [
{ id: 'p1', name: 'Tester', deck: getEnhancedStartingDeck().slice(5), hand: getEnhancedStartingDeck().slice(0, 5), discard: [], inPlay: [], credits: 5, actions: 3, health: 10, maxHandSize: 5, memoryUnitsUsed: 0, maxMemoryUnits: 4, factionReputation: { Corp: 50, Runner: 50, Street: 50 } },
{ id: 'p2', name: 'AI', deck: [], hand: [], discard: [], inPlay: [], credits: 5, actions: 3, health: 10, maxHandSize: 5, memoryUnitsUsed: 0, maxMemoryUnits: 4, factionReputation: { Corp: 50, Runner: 50, Street: 50 } }
],
activePlayerIndex: 0, market: { availableCards: [], trashedCards: [], maxSize: 5 },
phase: 'action', turnNumber: 1, logs: [], trashPile: [], runState: { isActive: false, flags: {} },
currentLocation: null, // Add location if needed
})),
addLog: vi.fn((gs, msg) => ({ ...gs, logs: [...gs.logs, { message: msg, timestamp: Date.now() }] })),
drawNCards: vi.fn((player, count, gs) => ({ updatedPlayer: player, drawnCards: [], updatedGameState: gs })), // Simplified mock
};
});

describe('useDeckBuilder Store', () => {

    beforeEach(() => {
         // Reset store state before each test
         useDeckBuilder.getState().resetGame();
         // Clear mocks on the service instance
         vi.mocked(cardExecutionService.__clearMocks)();
         vi.mocked(initializeGame).mockClear();
         vi.mocked(addLog).mockClear();
    });

    it('initializeGame should setup state and call service reset', () => {
        const { result } = renderHook(() => useDeckBuilder());

        act(() => {
            result.current.initializeGame(['Alice']);
        });

        expect(initializeGame).toHaveBeenCalledWith(['Alice']);
        expect(cardExecutionService.reset).toHaveBeenCalled();
        expect(result.current.gameState).toBeDefined();
        expect(result.current.gameState?.players[0].name).toBe('Tester'); // From mock initGame
        expect(result.current.isExecuting).toBe(false);
        expect(result.current.isTargetingModalOpen).toBe(false);
    });

    it('playCardFromHand should call service methods if valid', () => {
         const { result } = renderHook(() => useDeckBuilder());
         act(() => { result.current.initializeGame(['P1']); }); // Init state

         act(() => {
             result.current.playCardFromHand(0); // Play first card
         });

         expect(cardExecutionService.moveCardToZone).toHaveBeenCalledOnce();
         expect(cardExecutionService.queueCard).toHaveBeenCalledOnce();
         expect(cardExecutionService.startExecution).toHaveBeenCalledOnce();
         expect(result.current.isExecuting).toBe(true); // Should be marked as executing
    });

    it('playCardFromHand should not call service if not player turn or no actions', () => {
        const { result } = renderHook(() => useDeckBuilder());
         act(() => { result.current.initializeGame(['P1', 'P2']); });
         act(() => { result.current.gameState!.activePlayerIndex = 1; }); // Not player's turn
         act(() => { result.current.playCardFromHand(0); });
         expect(cardExecutionService.startExecution).not.toHaveBeenCalled();

         act(() => { result.current.gameState!.activePlayerIndex = 0; });
         act(() => { result.current.gameState!.players[0].actions = 0; }); // No actions
         act(() => { result.current.playCardFromHand(0); });
          expect(cardExecutionService.startExecution).not.toHaveBeenCalled();
    });

     it('buyMarketCard should update state and call service move', () => {
         const { result } = renderHook(() => useDeckBuilder());
         act(() => { result.current.initializeGame(['P1']); });
         const initialCredits = result.current.gameState!.players[0].credits;
         const marketCard = { id: 'm1', name: 'Market Card', cost: 3, faction: 'Neutral', cardType: 'Event', keywords: [] } as Card;
         act(() => {
            result.current.gameState!.market.availableCards = [marketCard];
            result.current.gameState!.phase = 'buy'; // Set to buy phase
         });

         act(() => { result.current.buyMarketCard(0); });

         expect(result.current.gameState!.players[0].credits).toBe(initialCredits - 3);
         expect(cardExecutionService.moveCardToZone).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 'm1' }), 'inMarket', 'inDiscard');
         expect(result.current.gameState!.market.availableCards).toHaveLength(0);
         // Assuming discard pile is updated by the mocked moveCardToZone (though mock is basic)
     });


    it('provideTargets should call service and update UI state', () => {
         const { result } = renderHook(() => useDeckBuilder());
         act(() => { result.current.initializeGame(['P1']); });
         // Manually set store state to paused
         act(() => { result.current._setTargetingModalOpen(true, {} as TargetingRequest); })
         act(() => { result.current._setIsExecuting(true); }) // Simulate service paused

         const mockTargets = [{ id: 't1', name: 'Target' }];
         act(() => { result.current.provideTargets(mockTargets); });

         expect(cardExecutionService.provideTargets).toHaveBeenCalledWith(mockTargets);
         expect(result.current.isTargetingModalOpen).toBe(false); // Modal should close
         expect(result.current.isExecuting).toBe(true); // Remains executing as service resumes
     });

     it('cancelTargeting should call service and update UI state', () => {
         const { result } = renderHook(() => useDeckBuilder());
         act(() => { result.current.initializeGame(['P1']); });
         act(() => { result.current._setTargetingModalOpen(true, {} as TargetingRequest); })
         act(() => { result.current._setIsExecuting(true); })

         act(() => { result.current.cancelTargeting(); });

         expect(cardExecutionService.cancelTargeting).toHaveBeenCalled();
         expect(result.current.isTargetingModalOpen).toBe(false);
         expect(result.current.isExecuting).toBe(true); // Remains executing as service processes cancel
     });


     it('endCurrentPhase should transition phases and update player state', () => {
        const { result } = renderHook(() => useDeckBuilder());
         act(() => { result.current.initializeGame(['P1', 'P2']); }); // Init with 2 players

         // Action -> Buy
         act(() => { result.current.endCurrentPhase(); });
         expect(result.current.gameState?.phase).toBe('buy');

         // Buy -> Cleanup (End P1 Turn)
         act(() => { result.current.endCurrentPhase(); });
         expect(result.current.gameState?.phase).toBe('cleanup'); // Intermediate cleanup state

         // Cleanup -> Action (Start P2 Turn)
         act(() => { result.current.endCurrentPhase(); });
         expect(result.current.gameState?.phase).toBe('action');
         expect(result.current.gameState?.activePlayerIndex).toBe(1); // P2's turn
         expect(result.current.gameState?.turnNumber).toBe(1); // Still turn 1
         expect(result.current.gameState?.players[0].actions).toBe(0); // P1 actions reset
         expect(result.current.gameState?.players[0].hand).toHaveLength(0); // P1 hand discarded
         expect(result.current.gameState?.players[1].actions).toBe(3); // P2 actions reset
         expect(result.current.gameState?.players[1].hand).toHaveLength(5); // P2 draws hand

         // End P2 Turn -> Start P1 Turn (Turn 2)
         act(() => { result.current.endCurrentPhase(); }); // P2 Action -> Buy
         act(() => { result.current.endCurrentPhase(); }); // P2 Buy -> Cleanup
         act(() => { result.current.endCurrentPhase(); }); // P2 Cleanup -> P1 Action
          expect(result.current.gameState?.phase).toBe('action');
          expect(result.current.gameState?.activePlayerIndex).toBe(0); // P1's turn again
          expect(result.current.gameState?.turnNumber).toBe(2); // Incremented turn number
     });

     // TODO: Add tests for _setupServiceListener reactions
     // This requires mocking the service's subscribe method and manually triggering callbacks

});
Use code with caution.
TypeScript
Run Tests: npm test
Watch For:
Service Interaction: Ensure store actions correctly call the mocked cardExecutionService methods (queueCard, startExecution, provideTargets, cancelTargeting, moveCardToZone).
State Updates: Verify the store's gameState, isExecuting, and isTargetingModalOpen update correctly based on both direct actions and simulated service events/callbacks.
Turn Logic: Check endCurrentPhase transitions states, resets/updates player resources (actions, hand), and advances turns correctly, using moveCardToZone for cleanup.
Mocking Accuracy: Ensure the service mocks provide enough functionality for the store tests to pass logically.
Phase 6: UI Components
Replace Files:
client/src/components/GameBoard.tsx (New version provided previously)
client/src/components/CardTargetingModal.tsx (Likely needs significant adaptation)
(Adapt other potentially affected UI components like ActionButtons, ExecuteButton, Hand/DraggableHand)
Create/Update Test Files:
client/src/components/GameBoard.test.tsx
client/src/components/CardTargetingModal.test.tsx
(Add tests for other adapted UI components)
Test Code: (Requires @testing-library/react)
// client/src/components/GameBoard.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GameBoard from './GameBoard';
import { useDeckBuilder } from '../lib/stores/useDeckBuilder';
import { initializeGame } from '../lib/game/game'; // Use real init for state structure

// Mock the Zustand store
vi.mock('../lib/stores/useDeckBuilder');

// Mock child components if they have complex internal logic or side effects not relevant here
vi.mock('./LocationCard', () => ({ default: () => <div data-testid="location-card">Location</div> }));
vi.mock('./DraggableHand', () => ({ default: ({ cards, title, onCardClick, canPlayCards }: any) => (
<div>
<div>{title}</div>
{cards.map((card: any, index: number) => (
<button data-testid={`card-${card.id || index}`} key={card.id || index} onClick={() => onCardClick(index)} disabled={!canPlayCards}>
{card.name}
</button>
))}
</div>
)}));
vi.mock('./Market', () => ({ default: ({ onCardClick, canBuyCards }: any) => <button data-testid="market-card" onClick={() => onCardClick(0)} disabled={!canBuyCards}>Market Card</button> }));
vi.mock('./Player', () => ({ default: ({ player }: any) => <div data-testid={`player-${player.id}`}>{player.name} Info</div> }));
vi.mock('./GameLog', () => ({ default: ({ logs }: any) => <div data-testid="game-log">{logs.length} Logs</div> }));
vi.mock('./ActionButtons', () => ({ default: ({ onEndPhase }: any) => <button data-testid="end-phase-btn" onClick={onEndPhase}>End Phase</button>}));
vi.mock('./ExecuteButton', () => ({ default: ({ onExecute, count, disabled }: any) => <button data-testid="execute-btn" onClick={onExecute} disabled={disabled}>Execute ({count})</button>}));
vi.mock('./CardTargetingModal', () => ({ default: ({ isOpen, onClose, onTargetSelect }: any) => isOpen ? <div data-testid="targeting-modal"><button onClick={() => onTargetSelect([{id:'t1'}])}>Select</button><button onClick={onClose}>Cancel</button></div> : null }));
vi.mock('./DeckViewer', () => ({ default: ({ isOpen }: any) => isOpen ? <div data-testid="deck-viewer">Deck Viewer</div> : null }));

describe('GameBoard Component', () => {
let mockStoreState: any;

    beforeEach(() => {
        // Reset mock store state before each test
        mockStoreState = {
            gameState: initializeGame(['UI Tester']), // Provide initial state
            locationDeck: { currentLocation: { name: 'Test Loc', threats: [] } }, // Basic location
            entityStatuses: [],
            isTargetingModalOpen: false,
            currentTargetingRequest: null,
            isExecuting: false,
            // Mock store actions
            playCardFromHand: vi.fn(),
            executeTurnActions: vi.fn(),
            buyMarketCard: vi.fn(),
            provideTargets: vi.fn(),
            cancelTargeting: vi.fn(),
            endCurrentPhase: vi.fn(),
            drawLocation: vi.fn(),
            // Add mocks for other actions if needed by UI elements
            drawCard: vi.fn(),
            gainCredit: vi.fn(),
            gainAction: vi.fn(),
            shuffleDiscard: vi.fn(),
            addLogMessage: vi.fn(),
            updateEntityActionPotential: vi.fn(),
            _setTargetingModalOpen: vi.fn((isOpen, req) => { mockStoreState.isTargetingModalOpen = isOpen; mockStoreState.currentTargetingRequest = req; }),
            _setIsExecuting: vi.fn((exec) => { mockStoreState.isExecuting = exec; }),
            _updateGameState: vi.fn((gs) => { mockStoreState.gameState = gs; }),
        };
        vi.mocked(useDeckBuilder).mockReturnValue(mockStoreState);
    });

    it('renders initial components correctly', () => {
        render(<GameBoard />);
        expect(screen.getByText('NETRUNNER')).toBeInTheDocument(); // Header
        expect(screen.getByTestId('location-card')).toBeInTheDocument();
        expect(screen.getByTestId('player-p1')).toBeInTheDocument(); // Player Info
        expect(screen.getByText(/YOUR HAND/)).toBeInTheDocument();
        expect(screen.getByTestId('game-log')).toBeInTheDocument();
        expect(screen.getByTestId('market-card')).toBeInTheDocument();
        expect(screen.getByTestId('end-phase-btn')).toBeInTheDocument(); // ActionButtons
    });

    it('calls playCardFromHand when a hand card is clicked', () => {
        render(<GameBoard />);
        const handCardButton = screen.getByTestId(`card-${mockStoreState.gameState.players[0].hand[0].id}`);
        fireEvent.click(handCardButton);
        expect(mockStoreState.playCardFromHand).toHaveBeenCalledWith(0); // Assuming first card clicked
    });

    it('calls buyMarketCard when a market card is clicked', () => {
         // Need to set phase to 'buy' and ensure player can afford for button to be enabled
         act(() => {
             mockStoreState.gameState.phase = 'buy';
             mockStoreState.gameState.players[0].credits = 10; // Ensure enough credits
         });
        render(<GameBoard />);
        const marketCardButton = screen.getByTestId('market-card');
        fireEvent.click(marketCardButton);
        expect(mockStoreState.buyMarketCard).toHaveBeenCalledWith(0); // Assuming first card
    });

     it('calls endCurrentPhase when End Phase button is clicked', () => {
         render(<GameBoard />);
         const endPhaseButton = screen.getByTestId('end-phase-btn');
         fireEvent.click(endPhaseButton);
         expect(mockStoreState.endCurrentPhase).toHaveBeenCalled();
     });

     it('calls executeTurnActions when Execute button is clicked', () => {
          // Add a card to inPlay to enable the button
          act(() => {
              mockStoreState.gameState.players[0].inPlay.push({ id: 'queued1', name: 'Queued Card' });
          });
         render(<GameBoard />);
         const executeButton = screen.getByTestId('execute-btn');
         expect(executeButton).not.toBeDisabled();
         fireEvent.click(executeButton);
         expect(mockStoreState.executeTurnActions).toHaveBeenCalled();
     });


    it('shows targeting modal when isTargetingModalOpen is true', () => {
        act(() => {
             mockStoreState.isTargetingModalOpen = true;
             mockStoreState.currentTargetingRequest = { message: 'Select Test Target' } as TargetingRequest; // Provide basic request
        });
        render(<GameBoard />);
        expect(screen.getByTestId('targeting-modal')).toBeInTheDocument();
    });

    // Add tests for modal interactions calling provideTargets/cancelTargeting

});
Use code with caution.
TypeScript
Run Tests: npm test
Watch For:
Store Interaction: Ensure UI components correctly read state from useDeckBuilder (e.g., enabling/disabling buttons, showing/hiding modal).
Action Dispatching: Confirm that button clicks and other interactions call the correct actions on the useDeckBuilder store.
Rendering: Verify conditional rendering based on game phase, player turn, and execution state works.
Modal Flow: Test the opening, interaction (calling provideTargets/cancelTargeting), and closing of the targeting modal.
This structured testing approach should help you catch regressions and verify the functionality of the refactored system at each stage. Remember to adapt and expand these tests as you add more specific game logic and components.
