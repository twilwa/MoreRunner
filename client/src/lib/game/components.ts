// Card Component System for Cyberpunk Deck-Builder
// This implements an entity-component architecture for card mechanics

import { Card, CardKeyword, CardFaction, CardType } from './cards';

// ----- ENUMS FOR COMPONENT TYPES -----

export enum TargetType {
  Player = 'player',
  Opponent = 'opponent',
  Threat = 'threat',
  Card = 'card',
}

export enum RiskType {
  Health = 'health',
  Resources = 'resources',
  Cards = 'cards',
}

export enum RewardType {
  Credits = 'credits',
  Damage = 'damage',
  Cards = 'cards',
  Actions = 'actions',
  ResourcesAndCards = 'resources_and_cards',
}

export enum DamageType {
  Meat = 'Meat',
  Net = 'Net',
  Brain = 'Brain',
}

// Game context passed to components when they are applied
export interface GameContext {
  card: Card;
  player: any; // Replace with proper Player type
  opponents: any[]; // Replace with proper Player type array
  targets: any[]; // Selected targets
  cardsInPlay: Card[];
  locationThreats?: any[]; // Location threats if any
  queuePosition?: number; // Position in the execution queue
  executionPaused: boolean; // Whether execution is paused for player input
  awaitingTargetSelection: boolean; // Whether waiting for player to select targets
  gameState: any; // Full game state object
  log: (message: string) => void; // For logging game events
  recentlyTrashed?: Card; // Card that was recently trashed (for RecycleGain component)
}

// Enhanced card with components
export interface EnhancedCard extends Card {
  components: Component[];
}

// Zone types for the inZone component system
export type CardZone = 'inMarket' | 'inDiscard' | 'inDeck' | 'inHand' | 'inQueue' | 'inPlay';

// Base Component interface
export interface Component {
  type: string;
  apply(context: GameContext): void;
}

// ----- ZONE COMPONENTS -----

// Base Zone component - abstract class for all zone components
export abstract class ZoneComponent implements Component {
  type: string;
  zone: CardZone;
  
  constructor(zone: CardZone) {
    this.zone = zone;
    this.type = `${zone}Zone`;
  }
  
  apply(context: GameContext): void {
    console.log(`Card ${context.card.name} is in zone ${this.zone}`);
  }
}

// Market Zone - card can be bought from market with credits
export class InMarketZone extends ZoneComponent {
  constructor() {
    super('inMarket');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    
    // Market zone behavior:
    // - Cards in the market can be purchased with credits
    // - They cannot be played directly
    // - They remain in market until purchased or cycled

    // Credit validation - check if player has enough credits to buy the card
    // ONLY credit costs are validated in market zone
    const hasCreditCost = context.card.components?.some(comp => comp.type === 'CreditCost');
    
    // If no custom credit cost component, use the default card.cost property
    if (!hasCreditCost && context.card.cost > 0) {
      const hasSufficientCredits = context.player.credits >= context.card.cost;
      
      if (!hasSufficientCredits) {
        console.log(`Warning: ${context.card.name} requires ${context.card.cost} credits but player only has ${context.player.credits}.`);
        context.executionPaused = true;
        context.log(`Not enough credits to buy ${context.card.name}.`);
        return;
      }
    }
    
    // When a card is in the market, add a log message
    context.log(`${context.card.name} is available for purchase in the market for ${context.card.cost} credits.`);
    
    // Cards in market can't move to play zone directly
    // Market cards can only be purchased, not played
  }
}

// Discard Zone - card is in discard pile
export class InDiscardZone extends ZoneComponent {
  constructor() {
    super('inDiscard');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    
    // Discard zone behavior:
    // - Cards in discard can't be played directly
    // - They can be retrieved by specific effects
    // - The discard pile is public information

    // Log when card moves to discard - only if not already there
    if (context.recentlyTrashed === context.card) {
      context.log(`${context.card.name} was trashed to the discard pile.`);
    }
    
    // When in recycling phase, some cards might trigger effects from discard
    // Using Runner faction as equivalent to Anarchs in our game
    const isAnarchCard = context.card.faction === 'Runner'; 
    // For recycling mechanics - using 'Virus' as our equivalent for recycle
    const hasRecycleKeyword = context.card.keywords?.includes('Virus');
    
    if (isAnarchCard && hasRecycleKeyword) {
      context.log(`${context.card.name} is in the discard pile. Anarch cards with Recycle keyword may have special abilities when trashed.`);
    }
  }
}

// Deck Zone - card is in player's deck
export class InDeckZone extends ZoneComponent {
  constructor(public deckPosition?: number) {
    super('inDeck');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    
    // Deck zone behavior:
    // - Cards in deck are hidden information
    // - They can be drawn or manipulated by effects
    // - Some effects can look at or arrange the top cards
    
    // If deckPosition is defined, we might want to track position in the deck
    if (this.deckPosition !== undefined) {
      // For "look at top X cards" type effects
      if (this.deckPosition === 0) {
        context.log(`${context.card.name} is on top of the deck.`);
      } else if (this.deckPosition === 1) {
        context.log(`${context.card.name} is the second card from the top of the deck.`);
      } else {
        context.log(`${context.card.name} is ${this.deckPosition+1} cards from the top of the deck.`);
      }
    } else {
      // If we're just generic "in deck"
      console.log(`${context.card.name} is somewhere in the deck.`);
    }
    
    // Cards in deck cannot be played directly
    // They need to be drawn first
  }
}

// Hand Zone - card is in player's hand
export class InHandZone extends ZoneComponent {
  constructor() {
    super('inHand');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    
    // Hand zone behavior:
    // - Cards in hand are only visible to their owner
    // - They can be played when action requirements are met
    // - They can be targeted by hand disruption effects
    
    // Check if this card can be played from hand based on actions only
    // Credit costs are ONLY checked in market, not here
    const canPlay = context.player.actions > 0;
                    
    if (canPlay) {
      console.log(`${context.card.name} can be played from hand (actions available).`);
    } else {
      console.log(`${context.card.name} cannot be played from hand (no actions left).`);
    }
    
    // Apply any effects specific to cards while they're in hand
    // (for example, some cards might have abilities that work from hand)
    // Using 'Stealth' for cards that can be played as reactions from hand
    const hasHandAbility = context.card.keywords?.includes('Stealth');
    if (hasHandAbility) {
      console.log(`${context.card.name} has abilities that can be used from hand.`);
    }
  }
}

// Queue Zone - card is in the execution queue
export class InQueueZone extends ZoneComponent {
  constructor(public queuePosition: number = 0) {
    super('inQueue');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    
    // Queue zone behavior:
    // - Cards in queue are waiting to be executed
    // - They have been committed (removed from hand) but not yet resolved
    // - ONLY ACTION costs are checked here; credit costs are checked in market zone
    
    // Set queue position in the context
    context.queuePosition = this.queuePosition;
    
    // Log card's position in the queue (for debugging)
    console.log(`${context.card.name} is in execution queue at position ${this.queuePosition}.`);
    
    // Check if this card has a specific action cost component
    const hasActionCost = context.card.components?.some(comp => comp.type === 'ActionCost');
    
    // By default, all cards require at least 1 action to play unless they have an explicit action cost of 0
    // Credit Chip is a special case as it requires 0 actions
    if (!hasActionCost && context.card.name !== 'Credit Chip') {
      // Check if player has at least 1 action
      const hasSufficientActions = context.player.actions >= 1;
      
      if (!hasSufficientActions) {
        console.log(`Warning: ${context.card.name} requires 1 action but player has ${context.player.actions}.`);
        context.executionPaused = true;
        context.log(`Not enough actions to play ${context.card.name}.`);
        return;
      }
    }
    
    // Special handling for cards with targeting components
    const hasTargeting = context.card.components?.some(comp => 
      comp.type === 'SingleEntityTarget' || 
      comp.type === 'MultiEntityTarget'
    );
    
    if (hasTargeting) {
      console.log(`${context.card.name} has targeting components and may pause execution for targeting.`);
    }
    
    // Cards in queue zone might have special abilities that trigger while waiting
    // Using 'Virus' keyword for cards that have prep effects
    const hasPrepEffect = context.card.keywords?.includes('Virus');
    if (hasPrepEffect) {
      console.log(`${context.card.name} has a Virus effect that triggers while in the queue.`);
    }
  }
}

// Play Zone - card is in the play area
export class InPlayZone extends ZoneComponent {
  constructor() {
    super('inPlay');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    
    // Play zone behavior:
    // - Cards in play are active and their effects are ongoing
    // - They can be targeted by other cards
    // - They may have activation abilities
    // - They remain in play until trashed, returned to hand, or the game ends
    
    // Log when a card enters play zone (usually only happens once when a card resolves)
    console.log(`${context.card.name} is in play and active.`);
    
    // Handle persistent effects
    
    // Check for activation abilities that can be used while in play
    // Use proper CardType from our system - check if the card has specific keywords
    const hasActivation = context.card.keywords.includes('Program') || context.card.keywords.includes('Hardware');
    
    if (hasActivation) {
      console.log(`${context.card.name} has abilities that can be activated while in play.`);
    }
    
    // Handle installed card mechanics (for hardware, programs, etc.)
    // We need to check the card effects to determine duration since it's not a direct property
    const hasTimedEffect = context.card.effects.some(e => e.type === 'gain_action' || e.type === 'draw_cards');
    if (hasTimedEffect) {
      console.log(`${context.card.name} has timed effects that will activate during play.`);
    } else {
      console.log(`${context.card.name} has permanent effects while in play.`);
    }
    
    // Cards in play contribute to faction synergies
    const faction = context.card.faction || 'neutral';
    console.log(`${context.card.name} contributes to ${faction} faction synergies.`);
  }
}

// ----- TARGET COMPONENTS -----

export class SingleEntityTarget implements Component {
  type = 'SingleEntityTarget';
  
  constructor(
    public targetType: TargetType,
    public allowTargetSelection: boolean = true,
    public filter?: (target: any) => boolean
  ) {}
  
  apply(context: GameContext): void {
    console.log(`SingleEntityTarget applying for ${context.card.name}, target type: ${this.targetType}, allow selection: ${this.allowTargetSelection}`);
    
    // Check if targets are already provided in context
    if (context.targets && context.targets.length > 0) {
      console.log("Targets already provided in context, skipping pause:", context.targets);
      return; // Skip target selection if targets are already available
    }
    
    if (this.allowTargetSelection) {
      // Signal that we need player input for target selection
      console.log(`Pausing execution for target selection (${this.targetType})`);
      context.executionPaused = true;
      context.awaitingTargetSelection = true;
      context.log(`Selecting target for ${context.card.name}...`);
      
      // This will be completed when player selects a target
      // The target will be stored in context.targets
      return; // Exit early to ensure no more components are processed
    } else {
      // Auto-select target based on target type
      switch (this.targetType) {
        case TargetType.Player:
          context.targets = [context.player];
          break;
        case TargetType.Opponent:
          // Select the first opponent by default
          context.targets = context.opponents.length > 0 ? [context.opponents[0]] : [];
          break;
        case TargetType.Threat:
          // Select threats based on filter or first threat by default
          if (context.locationThreats && context.locationThreats.length > 0) {
            context.targets = this.filter 
              ? context.locationThreats.filter(this.filter)
              : [context.locationThreats[0]];
          }
          break;
        case TargetType.Card:
          // Select cards based on filter
          if (this.filter && context.cardsInPlay.length > 0) {
            context.targets = context.cardsInPlay.filter(this.filter);
          }
          break;
      }
    }
  }
}

export class MultiEntityTarget implements Component {
  type = 'MultiEntityTarget';
  
  constructor(
    public targetType: 'players' | 'opponents' | 'threats' | 'cards',
    public maxTargets: number = Infinity,
    public allowTargetSelection: boolean = true,
    public filter?: (target: any) => boolean
  ) {}
  
  apply(context: GameContext): void {
    console.log(`MultiEntityTarget applying for ${context.card.name}, target type: ${this.targetType}, max targets: ${this.maxTargets}`);
    
    // Check if targets are already provided in context
    if (context.targets && context.targets.length > 0) {
      console.log("Targets already provided in context, skipping pause:", context.targets);
      return; // Skip target selection if targets are already available
    }
    
    if (this.allowTargetSelection) {
      // Signal that we need player input for target selection
      console.log(`Pausing execution for multiple target selection (${this.targetType})`);
      context.executionPaused = true;
      context.awaitingTargetSelection = true;
      context.log(`Select up to ${this.maxTargets} targets for ${context.card.name}...`);
      
      // This will be completed when player selects targets
      // The targets will be stored in context.targets
      return; // Exit early to ensure no more components are processed
    } else {
      // Auto-select targets based on target type
      let candidateTargets: any[] = [];
      
      switch (this.targetType) {
        case 'players':
          candidateTargets = [context.player, ...context.opponents];
          break;
        case 'opponents':
          candidateTargets = [...context.opponents];
          break;
        case 'threats':
          candidateTargets = context.locationThreats || [];
          break;
        case 'cards':
          candidateTargets = context.cardsInPlay;
          break;
      }
      
      // Apply filter if provided
      if (this.filter) {
        candidateTargets = candidateTargets.filter(this.filter);
      }
      
      // Limit to max targets
      context.targets = candidateTargets.slice(0, this.maxTargets);
    }
  }
}

export class SelfTarget implements Component {
  type = 'SelfTarget';
  
  apply(context: GameContext): void {
    // Target the player who played the card
    context.targets = [context.player];
  }
}

// ----- COST COMPONENTS -----

export class CreditCost implements Component {
  type = 'CreditCost';
  
  constructor(public amount: number) {}
  
  apply(context: GameContext): void {
    // Check if player has enough credits
    if (context.player.credits >= this.amount) {
      context.player.credits -= this.amount;
      context.log(`Paid ${this.amount} credits to play ${context.card.name}.`);
    } else {
      // Not enough credits, cancel card
      context.log(`Not enough credits to play ${context.card.name}.`);
      // Mark execution as failed
      context.executionPaused = true; // This will be handled differently in the actual implementation
    }
  }
}

export class ActionCost implements Component {
  type = 'ActionCost';
  
  constructor(public amount: number = 1) {}
  
  apply(context: GameContext): void {
    // Check if player has enough actions
    if (context.player.actions >= this.amount) {
      context.player.actions -= this.amount;
      context.log(`Used ${this.amount} action(s) to play ${context.card.name}.`);
    } else {
      // Not enough actions, cancel card
      context.log(`Not enough actions to play ${context.card.name}.`);
      // Mark execution as failed
      context.executionPaused = true; // This will be handled differently in the actual implementation
    }
  }
}

export class HealthCost implements Component {
  type = 'HealthCost';

  constructor(public amount: number, public damageType: DamageType) {}


  canApply(context: GameContext): boolean {
    // Allow if player has more health than the cost (prevents self-defeat)
    return context.player.health > this.amount;
  }

  apply(context: GameContext): void {
    if (!this.canApply(context)) {
      context.log(`Cannot pay health cost: Taking ${this.amount} ${this.damageType} damage would defeat you.`);
      context.executionPaused = true;
      return;
    }
    context.player.health -= this.amount;
    context.log(`Paid ${this.amount} ${this.damageType} damage to play ${context.card.name}.`);
  }
}

export class KeywordRequirement implements Component {
  type = 'KeywordRequirement';
  
  constructor(
    public keyword: CardKeyword,
    public count: number = 1,
    public location: 'play' | 'hand' | 'discard' = 'play'
  ) {}
  
  apply(context: GameContext): void {
    let cardsToCheck: Card[] = [];
    
    // Determine which cards to check based on location
    switch (this.location) {
      case 'play':
        cardsToCheck = context.cardsInPlay;
        break;
      case 'hand':
        cardsToCheck = context.player.hand;
        break;
      case 'discard':
        cardsToCheck = context.player.discard;
        break;
    }
    
    // Count cards with the required keyword
    const matchCount = cardsToCheck.filter(card => 
      card.keywords.includes(this.keyword)
    ).length;
    
    // Check if requirement is met
    if (matchCount >= this.count) {
      context.log(`Requirement met: Found ${matchCount} ${this.keyword} card(s).`);
    } else {
      context.log(`Requirement not met: Need ${this.count} ${this.keyword} card(s), found ${matchCount}.`);
      // Mark execution as failed
      context.executionPaused = true; // This will be handled differently in the actual implementation
    }
  }
}

export class TrashCost implements Component {
  type = 'TrashCost';
  
  constructor(
    public targetType: 'program' | 'hardware' | 'resource' | 'self' | 'any',
    public specific: boolean = false,
    public specificType?: string // Keyword or other filter
  ) {}
  
  apply(context: GameContext): void {
    // If self-trash (the card trashes itself)
    if (this.targetType === 'self') {
      // First check if card is in play
      const cardIndex = context.cardsInPlay.findIndex(c => c.id === context.card.id);
      if (cardIndex >= 0) {
        // Remove card from play
        const trashCard = context.cardsInPlay.splice(cardIndex, 1)[0];
        // Add to discard pile if player has one
        if (context.player.discard) {
          context.player.discard.push(trashCard);
        }
        context.log(`${context.card.name} was trashed as part of its cost.`);
      } else {
        context.log(`${context.card.name} cannot trash itself (not in play).`);
        context.executionPaused = true; // Fail execution
      }
      return;
    }
    
    // For all other trash costs, we need to select a card
    // If we already have targets selected, use those
    if (context.targets && context.targets.length > 0 && context.targets[0].cardType) {
      const targetCard = context.targets[0];
      
      // Validate target matches required type
      let isValidTarget = true;
      if (this.targetType !== 'any' && targetCard.cardType !== this.targetType) {
        isValidTarget = false;
      }
      
      if (this.specific && this.specificType && 
          !(targetCard.keywords && targetCard.keywords.some((k: string) => k === this.specificType as any))) {
        isValidTarget = false;
      }
      
      if (isValidTarget) {
        // Find card in play
        const cardIndex = context.cardsInPlay.findIndex(c => c.id === targetCard.id);
        if (cardIndex >= 0) {
          // Remove card from play
          const trashCard = context.cardsInPlay.splice(cardIndex, 1)[0];
          // Add to discard pile if player has one
          if (context.player.discard) {
            context.player.discard.push(trashCard);
          }
          context.log(`${targetCard.name} was trashed as part of ${context.card.name}'s cost.`);
        } else {
          context.log(`${targetCard.name} is not in play and cannot be trashed.`);
          context.executionPaused = true; // Fail execution
        }
      } else {
        context.log(`${targetCard.name} is not a valid trash target (wrong type).`);
        context.executionPaused = true; // Fail execution
      }
    } else {
      // No targets selected yet, pause execution for player input
      context.executionPaused = true;
      context.awaitingTargetSelection = true;
      
      let targetTypeDescription = this.targetType;
      if (this.specific && this.specificType) {
        // Use concatenation instead of template literals to avoid LSP issues
        targetTypeDescription = this.specificType + " " + this.targetType;
      }
      
      context.log(`Select a ${targetTypeDescription} card to trash.`);
    }
  }
}

// ----- EFFECT COMPONENTS -----

export class GainCredits implements Component {
  type = 'GainCredits';
  
  constructor(public amount: number) {}
  
  apply(context: GameContext): void {
    context.targets.forEach(target => {
      if (target.credits !== undefined) {
        target.credits += this.amount;
        context.log(`${target.name} gained ${this.amount} credits.`);
      }
    });
  }
}

export class DealDamage implements Component {
  type = 'DealDamage';
  
  constructor(public amount: number) {}
  
  apply(context: GameContext): void {
    context.targets.forEach(target => {
      if (target.health !== undefined) {
        target.health -= this.amount;
        context.log(`${context.card.name} dealt ${this.amount} damage to ${target.name}.`);
        
        // Check if target is defeated
        if (target.health <= 0) {
          context.log(`${target.name} was defeated!`);
          // Handle defeat logic here or in a separate component
        }
      }
    });
  }
}

export class PreventDamage implements Component {
  type = 'PreventDamage';
  
  constructor(public amount: number) {}
  
  apply(context: GameContext): void {
    context.targets.forEach(target => {
      if (target.damageProtection !== undefined) {
        target.damageProtection += this.amount;
        context.log(`${target.name} is protected from the next ${this.amount} damage.`);
      } else {
        target.damageProtection = this.amount;
        context.log(`${target.name} is now protected from the next ${this.amount} damage.`);
      }
    });
  }
}

export class DrawCards implements Component {
  type = 'DrawCards';
  
  constructor(public amount: number) {}
  
  apply(context: GameContext): void {
    context.targets.forEach(target => {
      if (target.drawCard) {
        // Assuming target has a drawCard method
        for (let i = 0; i < this.amount; i++) {
          const cardDrawn = target.drawCard();
          if (cardDrawn) {
            context.log(`${target.name} drew ${cardDrawn.name}.`);
          } else {
            context.log(`${target.name} couldn't draw a card (deck empty).`);
            break;
          }
        }
      } else {
        // Fallback for targets without drawCard method
        context.log(`${target.name} attempted to draw ${this.amount} cards.`);
      }
    });
  }
}

export class DiscardCards implements Component {
  type = 'DiscardCards';
  
  constructor(
    public amount: number,
    public random: boolean = false
  ) {}
  
  apply(context: GameContext): void {
    context.targets.forEach(target => {
      if (target.hand && target.discard) {
        if (this.random) {
          // Random discard
          for (let i = 0; i < Math.min(this.amount, target.hand.length); i++) {
            const randomIndex = Math.floor(Math.random() * target.hand.length);
            const discardedCard = target.hand.splice(randomIndex, 1)[0];
            target.discard.push(discardedCard);
            context.log(`${target.name} randomly discarded ${discardedCard.name}.`);
          }
        } else {
          // Player chooses which cards to discard
          // This requires player interaction, so we pause execution
          if (target === context.player) {
            context.executionPaused = true;
            context.awaitingTargetSelection = true;
            context.log(`Select ${this.amount} card(s) to discard.`);
            // The actual discard will happen when player selects cards
          } else {
            // For AI or other players, just discard from the beginning of hand
            for (let i = 0; i < Math.min(this.amount, target.hand.length); i++) {
              const discardedCard = target.hand.shift();
              target.discard.push(discardedCard);
              context.log(`${target.name} discarded ${discardedCard.name}.`);
            }
          }
        }
      }
    });
  }
}

export class GainAction implements Component {
  type = 'GainAction';
  
  constructor(public amount: number) {}
  
  apply(context: GameContext): void {
    context.targets.forEach(target => {
      if (target.actions !== undefined) {
        target.actions += this.amount;
        context.log(`${target.name} gained ${this.amount} action(s).`);
      }
    });
  }
}

export class RecycleGain implements Component {
  type = 'RecycleGain';
  
  constructor(
    public resourceType: 'credits' | 'cards' | 'actions',
    public amount: number,
    public bonusFromCardCost: boolean = false,
    public bonusMultiplier: number = 0.5 // By default gain 50% of the trashed card's cost
  ) {}
  
  apply(context: GameContext): void {
    // Check if there's a recently trashed card in the execution context
    // This requires extension of GameContext with a recentlyTrashed property
    const trashedCard = context.recentlyTrashed || { cost: 0, name: "unknown card" };
    
    // Calculate bonus from trashed card if applicable
    let totalAmount = this.amount;
    if (this.bonusFromCardCost && 'cost' in trashedCard) {
      const bonus = Math.floor(trashedCard.cost * this.bonusMultiplier);
      totalAmount += bonus;
      const cardName = 'name' in trashedCard ? trashedCard.name : "unknown card";
      context.log(`${context.card.name} gained a bonus of ${bonus} from recycling ${cardName}.`);
    }
    
    // Apply the resource gain based on type
    switch (this.resourceType) {
      case 'credits':
        if (context.player.credits !== undefined) {
          context.player.credits += totalAmount;
          context.log(`${context.player.name} gained ${totalAmount} credits from recycling.`);
        }
        break;
        
      case 'cards':
        if (context.player.drawCard) {
          for (let i = 0; i < totalAmount; i++) {
            const cardDrawn = context.player.drawCard();
            if (cardDrawn) {
              context.log(`${context.player.name} drew ${cardDrawn.name} from recycling.`);
            } else {
              context.log(`${context.player.name} couldn't draw a card (deck empty).`);
              break;
            }
          }
        }
        break;
        
      case 'actions':
        if (context.player.actions !== undefined) {
          context.player.actions += totalAmount;
          context.log(`${context.player.name} gained ${totalAmount} action(s) from recycling.`);
        }
        break;
    }
  }
}

// ----- CONDITIONAL COMPONENTS -----

export class KeywordSynergy implements Component {
  type = 'KeywordSynergy';
  
  constructor(
    public keyword: CardKeyword,
    public targetComponent: string,
    public bonusAmount: number
  ) {}
  
  apply(context: GameContext): void {
    // Check if any card in play has the required keyword
    const hasKeyword = context.cardsInPlay.some(card => 
      card.id !== context.card.id && card.keywords.includes(this.keyword)
    );
    
    if (hasKeyword) {
      // Find the target component to enhance
      const component = context.card.components?.find((comp: Component) => comp.type === this.targetComponent);
      if (component && 'amount' in component) {
        // Temporarily increase the amount for this execution
        const originalAmount = (component as any).amount;
        (component as any).amount += this.bonusAmount;
        
        context.log(`${context.card.name} gained +${this.bonusAmount} to ${this.targetComponent} from ${this.keyword} synergy.`);
        
        // Reset after execution (this would be handled differently in the actual implementation)
        setTimeout(() => {
          component.amount = originalAmount;
        }, 0);
      }
    }
  }
}

export class RiskReward implements Component {
  type = 'RiskReward';
  
  constructor(
    public riskType: RiskType,
    public rewardType: RewardType,
    public chance: number, // 0 to 100
    public riskAmount: number = 1,
    public rewardAmount: number = 3
  ) {}
  
  apply(context: GameContext): void {
    // Roll for success
    const roll = Math.floor(Math.random() * 100) + 1;
    const isSuccess = roll <= this.chance;
    
    // Log the roll
    context.log(`${context.card.name}: Risk roll: ${roll} (Need ${this.chance} or lower)`);
    
    if (isSuccess) {
      // Success: Apply reward
      context.log(`${context.card.name}: Success! Applying reward.`);
      this.applyReward(context);
    } else {
      // Failure: Apply risk
      context.log(`${context.card.name}: Failed! Applying penalty.`);
      this.applyRisk(context);
    }
  }
  
  private applyReward(context: GameContext): void {
    // Apply reward based on reward type
    switch (this.rewardType) {
      case RewardType.Credits:
        if (context.player.credits !== undefined) {
          context.player.credits += this.rewardAmount;
          context.log(`${context.player.name} gained ${this.rewardAmount} credits.`);
        }
        break;
        
      case RewardType.Damage:
        // Apply damage to each target
        context.targets.forEach(target => {
          if (target.health !== undefined) {
            target.health -= this.rewardAmount;
            context.log(`${context.card.name} dealt ${this.rewardAmount} damage to ${target.name}.`);
            
            // Check if target is defeated
            if (target.health <= 0) {
              context.log(`${target.name} was defeated!`);
            }
          }
        });
        break;
        
      case RewardType.Cards:
        // Draw cards
        if (context.player.drawCard) {
          for (let i = 0; i < this.rewardAmount; i++) {
            const cardDrawn = context.player.drawCard();
            if (cardDrawn) {
              context.log(`${context.player.name} drew ${cardDrawn.name}.`);
            } else {
              context.log(`${context.player.name} couldn't draw a card (deck empty).`);
              break;
            }
          }
        }
        break;
        
      case RewardType.Actions:
        if (context.player.actions !== undefined) {
          context.player.actions += this.rewardAmount;
          context.log(`${context.player.name} gained ${this.rewardAmount} action(s).`);
        }
        break;
        
      case RewardType.ResourcesAndCards:
        // Combination reward - both credits and cards
        if (context.player.credits !== undefined) {
          context.player.credits += this.rewardAmount;
          context.log(`${context.player.name} gained ${this.rewardAmount} credits.`);
        }
        
        if (context.player.drawCard) {
          // Draw half as many cards as the reward amount (minimum 1)
          const cardsToDraw = Math.max(1, Math.floor(this.rewardAmount / 2));
          for (let i = 0; i < cardsToDraw; i++) {
            const cardDrawn = context.player.drawCard();
            if (cardDrawn) {
              context.log(`${context.player.name} drew ${cardDrawn.name}.`);
            } else {
              context.log(`${context.player.name} couldn't draw a card (deck empty).`);
              break;
            }
          }
        }
        break;
    }
  }
  
  private applyRisk(context: GameContext): void {
    // Apply risk based on risk type
    switch (this.riskType) {
      case RiskType.Health:
        if (context.player.health !== undefined) {
          context.player.health -= this.riskAmount;
          context.log(`${context.player.name} took ${this.riskAmount} damage from the failed risk.`);
          
          // Check if player is defeated
          if (context.player.health <= 0) {
            context.log(`${context.player.name} was defeated!`);
            // Handle player defeat logic
          }
        }
        break;
        
      case RiskType.Resources:
        if (context.player.credits !== undefined) {
          // Lose credits, but don't go below 0
          const amountToLose = Math.min(context.player.credits, this.riskAmount);
          context.player.credits -= amountToLose;
          context.log(`${context.player.name} lost ${amountToLose} credits from the failed risk.`);
        }
        break;
        
      case RiskType.Cards:
        if (context.player.hand && context.player.discard) {
          // Random discard
          for (let i = 0; i < Math.min(this.riskAmount, context.player.hand.length); i++) {
            const randomIndex = Math.floor(Math.random() * context.player.hand.length);
            const discardedCard = context.player.hand.splice(randomIndex, 1)[0];
            context.player.discard.push(discardedCard);
            context.log(`${context.player.name} randomly discarded ${discardedCard.name} from the failed risk.`);
          }
        }
        break;
    }
  }
}

export class ComboEffect implements Component {
  type = 'ComboEffect';
  
  constructor(
    public requiredCardType: string, // The type of card needed for combo
    public bonusEffect: {
      type: 'credits' | 'damage' | 'cards' | 'actions',
      amount: number
    }
  ) {}
  
  apply(context: GameContext): void {
    // Check if required card is in play for combo
    const hasComboCard = context.cardsInPlay.some(card => 
      card.id !== context.card.id && (
        card.keywords.some(k => k === this.requiredCardType as any) || 
        card.cardType === this.requiredCardType
      )
    );
    
    if (hasComboCard) {
      context.log(`${context.card.name} activated combo with ${this.requiredCardType}!`);
      
      // Apply bonus effect
      switch (this.bonusEffect.type) {
        case 'credits':
          if (context.player.credits !== undefined) {
            context.player.credits += this.bonusEffect.amount;
            context.log(`${context.player.name} gained ${this.bonusEffect.amount} credits from combo effect.`);
          }
          break;
          
        case 'damage':
          context.targets.forEach(target => {
            if (target.health !== undefined) {
              target.health -= this.bonusEffect.amount;
              context.log(`${context.card.name} dealt ${this.bonusEffect.amount} additional damage to ${target.name} from combo effect.`);
            }
          });
          break;
          
        case 'cards':
          if (context.player.drawCard) {
            for (let i = 0; i < this.bonusEffect.amount; i++) {
              const cardDrawn = context.player.drawCard();
              if (cardDrawn) {
                context.log(`${context.player.name} drew ${cardDrawn.name} from combo effect.`);
              } else {
                context.log(`${context.player.name} couldn't draw a card (deck empty).`);
                break;
              }
            }
          }
          break;
          
        case 'actions':
          if (context.player.actions !== undefined) {
            context.player.actions += this.bonusEffect.amount;
            context.log(`${context.player.name} gained ${this.bonusEffect.amount} action(s) from combo effect.`);
          }
          break;
      }
    }
  }
}

// ----- CONTROL FLOW COMPONENTS -----

export class PauseQueue implements Component {
  type = 'PauseQueue';
  
  constructor(
    public message: string = "Choose targets to continue."
  ) {}
  
  apply(context: GameContext): void {
    context.executionPaused = true;
    context.awaitingTargetSelection = true; // This was missing!
    context.log(this.message);
  }
}

export class CancelCard implements Component {
  type = 'CancelCard';
  
  constructor(
    public targetCardIndex?: number, // If undefined, requires selection
    public targetCardCondition?: (card: Card) => boolean
  ) {}
  
  apply(context: GameContext): void {
    // If targeting a specific card in the queue
    if (context.gameState.activePlayer.inPlay) {
      const queue = context.gameState.activePlayer.inPlay;
      
      if (this.targetCardIndex !== undefined && this.targetCardIndex < queue.length) {
        // Cancel the specific card
        const canceledCard = queue[this.targetCardIndex];
        queue.splice(this.targetCardIndex, 1);
        context.log(`${context.card.name} canceled ${canceledCard.name}.`);
      }
      // If targeting based on a condition
      else if (this.targetCardCondition) {
        const cancelIndex = queue.findIndex(this.targetCardCondition);
        if (cancelIndex >= 0 && cancelIndex !== context.queuePosition) {
          const canceledCard = queue[cancelIndex];
          queue.splice(cancelIndex, 1);
          context.log(`${context.card.name} canceled ${canceledCard.name}.`);
        }
      }
      // If requiring selection
      else {
        context.executionPaused = true;
        context.awaitingTargetSelection = true;
        context.log('Select a card in the queue to cancel.');
      }
    }
  }
}

// ----- INFORMATION COMPONENTS -----

export class RevealCard implements Component {
  type = 'RevealCard';
  
  apply(context: GameContext): void {
    context.targets.forEach(target => {
      if (target.isFaceDown !== undefined) {
        target.isFaceDown = false;
        context.log(`${context.card.name} revealed ${target.name}.`);
      }
    });
  }
}

export class ScanEntity implements Component {
  type = 'ScanEntity';
  
  constructor(
    public revealFullInfo: boolean = false
  ) {}
  
  apply(context: GameContext): void {
    context.targets.forEach(target => {
      if (this.revealFullInfo) {
        // Provide detailed information about the target
        context.log(`Full scan of ${target.name}:`);
        if (target.health !== undefined) {
          context.log(`Health: ${target.health}`);
        }
        if (target.actionPotentials) {
          context.log(`Action Potential: ${target.actionPotentials.filter(Boolean).length}/${target.actionPotentials.length}`);
        }
        // Add more properties as needed
      } else {
        // Provide basic information
        context.log(`Basic scan of ${target.name}:`);
        if (target.health !== undefined) {
          context.log(`Health: ${target.health}`);
        }
      }
    });
  }
}

// We're using the EnhancedCard interface already defined at the top of the file

// Utility to check if a card is an EnhancedCard
export function isEnhancedCard(card: unknown): card is EnhancedCard {
  return !!card && typeof card === 'object' &&
    'id' in card &&
    'name' in card &&
    'components' in card &&
    Array.isArray((card as any).components);
}

// Function to apply all components of a card
export function executeCardComponents(card: EnhancedCard, context: GameContext): void {
  // Ensure card has components array (dealing with TypeScript null checks)
  const cardComponents = card.components || [];
  
  if (cardComponents.length === 0) {
    context.log(`${card.name} has no components to execute.`);
    return;
  }
  
  console.log(`executeCardComponents for ${card.name}, has ${cardComponents.length} components`);
  
  // Process components in order
  for (const component of cardComponents) {
    console.log(`Applying component: ${component.type}`);
    
    // Skip further processing if execution is paused
    if (context.executionPaused) {
      console.log(`Execution already paused before applying ${component.type} - stopping component execution`);
      break;
    }
    
    component.apply(context);
    
    // Log status after each component
    console.log(`After ${component.type} - executionPaused: ${context.executionPaused}, awaitingTargetSelection: ${context.awaitingTargetSelection}`);
  }
  
  // If execution completed successfully (not paused), move the card to discard
  if (!context.executionPaused && context.gameState) {
    console.log(`Card execution completed for ${card.name}, moving to discard`);
    
    // Get active player
    const activePlayer = context.gameState.players[context.gameState.activePlayerIndex];
    
    // If the card is in play area, move it to discard
    const cardInPlayIndex = activePlayer.inPlay.findIndex((c: any) => c.id === card.id);
    if (cardInPlayIndex >= 0) {
      // Add to discard pile
      console.log(`Moving ${card.name} from play area to discard pile`);
      const cardToDiscard = activePlayer.inPlay[cardInPlayIndex];
      
      // Import cardExecutionService to use the moveCardToZone helper method
      // This will be handled by the cardExecutionService.executeNextCard method
      // since it has direct access to the moveCardToZone helper
      
      console.log(`Card zone transition will be handled by cardExecutionService`);
      
      activePlayer.discard.push(cardToDiscard);
      
      // Update play area (without modifying the original array that could be in use)
      activePlayer.inPlay = [
        ...activePlayer.inPlay.slice(0, cardInPlayIndex),
        ...activePlayer.inPlay.slice(cardInPlayIndex + 1)
      ];
      
      context.log(`${card.name} moved to discard after execution.`);
    }
  }
}

// Factory function to create a card with components
export function createCardWithComponents(
  baseCard: Card,
  components: Component[]
): EnhancedCard {
  return {
    ...baseCard,
    components
  };
}