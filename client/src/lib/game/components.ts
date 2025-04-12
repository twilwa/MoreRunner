// Card Component System for Cyberpunk Deck-Builder
// This implements an entity-component architecture for card mechanics

import { Card, CardKeyword, CardFaction, CardType } from './cards';

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
    // Implementation for market zone behavior
  }
}

// Discard Zone - card is in discard pile
export class InDiscardZone extends ZoneComponent {
  constructor() {
    super('inDiscard');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    // Implementation for discard zone behavior
  }
}

// Deck Zone - card is in player's deck
export class InDeckZone extends ZoneComponent {
  constructor(public deckPosition?: number) {
    super('inDeck');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    // Implementation for deck zone behavior
  }
}

// Hand Zone - card is in player's hand
export class InHandZone extends ZoneComponent {
  constructor() {
    super('inHand');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    // Implementation for hand zone behavior
  }
}

// Queue Zone - card is in the execution queue
export class InQueueZone extends ZoneComponent {
  constructor(public queuePosition: number = 0) {
    super('inQueue');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    context.queuePosition = this.queuePosition;
    // Implementation for queue zone behavior
  }
}

// Play Zone - card is in the play area
export class InPlayZone extends ZoneComponent {
  constructor() {
    super('inPlay');
  }
  
  apply(context: GameContext): void {
    super.apply(context);
    // Implementation for play zone behavior
  }
}

// ----- TARGET COMPONENTS -----

export class SingleEntityTarget implements Component {
  type = 'SingleEntityTarget';
  
  constructor(
    public targetType: 'player' | 'opponent' | 'threat' | 'card',
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
        case 'player':
          context.targets = [context.player];
          break;
        case 'opponent':
          // Select the first opponent by default
          context.targets = context.opponents.length > 0 ? [context.opponents[0]] : [];
          break;
        case 'threat':
          // Select threats based on filter or first threat by default
          if (context.locationThreats && context.locationThreats.length > 0) {
            context.targets = this.filter 
              ? context.locationThreats.filter(this.filter)
              : [context.locationThreats[0]];
          }
          break;
        case 'card':
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
    public riskType: 'health' | 'resources' | 'cards',
    public rewardType: 'credits' | 'damage' | 'cards' | 'actions' | 'resources_and_cards',
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
      case 'credits':
        if (context.player.credits !== undefined) {
          context.player.credits += this.rewardAmount;
          context.log(`${context.player.name} gained ${this.rewardAmount} credits.`);
        }
        break;
        
      case 'damage':
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
        
      case 'cards':
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
        
      case 'actions':
        if (context.player.actions !== undefined) {
          context.player.actions += this.rewardAmount;
          context.log(`${context.player.name} gained ${this.rewardAmount} action(s).`);
        }
        break;
        
      case 'resources_and_cards':
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
      case 'health':
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
        
      case 'resources':
        if (context.player.credits !== undefined) {
          // Lose credits, but don't go below 0
          const amountToLose = Math.min(context.player.credits, this.riskAmount);
          context.player.credits -= amountToLose;
          context.log(`${context.player.name} lost ${amountToLose} credits from the failed risk.`);
        }
        break;
        
      case 'cards':
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