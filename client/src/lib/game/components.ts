// Card Component System for Cyberpunk Deck-Builder
// This implements an entity-component architecture for card mechanics

import { Card, CardKeyword, CardFaction } from './cards';

// Base Component interface
export interface Component {
  type: string;
  apply(context: GameContext): void;
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
    if (this.allowTargetSelection) {
      // Signal that we need player input for target selection
      context.executionPaused = true;
      context.awaitingTargetSelection = true;
      
      // This will be completed when player selects a target
      // The target will be stored in context.targets
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
    public filter?: (target: any) => boolean
  ) {}
  
  apply(context: GameContext): void {
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

// ----- CONTROL FLOW COMPONENTS -----

export class PauseQueue implements Component {
  type = 'PauseQueue';
  
  constructor(
    public message: string = "Choose targets to continue."
  ) {}
  
  apply(context: GameContext): void {
    context.executionPaused = true;
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

// Enhanced Card interface with components
export interface EnhancedCard extends Card {
  components?: Component[];
}

// Function to apply all components of a card
export function executeCardComponents(card: EnhancedCard, context: GameContext): void {
  if (!card.components || card.components.length === 0) {
    context.log(`${card.name} has no components to execute.`);
    return;
  }
  
  // Process components in order
  for (const component of card.components) {
    // Skip further processing if execution is paused
    if (context.executionPaused) {
      break;
    }
    
    component.apply(context);
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