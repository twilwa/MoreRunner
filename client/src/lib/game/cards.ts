// Defines the card types and related functionality

// Card Keywords/Tags for synergies
export type CardKeyword = 
  | 'Fire'     // Fire-based attack/effect cards
  | 'Water'    // Water-based effect cards
  | 'Earth'    // Earth-based defense cards
  | 'Air'      // Air-based utility cards
  | 'Arcane'   // Powerful magical effects
  | 'Basic'    // Basic starting cards
  | 'Common'   // Common tier cards
  | 'Rare'     // Rare tier cards
  | 'Epic';    // Epic tier cards

// Card Effect Types
export type CardEffect = {
  type: 'gain_resources' | 'damage_opponent' | 'draw_cards' | 'trash_cards' | 'gain_action' | 'force_discard' | 'copy_card';
  value: number;
  // Bonus effects if certain conditions are met
  synergy?: {
    keyword: CardKeyword;
    bonus: number;
  };
};

// Card structure
export interface Card {
  id: string;
  name: string;
  cost: number;
  keywords: CardKeyword[];
  effects: CardEffect[];
  description: string;
}

// --------------------------------------------------
// Card Library - Defining all available cards
// --------------------------------------------------

// Starting Deck Cards
export const COPPER: Card = {
  id: 'copper',
  name: 'Copper',
  cost: 0,
  keywords: ['Basic'],
  effects: [{ type: 'gain_resources', value: 1 }],
  description: 'Gain 1 coin.',
};

export const ESTATE: Card = {
  id: 'estate',
  name: 'Estate',
  cost: 2,
  keywords: ['Basic'],
  effects: [], // No immediate effect, worth victory points at end
  description: 'Worth 1 victory point.',
};

// Basic Market Cards
export const SILVER: Card = {
  id: 'silver',
  name: 'Silver',
  cost: 3,
  keywords: ['Common'],
  effects: [{ type: 'gain_resources', value: 2 }],
  description: 'Gain 2 coins.',
};

export const MARKET: Card = {
  id: 'market',
  name: 'Market',
  cost: 5,
  keywords: ['Common'],
  effects: [
    { type: 'gain_resources', value: 1 },
    { type: 'draw_cards', value: 1 },
    { type: 'gain_action', value: 1 }
  ],
  description: 'Gain 1 coin, draw 1 card, and gain 1 action.',
};

// Attack Cards
export const MILITIA: Card = {
  id: 'militia',
  name: 'Militia',
  cost: 4,
  keywords: ['Common'],
  effects: [
    { type: 'gain_resources', value: 2 },
    { type: 'force_discard', value: 1 }
  ],
  description: 'Gain 2 coins. Each opponent discards down to 3 cards in hand.',
};

export const FIREBALL: Card = {
  id: 'fireball',
  name: 'Fireball',
  cost: 5,
  keywords: ['Fire', 'Rare'],
  effects: [
    { 
      type: 'damage_opponent', 
      value: 2,
      synergy: { keyword: 'Fire', bonus: 1 } 
    }
  ],
  description: 'Deal 2 damage to opponent. If you have another Fire card in play, deal 3 damage instead.',
};

export const WATERFALL: Card = {
  id: 'waterfall',
  name: 'Waterfall',
  cost: 4,
  keywords: ['Water', 'Rare'],
  effects: [
    { type: 'draw_cards', value: 2 },
    { 
      type: 'force_discard', 
      value: 1,
      synergy: { keyword: 'Water', bonus: 1 } 
    }
  ],
  description: 'Draw 2 cards. Opponent discards 1 card. If you have another Water card in play, opponent discards 2 cards.',
};

export const STONE_WALL: Card = {
  id: 'stone_wall',
  name: 'Stone Wall',
  cost: 3,
  keywords: ['Earth', 'Common'],
  effects: [
    { 
      type: 'damage_opponent', 
      value: -2, // Negative value means protection
      synergy: { keyword: 'Earth', bonus: 1 }
    }
  ],
  description: 'Prevent the next 2 damage you would take. If you have another Earth card in play, prevent 3 damage instead.',
};

export const WHIRLWIND: Card = {
  id: 'whirlwind',
  name: 'Whirlwind',
  cost: 6,
  keywords: ['Air', 'Rare'],
  effects: [
    { type: 'draw_cards', value: 1 },
    { type: 'trash_cards', value: 1 },
    { type: 'gain_action', value: 1 }
  ],
  description: 'Draw 1 card, trash 1 card from your hand, and gain 1 action.',
};

export const ARCANE_INTELLECT: Card = {
  id: 'arcane_intellect',
  name: 'Arcane Intellect',
  cost: 7,
  keywords: ['Arcane', 'Epic'],
  effects: [
    { type: 'draw_cards', value: 3 },
    { 
      type: 'copy_card', 
      value: 1,
      synergy: { keyword: 'Arcane', bonus: 1 }
    }
  ],
  description: 'Draw 3 cards. You may copy an action card from the discard pile to your hand if you have another Arcane card in play.',
};

export const GOLD: Card = {
  id: 'gold',
  name: 'Gold',
  cost: 6,
  keywords: ['Common'],
  effects: [{ type: 'gain_resources', value: 3 }],
  description: 'Gain 3 coins.',
};

export const LABORATORY: Card = {
  id: 'laboratory',
  name: 'Laboratory',
  cost: 5,
  keywords: ['Rare'],
  effects: [
    { type: 'draw_cards', value: 2 },
    { type: 'gain_action', value: 1 }
  ],
  description: 'Draw 2 cards and gain 1 action.',
};

// Market card pool - all cards available for purchase
export const MARKET_CARD_POOL: Card[] = [
  SILVER,
  MARKET,
  MILITIA,
  FIREBALL,
  WATERFALL,
  STONE_WALL,
  WHIRLWIND,
  ARCANE_INTELLECT,
  GOLD,
  LABORATORY
];

// Get starting deck for players
export function getStartingDeck(): Card[] {
  // Standard starting deck: 7 Copper and 3 Estate
  return [
    { ...COPPER },
    { ...COPPER },
    { ...COPPER },
    { ...COPPER },
    { ...COPPER },
    { ...COPPER },
    { ...COPPER },
    { ...ESTATE },
    { ...ESTATE },
    { ...ESTATE }
  ];
}

// Helper to evaluate card synergies based on already played cards
export function evaluateCardSynergies(card: Card, cardsInPlay: Card[]): Card {
  // Create a deep copy of the card to avoid mutating the original
  const evaluatedCard: Card = JSON.parse(JSON.stringify(card));
  
  // For each effect with a synergy, check if it applies
  evaluatedCard.effects.forEach(effect => {
    if (effect.synergy) {
      // Check if there's another card in play with the synergy keyword
      const hasSynergy = cardsInPlay.some(playedCard => 
        playedCard.id !== card.id && 
        playedCard.keywords.includes(effect.synergy!.keyword)
      );
      
      // Apply the bonus if synergy exists
      if (hasSynergy) {
        effect.value += effect.synergy.bonus;
      }
    }
  });
  
  return evaluatedCard;
}

// Get a random card from the market pool
export function getRandomMarketCard(): Card {
  const randomIndex = Math.floor(Math.random() * MARKET_CARD_POOL.length);
  return { ...MARKET_CARD_POOL[randomIndex] };
}
