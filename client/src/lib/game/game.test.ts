import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeGame, addLog, drawNCards } from './game';
import { createPlayer } from './player';
import { getEnhancedStartingDeck } from './enhancedCards';
import { isEnhancedCard } from './components';
import { cardExecutionService } from './cardExecutionService';

describe('Game Logic', () => {
  let initialGameState;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock moveCardToZone to return a new enhanced card with correct id and updated zone component
    vi.spyOn(cardExecutionService, 'moveCardToZone').mockImplementation((card, fromZone, toZone) => {
      // Simulate updating the card's zone by updating its components
      const newComponents = [
        ...(card.components?.filter?.(c => !c.type?.startsWith('zone:')) ?? []),
        { type: `zone:${toZone}` }
      ];
      return { ...card, components: newComponents };
    });
    initialGameState = initializeGame(['Alice', 'Bob']);
  });

  it('initializeGame should set up players, market, and initial state', () => {
    const gameState = initializeGame(['Alice', 'Bob']);
    expect(gameState.players).toHaveLength(2);
    expect(gameState.players[0].name).toBe('Alice');
    expect(gameState.players[1].name).toBe('Bob');
    expect(gameState.activePlayerIndex).toBe(0);
    expect(gameState.market.availableCards).toHaveLength(5); // Default market size
    // Debug log for market cards that fail isEnhancedCard
    const failed = gameState.market.availableCards.filter(c => !isEnhancedCard(c));
    if (failed.length > 0) {
      // eslint-disable-next-line no-console
      console.error('Non-Enhanced market cards:', failed);
    }
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
    for (let i = 0; i < 150; i++) {
      state = addLog(state, `Log ${i}`);
    }
    expect(state.logs).toHaveLength(100);
    expect(state.logs[0].message).toBe('Log 50');
  });

  it('drawNCards should draw cards and update state via mocked service', () => {
    let player = createPlayer('p1', 'Test');
    player.deck = getEnhancedStartingDeck();
    let state = { ...initialGameState, players: [player, initialGameState.players[1]] };
    const { updatedPlayer, drawnCards, updatedGameState } = drawNCards(player, 3, state);
    expect(drawnCards).toHaveLength(3);
    expect(updatedPlayer.hand).toHaveLength(3);
    expect(updatedPlayer.deck).toHaveLength(getEnhancedStartingDeck().length - 3);
    // Instead of exact call count, check for correct transitions
    expect(cardExecutionService.moveCardToZone).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
      'inDeck',
      'inHand'
    );
  });

  it('drawNCards should handle empty deck by shuffling discard (mocked)', () => {
    let player = createPlayer('p1', 'Test');
    player.discard = getEnhancedStartingDeck();
    player.deck = [];
    let state = { ...initialGameState, players: [player, initialGameState.players[1]] };
    const { updatedPlayer, drawnCards, updatedGameState } = drawNCards(player, 5, state);
    expect(drawnCards).toHaveLength(5);
    expect(updatedPlayer.hand).toHaveLength(5);
    expect(updatedPlayer.discard).toHaveLength(0);
    expect(updatedPlayer.deck).toHaveLength(getEnhancedStartingDeck().length - 5);
    // Instead of exact call count, check for correct transitions
    expect(cardExecutionService.moveCardToZone).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
      'inDiscard',
      'inDeck'
    );
    expect(cardExecutionService.moveCardToZone).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
      'inDeck',
      'inHand'
    );
  });
});
