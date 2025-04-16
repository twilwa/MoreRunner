import { Card, CardFaction } from './cards';
import { cardExecutionService } from './cardExecutionService';
import { CardZone, EnhancedCard } from './components';
import { getEnhancedCard } from './enhancedCards';

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
  identity?: import('../../components/IdentitySelectionModal').RunnerIdentity;
  hasUsedAliceDiscountThisTurn?: boolean;
  // Method for drawing a card from the deck
  drawCard?: () => Card | null;
}

// Create a new player with starting deck
export function createPlayer(id: string, name: string, identity?: import('../../components/IdentitySelectionModal').RunnerIdentity): Player {
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
    faceDownCards: [],
    identity,
    hasUsedAliceDiscountThisTurn: false
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
      
      // When shuffling discard into deck, we need to apply zone transition for each card
      const shuffledCards = shuffleDeck([...updatedPlayer.discard]);
      
      // Apply zone transition for each card moved from discard to deck
      updatedPlayer.discard.forEach(card => {
        // Get the enhanced version of the card with components
        const enhancedCard = getEnhancedCard(card.id) || { 
          ...card, 
          components: [] 
        } as EnhancedCard;
        
        // Use zone transition to move the card from discard to deck
        const fromZone: CardZone = 'inDiscard';
        const toZone: CardZone = 'inDeck';
        
        // Apply zone transition using the execution service
        const updatedCard = cardExecutionService.moveCardToZone(
          enhancedCard,
          fromZone,
          toZone
        );
        // Replace in shuffledCards
        const idx = shuffledCards.findIndex(c => c.id === card.id);
        if (idx !== -1) shuffledCards[idx] = updatedCard;
        console.log(`Card ${card.name} moved from ${fromZone} to ${toZone} during shuffle`);
      });
      
      updatedPlayer.deck = shuffledCards;
      updatedPlayer.discard = [];
    }

    // Draw the top card of the deck
    if (updatedPlayer.deck.length > 0) {
      const card = updatedPlayer.deck[0];
      
      // Get the enhanced version of the card with components
      const enhancedCard = getEnhancedCard(card.id) || { 
        ...card, 
        components: [] 
      } as EnhancedCard;
      
      // Use zone transition to move the card from deck to hand
      const fromZone: CardZone = 'inDeck';
      const toZone: CardZone = 'inHand';
      
      // Apply zone transition using the execution service
      const updatedCard = cardExecutionService.moveCardToZone(
        enhancedCard,
        fromZone,
        toZone
      );
      console.log(`Card ${card.name} drawn from ${fromZone} to ${toZone}`);
      drawnCards.push(updatedCard);
      updatedPlayer.hand.push(updatedCard);
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
    
    // Get the enhanced version of the card with components
    const enhancedCard = getEnhancedCard(card.id) || { 
      ...card, 
      components: [] 
    } as EnhancedCard;
    
    // Use zone transition to move the card from hand to discard
    const fromZone: CardZone = 'inHand';
    const toZone: CardZone = 'inDiscard';
    
    // Apply zone transition using the execution service
    const updatedCard = cardExecutionService.moveCardToZone(
      enhancedCard,
      fromZone,
      toZone
    );
    console.log(`Card ${card.name} discarded from ${fromZone} to ${toZone}`);
    updatedPlayer.discard.push(updatedCard);
    updatedPlayer.hand = updatedPlayer.hand.filter((_, i) => i !== cardIndex);
  }
  
  return updatedPlayer;
}

// Discard the entire hand
export function discardHand(player: Player): Player {
  const updatedPlayer = { ...player };
  
  // Apply zone transition for each card in hand
  updatedPlayer.hand.forEach(card => {
    // Get the enhanced version of the card with components
    const enhancedCard = getEnhancedCard(card.id) || { 
      ...card, 
      components: [] 
    } as EnhancedCard;
    
    // Use zone transition to move the card from hand to discard
    const fromZone: CardZone = 'inHand';
    const toZone: CardZone = 'inDiscard';
    
    // Apply zone transition using the execution service
    const updatedCard = cardExecutionService.moveCardToZone(
      enhancedCard,
      fromZone,
      toZone
    );
    console.log(`Card ${card.name} discarded from ${fromZone} to ${toZone}`);
    updatedPlayer.discard.push(updatedCard);
    // Remove from hand by id
    updatedPlayer.hand = updatedPlayer.hand.filter(c => c.id !== card.id);
  });
  
  return updatedPlayer;
}

// Play a card from hand
export function playCard(player: Player, cardIndex: number): { player: Player, playedCard: Card | null } {
  const updatedPlayer = { ...player };
  
  if (cardIndex >= 0 && cardIndex < updatedPlayer.hand.length) {
    const card = updatedPlayer.hand[cardIndex];
    
    // --- Alice McCaffrey IDENTITY ABILITY ---
    let cardToPlay = card;
    if (
      updatedPlayer.identity &&
      updatedPlayer.identity.id === 'alice' &&
      !updatedPlayer.hasUsedAliceDiscountThisTurn &&
      (card.cardType === 'Program' || card.cardType === 'Hardware' ||
        (card.keywords && (card.keywords.includes('Program') || card.keywords.includes('Hardware'))))
    ) {
      cardToPlay = { ...card, cost: Math.max(0, (card.cost ?? 0) - 1) };
      updatedPlayer.hasUsedAliceDiscountThisTurn = true;
    }

    // Get the enhanced version of the card with components
    const enhancedCard = getEnhancedCard(cardToPlay.id) || { 
      ...cardToPlay, 
      components: [] 
    } as EnhancedCard;
    
    // Use the card execution service to move the card from hand to the right zone
    // This ensures all zone components are properly applied
    let fromZone: CardZone = 'inHand';
    let toZone: CardZone;
    
    // Determine target zone based on card type
    if (cardToPlay.cardType === 'Install') {
      updatedPlayer.installedCards.push(cardToPlay);
      toZone = 'inPlay'; // Installed cards are in play zone
    } else if (cardToPlay.cardType === 'Trap' && cardToPlay.isFaceDown) {
      updatedPlayer.faceDownCards.push(cardToPlay);
      toZone = 'inPlay'; // Face down cards are in play zone but special-flagged
    } else {
      // Normal cards go to inPlay or inQueue depending on execution strategy
      updatedPlayer.inPlay.push(cardToPlay);
      toZone = 'inPlay';
    }
    
    // Apply zone transition using the execution service
    const updatedCard = cardExecutionService.moveCardToZone(
      enhancedCard,
      fromZone,
      toZone
    );
    console.log(`Card ${cardToPlay.name} played from ${fromZone} to ${toZone}`);
    updatedPlayer.inPlay.push(updatedCard);
    updatedPlayer.hand = updatedPlayer.hand.filter((_, i) => i !== cardIndex);
    
    // Legacy effect handling for backward compatibility
    // Note: This is for cards that don't use the component system yet
    for (const effect of cardToPlay.effects) {
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
          const targetCard = cardToPlay;
          targetCard.isFaceDown = true;
          break;
        // Other effects are now handled by the component system
      }
    }
    
    return { player: updatedPlayer, playedCard: cardToPlay };
  }
  
  return { player: updatedPlayer, playedCard: null };
}

// Buy a card from the market (unlimited buys allowed)
export function buyCard(player: Player, card: Card): Player {
  const updatedPlayer = { ...player };
  
  if (updatedPlayer.credits >= card.cost) {
    updatedPlayer.credits -= card.cost;
    // No longer decrement buys - unlimited buys allowed
    
    // Get the enhanced version of the card with components
    const enhancedCard = getEnhancedCard(card.id) || { 
      ...card, 
      components: [] 
    } as EnhancedCard;
    
    // Use zone transition to move the card from market to discard
    // This triggers appropriate zone components
    const fromZone: CardZone = 'inMarket';
    const toZone: CardZone = 'inDiscard';
    
    // Apply zone transition using the execution service
    const updatedCard = cardExecutionService.moveCardToZone(
      enhancedCard,
      fromZone,
      toZone
    );
    console.log(`Card ${card.name} purchased and moved from ${fromZone} to ${toZone}`);
    
    // Add card to discard pile (not directly to deck)
    updatedPlayer.discard.push(updatedCard);
    
    // Adjust faction reputation based on card purchased
    if (card.faction !== 'Neutral') {
      updatedPlayer.factionReputation[card.faction] += 2; // Small increase in reputation
    }
  }
  
  return updatedPlayer;
}

// Trash (remove) a card from hand
export function trashCard(player: Player, cardIndex: number): { player: Player, trashedCard: Card | null, gainedCredits?: number } {
  const updatedPlayer = { ...player };
  let gainedCredits = 0;

  if (cardIndex >= 0 && cardIndex < updatedPlayer.hand.length) {
    const card = updatedPlayer.hand[cardIndex];

    // Get the enhanced version of the card with components
    const enhancedCard = getEnhancedCard(card.id) || { 
      ...card, 
      components: [] 
    } as EnhancedCard;
    
    // --- NOISE IDENTITY ABILITY ---
    if (updatedPlayer.identity && updatedPlayer.identity.id === 'noise') {
      updatedPlayer.credits += 1;
      gainedCredits = 1;
    }
    // --- END NOISE ABILITY ---

    // Remove the card from hand
    updatedPlayer.hand = updatedPlayer.hand.filter((_, i) => i !== cardIndex);
    return { player: updatedPlayer, trashedCard: card, gainedCredits };
  }

  return { player: updatedPlayer, trashedCard: null };
}

// Reset player turn (move in-play cards to discard, reset actions/buys)
export function endTurn(player: Player): Player {
  const updatedPlayer = { ...player };
  
  // Process each in-play card with the zone component system
  updatedPlayer.inPlay.forEach(card => {
    // Get the enhanced version of the card with components
    const enhancedCard = getEnhancedCard(card.id) || { 
      ...card, 
      components: [] 
    } as EnhancedCard;
    
    // Use zone transition to move the card from play to discard
    // This triggers appropriate zone components
    const fromZone: CardZone = 'inPlay';
    const toZone: CardZone = 'inDiscard';
    
    // Apply zone transition using the execution service
    const updatedCard = cardExecutionService.moveCardToZone(
      enhancedCard,
      fromZone,
      toZone
    );
    console.log(`End turn: Card ${card.name} moved from ${fromZone} to ${toZone}`);
    updatedPlayer.discard.push(updatedCard);
  });
  
  // Clear the in-play area (except installed cards and face-down cards)
  updatedPlayer.inPlay = [];
  
  // Reset resources
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
  updatedPlayer.hasUsedAliceDiscountThisTurn = false; // Reset Alice's discount flag
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
    
    // Get the enhanced version of the card with components
    const enhancedCard = getEnhancedCard(card.id) || { 
      ...card, 
      components: [] 
    } as EnhancedCard;
    
    // Use zone transition to move the card from hand to discard
    const fromZone: CardZone = 'inHand';
    const toZone: CardZone = 'inDiscard';
    
    // Apply zone transition using the execution service
    const updatedCard = cardExecutionService.moveCardToZone(
      enhancedCard,
      fromZone,
      toZone
    );
    console.log(`Card ${card.name} force discarded from ${fromZone} to ${toZone}`);
    discardedCards.push(updatedCard);
    updatedPlayer.discard.push(updatedCard);
    updatedPlayer.hand = updatedPlayer.hand.filter((_, i) => i !== randomIndex);
  }
  
  return { player: updatedPlayer, discardedCards };
}
