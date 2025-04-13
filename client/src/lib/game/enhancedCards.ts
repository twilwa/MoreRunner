// Enhanced cards using the component system
import { 
  Card, 
  CREDIT_CHIP, 
  PERSONAL_DATA, 
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
  TRACE_PROGRAM,
  DESPERATE_HACK,
  CIRCUIT_BREAKER
} from './cards';

import {
  EnhancedCard,
  createCardWithComponents,
  SingleEntityTarget,
  MultiEntityTarget,
  SelfTarget,
  TargetsConfirmed, // Add the new TargetsConfirmed component
  CreditCost,
  ActionCost,
  KeywordRequirement,
  TrashCost,
  GainCredits,
  DealDamage,
  PreventDamage,
  DrawCards,
  DiscardCards,
  GainAction,
  KeywordSynergy,
  RiskReward,
  ComboEffect,
  PauseQueue,
  CancelCard,
  RevealCard,
  ScanEntity,
  // Zone components
  InMarketZone,
  InHandZone,
  InDeckZone,
  InDiscardZone,
  InQueueZone,
  InPlayZone,
  GameContext
} from './components';

// Basic Resources
export const ENHANCED_CREDIT_CHIP: EnhancedCard = createCardWithComponents(
  CREDIT_CHIP,
  [
    new SelfTarget(),
    new ActionCost(0), // Credit Chip requires 0 actions to play (special case)
    new GainCredits(1)
  ]
);

// Advanced Cards
export const ENHANCED_MALICIOUS_CODE: EnhancedCard = createCardWithComponents(
  MALICIOUS_CODE,
  [
    // First step: Choose targets
    new SingleEntityTarget('threat', true, threat => threat.health !== undefined),
    // Mark targets as needing confirmation
    new TargetsConfirmed(false),
    
    // Second step: Pay costs (after targets confirmed)
    new CreditCost(5),
    new ActionCost(1),
    
    // Third step: Execute effects (after costs paid)
    new DealDamage(2),
    new KeywordSynergy('Virus', 'DealDamage', 1)
  ]
);

export const ENHANCED_FIREWALL: EnhancedCard = createCardWithComponents(
  FIREWALL,
  [
    new CreditCost(3),
    new ActionCost(1),
    new SelfTarget(),
    new PreventDamage(2),
    new KeywordSynergy('ICE', 'PreventDamage', 1)
  ]
);

export const ENHANCED_CRYPTO_WALLET: EnhancedCard = createCardWithComponents(
  CRYPTO_WALLET,
  [
    new CreditCost(3),
    new ActionCost(1),
    new SelfTarget(),
    new GainCredits(2)
  ]
);

export const ENHANCED_DARK_MARKET: EnhancedCard = createCardWithComponents(
  DARK_MARKET,
  [
    new CreditCost(5),
    new ActionCost(1),
    new SelfTarget(),
    new GainCredits(1),
    new DrawCards(1),
    new GainAction(1)
  ]
);

export const ENHANCED_NEURAL_IMPLANT: EnhancedCard = createCardWithComponents(
  NEURAL_IMPLANT,
  [
    new CreditCost(7),
    new ActionCost(1),
    new SelfTarget(),
    new DrawCards(3),
    new KeywordRequirement('Cyberware', 1),
    // Component for copy card effect would go here
  ]
);

export const ENHANCED_SYSTEM_PURGE: EnhancedCard = createCardWithComponents(
  SYSTEM_PURGE,
  [
    new CreditCost(6),
    new ActionCost(1),
    new SelfTarget(),
    new DrawCards(1),
    new DiscardCards(1, false), // Player chooses which card to discard
    new GainAction(1)
  ]
);

export const ENHANCED_BACKDOOR: EnhancedCard = createCardWithComponents(
  BACKDOOR,
  [
    new CreditCost(3),
    new ActionCost(1),
    new SingleEntityTarget('card', true, card => card.keywords.includes('ICE')),
    // Stealth bypass component would go here
    new DrawCards(1)
  ]
);

export const ENHANCED_TRACE_PROGRAM: EnhancedCard = createCardWithComponents(
  TRACE_PROGRAM,
  [
    // Step 1: Choose targets
    new SingleEntityTarget('opponent', true),
    new TargetsConfirmed(false), // Set to false initially - will be set to true after target selection
    
    // Step 2: Pay costs (after targets confirmed)
    new CreditCost(5),
    new ActionCost(1),
    
    // Step 3: Execute effects (after costs paid)
    // Trace component would go here
    new DiscardCards(1, true) // Random discard
  ]
);

export const ENHANCED_DATA_BREACH: EnhancedCard = createCardWithComponents(
  DATA_BREACH,
  [
    // Step 1: Choose targets
    new MultiEntityTarget('opponents', 1), // Target one opponent
    new TargetsConfirmed(false), // Set to false initially - will be set to true after target selection
    
    // Step 2: Pay costs (after targets confirmed)
    new CreditCost(4),
    new ActionCost(1),
    
    // Step 3: Execute effects (after costs paid)
    new DrawCards(2),
    new DiscardCards(1, true), // Random discard
    new KeywordSynergy('Stealth', 'DiscardCards', 1) // +1 card discard with Stealth synergy
  ]
);

// Example of a new card using components
export const NETWORK_SCANNER: EnhancedCard = createCardWithComponents(
  {
    id: 'network_scanner',
    name: 'Network Scanner',
    cost: 4,
    faction: 'Runner',
    cardType: 'Program',
    keywords: ['Stealth', 'Program'],
    effects: [], // No traditional effects, using components instead
    description: 'Scan a target to reveal its details. Draw a card if you have a Stealth card in play.'
  },
  [
    // Define targeting components first
    new SingleEntityTarget('threat', true),
    
    // Add TargetsConfirmed with default false
    new TargetsConfirmed(false),
    
    // Then cost components
    new CreditCost(4),
    new ActionCost(1),
    
    // Then effect components
    new ScanEntity(true),
    new KeywordRequirement('Stealth', 1, 'play'),
    new DrawCards(1)
  ]
);

export const ICE_BREAKER: EnhancedCard = createCardWithComponents(
  {
    id: 'ice_breaker',
    name: 'ICE Breaker',
    cost: 5,
    faction: 'Runner',
    cardType: 'Program',
    keywords: ['Virus', 'Program'],
    effects: [], // No traditional effects, using components instead
    description: 'Cancel a card with ICE keyword. Deal 2 damage to a corp entity.'
  },
  [
    // Step 1: Choose targets
    new SingleEntityTarget('threat', true, threat => threat.faction === 'Corp'),
    new TargetsConfirmed(false), // Set to false initially - will be set to true after target selection
    
    // Step 2: Pay costs (after targets confirmed)
    new CreditCost(5),
    new ActionCost(1),
    
    // Step 3: Execute effects (after costs paid)
    new CancelCard(undefined, card => card.keywords.includes('ICE')),
    new DealDamage(2)
  ]
);

// New Anarch card showcasing high-risk/high-reward mechanics
export const ENHANCED_DESPERATE_HACK: EnhancedCard = createCardWithComponents(
  DESPERATE_HACK, // Using the base card defined in cards.ts
  [
    // Step 1: Choose targets
    new SingleEntityTarget('threat', true, threat => threat.health !== undefined),
    new TargetsConfirmed(false), // Set to false initially - will be set to true after target selection
    
    // Step 2: Pay costs (after targets confirmed)
    new CreditCost(2), // Cheap but risky
    new ActionCost(1),
    
    // Step 3: Execute effects (after costs paid)
    new RiskReward(
      'health', // Risk type - player takes damage if failed
      'damage', // Reward type - deal damage if successful
      60, // 60% chance of success
      2,  // Take 2 damage on failure
      4   // Deal 4 damage on success
    ),
    new KeywordSynergy('Virus', 'RiskReward', 1) // +1 damage if you have a Virus card
  ]
);

// New Anarch card showcasing trash/recycle mechanics
export const ENHANCED_CIRCUIT_BREAKER: EnhancedCard = createCardWithComponents(
  CIRCUIT_BREAKER, // Using the base card defined in cards.ts
  [
    // Step 1: Choose targets
    new SingleEntityTarget('threat', true, threat => threat.health !== undefined),
    new TargetsConfirmed(false), // Set to false initially - will be set to true after target selection
    
    // Step 2: Pay costs (after targets confirmed)
    new CreditCost(1), // Very cheap because you're sacrificing another card
    new ActionCost(1),
    // TrashCost is handled directly as a cost component
    new TrashCost('program', false), // Trash any program
    
    // Step 3: Execute effects (after costs paid)
    new DealDamage(3), // Base damage value (gets modified in real gameplay based on trashed card's cost)
    new ComboEffect('Virus', { type: 'damage', amount: 1 }) // +1 damage if you have a Virus card in play
  ]
);

// Create a collection of all enhanced cards
export const ENHANCED_CARDS: EnhancedCard[] = [
  ENHANCED_CREDIT_CHIP,
  ENHANCED_MALICIOUS_CODE,
  ENHANCED_FIREWALL,
  ENHANCED_CRYPTO_WALLET,
  ENHANCED_DARK_MARKET,
  ENHANCED_NEURAL_IMPLANT,
  ENHANCED_SYSTEM_PURGE,
  ENHANCED_BACKDOOR,
  ENHANCED_TRACE_PROGRAM,
  ENHANCED_DATA_BREACH,
  NETWORK_SCANNER,
  ICE_BREAKER,
  ENHANCED_DESPERATE_HACK,
  ENHANCED_CIRCUIT_BREAKER
];

// Helper function to get the enhanced version of a card by ID
export function getEnhancedCard(cardId: string): EnhancedCard | undefined {
  return ENHANCED_CARDS.find(card => card.id === cardId);
}

// Function to get a starting deck with enhanced cards
export function getEnhancedStartingDeck(): EnhancedCard[] {
  // Standard starting deck: 7 Credit Chips and 3 Personal Data
  return [
    { ...ENHANCED_CREDIT_CHIP },
    { ...ENHANCED_CREDIT_CHIP },
    { ...ENHANCED_CREDIT_CHIP },
    { ...ENHANCED_CREDIT_CHIP },
    { ...ENHANCED_CREDIT_CHIP },
    { ...ENHANCED_CREDIT_CHIP },
    { ...ENHANCED_CREDIT_CHIP },
    // Personal Data with empty components array to match EnhancedCard interface
    { ...PERSONAL_DATA, components: [] },
    { ...PERSONAL_DATA, components: [] },
    { ...PERSONAL_DATA, components: [] }
  ];
}