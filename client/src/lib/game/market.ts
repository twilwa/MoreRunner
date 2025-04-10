import { Card, getRandomMarketCard } from './cards';

export interface Market {
  availableCards: Card[];
  trashedCards: Card[];
  maxSize: number;
}

// Create initial market with random cards
export function createMarket(size: number = 5): Market {
  const availableCards: Card[] = [];
  
  // Fill market with random cards
  for (let i = 0; i < size; i++) {
    availableCards.push(getRandomMarketCard());
  }
  
  return {
    availableCards,
    trashedCards: [],
    maxSize: size
  };
}

// Remove a card from the market (when purchased)
export function removeCard(market: Market, cardIndex: number): { market: Market, removedCard: Card | null } {
  const updatedMarket = { ...market };
  
  if (cardIndex >= 0 && cardIndex < updatedMarket.availableCards.length) {
    const card = updatedMarket.availableCards[cardIndex];
    updatedMarket.availableCards = updatedMarket.availableCards.filter((_, i) => i !== cardIndex);
    return { market: updatedMarket, removedCard: card };
  }
  
  return { market: updatedMarket, removedCard: null };
}

// Add a card to the market's trash pile
export function trashCard(market: Market, card: Card): Market {
  const updatedMarket = { ...market };
  updatedMarket.trashedCards.push({ ...card });
  return updatedMarket;
}

// Refill the market to its maximum size with random cards
export function refillMarket(market: Market): Market {
  const updatedMarket = { ...market };
  
  // Add cards until we reach the max size
  while (updatedMarket.availableCards.length < updatedMarket.maxSize) {
    updatedMarket.availableCards.push(getRandomMarketCard());
  }
  
  return updatedMarket;
}

// Completely refresh the market with new random cards
export function refreshMarket(market: Market): Market {
  const updatedMarket = { ...market };
  
  // Move current market cards to trash
  updatedMarket.trashedCards = [...updatedMarket.trashedCards, ...updatedMarket.availableCards];
  
  // Add new random cards
  updatedMarket.availableCards = [];
  for (let i = 0; i < updatedMarket.maxSize; i++) {
    updatedMarket.availableCards.push(getRandomMarketCard());
  }
  
  return updatedMarket;
}
