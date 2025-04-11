import { Card } from './cards';

export interface Player {
  id: string;
  name: string;
  deck: Card[];
  hand: Card[];
  discard: Card[];
  inPlay: Card[];
  credits: number;  // Renamed from coins to credits for cyberpunk theme
  actions: number;
  buys: number;
  health: number;
  factionReputation: {  // New field for tracking faction reputation
    Corp: number;      // 0-100 reputation with Corporations
    Runner: number;    // 0-100 reputation with Netrunners
    Street: number;    // 0-100 reputation with Street gangs
  };
  installedCards: Card[];  // Permanent card installations
  faceDownCards: Card[];   // Traps and ambushes
}

// Create a new player with starting deck
export function createPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    deck: [],
    hand: [],
    discard: [],
    inPlay: [],
    credits: 0,
    actions: 0,
    buys: 0,
    health: 10, // Starting health
    factionReputation: {
      Corp: 50,   // Neutral starting reputation
      Runner: 50,
      Street: 50
    },
    installedCards: [],
    faceDownCards: []
  };
}

// Shuffle a deck of cards
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
  }
  return shuffled;
}

// Draw a specific number of cards from the deck to hand
export function drawCards(player: Player, count: number): { player: Player, drawnCards: Card[] } {
  const updatedPlayer = { ...player };
  const drawnCards: Card[] = [];

  for (let i = 0; i < count; i++) {
    // If deck is empty, shuffle discard pile and make it the new deck
    if (updatedPlayer.deck.length === 0) {
      if (updatedPlayer.discard.length === 0) {
        break; // No cards to draw
      }
      updatedPlayer.deck = shuffleDeck([...updatedPlayer.discard]);
      updatedPlayer.discard = [];
    }

    // Draw the top card of the deck
    if (updatedPlayer.deck.length > 0) {
      const card = updatedPlayer.deck[0];
      drawnCards.push(card);
      updatedPlayer.hand.push(card);
      updatedPlayer.deck = updatedPlayer.deck.slice(1);
    }
  }

  return { player: updatedPlayer, drawnCards };
}

// Draw a hand of 5 cards
export function drawHand(player: Player): Player {
  const { player: updatedPlayer } = drawCards(player, 5);
  return updatedPlayer;
}

// Discard a specific card from hand
export function discardCard(player: Player, cardIndex: number): Player {
  const updatedPlayer = { ...player };
  
  if (cardIndex >= 0 && cardIndex < updatedPlayer.hand.length) {
    const card = updatedPlayer.hand[cardIndex];
    updatedPlayer.discard.push(card);
    updatedPlayer.hand = updatedPlayer.hand.filter((_, i) => i !== cardIndex);
  }
  
  return updatedPlayer;
}

// Discard the entire hand
export function discardHand(player: Player): Player {
  const updatedPlayer = { ...player };
  updatedPlayer.discard = [...updatedPlayer.discard, ...updatedPlayer.hand];
  updatedPlayer.hand = [];
  return updatedPlayer;
}

// Play a card from hand
export function playCard(player: Player, cardIndex: number): { player: Player, playedCard: Card | null } {
  const updatedPlayer = { ...player };
  
  if (cardIndex >= 0 && cardIndex < updatedPlayer.hand.length) {
    const card = updatedPlayer.hand[cardIndex];
    
    // Handle different card types
    if (card.cardType === 'Install') {
      updatedPlayer.installedCards.push(card);
    } else if (card.cardType === 'Trap' && card.isFaceDown) {
      updatedPlayer.faceDownCards.push(card);
    } else {
      updatedPlayer.inPlay.push(card);
    }
    
    updatedPlayer.hand = updatedPlayer.hand.filter((_, i) => i !== cardIndex);
    
    // Apply card effects
    for (const effect of card.effects) {
      switch (effect.type) {
        case 'gain_credits':
        case 'gain_resources': // Legacy support
          updatedPlayer.credits += effect.value;
          break;
        case 'gain_action':
          updatedPlayer.actions += effect.value;
          break;
        case 'draw_cards':
          const { player: playerAfterDraw } = drawCards(updatedPlayer, effect.value);
          updatedPlayer.deck = playerAfterDraw.deck;
          updatedPlayer.hand = playerAfterDraw.hand;
          updatedPlayer.discard = playerAfterDraw.discard;
          break;
        case 'push_luck':
          // Push your luck mechanic - chance of damage for extra cards
          for (let i = 0; i < effect.value; i++) {
            const { player: playerAfterLuckyDraw } = drawCards(updatedPlayer, 1);
            // Copy all properties from the new player state
            updatedPlayer.deck = playerAfterLuckyDraw.deck;
            updatedPlayer.hand = playerAfterLuckyDraw.hand;
            updatedPlayer.discard = playerAfterLuckyDraw.discard;
            
            // 20% chance of taking damage per card
            if (Math.random() < 0.2) {
              updatedPlayer.health -= 1;
            }
          }
          break;
        case 'set_trap':
          // Card will be played face down and only revealed later
          const targetCard = card;
          targetCard.isFaceDown = true;
          break;
        // Other effects are handled by the game engine
      }
    }
    
    return { player: updatedPlayer, playedCard: card };
  }
  
  return { player: updatedPlayer, playedCard: null };
}

// Buy a card from the market (unlimited buys allowed)
export function buyCard(player: Player, card: Card): Player {
  const updatedPlayer = { ...player };
  
  if (updatedPlayer.credits >= card.cost) {
    updatedPlayer.credits -= card.cost;
    // No longer decrement buys - unlimited buys allowed
    
    // Add card to discard pile (not directly to deck)
    updatedPlayer.discard.push({ ...card });
    
    // Adjust faction reputation based on card purchased
    if (card.faction !== 'Neutral') {
      updatedPlayer.factionReputation[card.faction] += 2; // Small increase in reputation
    }
  }
  
  return updatedPlayer;
}

// Trash (remove) a card from hand
export function trashCard(player: Player, cardIndex: number): { player: Player, trashedCard: Card | null } {
  const updatedPlayer = { ...player };
  
  if (cardIndex >= 0 && cardIndex < updatedPlayer.hand.length) {
    const card = updatedPlayer.hand[cardIndex];
    updatedPlayer.hand = updatedPlayer.hand.filter((_, i) => i !== cardIndex);
    return { player: updatedPlayer, trashedCard: card };
  }
  
  return { player: updatedPlayer, trashedCard: null };
}

// Reset player turn (move in-play cards to discard, reset actions/buys)
export function endTurn(player: Player): Player {
  const updatedPlayer = { ...player };
  updatedPlayer.discard = [...updatedPlayer.discard, ...updatedPlayer.inPlay];
  updatedPlayer.inPlay = [];
  updatedPlayer.credits = 0;
  updatedPlayer.actions = 0;
  updatedPlayer.buys = 0;
  // Note: Installed cards and face-down cards remain in play between turns
  return updatedPlayer;
}

// Start a new turn for player (reset actions/buys and draw 5 cards)
export function startTurn(player: Player): Player {
  let updatedPlayer = { ...player };
  updatedPlayer.actions = 1; // Start with 1 action
  updatedPlayer.buys = 1;    // Start with 1 buy
  updatedPlayer = drawHand(discardHand(updatedPlayer)); // Discard previous hand and draw 5 new cards
  return updatedPlayer;
}

// Apply damage to player
export function applyDamage(player: Player, amount: number): Player {
  const updatedPlayer = { ...player };
  updatedPlayer.health = Math.max(0, updatedPlayer.health - amount);
  return updatedPlayer;
}

// Force a player to discard cards
export function forceDiscard(player: Player, count: number): { player: Player, discardedCards: Card[] } {
  const updatedPlayer = { ...player };
  const discardedCards: Card[] = [];
  
  // Randomly select cards to discard
  for (let i = 0; i < count && updatedPlayer.hand.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * updatedPlayer.hand.length);
    const card = updatedPlayer.hand[randomIndex];
    discardedCards.push(card);
    updatedPlayer.discard.push(card);
    updatedPlayer.hand = updatedPlayer.hand.filter((_, i) => i !== randomIndex);
  }
  
  return { player: updatedPlayer, discardedCards };
}
