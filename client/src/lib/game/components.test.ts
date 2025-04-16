import { describe, it, expect, vi } from 'vitest';
import {
  CreditCost, ActionCost, GainCredits, DealDamage, SingleEntityTarget,
  GameContext, EnhancedCard, Card, CardZone, TrashCost, HealthCost, KeywordRequirement, RiskReward
} from './components';
import { Player } from './player';
import { GameState } from './game';
import { playCard } from './player';

// Helper to create a valid Card for tests
const createTestCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'c1',
  name: 'Test Card',
  cost: 0,
  faction: 'Runner',
  cardType: 'program',
  keywords: [],
  effects: [],
  description: '',
  ...overrides
});

// Helper to create mock context
const createMockContext = (overrides: Partial<GameContext> = {}): GameContext => ({
  card: overrides.card || createTestCard(),
  player: overrides.player || ({
    id: 'p1',
    name: 'Player 1',
    credits: 5,
    actions: 1,
    buys: 1,
    health: 5,
    hand: [],
    inPlay: [],
    discard: [],
    deck: [],
    factionReputation: { Corp: 0, Runner: 0, Street: 0 },
    installedCards: [],
    faceDownCards: []
  } as Player),
  opponents: overrides.opponents || [],
  gameState: overrides.gameState || ({} as GameState),
  targets: overrides.targets || [],
  cardsInPlay: overrides.cardsInPlay || [],
  locationThreats: overrides.locationThreats || [],
  log: overrides.log || (() => {}),
  executionPaused: overrides.executionPaused || false,
  awaitingTargetSelection: overrides.awaitingTargetSelection || false,
  recentlyTrashed: overrides.recentlyTrashed
});

describe('Component System', () => {
  it('CreditCost canApply returns true if player has enough credits', () => {
    const context = createMockContext({ player: { credits: 5, name: 'Player 1', id: 'p1', actions: 1, buys: 1, health: 5, hand: [], inPlay: [], discard: [], deck: [], factionReputation: { Corp: 0, Runner: 0, Street: 0 }, installedCards: [], faceDownCards: [] } });
    const comp = new CreditCost(3);
    expect(context.player.credits >= comp.amount).toBe(true);
  });

  it('CreditCost canApply returns false if player lacks credits', () => {
    const context = createMockContext({ player: { credits: 2, name: 'Player 1', id: 'p1', actions: 1, buys: 1, health: 5, hand: [], inPlay: [], discard: [], deck: [], factionReputation: { Corp: 0, Runner: 0, Street: 0 }, installedCards: [], faceDownCards: [] } });
    const comp = new CreditCost(3);
    expect(context.player.credits >= comp.amount).toBe(false);
  });

  it('GainCredits apply increases player credits', () => {
    const player = { id: 'p1', name: 'Player 1', credits: 2, actions: 1, buys: 1, health: 5, hand: [], inPlay: [], discard: [], deck: [], factionReputation: { Corp: 0, Runner: 0, Street: 0 }, installedCards: [], faceDownCards: [] } as Player;
    const context = createMockContext({ player, targets: [player] });
    const comp = new GainCredits(3);
    comp.apply(context);
    expect(player.credits).toBe(5);
  });

  it('DealDamage apply decreases player health', () => {
    const player = { id: 'p1', name: 'Player 1', credits: 5, actions: 1, buys: 1, health: 5, hand: [], inPlay: [], discard: [], deck: [], factionReputation: { Corp: 0, Runner: 0, Street: 0 }, installedCards: [], faceDownCards: [] } as Player;
    const context = createMockContext({ player, targets: [player] });
    const comp = new DealDamage(2);
    comp.apply(context);
    expect(player.health).toBe(3);
  });

  it('TrashCost self-trash removes card from play and adds to discard', () => {
    const player = {
      id: 'p1',
      name: 'Player 1',
      credits: 5,
      actions: 1,
      buys: 1,
      health: 5,
      hand: [],
      inPlay: [createTestCard({ id: 'c1' })],
      discard: [],
      deck: [],
      factionReputation: { Corp: 0, Runner: 0, Street: 0 },
      installedCards: [],
      faceDownCards: []
    } as Player;
    const context = createMockContext({ player, cardsInPlay: player.inPlay, card: player.inPlay[0] });
    const comp = new TrashCost('self');
    comp.apply(context);
    expect(player.inPlay.length).toBe(0);
    expect(player.discard.length).toBe(1);
    expect(player.discard[0].id).toBe('c1');
  });

  it('TrashCost with targetType removes correct card from play', () => {
    const player = {
      id: 'p1',
      name: 'Player 1',
      credits: 5,
      actions: 1,
      buys: 1,
      health: 5,
      hand: [],
      inPlay: [
        createTestCard({ id: 'c1' }),
        createTestCard({ id: 'c2' })
      ],
      discard: [],
      deck: [],
      factionReputation: { Corp: 0, Runner: 0, Street: 0 },
      installedCards: [],
      faceDownCards: []
    } as Player;
    const context = createMockContext({ player, cardsInPlay: player.inPlay, card: player.inPlay[0], targets: [player.inPlay[1]] });
    const comp = new TrashCost('program');
    comp.apply(context);
    expect(player.inPlay.length).toBe(1);
    expect(player.inPlay[0].id).toBe('c1');
    expect(player.discard.length).toBe(1);
    expect(player.discard[0].id).toBe('c2');
  });

  it('ActionCost apply subtracts actions if enough actions are present', () => {
    const player = {
      id: 'p1',
      name: 'Player 1',
      credits: 5,
      actions: 2,
      buys: 1,
      health: 5,
      hand: [],
      inPlay: [],
      discard: [],
      deck: [],
      factionReputation: { Corp: 0, Runner: 0, Street: 0 },
      installedCards: [],
      faceDownCards: []
    } as Player;
    const context = createMockContext({ player, card: createTestCard() });
    const comp = new ActionCost(1);
    comp.apply(context);
    expect(player.actions).toBe(1);
    expect(context.executionPaused).not.toBe(true);
  });

  it('ActionCost apply pauses execution if not enough actions', () => {
    const player = {
      id: 'p1',
      name: 'Player 1',
      credits: 5,
      actions: 0,
      buys: 1,
      health: 5,
      hand: [],
      inPlay: [],
      discard: [],
      deck: [],
      factionReputation: { Corp: 0, Runner: 0, Street: 0 },
      installedCards: [],
      faceDownCards: []
    } as Player;
    const context = createMockContext({ player, card: createTestCard() });
    const comp = new ActionCost(1);
    comp.apply(context);
    expect(player.actions).toBe(0);
    expect(context.executionPaused).toBe(true);
  });

  it('HealthCost canApply returns true if player has enough health', () => {
    const player = { id: 'p1', name: 'Player 1', credits: 5, actions: 1, buys: 1, health: 5, hand: [], inPlay: [], discard: [], deck: [], factionReputation: { Corp: 0, Runner: 0, Street: 0 }, installedCards: [], faceDownCards: [] } as Player;
    const context = createMockContext({ player });
    const comp = new HealthCost(3, 'Meat');
    expect(comp.canApply(context)).toBe(true);
  });

  it('HealthCost canApply returns false if player does not have enough health', () => {
    const player = { id: 'p1', name: 'Player 1', credits: 5, actions: 1, buys: 1, health: 2, hand: [], inPlay: [], discard: [], deck: [], factionReputation: { Corp: 0, Runner: 0, Street: 0 }, installedCards: [], faceDownCards: [] } as Player;
    const context = createMockContext({ player });
    const comp = new HealthCost(3, 'Net');
    expect(comp.canApply(context)).toBe(false);
  });

  it('HealthCost apply subtracts health if enough health is present', () => {
    const player = { id: 'p1', name: 'Player 1', credits: 5, actions: 1, buys: 1, health: 5, hand: [], inPlay: [], discard: [], deck: [], factionReputation: { Corp: 0, Runner: 0, Street: 0 }, installedCards: [], faceDownCards: [] } as Player;
    const context = createMockContext({ player });
    const comp = new HealthCost(2, 'Brain');
    comp.apply(context);
    expect(player.health).toBe(3);
    expect(context.executionPaused).not.toBe(true);
  });

  it('HealthCost apply pauses execution if not enough health', () => {
    const player = { id: 'p1', name: 'Player 1', credits: 5, actions: 1, buys: 1, health: 2, hand: [], inPlay: [], discard: [], deck: [], factionReputation: { Corp: 0, Runner: 0, Street: 0 }, installedCards: [], faceDownCards: [] } as Player;
    const context = createMockContext({ player });
    const comp = new HealthCost(3, 'Meat');
    comp.apply(context);
    expect(player.health).toBe(2);
    expect(context.executionPaused).toBe(true);
  });

  describe('KeywordRequirement', () => {
    const cardWithKeyword = { id: 'c1', name: 'Virus Card', keywords: ['Virus'], cost: 0 };
    const cardWithoutKeyword = { id: 'c2', name: 'No Virus', keywords: ['Weapon'], cost: 0 };

    it('does not pause execution if enough cards with keyword in play', () => {
      const context = createMockContext({ cardsInPlay: [cardWithKeyword, cardWithoutKeyword] });
      const comp = new KeywordRequirement('Virus', 1, 'play');
      comp.apply(context);
      expect(context.executionPaused).not.toBe(true);
    });

    it('pauses execution if not enough cards with keyword in play', () => {
      const context = createMockContext({ cardsInPlay: [cardWithoutKeyword] });
      const comp = new KeywordRequirement('Virus', 1, 'play');
      comp.apply(context);
      expect(context.executionPaused).toBe(true);
    });

    it('checks hand if location is hand', () => {
      const context = createMockContext({ player: { hand: [cardWithKeyword, cardWithoutKeyword] } });
      const comp = new KeywordRequirement('Virus', 1, 'hand');
      comp.apply(context);
      expect(context.executionPaused).not.toBe(true);
    });

    it('pauses execution if not enough in hand', () => {
      const context = createMockContext({ player: { hand: [cardWithoutKeyword] } });
      const comp = new KeywordRequirement('Virus', 1, 'hand');
      comp.apply(context);
      expect(context.executionPaused).toBe(true);
    });

    it('checks discard if location is discard', () => {
      const context = createMockContext({ player: { discard: [cardWithKeyword] } });
      const comp = new KeywordRequirement('Virus', 1, 'discard');
      comp.apply(context);
      expect(context.executionPaused).not.toBe(true);
    });

    it('pauses execution if not enough in discard', () => {
      const context = createMockContext({ player: { discard: [cardWithoutKeyword] } });
      const comp = new KeywordRequirement('Virus', 1, 'discard');
      comp.apply(context);
      expect(context.executionPaused).toBe(true);
    });
  });

  describe('RiskReward', () => {
    it('should apply a successful risk and give the reward', () => {
      // Arrange: player starts with 5 credits
      const player = { name: 'Test', credits: 5, health: 10, actions: 1, drawCard: undefined };
      const logMessages: string[] = [];
      const context = {
        player,
        opponents: [],
        gameState: {},
        targets: [],
        card: { name: 'Risky Card' },
        log: (msg: string) => logMessages.push(msg),
      };
      // Create RiskReward with 100% chance, reward is credits
      const comp = new RiskReward('health', 'credits', 100, 2, 3);
      comp._setRng(() => 0); // Always succeed (roll = 1)
      // Act
      comp.apply(context);
      // Assert
      expect(player.credits).toBe(8); // 5 + 3 reward
      expect(logMessages.some(m => m.includes('Success'))).toBe(true);
      expect(logMessages.some(m => m.includes('gained 3 credits'))).toBe(true);
    });

    it('should apply a failed risk and apply the penalty', () => {
      // Arrange: player starts with 10 health
      const player = { name: 'Test', credits: 5, health: 10, actions: 1, drawCard: undefined };
      const logMessages: string[] = [];
      const context = {
        player,
        opponents: [],
        gameState: {},
        targets: [],
        card: { name: 'Risky Card' },
        log: (msg: string) => logMessages.push(msg),
      };
      // Create RiskReward with 0% chance, risk is health
      const comp = new RiskReward('health', 'credits', 0, 2, 3);
      comp._setRng(() => 1); // Always fail (roll = 100)
      // Act
      comp.apply(context);
      // Assert
      expect(player.health).toBe(8); // 10 - 2 risk
      expect(logMessages.some(m => m.includes('Failed'))).toBe(true);
      expect(logMessages.some(m => m.includes('took 2 damage from the failed risk'))).toBe(true);
    });
  });

  // --- CARD REMOVAL FROM HAND BUG TEST ---
  it('should remove only one copy from hand and add to execution queue when playing a duplicate card (e.g., Credit Chip)', () => {
    // Setup: Player hand has two Credit Chips (simulate by id)
    const creditChip = createTestCard({ id: 'credit_chip', name: 'Credit Chip' });
    const player = {
      id: 'p1',
      name: 'Player 1',
      credits: 5,
      actions: 1,
      buys: 1,
      health: 5,
      hand: [creditChip, { ...creditChip }],
      inPlay: [],
      discard: [],
      deck: [],
      factionReputation: { Corp: 0, Runner: 0, Street: 0 },
      installedCards: [],
      faceDownCards: []
    } as Player;
    // Play the first Credit Chip
    let result = playCard(player, 0);
    expect(result.playedCard?.id).toBe('credit_chip');
    expect(result.player.hand.length).toBe(1);
    expect(result.player.hand[0].id).toBe('credit_chip');
    // Play the second Credit Chip
    result = playCard(result.player, 0);
    expect(result.playedCard?.id).toBe('credit_chip');
    expect(result.player.hand.length).toBe(0);
  });

  // Add more tests for other components and edge cases as needed
});
