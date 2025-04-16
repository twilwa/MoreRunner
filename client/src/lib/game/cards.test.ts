import { describe, it, expect } from 'vitest';
import { MARKET_CARD_POOL, getStartingDeck, getRandomMarketCard } from './cards';

describe('Card Definitions & Utils', () => {
  it('MARKET_CARD_POOL should contain cards', () => {
    expect(MARKET_CARD_POOL.length).toBeGreaterThan(0);
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
    expect(MARKET_CARD_POOL.some(poolCard => poolCard.id === randomCard.id)).toBe(true);
  });

  it('getRandomMarketCard should return a copy, not a reference', () => {
    const randomCard1 = getRandomMarketCard();
    const randomCard2 = getRandomMarketCard();
    randomCard1.name = 'MODIFIED_CARD_NAME_TEST';
    randomCard1.cost = 999;
    const originalCardInPool = MARKET_CARD_POOL.find(c => c.id === randomCard1.id);
    expect(originalCardInPool).toBeDefined();
    expect(originalCardInPool?.name).not.toBe('MODIFIED_CARD_NAME_TEST');
    expect(originalCardInPool?.cost).not.toBe(999);
    if (randomCard2.id === randomCard1.id) {
      expect(randomCard2.name).not.toBe('MODIFIED_CARD_NAME_TEST');
    }
  });
});
