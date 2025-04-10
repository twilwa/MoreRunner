// Defines the card types and related functionality for a Cyberpunk themed game

// Factions in the cyberpunk world
export type CardFaction = 
  | 'Corp'     // Corporate/megacorp faction
  | 'Runner'   // Hacker/netrunner faction
  | 'Street'   // Street gangs/mercenaries
  | 'Neutral'; // No specific faction

// Card Keywords/Tags for synergies
export type CardKeyword = 
  | 'Virus'      // Viral programs that replicate and cause system damage
  | 'ICE'        // Intrusion Countermeasures Electronics - defensive programs
  | 'Stealth'    // Covert operations and sneaking programs
  | 'Weapon'     // Offensive hardware or programs for direct attacks
  | 'Memory'     // Cards related to data storage and processing
  | 'Hardware'   // Physical computing equipment
  | 'Program'    // Software and digital tools
  | 'Cyberware'  // Implants and augmentations
  | 'Basic'      // Basic starting cards
  | 'Common'     // Common tier cards
  | 'Rare'       // Rare tier cards
  | 'Epic';      // Epic tier cards

// Card types for different play styles
export type CardType = 
  | 'Program'   // Standard card played normally
  | 'Trap'      // Can be played face down as a trap
  | 'Install'   // Installed card with ongoing effects
  | 'Hardware'  // Permanent upgrades/equipment
  | 'Event';    // One-time effect cards

// Card Effect Types
export type CardEffect = {
  type: 'gain_credits' | 'damage_opponent' | 'draw_cards' | 'trash_cards' | 'gain_action' | 'force_discard' | 
        'copy_card' | 'fuse_cards' | 'set_trap' | 'trace' | 'reveal_trap' | 'push_luck' | 'stealth_bypass' |
        'gain_resources'; // Kept for backward compatibility
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
  faction: CardFaction;
  cardType: CardType;
  keywords: CardKeyword[];
  effects: CardEffect[];
  description: string;
  isFaceDown?: boolean;  // For trap/ambush cards
  canFuse?: boolean;     // Indicates if this card can be fused with another
  riskLevel?: number;    // For push-your-luck mechanics (0-3)
}

// --------------------------------------------------
// Card Library - Defining all available cards for cyberpunk theme
// --------------------------------------------------

// Starting Deck Cards
export const CREDIT_CHIP: Card = {
  id: 'credit_chip',
  name: 'Credit Chip',
  cost: 0,
  faction: 'Neutral',
  cardType: 'Program',
  keywords: ['Basic'],
  effects: [{ type: 'gain_credits', value: 1 }],
  description: 'Gain 1 credit.',
};

export const PERSONAL_DATA: Card = {
  id: 'personal_data',
  name: 'Personal Data',
  cost: 2,
  faction: 'Neutral',
  cardType: 'Program',
  keywords: ['Basic', 'Memory'],
  effects: [], // No immediate effect, worth victory points at end
  description: 'Storage for personal data. Worth 1 victory point.',
};

// Basic Market Cards
export const CRYPTO_WALLET: Card = {
  id: 'crypto_wallet',
  name: 'Crypto Wallet',
  cost: 3,
  faction: 'Runner',
  cardType: 'Hardware',
  keywords: ['Common', 'Hardware'],
  effects: [{ type: 'gain_credits', value: 2 }],
  description: 'Gain 2 credits.',
};

export const DARK_MARKET: Card = {
  id: 'dark_market',
  name: 'Dark Market',
  cost: 5,
  faction: 'Street',
  cardType: 'Event',
  keywords: ['Common', 'Program'],
  effects: [
    { type: 'gain_credits', value: 1 },
    { type: 'draw_cards', value: 1 },
    { type: 'gain_action', value: 1 }
  ],
  description: 'Gain 1 credit, draw 1 card, and gain 1 action.',
};

// Attack Cards
export const STREET_THUG: Card = {
  id: 'street_thug',
  name: 'Street Thug',
  cost: 4,
  faction: 'Street',
  cardType: 'Event',
  keywords: ['Common', 'Weapon'],
  effects: [
    { type: 'gain_credits', value: 2 },
    { type: 'force_discard', value: 1 }
  ],
  description: 'Gain 2 credits. Each opponent discards down to 3 cards in hand.',
};

export const MALICIOUS_CODE: Card = {
  id: 'malicious_code',
  name: 'Malicious Code',
  cost: 5,
  faction: 'Runner',
  cardType: 'Program',
  keywords: ['Virus', 'Rare'],
  effects: [
    { 
      type: 'damage_opponent', 
      value: 2,
      synergy: { keyword: 'Virus', bonus: 1 } 
    }
  ],
  description: 'Deal 2 damage to opponent. If you have another Virus program in play, deal 3 damage instead.',
};

export const DATA_BREACH: Card = {
  id: 'data_breach',
  name: 'Data Breach',
  cost: 4,
  faction: 'Runner',
  cardType: 'Event',
  keywords: ['Stealth', 'Rare'],
  effects: [
    { type: 'draw_cards', value: 2 },
    { 
      type: 'force_discard', 
      value: 1,
      synergy: { keyword: 'Stealth', bonus: 1 } 
    }
  ],
  description: 'Draw 2 cards. Opponent discards 1 card. If you have another Stealth card in play, opponent discards 2 cards.',
};

export const FIREWALL: Card = {
  id: 'firewall',
  name: 'Firewall',
  cost: 3,
  faction: 'Corp',
  cardType: 'Install',
  keywords: ['ICE', 'Common'],
  effects: [
    { 
      type: 'damage_opponent', 
      value: -2, // Negative value means protection
      synergy: { keyword: 'ICE', bonus: 1 }
    }
  ],
  description: 'Prevent the next 2 damage you would take. If you have another ICE in play, prevent 3 damage instead.',
  canFuse: true
};

export const SYSTEM_PURGE: Card = {
  id: 'system_purge',
  name: 'System Purge',
  cost: 6,
  faction: 'Corp',
  cardType: 'Event',
  keywords: ['Memory', 'Rare'],
  effects: [
    { type: 'draw_cards', value: 1 },
    { type: 'trash_cards', value: 1 },
    { type: 'gain_action', value: 1 }
  ],
  description: 'Draw 1 card, trash 1 card from your hand, and gain 1 action.',
};

export const NEURAL_IMPLANT: Card = {
  id: 'neural_implant',
  name: 'Neural Implant',
  cost: 7,
  faction: 'Corp',
  cardType: 'Hardware',
  keywords: ['Cyberware', 'Epic'],
  effects: [
    { type: 'draw_cards', value: 3 },
    { 
      type: 'copy_card', 
      value: 1,
      synergy: { keyword: 'Cyberware', bonus: 1 }
    }
  ],
  description: 'Draw 3 cards. You may copy a card from the discard pile if you have another Cyberware in play.',
  canFuse: true
};

export const CORPORATE_FUNDING: Card = {
  id: 'corporate_funding',
  name: 'Corporate Funding',
  cost: 6,
  faction: 'Corp',
  cardType: 'Event',
  keywords: ['Common', 'Program'],
  effects: [{ type: 'gain_credits', value: 3 }],
  description: 'Gain 3 credits.',
};

export const HACKER_DEN: Card = {
  id: 'hacker_den',
  name: 'Hacker Den',
  cost: 5,
  faction: 'Runner',
  cardType: 'Install',
  keywords: ['Rare', 'Memory'],
  effects: [
    { type: 'draw_cards', value: 2 },
    { type: 'gain_action', value: 1 }
  ],
  description: 'Draw 2 cards and gain 1 action.',
};

export const AMBUSH_PROTOCOL: Card = {
  id: 'ambush_protocol',
  name: 'Ambush Protocol',
  cost: 4,
  faction: 'Corp',
  cardType: 'Trap',
  keywords: ['Rare', 'ICE'],
  effects: [
    { type: 'set_trap', value: 1 },
    { type: 'damage_opponent', value: 3 }
  ],
  description: 'Can be played face down. When revealed, deal 3 damage to opponent.',
  isFaceDown: false
};

export const BACKDOOR: Card = {
  id: 'backdoor',
  name: 'Backdoor',
  cost: 3,
  faction: 'Runner',
  cardType: 'Program',
  keywords: ['Stealth', 'Rare'],
  effects: [
    { type: 'stealth_bypass', value: 1 },
    { type: 'draw_cards', value: 1 }
  ],
  description: 'Bypass one ICE card. Draw a card.',
  riskLevel: 1
};

export const RISKY_HACK: Card = {
  id: 'risky_hack',
  name: 'Risky Hack',
  cost: 4,
  faction: 'Runner',
  cardType: 'Event',
  keywords: ['Virus', 'Epic'],
  effects: [
    { type: 'push_luck', value: 3 },
    { type: 'gain_credits', value: 2 }
  ],
  description: 'Push your luck: Draw up to 3 cards. For each card drawn, 20% chance to take 1 damage.',
  riskLevel: 3
};

export const TRACE_PROGRAM: Card = {
  id: 'trace_program',
  name: 'Trace Program',
  cost: 5,
  faction: 'Corp',
  cardType: 'Program',
  keywords: ['ICE', 'Rare'],
  effects: [
    { type: 'trace', value: 2 },
    { type: 'force_discard', value: 1 }
  ],
  description: 'Trace opponent for 2. If successful, they discard a card and you draw a card.',
};

// Market card pool - all cards available for purchase
export const MARKET_CARD_POOL: Card[] = [
  CRYPTO_WALLET,
  DARK_MARKET,
  STREET_THUG,
  MALICIOUS_CODE,
  DATA_BREACH,
  FIREWALL,
  SYSTEM_PURGE,
  NEURAL_IMPLANT,
  CORPORATE_FUNDING,
  HACKER_DEN,
  AMBUSH_PROTOCOL,
  BACKDOOR,
  RISKY_HACK,
  TRACE_PROGRAM
];

// Get starting deck for players
export function getStartingDeck(): Card[] {
  // Standard starting deck: 7 Credit Chips and 3 Personal Data
  return [
    { ...CREDIT_CHIP },
    { ...CREDIT_CHIP },
    { ...CREDIT_CHIP },
    { ...CREDIT_CHIP },
    { ...CREDIT_CHIP },
    { ...CREDIT_CHIP },
    { ...CREDIT_CHIP },
    { ...PERSONAL_DATA },
    { ...PERSONAL_DATA },
    { ...PERSONAL_DATA }
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
