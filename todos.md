Okay, let's generate new versions of the core files, keeping the essential structures and good parts while scaffolding out the proposed improvements based on the refactoring plan.
Key Changes Reflected:
Centralized Execution: cardExecutionService.ts is refactored into a state machine.
Component Responsibilities: Components now have canApply (where applicable) and apply returns ComponentStatus or StateChangeDescription[]. Direct state mutation is removed from components.
Decoupled State: Components describe intended changes; the service applies them.
Simplified Store: useDeckBuilder.ts triggers the service and observes its state for UI updates.
Zone Management: Centralized in cardExecutionService.moveCardToZone.
Cleaned State Files: player.ts and game.ts focus on state definition.
NOTE: This is a significant refactor. The generated code provides the structure and interfaces for the new design but requires filling in the detailed logic (marked with // TODO:). You'll need to implement the specific logic for each component's canApply and apply based on the game rules, and flesh out the CardExecutionService state machine and state update handling.
/client/src/lib/game/components.ts (Refactored)
// Card Component System for Cyberpunk Deck-Builder (Refactored)
// Components return status or describe state changes, execution controlled by CardExecutionService.

import { Card, CardKeyword, CardFaction, CardType } from './cards';
import { Player } from './player'; // Assuming Player type exists
import { GameState } from './game'; // Assuming GameState type exists

// --- Core Types ---

export enum ComponentStatus {
SUCCESS = 'SUCCESS',
FAILURE = 'FAILURE',
REQUIRES_TARGETING = 'REQUIRES_TARGETING',
}

// Describes an intended change to the game state
export interface StateChangeDescription {
type: 'DELTA_STATE' | 'SET_STATE' | 'MOVE_CARD' | 'ADD_COUNTER' | 'REMOVE_COUNTER' | 'SET_FLAG' | 'APPLY_DAMAGE' | 'TRASH_CARD'; // etc.
targetId: string; // ID of the player, card, or threat to modify
payload: any; // Details of the change (e.g., { property: 'credits', delta: 5 } or { property: 'health', value: 10 })
}

// Information needed for targeting
export interface TargetingRequest {
requestingCardId: string;
requestingComponentType: string;
targetType: 'player' | 'opponent' | 'threat' | 'card' | 'location' | string; // Allow custom types
maxTargets: number;
minTargets: number;
filter?: (target: any, context: GameContext) => boolean; // Filter function description or key
message: string; // Message to display to the user
}

// Game context passed to components
export interface GameContext {
currentCard: EnhancedCard; // The card whose component is being executed
player: Player; // The player executing the card
opponents: Player[];
gameState: GameState; // Read-only access to the broader game state
targets: any[]; // Targets provided _for_ the current component execution
cardsInPlay: EnhancedCard[]; // All cards currently considered "in play"
locationThreats?: any[]; // Threats at the current location
log: (message: string) => void; // Function to log messages
// Add other relevant contextual info as needed (e.g., currentRunState)
}

// Enhanced card with components
export interface EnhancedCard extends Card {
components: Component[];
}

// Base Component interface (Refactored)
export interface Component {
type: string; // Unique identifier for the component type

/\*\*

- Checks if the component's prerequisites are met (e.g., costs, conditions).
- Optional: Only needed for Costs and Conditionals usually.
- @param context Current game context.
- @returns True if prerequisites are met, false otherwise.
  \*/
  canApply?(context: GameContext): boolean;

/\*\*

- Executes the component's logic.
- @param context Current game context.
- @returns A ComponentStatus indicating the result, or an array of StateChangeDescriptions for effect components.
  \*/
  apply(context: GameContext): ComponentStatus | StateChangeDescription[];
  }

// ----- Zone Components -----
// Keep the concept, but simplify. Their primary role is tagging a card's location.
// Actual zone transition logic is centralized in the service.

export type CardZone = 'inMarket' | 'inDiscard' | 'inDeck' | 'inHand' | 'inPlay' | 'Trash'; // Added Trash

export abstract class ZoneComponent implements Component {
type: string;
zone: CardZone;

constructor(zone: CardZone) {
this.zone = zone;
this.type = `${zone}Zone`; // e.g., inHandZone, inPlayZone
}

// Zone components usually don't need complex apply logic; they mark state.
apply(context: GameContext): ComponentStatus {
// console.log(`Card ${context.currentCard.name} is in zone ${this.zone}`);
return ComponentStatus.SUCCESS; // Simple success, no state change described
}
}

export class InMarketZone extends ZoneComponent { constructor() { super('inMarket'); } }
export class InDiscardZone extends ZoneComponent { constructor() { super('inDiscard'); } }
export class InDeckZone extends ZoneComponent { constructor() { super('inDeck'); } }
export class InHandZone extends ZoneComponent { constructor() { super('inHand'); } }
export class InPlayZone extends ZoneComponent { constructor() { super('inPlay'); } }
// No InQueueZone needed if queue is internal to the service. inPlay represents active/resolving cards.

// ----- Targeting Components (Refactored Skeletons) -----

export class SingleEntityTarget implements Component {
type = 'SingleEntityTarget';

constructor(
public targetType: string, // e.g., 'threat', 'program', 'player'
public allowTargetSelection: boolean = true,
public filter?: (target: any, context: GameContext) => boolean // Keep filter for criteria
) {}

// canApply might check if _any_ valid targets exist
canApply(context: GameContext): boolean {
// TODO: Implement logic to find potential targets based on targetType and filter
const potentialTargets = this.findPotentialTargets(context);
return potentialTargets.length > 0;
}

apply(context: GameContext): ComponentStatus {
if (context.targets.length > 0) {
// Targets already provided (resuming execution)
// TODO: Validate provided target(s) against type/filter?
console.log(`SingleEntityTarget: Targets provided [${context.targets.map(t => t?.id || t?.name).join(', ')}], continuing.`);
return ComponentStatus.SUCCESS;
}

    if (this.allowTargetSelection) {
        // TODO: Check if *any* valid targets exist using findPotentialTargets
        if (!this.canApply(context)) {
            context.log(`No valid targets found for ${context.currentCard.name}.`);
            return ComponentStatus.FAILURE;
        }
      console.log(`SingleEntityTarget: Requesting target selection for ${this.targetType}`);
      return ComponentStatus.REQUIRES_TARGETING; // Service will handle pausing
    } else {
      // Auto-select logic
      const potentialTargets = this.findPotentialTargets(context);
      if (potentialTargets.length > 0) {
        // Auto-select the first valid target
        // The service needs to store this target for subsequent components
        context.targets = [potentialTargets[0]]; // Temporary storage in context for *this tick*
        console.log(`SingleEntityTarget: Auto-selected target ${potentialTargets[0]?.id || potentialTargets[0]?.name}`);
        return ComponentStatus.SUCCESS;
      } else {
        context.log(`No valid auto-targets found for ${context.currentCard.name}.`);
        return ComponentStatus.FAILURE;
      }
    }

}

findPotentialTargets(context: GameContext): any[] {
// TODO: Implement actual logic to find targets in gameState based on targetType and filter
let candidates: any[] = [];
switch (this.targetType) {
case 'threat': candidates = context.locationThreats || []; break;
case 'opponent': candidates = context.opponents || []; break;
case 'player': candidates = [context.player]; break;
case 'card': /_find cards based on location_/ break;
// Add more cases
}
if (this.filter) {
candidates = candidates.filter(t => this.filter!(t, context));
}
return candidates;
}

// Method for the service to get targeting info when pausing
getTargetingRequest(context: GameContext): TargetingRequest {
return {
requestingCardId: context.currentCard.id,
requestingComponentType: this.type,
targetType: this.targetType,
maxTargets: 1,
minTargets: 1, // Usually 1 for single target
filter: this.filter, // Pass the filter function/description
message: `Select a ${this.targetType} target for ${context.currentCard.name}`
};
}
}

export class MultiEntityTarget implements Component {
type = 'MultiEntityTarget';
constructor(
public targetType: string,
public maxTargets: number = Infinity,
public minTargets: number = 1, // Add minTargets
public allowTargetSelection: boolean = true,
public filter?: (target: any, context: GameContext) => boolean
) {}

canApply(context: GameContext): boolean {
// TODO: Implement logic to find potential targets
const potentialTargets = this.findPotentialTargets(context);
return potentialTargets.length >= this.minTargets; // Check if minimum can be met
}

apply(context: GameContext): ComponentStatus {
if (context.targets.length > 0) {
console.log(`MultiEntityTarget: Targets provided [${context.targets.map(t => t?.id || t?.name).join(', ')}], continuing.`);
// TODO: Validate count against min/max?
return ComponentStatus.SUCCESS;
}

    if (this.allowTargetSelection) {
        if (!this.canApply(context)) {
             context.log(`Not enough valid targets found for ${context.currentCard.name} (min: ${this.minTargets}).`);
             return ComponentStatus.FAILURE;
        }
      console.log(`MultiEntityTarget: Requesting target selection for ${this.targetType}`);
      return ComponentStatus.REQUIRES_TARGETING;
    } else {
      // Auto-select logic
      const potentialTargets = this.findPotentialTargets(context);
      const targetCount = Math.min(potentialTargets.length, this.maxTargets);
       if (targetCount >= this.minTargets) {
           context.targets = potentialTargets.slice(0, targetCount);
           console.log(`MultiEntityTarget: Auto-selected ${context.targets.length} targets.`);
           return ComponentStatus.SUCCESS;
       } else {
            context.log(`Not enough valid auto-targets found for ${context.currentCard.name} (min: ${this.minTargets}).`);
            return ComponentStatus.FAILURE;
       }
    }

}

findPotentialTargets(context: GameContext): any[] {
// TODO: Implement same logic as SingleEntityTarget.findPotentialTargets
return [];
}

getTargetingRequest(context: GameContext): TargetingRequest {
return {
requestingCardId: context.currentCard.id,
requestingComponentType: this.type,
targetType: this.targetType,
maxTargets: this.maxTargets,
minTargets: this.minTargets,
filter: this.filter,
message: `Select up to ${this.maxTargets} (min ${this.minTargets}) ${this.targetType} target(s) for ${context.currentCard.name}`
};
}
}

export class SelfTarget implements Component {
type = 'SelfTarget';

apply(context: GameContext): ComponentStatus {
// No targets needed from player, service knows the player.
// The service should ensure subsequent effect components target the player.
// This component itself doesn't need to set context.targets.
console.log("SelfTarget: Targeting the current player.");
return ComponentStatus.SUCCESS;
}
}

// ----- Cost Components (Refactored Skeletons) -----

export class CreditCost implements Component {
type = 'CreditCost';
constructor(public amount: number) {}

// Checked by the service _before_ execution begins, _only_ for market buys
canApply(context: GameContext): boolean {
const canAfford = context.player.credits >= this.amount;
if (!canAfford) {
context.log(`Insufficient credits: Need ${this.amount}, have ${context.player.credits}.`);
}
return canAfford;
}

apply(context: GameContext): ComponentStatus {
// The _check_ happens in canApply. The actual cost deduction
// happens in the service _after_ all canApply checks pass.
// This component confirms the cost requirement exists.
return ComponentStatus.SUCCESS; // Indicate the cost requirement itself is valid
}

// Optionally, return a state change description for the service to apply
getCostDescription(): StateChangeDescription {
return { type: 'DELTA_STATE', targetId: 'player', payload: { property: 'credits', delta: -this.amount } };
}
}

export class ActionCost implements Component {
type = 'ActionCost';
constructor(public amount: number = 1) {}

// Checked by the service _before_ execution begins for play actions
canApply(context: GameContext): boolean {
const hasActions = context.player.actions >= this.amount;
if (!hasActions) {
context.log(`Insufficient actions: Need ${this.amount}, have ${context.player.actions}.`);
}
return hasActions;
}

apply(context: GameContext): ComponentStatus {
// Confirms the action cost requirement. Deduction happens in service.
return ComponentStatus.SUCCESS;
}

getCostDescription(): StateChangeDescription {
return { type: 'DELTA_STATE', targetId: 'player', payload: { property: 'actions', delta: -this.amount } };
}
}

export class TrashCost implements Component {
type = 'TrashCost';
constructor(
public targetType: 'program' | 'hardware' | 'resource' | 'self' | 'any',
public count: number = 1,
// TODO: Add filter support
) {}

canApply(context: GameContext): boolean {
// TODO: Check if the player _has_ the required number of cards of targetType to trash
// This might require targeting first if not 'self'
return true; // Placeholder
}

apply(context: GameContext): ComponentStatus {
if (this.targetType === 'self') {
// Service handles the actual trashing based on this component type
console.log("TrashCost: Card will trash itself.");
return ComponentStatus.SUCCESS;
}

     // Requires targeting
     if (context.targets.length < this.count) {
        // Request targets if not enough provided
        console.log(`TrashCost: Requesting ${this.count} target(s) of type ${this.targetType} to trash.`);
        return ComponentStatus.REQUIRES_TARGETING;
     } else {
        // Targets provided, validation happens here or in service
        console.log(`TrashCost: Targets provided for trashing: [${context.targets.map(t => t.name).join(', ')}]`);
         // TODO: Validate targets match targetType and count
        // Service will handle the actual trashing based on context.targets
        return ComponentStatus.SUCCESS;
     }

}

getTargetingRequest(context: GameContext): TargetingRequest {
return {
requestingCardId: context.currentCard.id,
requestingComponentType: this.type,
targetType: this.targetType, // Or 'card' with a filter
maxTargets: this.count,
minTargets: this.count,
filter: (target) => target.cardType === this.targetType, // Example filter
message: `Select ${this.count} ${this.targetType}(s) to trash for ${context.currentCard.name}`
};
}

// Describe the trash action for the service
getTrashDescription(targets: any[]): StateChangeDescription[] {
return targets.map(target => ({
type: 'TRASH_CARD',
targetId: target.id,
payload: { fromZone: 'inPlay' } // Assuming trashing from play
}));
}
}

export class HealthCost implements Component {
type = 'HealthCost';
constructor(public amount: number, public damageType: 'Meat' | 'Net' | 'Brain') {}

canApply(context: GameContext): boolean {
// Technically, you can always take damage unless it would kill you
// Maybe check if health > amount to prevent self-defeat? Optional rule.
const canAfford = context.player.health > this.amount; // Prevent self-defeat
if (!canAfford) {
context.log(`Cannot pay health cost: Taking ${this.amount} ${this.damageType} damage would defeat you.`);
}
return canAfford;
}

apply(context: GameContext): ComponentStatus {
// Confirms the health cost requirement. Deduction happens in service.
return ComponentStatus.SUCCESS;
}

getCostDescription(): StateChangeDescription {
return { type: 'APPLY_DAMAGE', targetId: 'player', payload: { amount: this.amount, damageType: this.damageType } };
}
}

// ----- Effect Components (Refactored Skeletons) -----
// These now return StateChangeDescription[]

export class GainCredits implements Component {
type = 'GainCredits';
constructor(public amount: number) {}

apply(context: GameContext): StateChangeDescription[] {
// Assume SelfTarget ran before, default target is player if context.targets is empty
const targetId = context.targets.length > 0 ? context.targets[0].id : 'player';
if (targetId === 'player') { // Ensure we target the player
return [{ type: 'DELTA_STATE', targetId: 'player', payload: { property: 'credits', delta: this.amount } }];
}
return []; // Or handle targeting other entities if needed
}
}

export class DealDamage implements Component {
type = 'DealDamage';
constructor(public amount: number, public damageType: 'Net' | 'Meat' | 'Brain') {}

apply(context: GameContext): StateChangeDescription[] {
// Assumes a Targeting component ran before and populated context.targets
return context.targets.map(target => ({
type: 'APPLY_DAMAGE',
targetId: target.id,
payload: { amount: this.amount, damageType: this.damageType }
}));
}
}

export class DrawCards implements Component {
type = 'DrawCards';
constructor(public amount: number) {}

apply(context: GameContext): StateChangeDescription[] {
const targetId = context.targets.length > 0 ? context.targets[0].id : 'player';
if (targetId === 'player') {
return [{ type: 'DELTA_STATE', targetId: 'player', payload: { property: 'draw', delta: this.amount } }];
// Service needs to handle drawing logic (deck empty -> shuffle discard etc.)
}
return [];
}
}

export class GainAction implements Component {
type = 'GainAction';
constructor(public amount: number) {}

apply(context: GameContext): StateChangeDescription[] {
const targetId = context.targets.length > 0 ? context.targets[0].id : 'player';
if (targetId === 'player') {
return [{ type: 'DELTA_STATE', targetId: 'player', payload: { property: 'actions', delta: this.amount } }];
}
return [];
}
}

// ... Refactor other Effect components similarly ...
export class TrashTargetCard implements Component {
type = 'TrashTargetCard';
apply(context: GameContext): StateChangeDescription[] {
return context.targets.map(target => ({
type: 'TRASH_CARD',
targetId: target.id,
payload: { fromZone: 'inPlay' } // Assuming target is in play
}));
}
}

export class BypassSecurity implements Component {
type = 'BypassSecurity';
constructor(public targetType: string = 'ICE', public count: number = 1){}
apply(context: GameContext): StateChangeDescription[] {
// Service needs to handle run state flags
return [{ type: 'SET_FLAG', targetId: 'run', payload: { flag: `bypass${this.targetType}`, value: this.count } }];
}
}

export class RecycleCard implements Component {
type = 'RecycleCard';
constructor(public targetZone: 'Hand' | 'Stack' = 'Hand', public filter?: any){}
apply(context: GameContext): StateChangeDescription[] {
// Needs info about what was trashed, or needs targeting for discard pile
// TODO: Implement targeting for discard pile or get info from context
// Example: Move card 'cardX' from Discard to Hand
const cardToRecycleId = context.targets[0]?.id; // Assuming target is the card in discard
if (cardToRecycleId) {
return [{ type: 'MOVE_CARD', targetId: cardToRecycleId, payload: { fromZone: 'inDiscard', toZone: this.targetZone.toLowerCase() as CardZone } }];
}
return [];
}
}

// ----- Conditional Components (Refactored Skeletons) -----
// `apply` now just returns SUCCESS/FAILURE based on `canApply`

export class KeywordRequirement implements Component {
type = 'KeywordRequirement';
constructor(
public keyword: CardKeyword,
public count: number = 1,
public location: 'play' | 'hand' | 'discard' = 'play'
) {}

canApply(context: GameContext): boolean {
// TODO: Implement check based on context.cardsInPlay, context.player.hand etc.
let cardsToCheck: EnhancedCard[] = [];
switch(this.location) {
case 'play': cardsToCheck = context.cardsInPlay; break;
case 'hand': cardsToCheck = context.player.hand as EnhancedCard[]; break; // Assuming hand contains EnhancedCard
case 'discard': cardsToCheck = context.player.discard as EnhancedCard[]; break; // Assuming discard contains EnhancedCard
}
const found = cardsToCheck.filter(c => c.keywords?.includes(this.keyword)).length;
const requirementMet = found >= this.count;
if (!requirementMet) {
context.log(`Condition Failed: Need ${this.count} '${this.keyword}', found ${found}.`);
}
return requirementMet;
}

apply(context: GameContext): ComponentStatus {
return this.canApply(context) ? ComponentStatus.SUCCESS : ComponentStatus.FAILURE;
}
}

export class RunCondition implements Component {
type = 'RunCondition';
constructor(public conditionType: 'SuccessfulRun' | 'AccessedServer' | string, public server?: string) {}

    canApply(context: GameContext): boolean {
        // TODO: Check the actual run state from GameContext or a dedicated RunState object
        // Example:
        // if (this.conditionType === 'SuccessfulRun') {
        //     return context.runState?.lastRunWasSuccessful ?? false;
        // }
        const conditionMet = true; // Placeholder
         if (!conditionMet) {
             context.log(`Condition Failed: Run condition '${this.conditionType}' not met.`);
         }
        return conditionMet;
    }

    apply(context: GameContext): ComponentStatus {
        return this.canApply(context) ? ComponentStatus.SUCCESS : ComponentStatus.FAILURE;
    }

}

// ----- Control Flow Components -----
// These might still directly influence the service state slightly or return special status codes

export class PauseQueue implements Component {
type = 'PauseQueue';
constructor(public message: string = "Choose targets to continue.") {}

apply(context: GameContext): ComponentStatus {
// This component specifically requests targeting pause
return ComponentStatus.REQUIRES_TARGETING;
}

// Provide details for the targeting request
getTargetingRequest(context: GameContext): TargetingRequest {
// This component type might need generic targeting if not specified
return {
requestingCardId: context.currentCard.id,
requestingComponentType: this.type,
targetType: 'any', // Or make constructor take targetType
maxTargets: 1,
minTargets: 0, // Allow continuing without target if needed
filter: undefined,
message: this.message
};
}
}

// --- Utility Functions ---

// Factory function remains useful
export function createCardWithComponents(
baseCard: Card,
components: Component[]
): EnhancedCard {
return {
...baseCard,
components
};
}

// Helper to check if a card is enhanced
export function isEnhancedCard(card: Card | EnhancedCard): card is EnhancedCard {
return card && Array.isArray((card as EnhancedCard).components);
}
Use code with caution.
TypeScript
/client/src/lib/game/cardExecutionService.ts (Refactored Skeleton)
// Card Execution Service (Refactored Skeleton)
// Manages card execution state machine and applies component effects.

import { EnhancedCard, Component, GameContext, ComponentStatus, StateChangeDescription, TargetingRequest, CardZone, ZoneComponent } from './components';
import { Card } from './cards';
import { GameState } from './game';
import { Player } from './player';
import { getEnhancedCard, isEnhancedCard } from './enhancedCards'; // Ensure isEnhancedCard is exported

enum ExecutionStateEnum {
IDLE = 'IDLE',
RUNNING = 'RUNNING',
PAUSED_FOR_TARGETING = 'PAUSED_FOR_TARGETING',
CARD_FAILED = 'CARD_FAILED', // Intermediate state before moving to next card
QUEUE_COMPLETE = 'QUEUE_COMPLETE',
}

interface ServiceState {
state: ExecutionStateEnum;
internalQueue: EnhancedCard[];
currentCardIndex: number;
currentComponentIndex: number;
currentGameState: GameState | null; // Hold the latest game state
currentContext: GameContext | null; // Context for the _current_ component execution
currentTargetingRequest: TargetingRequest | null;
stateChangesBuffer: StateChangeDescription[]; // Buffer changes from effect components
logFn: ((message: string) => void) | null;
}

export class CardExecutionService {
private serviceState: ServiceState = this.getInitialServiceState();

// --- Public API ---

public queueCard(card: Card | EnhancedCard): void {
console.log(`Queueing card ${card.name} for execution`);
const enhancedCard = this.ensureEnhanced(card);
const cardCopy = { ...enhancedCard, components: [...enhancedCard.components] }; // Deep copy needed?

    // Do not add zone component here, it should be added when moved from hand/market
    // Remove CreditCost if it snuck in somehow (should be handled by moveCardToZone)
    cardCopy.components = cardCopy.components.filter(comp => comp.type !== 'CreditCost');

    this.serviceState.internalQueue.push(cardCopy);
    // Optional: Automatically start if IDLE?
    // if (this.serviceState.state === ExecutionStateEnum.IDLE) {
    //   this.startExecution(initialGameState, logFn);
    // }

}

public startExecution(initialGameState: GameState, logFn: (message: string) => void): void {
if (this.serviceState.state !== ExecutionStateEnum.IDLE || this.serviceState.internalQueue.length === 0) {
console.warn("Execution service not idle or queue empty, cannot start.");
return;
}
console.log("Starting card execution...");
this.serviceState.currentGameState = initialGameState;
this.serviceState.logFn = logFn;
this.serviceState.state = ExecutionStateEnum.RUNNING;
this.serviceState.currentCardIndex = 0;
this.serviceState.currentComponentIndex = 0;
this.tick(); // Start the execution loop
}

public provideTargets(targets: any[]): void {
if (this.serviceState.state !== ExecutionStateEnum.PAUSED_FOR_TARGETING) {
console.warn("Cannot provide targets, service not awaiting target selection.");
return;
}
if (!this.serviceState.currentContext) {
console.error("Cannot provide targets, current context is missing.");
this.serviceState.state = ExecutionStateEnum.IDLE; // Reset on error
return;
}

    console.log(`Targets provided: [${targets.map(t => t?.id || t?.name).join(', ')}], resuming execution.`);
    // Store targets temporarily in the *current* context for the component being resumed
    this.serviceState.currentContext.targets = targets;
    this.serviceState.currentTargetingRequest = null; // Clear the request
    this.serviceState.state = ExecutionStateEnum.RUNNING;

    this.tick(); // Continue execution loop

}

public cancelExecution(): void {
if (this.serviceState.state === ExecutionStateEnum.PAUSED_FOR_TARGETING) {
console.log("Canceling execution while paused for targeting.");
this.log("Card execution canceled by user.");
// Handle the currently paused card as failed/aborted
this.handleCardFailure();
// If there are more cards, continue execution, otherwise complete
if (this.serviceState.currentCardIndex < this.serviceState.internalQueue.length) {
this.serviceState.state = ExecutionStateEnum.RUNNING;
this.tick();
} else {
this.serviceState.state = ExecutionStateEnum.QUEUE_COMPLETE;
this.resetInternalState(); // Keep gameState, clear queue etc.
}
} else {
console.warn("Can only cancel execution when paused for targeting.");
}
}

public reset(): void {
console.log("Resetting Card Execution Service.");
this.serviceState = this.getInitialServiceState();
}

// --- Getters for UI observation ---
public isPausedForTargeting(): boolean {
return this.serviceState.state === ExecutionStateEnum.PAUSED_FOR_TARGETING;
}

public getTargetingRequest(): TargetingRequest | null {
return this.serviceState.currentTargetingRequest;
}

public getCurrentGameState(): GameState | null {
return this.serviceState.currentGameState;
}

// --- Internal Execution Loop ---

private tick(): void {
if (this.serviceState.state !== ExecutionStateEnum.RUNNING) {
//console.log(`Tick called but state is ${this.serviceState.state}, exiting.`);
return;
}
if (!this.serviceState.currentGameState || !this.serviceState.logFn) {
console.error("Cannot tick: GameState or log function missing.");
this.serviceState.state = ExecutionStateEnum.IDLE;
return;
}
if (this.serviceState.currentCardIndex >= this.serviceState.internalQueue.length) {
console.log("Queue finished processing.");
this.serviceState.state = ExecutionStateEnum.QUEUE_COMPLETE;
this.resetInternalState(); // Keep gameState, clear queue etc.
this.log("Finished executing all cards in the queue.");
return;
}

    const currentCard = this.serviceState.internalQueue[this.serviceState.currentCardIndex];
    const components = currentCard.components || [];

    if (this.serviceState.currentComponentIndex >= components.length) {
      // Finished all components for this card successfully
      this.handleCardSuccess(currentCard);
      // Automatically proceed to the next card in the next tick
      requestAnimationFrame(() => this.tick());
      return;
    }

    const currentComponent = components[this.serviceState.currentComponentIndex];

    // Create context for this component's execution
    // Crucially, targets are reset unless resuming from pause
    const targetsForComponent = this.serviceState.currentContext?.targets || [];
    this.serviceState.currentContext = this.createExecutionContext(
        this.serviceState.currentGameState,
        currentCard,
        targetsForComponent // Pass targets provided via provideTargets
    );
     // Clear targets in context *after* creating it for the current component
     if (this.serviceState.currentContext) this.serviceState.currentContext.targets = [];


    console.log(`Ticking: Card '${currentCard.name}' (${this.serviceState.currentCardIndex}), Component '${currentComponent.type}' (${this.serviceState.currentComponentIndex})`);

    try {
      // 1. Check Prerequisites (Cost/Conditionals) using canApply if available
      if (currentComponent.canApply && !currentComponent.canApply(this.serviceState.currentContext)) {
        this.log(`Prerequisite failed for ${currentComponent.type} on ${currentCard.name}.`);
        this.handleCardFailure(); // Abort this card
        requestAnimationFrame(() => this.tick()); // Move to next card
        return;
      }

      // 2. Apply the component
      const result = currentComponent.apply(this.serviceState.currentContext);

      // 3. Process result
      if (result === ComponentStatus.SUCCESS) {
        this.serviceState.currentComponentIndex++; // Move to next component
      } else if (result === ComponentStatus.FAILURE) {
        this.log(`Component ${currentComponent.type} failed for ${currentCard.name}.`);
        this.handleCardFailure(); // Abort this card
      } else if (result === ComponentStatus.REQUIRES_TARGETING) {
         // Ensure the component can provide a targeting request
         if (typeof (currentComponent as any).getTargetingRequest === 'function') {
            this.serviceState.currentTargetingRequest = (currentComponent as any).getTargetingRequest(this.serviceState.currentContext);
            this.serviceState.state = ExecutionStateEnum.PAUSED_FOR_TARGETING;
            this.log(`Execution paused: ${this.serviceState.currentTargetingRequest?.message || `Awaiting target selection for ${currentCard.name}...`}`);
            console.log("Paused for targeting request:", this.serviceState.currentTargetingRequest);
            // DO NOT continue ticking, wait for provideTargets
            return;
        } else {
             console.error(`Component ${currentComponent.type} returned REQUIRES_TARGETING but has no getTargetingRequest method!`);
             this.handleCardFailure(); // Treat as failure
        }
      } else if (Array.isArray(result)) {
        // Effect component returned state changes
        this.serviceState.stateChangesBuffer.push(...result);
        this.serviceState.currentComponentIndex++; // Move to next component
      } else {
         console.error(`Component ${currentComponent.type} returned unexpected result:`, result);
         this.handleCardFailure(); // Treat as failure
      }

    } catch (error) {
      console.error(`Error executing component ${currentComponent.type} for card ${currentCard.name}:`, error);
      this.log(`Runtime error during execution of ${currentCard.name}.`);
      this.handleCardFailure(); // Abort on error
    }

    // If still running, schedule the next tick
    if (this.serviceState.state === ExecutionStateEnum.RUNNING) {
      requestAnimationFrame(() => this.tick());
    }

}

// --- Internal State Management ---

private getInitialServiceState(): ServiceState {
return {
state: ExecutionStateEnum.IDLE,
internalQueue: [],
currentCardIndex: 0,
currentComponentIndex: 0,
currentGameState: null,
currentContext: null,
currentTargetingRequest: null,
stateChangesBuffer: [],
logFn: null,
};
}

private resetInternalState(): void {
// Keep gameState, clear the rest for the next execution run
this.serviceState.internalQueue = [];
this.serviceState.currentCardIndex = 0;
this.serviceState.currentComponentIndex = 0;
this.serviceState.currentContext = null;
this.serviceState.currentTargetingRequest = null;
this.serviceState.stateChangesBuffer = [];
// Keep logFn if needed? Or reset? Resetting seems safer.
// this.serviceState.logFn = null;
}

private createExecutionContext(gameState: GameState, card: EnhancedCard, targets: any[]): GameContext {
// TODO: Populate cardsInPlay and locationThreats correctly from gameState
const cardsInPlay = gameState.players.reduce((acc, p) => [...acc, ...(p.inPlay as EnhancedCard[])], [] as EnhancedCard[]);
const locationThreats = (gameState as any).locationDeck?.currentLocation?.threats || []; // Example access

    return {
      currentCard: card,
      player: gameState.players[gameState.activePlayerIndex], // Assumes active player is correct
      opponents: gameState.players.filter((_, i) => i !== gameState.activePlayerIndex),
      gameState: gameState, // Provide read-only access
      targets: targets, // Targets specifically for *this* component run
      cardsInPlay: cardsInPlay,
      locationThreats: locationThreats,
      log: this.log.bind(this),
    };

}

private applyStateChanges(): void {
if (!this.serviceState.currentGameState) return;
let updatedGameState = this.serviceState.currentGameState;

       this.log(`Applying ${this.serviceState.stateChangesBuffer.length} buffered state changes.`);
       console.log("Buffered changes:", JSON.stringify(this.serviceState.stateChangesBuffer));

       for (const change of this.serviceState.stateChangesBuffer) {
           // TODO: Implement logic to apply different change types
           // This is where the complexity of state updates lies.
           // Example:
           if (change.type === 'DELTA_STATE') {
               const { targetId, payload } = change;
               const { property, delta } = payload;
               if (targetId === 'player') {
                    const playerIndex = updatedGameState.players.findIndex(p => p.id === this.serviceState.currentContext?.player.id);
                    if (playerIndex !== -1 && typeof (updatedGameState.players[playerIndex] as any)[property] === 'number') {
                        (updatedGameState.players[playerIndex] as any)[property] += delta;
                        console.log(`Applied DELTA_STATE: ${targetId}.${property} += ${delta}`);
                    }
               } else {
                   // Handle targeting cards, threats etc.
               }
           } else if (change.type === 'APPLY_DAMAGE') {
                const { targetId, payload } = change;
                 const { amount, damageType } = payload;
                 // Find target (player, threat, etc.) and apply damage
                 console.log(`Applied APPLY_DAMAGE: ${amount} ${damageType} to ${targetId}`);
           } else if (change.type === 'MOVE_CARD') {
                const { targetId, payload } = change;
                const { fromZone, toZone } = payload;
                // Find card and move it using moveCardToZone
                // This needs careful implementation to find the card across all possible zones
                console.log(`Applied MOVE_CARD: ${targetId} from ${fromZone} to ${toZone}`);
           } else if (change.type === 'TRASH_CARD') {
               const { targetId, payload } = change;
               const { fromZone } = payload;
               // Find card and move it to Trash zone (conceptually) / remove from game state arrays
               console.log(`Applied TRASH_CARD: ${targetId} from ${fromZone}`);
           }
           // Add cases for ADD_COUNTER, SET_FLAG etc.
       }

       this.serviceState.currentGameState = updatedGameState; // Update the service's copy
       this.serviceState.stateChangesBuffer = []; // Clear buffer

}

private handleCardSuccess(card: EnhancedCard): void {
this.log(`Card '${card.name}' executed successfully.`);
this.applyStateChanges(); // Apply any buffered changes from the card's effects
// Move card to discard
if (this.serviceState.currentGameState) {
this.serviceState.currentGameState = this.moveCardToZone(
this.serviceState.currentGameState,
card,
'inPlay', // Assuming card was in play during execution
'inDiscard'
);
}
this.advanceQueue();
}

private handleCardFailure(): void {
const card = this.serviceState.internalQueue[this.serviceState.currentCardIndex];
this.log(`Card '${card?.name || 'Unknown'}' failed execution.`);
this.serviceState.stateChangesBuffer = []; // Discard any changes from the failed card
// Move card to discard
if (this.serviceState.currentGameState && card) {
this.serviceState.currentGameState = this.moveCardToZone(
this.serviceState.currentGameState,
card,
'inPlay', // Assuming card was in play during execution attempt
'inDiscard'
);
}
this.advanceQueue();
}

private advanceQueue(): void {
this.serviceState.currentCardIndex++;
this.serviceState.currentComponentIndex = 0; // Reset for next card
this.serviceState.currentContext = null; // Clear context
this.serviceState.stateChangesBuffer = []; // Clear buffer for next card
}

private log(message: string): void {
if (this.serviceState.logFn) {
this.serviceState.logFn(message);
} else {
console.log("CES Log:", message); // Fallback log
}
}

// Centralized Zone Management Helper
public moveCardToZone(gameState: GameState, card: Card | EnhancedCard, fromZoneType: CardZone, toZoneType: CardZone): GameState {
console.log(`Attempting to move card ${card.name} from ${fromZoneType} to ${toZoneType}`);
let updatedGameState = { ...gameState }; // Shallow copy
let cardFound = false;
const targetPlayerIndex = updatedGameState.players.findIndex(p => p.id === this.serviceState.currentContext?.player.id) ?? updatedGameState.activePlayerIndex; // Default to active if no context
const targetPlayer = updatedGameState.players[targetPlayerIndex];

       // Ensure we have the enhanced version for component manipulation
       const enhancedCardToMove = this.ensureEnhanced(card);

       // 1. Find and Remove card from the 'fromZone' array in gameState
       const removeFromPlayerArray = (zone: keyof Player): boolean => {
           if (!targetPlayer) return false;
           const currentZoneArray = targetPlayer[zone] as Card[];
           const index = currentZoneArray.findIndex(c => c.id === card.id);
           if (index !== -1) {
               targetPlayer[zone] = [...currentZoneArray.slice(0, index), ...currentZoneArray.slice(index + 1)];
               console.log(`Removed ${card.name} from player's ${zone}`);
               return true;
           }
           return false;
       };

       const removeFromMarket = (): boolean => {
           const index = updatedGameState.market.availableCards.findIndex(c => c.id === card.id);
           if (index !== -1) {
                updatedGameState.market = {
                    ...updatedGameState.market,
                    availableCards: [
                        ...updatedGameState.market.availableCards.slice(0, index),
                        ...updatedGameState.market.availableCards.slice(index + 1)
                    ]
                };
               console.log(`Removed ${card.name} from market`);
               return true;
           }
           return false;
       }

       switch(fromZoneType) {
           case 'inHand': cardFound = removeFromPlayerArray('hand'); break;
           case 'inDeck': cardFound = removeFromPlayerArray('deck'); break;
           case 'inDiscard': cardFound = removeFromPlayerArray('discard'); break;
           case 'inPlay': cardFound = removeFromPlayerArray('inPlay'); break; // Assuming inPlay holds executing cards
           case 'inMarket': cardFound = removeFromMarket(); break;
       }

       if (!cardFound) {
           console.warn(`Card ${card.name} not found in zone ${fromZoneType} for move.`);
           // Decide if this is an error or acceptable (e.g., card already moved)
           // return updatedGameState; // Return state as is if card not found in expected zone
       }

       // 2. Update card's zone component
       enhancedCardToMove.components = enhancedCardToMove.components.filter(comp => !(comp instanceof ZoneComponent));
       let zoneComponentToAdd: ZoneComponent | null = null;
       switch(toZoneType) {
           case 'inMarket': zoneComponentToAdd = new InMarketZone(); break;
           case 'inDiscard': zoneComponentToAdd = new InDiscardZone(); break;
           case 'inDeck': zoneComponentToAdd = new InDeckZone(); break;
           case 'inHand': zoneComponentToAdd = new InHandZone(); break;
           case 'inPlay': zoneComponentToAdd = new InPlayZone(); break;
           case 'Trash': /* No component for trash, card leaves game state */ break;
       }
       if (zoneComponentToAdd) {
           enhancedCardToMove.components.push(zoneComponentToAdd);
           console.log(`Added ${zoneComponentToAdd.type} component to ${enhancedCardToMove.name}`);
       }

        // Remove CreditCost if moving *to* a non-Market zone
        if (toZoneType !== 'inMarket') {
             enhancedCardToMove.components = enhancedCardToMove.components.filter(comp => comp.type !== 'CreditCost');
        }

       // 3. Add card to the 'toZone' array in gameState (unless Trashed)
       const addToPlayerArray = (zone: keyof Player) => {
           if (!targetPlayer) return;
           const currentZoneArray = targetPlayer[zone] as Card[];
           targetPlayer[zone] = [...currentZoneArray, enhancedCardToMove]; // Add the card with updated components
           console.log(`Added ${enhancedCardToMove.name} to player's ${zone}`);
       };

        const addToMarket = () => {
             updatedGameState.market = {
                 ...updatedGameState.market,
                 availableCards: [...updatedGameState.market.availableCards, enhancedCardToMove]
             };
            console.log(`Added ${enhancedCardToMove.name} to market`);
        }


       if (toZoneType !== 'Trash') {
           switch(toZoneType) {
               case 'inHand': addToPlayerArray('hand'); break;
               case 'inDeck': addToPlayerArray('deck'); break;
               case 'inDiscard': addToPlayerArray('discard'); break;
               case 'inPlay': addToPlayerArray('inPlay'); break;
               case 'inMarket': addToMarket(); break;
           }
       } else {
            // Add to game trash pile if it exists
            if (updatedGameState.trashPile) {
                 updatedGameState.trashPile = [...updatedGameState.trashPile, enhancedCardToMove];
            }
           console.log(`Card ${enhancedCardToMove.name} moved to Trash (removed from game).`);
       }

       // 4. Update the player/market object in the gameState array/object
        if (fromZoneType !== 'inMarket' && toZoneType !== 'inMarket' && targetPlayer) {
             updatedGameState.players = [
                 ...updatedGameState.players.slice(0, targetPlayerIndex),
                 targetPlayer, // Put the updated player back
                 ...updatedGameState.players.slice(targetPlayerIndex + 1)
             ];
        }
        // If market was involved, gameState.market is already updated

       return updatedGameState;

}

private ensureEnhanced(card: Card | EnhancedCard): EnhancedCard {
if (isEnhancedCard(card)) {
return card;
}
// Attempt to find pre-enhanced version, otherwise create minimal
return getEnhancedCard(card.id) || { ...card, components: [] };
}
}

// Singleton instance
export const cardExecutionService = new CardExecutionService();
Use code with caution.
TypeScript
/client/src/lib/game/enhancedCards.ts (Adjusted Examples)
// Enhanced cards using the component system (Adjusted for Refactor)
import {
Card, CREDIT_CHIP, MALICIOUS_CODE, FIREWALL, CRYPTO_WALLET, DARK_MARKET,
NEURAL_IMPLANT, SYSTEM_PURGE, BACKDOOR, TRACE_PROGRAM, DATA_BREACH,
DESPERATE_HACK, CIRCUIT_BREAKER, PERSONAL_DATA // Assuming these base cards exist
} from './cards';

import {
EnhancedCard, Component, createCardWithComponents,
// Targeting
SingleEntityTarget, MultiEntityTarget, SelfTarget,
// Costs
CreditCost, ActionCost, TrashCost, HealthCost, KeywordRequirement,
// Effects
GainCredits, DealDamage, PreventDamage, DrawCards, DiscardCards, GainAction,
TrashTargetCard, BypassSecurity, RecycleCard, AddCounters, ModifyTarget, InstallCard,
// Conditionals
KeywordSynergy, RiskReward, ComboEffect, RunCondition,
// Control Flow
PauseQueue, CancelCard, // Using PauseQueue less directly now
// Information
RevealCard, ScanEntity,
// State Modifiers
IncreaseMemory,
// Zones (less critical for definition here, added by service)
} from './components';

// --- Basic Resources ---
export const ENHANCED_CREDIT_CHIP: EnhancedCard = createCardWithComponents(
CREDIT_CHIP,
[
// Note: ActionCost(0) explicitly defined, otherwise service assumes 1 action.
new ActionCost(0), // Checked on play
new SelfTarget(), // Target player for the effect
new GainCredits(1) // Describes the effect
]
);

// --- Runner Card Examples (Aligned with Factions) ---

// Anarch
export const ENHANCED_DESPERATE_HACK: EnhancedCard = createCardWithComponents(
DESPERATE_HACK,
[
new ActionCost(1), // Cost to play
// CreditCost removed - not paid when playing from hand
new SingleEntityTarget('threat', true), // Request target selection
new RiskReward('health', 'damage', 60, 2, 4), // Risk/Reward Logic
// KeywordSynergy needs careful implementation: Should it modify the RiskReward component's output?
// Option 1: Specific Synergy Component
// new VirusDamageSynergy('RiskReward', 1)
// Option 2: Generic KeywordSynergy (service needs to interpret targetComponent='RiskReward')
new KeywordSynergy('Virus', 'RiskReward', 1) // Bonus damage on success
]
);

export const ENHANCED_CIRCUIT_BREAKER: EnhancedCard = createCardWithComponents(
CIRCUIT_BREAKER,
[
new ActionCost(1),
// CreditCost removed
new TrashCost('program'), // Requires selecting a program to trash (triggers targeting)
new SingleEntityTarget('threat', true), // Select threat _after_ selecting program to trash
// DealDamage now needs context of the trashed card.
// Option 1: Service passes trashed card info in context
// Option 2: Specific component
// new DamageBasedOnTrashCost(1) // Hypothetical component
new DealDamage(3, 'Net'), // Placeholder base damage, real logic needs context
new ComboEffect('Virus', { type: 'damage', amount: 1 }) // Conditional bonus
]
);

// Criminal
export const ENHANCED_BACKDOOR: EnhancedCard = createCardWithComponents( // Assuming base BACKDOOR exists
BACKDOOR,
[
new ActionCost(1),
// CreditCost removed
new SingleEntityTarget('card', true, (target) => target.keywords?.includes('ICE')), // Target ICE
new BypassSecurity('ICE', 1), // Effect: Bypass one ICE
new SelfTarget(), // Target self for draw
new DrawCards(1) // Effect: Draw card
]
);

// Shaper
export const ENHANCED_ADAPTIVE_ALGORITHM: EnhancedCard = createCardWithComponents( // Assuming base exists
{id: 'adaptive_algorithm', name: 'Adaptive Algorithm', cost: 2, faction: 'Runner', cardType: 'Program', keywords: ['Program'], effects: [], description: 'Pay 2 Credits, Trash: Search stack, install Program (cost -3).'},
[
// This card is a Program, its effect is an _ability_ triggered later.
// The components here define the _program itself_, not its triggered ability yet.
new IncreaseMemory(2), // Example passive effect of the program card itself when installed
// The ability needs a different mechanism (e.g., ActivationComponent or triggered effect system)
// Placeholder for the ability's definition:
// new AbilityComponent({
// cost: [new CreditCost(2), new TrashCost('self')],
// effect: [new SearchStackAndInstall({ type: 'Program', costModifier: -3 })]
// })
]
);

// --- Corp Card Examples (Placeholders) ---
export const ENHANCED_FIREWALL: EnhancedCard = createCardWithComponents(
FIREWALL,
[
// Rez cost handled differently, maybe ActionCost(0) + RezCostComponent?
new ActionCost(1), // Assuming cost to install/rez initially
// new RezCost(3), // Hypothetical RezCost component
new SelfTarget(), // Targets self (the corp) for prevention
new PreventDamage(2),
new KeywordSynergy('ICE', 'PreventDamage', 1)
]
);

// --- Collection & Helpers ---
export const ENHANCED_CARDS_MAP: Map<string, EnhancedCard> = new Map([
[ENHANCED_CREDIT_CHIP.id, ENHANCED_CREDIT_CHIP],
[ENHANCED_DESPERATE_HACK.id, ENHANCED_DESPERATE_HACK],
[ENHANCED_CIRCUIT_BREAKER.id, ENHANCED_CIRCUIT_BREAKER],
[ENHANCED_BACKDOOR.id, ENHANCED_BACKDOOR],
// [ENHANCED_ADAPTIVE_ALGORITHM.id, ENHANCED_ADAPTIVE_ALGORITHM], // Add when base card exists
[ENHANCED_FIREWALL.id, ENHANCED_FIREWALL],
// Add other enhanced cards...
]);

export function getEnhancedCard(cardId: string): EnhancedCard | undefined {
const enhanced = ENHANCED_CARDS_MAP.get(cardId);
if (enhanced) {
// Return a copy to prevent mutation of the definition
return { ...enhanced, components: [...enhanced.components] };
}
// TODO: Find the base card definition if not pre-enhanced?
return undefined;
}

// Function to get a starting deck with enhanced cards
export function getEnhancedStartingDeck(): EnhancedCard[] {
const enhance = (card: Card): EnhancedCard => {
return getEnhancedCard(card.id) || { ...card, components: [] };
}
return [
enhance(CREDIT_CHIP),
enhance(CREDIT_CHIP),
enhance(CREDIT_CHIP),
enhance(CREDIT_CHIP),
enhance(CREDIT_CHIP),
enhance(CREDIT_CHIP),
enhance(CREDIT_CHIP),
enhance(PERSONAL_DATA), // Personal Data might not need components initially
enhance(PERSONAL_DATA),
enhance(PERSONAL_DATA)
];
}

// Ensure isEnhancedCard is exported if defined in components.ts or define here
export { isEnhancedCard } from './components'; // Re-export if defined there
// OR: export function isEnhancedCard(card: Card | EnhancedCard): card is EnhancedCard { ... }
Use code with caution.
TypeScript
/client/src/lib/game/player.ts (Simplified)
import { Card, CardFaction } from './cards';
import { EnhancedCard } from './components'; // Import EnhancedCard

export interface Player {
id: string;
name: string;
deck: Card[]; // Can contain Card or EnhancedCard, but should be treated as EnhancedCard
hand: Card[];
discard: Card[];
inPlay: Card[]; // Cards queued for execution or persistent installs
credits: number;
actions: number;
// buys: number; // Removed if buys are unlimited per turn during buy phase
health: number;
factionReputation: {
Corp: number;
Runner: number;
Street: number;
};
// installedCards: Card[]; // Merged into inPlay or managed by components
// faceDownCards: Card[]; // Merged into inPlay or managed by components
maxHandSize: number; // Added for cleanup phase
memoryUnitsUsed: number; // Added for Shaper
maxMemoryUnits: number; // Added for Shaper
}

// Create a new player
export function createPlayer(id: string, name: string): Player {
return {
id,
name,
deck: [],
hand: [],
discard: [],
inPlay: [],
credits: 5, // Starting credits
actions: 3, // Starting actions per turn (adjust as needed)
// buys: 1, // Removed
health: 10, // Starting health
factionReputation: { Corp: 50, Runner: 50, Street: 50 },
maxHandSize: 5,
memoryUnitsUsed: 0,
maxMemoryUnits: 4, // Default MU
};
}

// Shuffle a deck of cards (Remains the same)
export function shuffleDeck(deck: Card[]): Card[] {
const shuffled = [...deck];
for (let i = shuffled.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() \* (i + 1));
[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
}
return shuffled;
}

// NOTE: Functions like drawCards, discardCard, playCard, buyCard, endTurn, startTurn
// are REMOVED from here. Their logic is now handled by the CardExecutionService
// and the main game loop reacting to state changes or using the ZoneManager.
// Player.ts should focus only on the Player state definition and creation.
Use code with caution.
TypeScript
/client/src/lib/game/game.ts (Simplified)
import { Card } from './cards';
import { Market, createMarket, refillMarket } from './market'; // Removed removeCard import
import { Player, createPlayer, shuffleDeck } from './player';
import { getEnhancedStartingDeck } from './enhancedCards'; // Use enhanced deck
import { LocationDeck, initializeLocationDeck, Location } from './location'; // Assuming Location types exist

export type GamePhase = 'action' | 'buy' | 'cleanup' | 'waiting' | 'game_over' | 'targeting'; // Added targeting phase? Or handled by service state.

export type GameLog = {
message: string;
timestamp: number;
};

export interface GameState {
players: Player[];
activePlayerIndex: number;
market: Market;
phase: GamePhase;
turnNumber: number;
logs: GameLog[];
trashPile: Card[]; // Cards removed from the game
locationDeck?: LocationDeck; // Optional location deck for scenario mode
currentLocation?: Location | null; // Direct reference for easier access
// Add other global state: e.g., runState, corpScore, runnerScore etc.
}

// Initialize a new game
export function initializeGame(playerNames: string[]): GameState {
const players: Player[] = playerNames.map((name, i) => {
const player = createPlayer(`player_${i}`, name);
// Get enhanced starting deck
const startingDeck = getEnhancedStartingDeck();
player.deck = shuffleDeck(startingDeck);
// Initial draw handled by startTurn logic or game setup sequence
return player;
});

const market = createMarket(5); // Or desired size
const locationDeck = initializeLocationDeck(); // Initialize for scenario mode

// Initial Draw for first player (example)
const { updatedPlayer: playerAfterDraw, drawnCards } = drawNCards(players[0], 5); // Use helper below
players[0] = playerAfterDraw;

return {
players,
activePlayerIndex: 0,
market,
phase: 'action', // Start in action phase
turnNumber: 1,
logs: [{ message: `Game started. ${players[0].name}'s turn.`, timestamp: Date.now() }],
trashPile: [],
locationDeck: locationDeck,
currentLocation: locationDeck.currentLocation,
};
}

// Add a log message (Remains useful)
export function addLog(gameState: GameState, message: string): GameState {
console.log("GameLog:", message); // Keep console log for debugging
const newLog = { message, timestamp: Date.now() };
// Keep logs reasonably sized
const logs = [...gameState.logs, newLog].slice(-50);
return { ...gameState, logs };
}

// Helper function to draw N cards - needed because draw logic moved from player.ts
export function drawNCards(player: Player, count: number): { updatedPlayer: Player, drawnCards: Card[] } {
let updatedPlayer = { ...player, hand: [...player.hand], deck: [...player.deck], discard: [...player.discard] }; // Create copies
const drawnCards: Card[] = [];

     for (let i = 0; i < count; i++) {
         if (updatedPlayer.deck.length === 0) {
             if (updatedPlayer.discard.length === 0) {
                 break; // No cards left anywhere
             }
             // Shuffle discard into deck
             console.log(`${player.name} shuffling discard into deck.`);
             updatedPlayer.deck = shuffleDeck(updatedPlayer.discard);
             updatedPlayer.discard = [];
              // TODO: Need to apply zone transitions here via service/manager if cards are enhanced
             if (updatedPlayer.deck.length === 0) break; // Still empty after shuffle?
         }

         const cardToDraw = updatedPlayer.deck.shift();
         if (cardToDraw) {
             // TODO: Apply zone transition (Deck -> Hand) via service/manager if card is enhanced
             updatedPlayer.hand.push(cardToDraw);
             drawnCards.push(cardToDraw);
         }
     }
     return { updatedPlayer, drawnCards };

}

// NOTE: Functions like playCardFromHand, buyCardFromMarket, endPhase
// are REMOVED from here. Their logic is now handled by the CardExecutionService
// interacting with the `useDeckBuilder` store and potentially a `GameLoopManager`.
// Game.ts should focus on state definition and initialization.
Use code with caution.
TypeScript
/client/src/lib/stores/useDeckBuilder.ts (Refactored Skeleton)
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { GameState, GamePhase, initializeGame, addLog, drawNCards } from "../game/game";
import { LocationDeck, initializeLocationDeck, drawNextLocation, Location, LocationThreat } from "../game/location";
import { Card as CardType } from "../game/cards";
import { refillMarket } from "../game/market";
import { cardExecutionService } from "../game/cardExecutionService";
import { getEnhancedCard, isEnhancedCard } from "../game/enhancedCards"; // Import isEnhancedCard
import { Component, EnhancedCard, TargetingRequest } from "../game/components"; // Import TargetingRequest

// Define the entity status type for tracking action potentials and played cards
export interface EntityStatus {
threatId: string;
actionPotentials: boolean[]; // Array of action potential dots (true = active)
playedCards: CardType[]; // Cards played by this entity
}

interface DeckBuilderState {
gameState: GameState | null;
locationDeck: LocationDeck | null;
entityStatuses: EntityStatus[]; // Track entity action potentials and played cards

// UI State related to card execution
isTargetingModalOpen: boolean;
currentTargetingRequest: TargetingRequest | null;

// Game initialization
initializeGame: (playerNames: string[]) => void;

// --- Player Actions (Triggering the Service) ---
queueAndExecuteCard: (cardIndexInHand: number) => void; // Combines queueing and starting execution
// executeQueuedActions: () => void; // Maybe less relevant now? Execution might be more atomic per card play.
buyMarketCard: (cardIndexInMarket: number) => void;
provideTargets: (targets: any[]) => void; // Renamed from onTargetSelect for clarity
cancelTargeting: () => void; // Action to cancel targeting

// --- Turn Management (Might move to a GameLoop service later) ---
endCurrentPhase: () => void;

// --- Scenario Actions ---
drawLocation: () => void;

// --- Basic Dev/Debug Actions ---
drawCard: () => void;
gainCredit: () => void;
gainAction: () => void;
shuffleDiscard: () => void;

// Entity status management (Remains useful for UI)
updateEntityActionPotential: (threatId: string, newPotentials: boolean[]) => void;
// addEntityPlayedCard: (threatId: string, card: CardType) => void; // Probably handled by game logic now
// clearEntityPlayedCards: (threatId: string) => void; // Probably handled by game logic now

// Utility
addLogMessage: (message: string) => void;
resetGame: () => void;

// Internal: Update state based on service events (Placeholder)
\_handleExecutionPause: (request: TargetingRequest) => void;
\_handleExecutionResume: () => void;
\_handleExecutionComplete: (newState: GameState) => void; // Service provides final state
\_updateGameState: (newState: GameState) => void; // Generic update
}

export const useDeckBuilder = create<DeckBuilderState>()(
subscribeWithSelector((set, get) => ({
gameState: null,
locationDeck: null,
entityStatuses: [],
isTargetingModalOpen: false,
currentTargetingRequest: null,

    initializeGame: (playerNames) => {
      cardExecutionService.reset(); // Reset service state
      const newGameState = initializeGame(playerNames);
      const newLocationDeck = newGameState.locationDeck || initializeLocationDeck(); // Ensure location deck exists

      // Initialize entity statuses based on the first location
        let initialEntityStatuses: EntityStatus[] = [];
        if (newLocationDeck.currentLocation?.threats) {
            initialEntityStatuses = newLocationDeck.currentLocation.threats.map(threat => {
                const numPotentials = Math.max(1, Math.min(4, Math.ceil(threat.dangerLevel * 0.8)));
                return {
                    threatId: threat.id,
                    actionPotentials: Array(numPotentials).fill(false),
                    playedCards: [],
                };
            });
        }


      set({
        gameState: newGameState,
        locationDeck: newLocationDeck,
        entityStatuses: initialEntityStatuses,
        isTargetingModalOpen: false,
        currentTargetingRequest: null,
      });
      console.log("Game Initialized");
    },

    queueAndExecuteCard: (cardIndexInHand) => {
       const { gameState, addLogMessage } = get();
       if (!gameState || gameState.phase !== 'action') {
           addLogMessage("Cannot play card now.");
           return;
       }
       const activePlayer = gameState.players[gameState.activePlayerIndex];
       if (activePlayer.actions <= 0) {
           addLogMessage("No actions remaining.");
           return;
       }
        if (cardIndexInHand < 0 || cardIndexInHand >= activePlayer.hand.length) {
            addLogMessage("Invalid card selection.");
            return;
        }

       // Check if service is busy
       if (cardExecutionService.isPausedForTargeting() || cardExecutionService['serviceState'].state === 'RUNNING') {
            addLogMessage("Card execution already in progress.");
            return;
       }

       const cardToPlay = activePlayer.hand[cardIndexInHand];
       const enhancedCard = get().enhanceCard(cardToPlay); // Use internal enhance helper

        // 1. Move card from Hand to Play zone (updates state and adds Zone component)
        const newStateAfterMove = cardExecutionService.moveCardToZone(
            gameState,
            enhancedCard,
            'inHand',
            'inPlay'
        );

       // 2. Queue the card (which is now in the 'inPlay' array conceptually)
       cardExecutionService.queueCard(enhancedCard); // Queue the *specific instance* that was moved

       // 3. Start execution
       cardExecutionService.startExecution(newStateAfterMove, addLogMessage); // Pass the updated state

       // 4. Update store state (will be further updated by service ticks)
        get()._updateGameState(newStateAfterMove); // Update state immediately after move


        // 5. Observe service state changes (handled by useEffect in component or listener here)
        // This part is crucial and needs a proper listener/subscription mechanism
        // Placeholder for demonstration:
        if (cardExecutionService.isPausedForTargeting()) {
             get()._handleExecutionPause(cardExecutionService.getTargetingRequest()!);
        }

    },

    buyMarketCard: (cardIndexInMarket) => {
       const { gameState, addLogMessage } = get();
        if (!gameState || gameState.phase !== 'buy') { // Only allow buying in buy phase? Or anytime? Let's restrict for now.
            addLogMessage("Cannot buy card now (not in Buy phase).");
           return;
        }
        const activePlayer = gameState.players[gameState.activePlayerIndex];
        // if (activePlayer.buys <= 0) { // If buys were limited
        //     addLogMessage("No buys remaining.");
        //     return;
        // }
        if (cardIndexInMarket < 0 || cardIndexInMarket >= gameState.market.availableCards.length) {
            addLogMessage("Invalid market selection.");
            return;
        }

        const cardToBuy = gameState.market.availableCards[cardIndexInMarket];
        const enhancedCard = get().enhanceCard(cardToBuy);

        // Check cost *before* moving/paying
        if (activePlayer.credits < enhancedCard.cost) {
             addLogMessage(`Insufficient credits to buy ${enhancedCard.name} (Cost: ${enhancedCard.cost})`);
             return;
        }

        // Deduct cost (immediate state update)
        activePlayer.credits -= enhancedCard.cost;
        addLogMessage(`Spent ${enhancedCard.cost} credits.`);

        // Move card from Market to Discard
        const newStateAfterMove = cardExecutionService.moveCardToZone(
            gameState,
            enhancedCard,
            'inMarket',
            'inDiscard'
        );

         // Refill market (optional, could happen at end of turn)
        // const finalState = { ...newStateAfterMove, market: refillMarket(newStateAfterMove.market) };
        const finalState = newStateAfterMove;


        addLogMessage(`Bought ${enhancedCard.name}. Added to discard.`);
        get()._updateGameState(finalState);

    },

    provideTargets: (targets) => {
        const { addLogMessage } = get();
         if (!cardExecutionService.isPausedForTargeting()) {
             console.warn("Attempted to provide targets when not required.");
             return;
         }
        addLogMessage(`Target(s) selected: ${targets.map(t => t.name || t.id).join(', ')}`);
        cardExecutionService.provideTargets(targets);
        // Service resumes automatically, UI should react to state changes from service ticks
        get()._handleExecutionResume(); // Update local UI state immediately
    },

     cancelTargeting: () => {
         const { addLogMessage } = get();
         if (!cardExecutionService.isPausedForTargeting()) {
             console.warn("Attempted to cancel targeting when not required.");
             return;
         }
         addLogMessage("Targeting canceled.");
         cardExecutionService.cancelExecution(); // Ask service to handle cancellation
         get()._handleExecutionResume(); // Update UI state (modal closes)
         // Service will potentially move card to discard and proceed
         // Need to get final state from service after it processes cancellation
          const finalState = cardExecutionService.getCurrentGameState();
          if (finalState) {
              get()._updateGameState(finalState);
          }
     },

    endCurrentPhase: () => {
        const { gameState, addLogMessage } = get();
        if (!gameState) return;
        // Check if execution is in progress
        if (cardExecutionService.isPausedForTargeting() || cardExecutionService['serviceState'].state === 'RUNNING') {
             addLogMessage("Cannot end phase while card execution is in progress or paused.");
             return;
        }

        let nextPhase: GamePhase = gameState.phase;
        let turnEnded = false;
        let nextPlayerIndex = gameState.activePlayerIndex;
        let turnNumber = gameState.turnNumber;

        switch (gameState.phase) {
            case 'action':
                nextPhase = 'buy';
                addLogMessage("Ending Action Phase, entering Buy Phase.");
                break;
            case 'buy':
                nextPhase = 'cleanup';
                addLogMessage("Ending Buy Phase, entering Cleanup Phase.");
                break;
            case 'cleanup':
                nextPhase = 'action'; // Next player's action phase
                turnEnded = true;
                addLogMessage(`Ending ${gameState.players[gameState.activePlayerIndex].name}'s turn.`);
                nextPlayerIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
                if (nextPlayerIndex === 0) {
                    turnNumber += 1;
                    addLogMessage(`Starting Turn ${turnNumber}.`);
                }
                addLogMessage(`Starting ${gameState.players[nextPlayerIndex].name}'s turn.`);
                break;
            default:
                 addLogMessage(`Cannot end phase during ${gameState.phase}.`);
                 return; // Don't update state if not applicable
        }

        // Create a new state object
        let updatedGameState = {
            ...gameState,
            phase: nextPhase,
            activePlayerIndex: nextPlayerIndex,
            turnNumber: turnNumber,
        };

        // Handle end-of-turn cleanup for the player whose turn just ended
         if (turnEnded) {
             const playerEndingTurnIndex = (nextPlayerIndex + gameState.players.length - 1) % gameState.players.length;
             let playerEndingTurn = updatedGameState.players[playerEndingTurnIndex];

             // Discard hand
             const handToDiscard = [...playerEndingTurn.hand];
             playerEndingTurn.hand = [];
             playerEndingTurn.discard = [...playerEndingTurn.discard, ...handToDiscard];
             // TODO: Zone transitions needed here if cards are enhanced

              // Reset actions/buys (already done for *next* player below)
              // Maybe reset transient effects here

             updatedGameState.players = updatedGameState.players.map((p, index) =>
                index === playerEndingTurnIndex ? playerEndingTurn : p
             );
              addLogMessage(`${playerEndingTurn.name} discards hand.`);
         }

        // Prepare the *next* player
        let nextPlayer = updatedGameState.players[nextPlayerIndex];
        nextPlayer.actions = 3; // Reset actions (adjust value as needed)
        // nextPlayer.buys = 1; // Reset buys if limited
        // Draw new hand for next player
        const { updatedPlayer: nextPlayerAfterDraw } = drawNCards(nextPlayer, nextPlayer.maxHandSize);
        nextPlayer = nextPlayerAfterDraw;

         // Update the player array
         updatedGameState.players = updatedGameState.players.map((p, index) =>
            index === nextPlayerIndex ? nextPlayer : p
         );

        set({ gameState: updatedGameState });
    },


    // --- Scenario Actions ---
    drawLocation: () => {
      const { locationDeck, gameState, addLogMessage } = get();
      if (!locationDeck || !gameState) return;

      const updatedLocationDeck = drawNextLocation(locationDeck);

       let updatedGameState = gameState;
       if (updatedLocationDeck.currentLocation) {
            updatedGameState = addLog(updatedGameState, `Moved to new location: ${updatedLocationDeck.currentLocation.name}`);
             // Initialize entity statuses for the new location
             let newEntityStatuses: EntityStatus[] = [];
             if (updatedLocationDeck.currentLocation?.threats) {
                 newEntityStatuses = updatedLocationDeck.currentLocation.threats.map(threat => {
                     const numPotentials = Math.max(1, Math.min(4, Math.ceil(threat.dangerLevel * 0.8)));
                     return {
                         threatId: threat.id,
                         actionPotentials: Array(numPotentials).fill(false),
                         playedCards: [],
                     };
                 });
             }
              set({ locationDeck: updatedLocationDeck, gameState: updatedGameState, entityStatuses: newEntityStatuses });
       } else {
            set({ locationDeck: updatedLocationDeck }); // Update even if location is null (end of deck?)
       }

    },

    // --- Basic Dev/Debug Actions ---
    // These need to be refactored to use the service/zone manager if they modify state directly
    drawCard: () => {
       const { gameState, addLogMessage } = get();
       if (!gameState || !isPlayerTurn(gameState)) return;
       const playerIndex = gameState.activePlayerIndex;
       const { updatedPlayer, drawnCards } = drawNCards(gameState.players[playerIndex], 1);
        if (drawnCards.length > 0) {
             const updatedGameState = {
                 ...gameState,
                 players: gameState.players.map((p, i) => i === playerIndex ? updatedPlayer : p)
             };
             addLogMessage(`Drew ${drawnCards[0].name}.`);
             set({ gameState: updatedGameState });
        } else {
             addLogMessage("Could not draw card (deck empty?).");
        }
    },
    gainCredit: () => {
         const { gameState, addLogMessage } = get();
         if (!gameState || !isPlayerTurn(gameState)) return;
         const playerIndex = gameState.activePlayerIndex;
         const updatedPlayer = { ...gameState.players[playerIndex], credits: gameState.players[playerIndex].credits + 1 };
         const updatedGameState = {
             ...gameState,
             players: gameState.players.map((p, i) => i === playerIndex ? updatedPlayer : p)
         };
         addLogMessage("Gained 1 credit.");
         set({ gameState: updatedGameState });
    },
    gainAction: () => {
         const { gameState, addLogMessage } = get();
         if (!gameState || !isPlayerTurn(gameState)) return;
         const playerIndex = gameState.activePlayerIndex;
         const updatedPlayer = { ...gameState.players[playerIndex], actions: gameState.players[playerIndex].actions + 1 };
          const updatedGameState = {
             ...gameState,
             players: gameState.players.map((p, i) => i === playerIndex ? updatedPlayer : p)
         };
         addLogMessage("Gained 1 action.");
         set({ gameState: updatedGameState });
    },
    shuffleDiscard: () => {
         const { gameState, addLogMessage } = get();
         if (!gameState || !isPlayerTurn(gameState)) return;
         const playerIndex = gameState.activePlayerIndex;
         let player = gameState.players[playerIndex];
          if (player.discard.length === 0) {
             addLogMessage("Discard pile is empty.");
             return;
         }
          let updatedDeck = shuffleDeck([...player.deck, ...player.discard]);
          // TODO: Zone transitions needed
          let updatedPlayer = { ...player, deck: updatedDeck, discard: [] };
           const updatedGameState = {
             ...gameState,
             players: gameState.players.map((p, i) => i === playerIndex ? updatedPlayer : p)
         };
         addLogMessage("Shuffled discard into deck.");
         set({ gameState: updatedGameState });
    },

    // --- Entity Status Management ---
     updateEntityActionPotential: (threatId, newPotentials) => {
      set((state) => {
        const existingIndex = state.entityStatuses.findIndex(status => status.threatId === threatId);
        let updatedStatuses = [...state.entityStatuses];
         if (existingIndex >= 0) {
              // Check if threat is dead before updating
               const isDead = state.locationDeck?.currentLocation?.threats.some(t => t.id === threatId && (t.isDead || t.defenseValue <= 0));
               if (!isDead) {
                    updatedStatuses[existingIndex] = { ...updatedStatuses[existingIndex], actionPotentials: newPotentials };
               }
         } else {
              // Only add if threat exists in current location and is not dead
              const threatExists = state.locationDeck?.currentLocation?.threats.some(t => t.id === threatId && !(t.isDead || t.defenseValue <= 0));
              if (threatExists) {
                   updatedStatuses.push({ threatId, actionPotentials: newPotentials, playedCards: [] });
              }
         }
        return { entityStatuses: updatedStatuses };
      });
    },

    addLogMessage: (message) => {
      set((state) => {
        if (!state.gameState) return {};
        return { gameState: addLog(state.gameState, message) };
      });
    },

    resetGame: () => {
      cardExecutionService.reset();
      set({
        gameState: null,
        locationDeck: null,
        entityStatuses: [],
        isTargetingModalOpen: false,
        currentTargetingRequest: null,
      });
      console.log("Game Reset");
    },

    // --- Internal Handlers ---
    _handleExecutionPause: (request) => {
        console.log("Store: Handling execution pause, opening modal.");
        set({ isTargetingModalOpen: true, currentTargetingRequest: request });
    },
    _handleExecutionResume: () => {
         console.log("Store: Handling execution resume, closing modal.");
        set({ isTargetingModalOpen: false, currentTargetingRequest: null });
    },
     _handleExecutionComplete: (newState) => {
         console.log("Store: Handling execution complete.");
          // Called by the service when the queue finishes or is aborted cleanly
         set({
             gameState: newState, // Update with the final state from the service
             isTargetingModalOpen: false, // Ensure modal is closed
             currentTargetingRequest: null
          });
    },
    _updateGameState: (newState) => {
         // Generic state update, useful for intermediate steps
         set({ gameState: newState });
    },


    // Internal enhanceCard helper (copied from original store)
    enhanceCard: (card: CardType): EnhancedCard => {
        const enhancedVersion = getEnhancedCard(card.id);
        if (enhancedVersion) {
          return { ...enhancedVersion }; // Return copy
        } else {
           // Return minimal enhanced card
           const minimalEnhanced = { ...card, components: card.components || [] };
            // Ensure components array exists even if base card didn't have one
            if (!Array.isArray(minimalEnhanced.components)) {
                minimalEnhanced.components = [];
            }
           return minimalEnhanced as EnhancedCard; // Assert type
        }
      },

})),
);

// Helper function
const isPlayerTurn = (gameState: GameState | null): boolean => {
return !!gameState && gameState.activePlayerIndex === 0;
}

// Optional: Add a listener to react to service state changes globally
// This requires the service to be an event emitter or have subscribable state.
// Example (conceptual):
// cardExecutionService.subscribe((serviceState) => {
// const storeState = useDeckBuilder.getState();
// if (serviceState.state === ExecutionStateEnum.PAUSED_FOR_TARGETING && !storeState.isTargetingModalOpen) {
// storeState.\_handleExecutionPause(serviceState.currentTargetingRequest);
// } else if (serviceState.state !== ExecutionStateEnum.PAUSED_FOR_TARGETING && storeState.isTargetingModalOpen) {
// storeState.\_handleExecutionResume();
// }
// // Update game state if service provides it
// if (serviceState.currentGameState) {
// storeState.\_updateGameState(serviceState.currentGameState);
// }
// });
Use code with caution.
TypeScript
/client/src/components/GameBoard.tsx (Adaptations)
Modify the useEffect that watches for targeting needs. Instead of directly checking cardExecutionService, it should check useDeckBuilder's state (isTargetingModalOpen, currentTargetingRequest).
Modify handleExecuteQueuedCards to simply call useDeckBuilder.queueAndExecuteCard (or a similar trigger action) for each card intended for execution, rather than managing the loop itself. Or have a single "Execute Turn Actions" button that triggers the service for all queued cards.
Modify handleTargetSelection to call useDeckBuilder.provideTargets.
Pass currentTargetingRequest (from the store) to the CardTargetingModal so it knows what to display and what filters to apply.
// Inside GameBoard.tsx

const {
// ... other state from useDeckBuilder
isTargetingModalOpen,
currentTargetingRequest, // Get the request info
queueAndExecuteCard, // Use the combined action
provideTargets,
cancelTargeting,
// ... other actions
} = useDeckBuilder();

// ... other useState hooks

// Effect to handle modal visibility based on store state
// useEffect(() => {
// // This effect is no longer strictly necessary if the modal's
// // isOpen prop directly uses the store's isTargetingModalOpen state.
// // Kept here for clarity or if additional logic is needed.
// setIsTargetingModalOpen(storeIsTargetingModalOpen);
// }, [storeIsTargetingModalOpen]);

// Handler for clicking a card in hand (simplified)
const handlePlayHandCard = (cardIndex: number) => {
if (isPlayerTurn && activePlayer.actions > 0) {
queueAndExecuteCard(cardIndex); // Use the store action
} else {
// Log why it failed
if (!isPlayerTurn) addLogMessage('Cannot play cards during opponent\'s turn.');
else if (activePlayer.actions <= 0) addLogMessage('No actions remaining.');
}
};

// Handler for the main execute button (if keeping separate queue/execute)
// This might be removed if play is atomic per card
const handleExecuteTurnActions = () => {
if (isPlayerTurn) {
if (activePlayer.inPlay.length > 0) {
// TODO: Decide how to trigger execution of MULTIPLE queued cards
// Option 1: Execute them one by one via the service (complex UI sync)
// Option 2: Have the service handle the whole 'inPlay' queue at once (simpler UI sync)
// Assuming Option 2 for now:
executeQueuedCards(); // Tell the store to execute everything currently in 'inPlay' via the service
} else {
addLogMessage('No actions queued to execute.');
}
}
};

// Target selection handler (simplified)
const handleTargetSelection = (selectedTargets: any[]) => {
console.log("GameBoard: Confirming target selection via store action:", selectedTargets);
provideTargets(selectedTargets); // Call the store action
// No need to manually close modal, store state change will handle it
};

const handleCloseTargetingModal = () => {
console.log("GameBoard: Closing targeting modal via store action (cancel)");
cancelTargeting(); // Call the store action to cancel
};

// ... inside the return statement ...

{/_Replace Hand with DraggableHand if using queue_/}
<DraggableHand
cards={activePlayer.hand}
onCardClick={handlePlayHandCard} // Play immediately queues and starts execution
onDragEnd={handleDragEnd} // Keep drag for reordering hand maybe? Or remove drag from hand.
canPlayCards={canPlayCards}
title="YOUR HAND (Click to Play)"
isQueue={false} // This is the hand, not the execution queue
/>

{/_Active Programs / Execution Queue _/}
<DraggableHand
cards={activePlayer.inPlay} // 'inPlay' now acts as the conceptual queue
onCardClick={handleReturnQueuedCard} // Click to return to hand before execution? Needs design decision.
onDragEnd={handleDragEnd} // Reorder execution sequence
canPlayCards={isPlayerTurn} // Can interact if it's player turn
title="ACTION QUEUE (Drag to Reorder)"
isQueue={true}
/>
{/_ Execute Button (if keeping separate execute step)_/}
<ExecuteButton
onExecute={handleExecuteTurnActions} // Trigger execution of the queue
disabled={!isPlayerTurn || activePlayer.inPlay.length === 0}
count={activePlayer.inPlay.length}
/>

{/_Pass store state to the targeting modal_/}
<CardTargetingModal
isOpen={isTargetingModalOpen} // Use store state directly
onClose={handleCloseTargetingModal} // Use cancel action
onTargetSelect={handleTargetSelection}
// Pass targeting request info to the modal
// card={currentTargetingRequest?.requestingCard} // Need to fetch card object based on ID
// context={cardExecutionService.getExecutionContext()} // Maybe pass relevant context parts?
// possibleTargets={derivePossibleTargets(currentTargetingRequest, gameState, locationDeck)} // Derive targets based on request
// message={currentTargetingRequest?.message}
// maxTargets={currentTargetingRequest?.maxTargets}
// minTargets={currentTargetingRequest?.minTargets}
/>

// ... rest of GameBoard
Use code with caution.
TypeScript

---

# COMPLETED: Action Potential (AP) Gain Logic Refactor
- All threat AP gain and play logic is now centralized in `client/src/lib/game/threats.ts`.
- No direct mutation of `threat.actionPotential` remains outside these utilities.
- All tests (including deferred play at max AP) pass.
- Comments added to all relevant files enforcing use of the utility functions.
- See `testingplan.md` for test coverage.

---
