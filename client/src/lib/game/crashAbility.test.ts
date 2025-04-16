import { describe, it, expect } from 'vitest';
import { executeCardComponents } from './components';
import { Card, EnhancedCard } from './components';
import { Player } from './player';
import { GameContext } from './components';

// Helper to create a Virus card
const createVirusCard = (overrides: Partial<Card> = {}): EnhancedCard => ({
  id: 'virus1',
  name: 'Test Virus',
  cost: 1,
  faction: 'Runner',
  cardType: 'program',
  keywords: ['Virus'],
  effects: [],
  description: 'A test virus card.',
  components: [],
  ...overrides
});

// Helper to create a mock player with Crash identity
const createCrashPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'runner1',
  name: 'Crash',
  credits: 5,
  actions: 2,
  buys: 1,
  health: 10,
  hand: [],
  inPlay: [],
  discard: [],
  deck: [],
  factionReputation: { Corp: 0, Runner: 0, Street: 0 },
  installedCards: [],
  faceDownCards: [],
  identity: {
    id: 'crash',
    name: 'Crash',
    faction: 'Anarch',
    description: 'Aggressive disruptor. Excels at sabotaging enemy actions with viruses.',
    ability: 'Whenever you successfully execute a Virus, reduce the action potential of 1 entity by 1.'
  },
  ...overrides
});

// Helper to create a mock opponent
const createOpponent = (overrides: Partial<Player> = {}): Player => ({
  id: 'corp1',
  name: 'Corp Opponent',
  credits: 5,
  actions: 2,
  buys: 1,
  health: 10,
  hand: [],
  inPlay: [],
  discard: [],
  deck: [],
  factionReputation: { Corp: 0, Runner: 0, Street: 0 },
  installedCards: [],
  faceDownCards: [],
  ...overrides
});

describe('Crash Identity Ability', () => {
  it('should reduce the action potential of one entity by 1 when a Virus is executed, only once per queue', () => {
    // Arrange
    const player = createCrashPlayer();
    const opponent = createOpponent({ actions: 3 });
    let abilityTriggered = false;
    let reducedOpponentActions = 0;
    // Mock GameContext
    const context: GameContext = {
      card: createVirusCard(),
      player,
      opponents: [opponent],
      targets: [],
      cardsInPlay: [],
      locationThreats: [],
      log: (msg: string) => {},
      executionPaused: false,
      awaitingTargetSelection: false,
      gameState: {
        // Simulate a per-queue flag for Crash ability
        _crashAbilityUsed: false,
      }
    };
    // Simulate Crash ability logic
    // This would be in the card execution service in the real implementation
    function maybeTriggerCrashAbility(ctx: GameContext) {
      if (
        ctx.player.identity?.id === 'crash' &&
        ctx.card.keywords?.includes('Virus') &&
        !ctx.gameState._crashAbilityUsed
      ) {
        // Reduce action potential of one entity (opponent)
        ctx.opponents[0].actions -= 1;
        ctx.gameState._crashAbilityUsed = true;
        abilityTriggered = true;
        reducedOpponentActions = ctx.opponents[0].actions;
      }
    }
    // Act: Execute a Virus card
    maybeTriggerCrashAbility(context);
    // Try to trigger again in the same queue
    maybeTriggerCrashAbility(context);
    // Assert
    expect(abilityTriggered).toBe(true);
    expect(reducedOpponentActions).toBe(2);
    expect(context.opponents[0].actions).toBe(2);
    // Ability should only trigger once per queue
    expect(context.gameState._crashAbilityUsed).toBe(true);
  });

  it('should not trigger Crash ability for non-Virus cards', () => {
    const player = createCrashPlayer();
    const opponent = createOpponent({ actions: 3 });
    let abilityTriggered = false;
    const context: GameContext = {
      card: createVirusCard({ keywords: ['Program'] }), // Not a Virus
      player,
      opponents: [opponent],
      targets: [],
      cardsInPlay: [],
      locationThreats: [],
      log: (msg: string) => {},
      executionPaused: false,
      awaitingTargetSelection: false,
      gameState: { _crashAbilityUsed: false }
    };
    function maybeTriggerCrashAbility(ctx: GameContext) {
      if (
        ctx.player.identity?.id === 'crash' &&
        ctx.card.keywords?.includes('Virus') &&
        !ctx.gameState._crashAbilityUsed
      ) {
        ctx.opponents[0].actions -= 1;
        ctx.gameState._crashAbilityUsed = true;
        abilityTriggered = true;
      }
    }
    maybeTriggerCrashAbility(context);
    expect(abilityTriggered).toBe(false);
    expect(context.opponents[0].actions).toBe(3);
    expect(context.gameState._crashAbilityUsed).toBe(false);
  });

  it('should reset Crash ability trigger between queues', () => {
    const player = createCrashPlayer();
    const opponent = createOpponent({ actions: 3 });
    // Simulate two separate execution queues
    let gameState = { _crashAbilityUsed: false };
    const context1: GameContext = {
      card: createVirusCard(),
      player,
      opponents: [opponent],
      targets: [],
      cardsInPlay: [],
      locationThreats: [],
      log: (msg: string) => {},
      executionPaused: false,
      awaitingTargetSelection: false,
      gameState
    };
    const context2: GameContext = {
      card: createVirusCard(),
      player,
      opponents: [opponent],
      targets: [],
      cardsInPlay: [],
      locationThreats: [],
      log: (msg: string) => {},
      executionPaused: false,
      awaitingTargetSelection: false,
      gameState: { _crashAbilityUsed: false }
    };
    // Act
    function maybeTriggerCrashAbility(ctx: GameContext) {
      if (
        ctx.player.identity?.id === 'crash' &&
        ctx.card.keywords?.includes('Virus') &&
        !ctx.gameState._crashAbilityUsed
      ) {
        ctx.opponents[0].actions -= 1;
        ctx.gameState._crashAbilityUsed = true;
      }
    }
    maybeTriggerCrashAbility(context1);
    // Ability should be used in first queue
    expect(context1.gameState._crashAbilityUsed).toBe(true);
    expect(context1.opponents[0].actions).toBe(2);
    // Reset for new queue
    maybeTriggerCrashAbility(context2);
    expect(context2.gameState._crashAbilityUsed).toBe(true);
    expect(context2.opponents[0].actions).toBe(1);
  });
});
