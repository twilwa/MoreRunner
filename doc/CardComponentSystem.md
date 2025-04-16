## Revised `CardComponentSystem.md`

```markdown
# Card Component System Design (Runner Focused)

This document outlines the design architecture for the component-based card system in our Cyberpunk deck-builder game, focusing on the Runner factions for scenario mode. The component system allows for modular card creation, predictable execution, and faction-specific mechanics.

## System Architecture Overview

The card component system uses an entity-component pattern where each card is composed of multiple components that define its behavior. Components execute sequentially, providing a clear and predictable execution flow.

```
Card → Components → GameState Changes
```

## Runner Faction Design Philosophy

Each Runner faction has a distinct mechanical identity expressed through its component preferences and synergies:

### Anarch (Red)
- **Identity**: Destructive, high-risk/high-reward, recycle-focused, chaotic, "burn it down".
- **Mechanical Expression**:
  - Cards often use `TrashCost` (self), `HealthCost`, or `RiskReward` components for powerful effects.
  - Virus programs utilizing `AddCounters` and `ProgressiveEffect` to grow stronger.
  - Direct destruction effects (`TrashTargetCard`, `DealDamage`).
  - Recycling destroyed/trashed resources (`RecycleCard`).
- **Component Preferences**: `DealDamage`, `TrashTargetCard`, `TrashCost`, `HealthCost`, `RiskReward`, `AddCounters` (Virus), `ProgressiveEffect`, `RecycleCard`.
- **Gameplay Pattern**: Seeks immediate impact, often at personal cost. Creates opportunities through destruction and chaos. Can snowball if unchecked but vulnerable to self-destruction or focused counter-play.

### Criminal (Blue)
- **Identity**: Efficient, resourceful, stealthy, flexible, tool-user, "fixer".
- **Mechanical Expression**:
  - Strong economy (`GainCredits`) and action efficiency (`GainAction`).
  - Bypassing obstacles (`BypassSecurity`) rather than direct confrontation.
  - Controlling the flow (`CancelCard`, `RedirectEffect`).
  - Leveraging connections and information (`Connection` keyword, `PeekLocation`).
  - Using specific `Event` cards for high-impact, efficient plays.
- **Component Preferences**: `GainCredits`, `BypassSecurity`, `CancelCard`, `RedirectEffect`, `GainAction`, `Event` (as a card type), `Connection` (Keyword), `Stealth` (Keyword). High affinity for efficient `CreditCost` usage.
- **Gameplay Pattern**: Builds resources consistently. Invests in tools (`Program`, `Hardware`) and events for efficient problem-solving. Controls tempo through denial and clever plays. Exploits temporary weaknesses.

### Shaper (Green)
- **Identity**: Engineering, building, construction, combo-focused, slow setup/strong finish, "master craftsman".
- **Mechanical Expression**:
  - Installing infrastructure (`InstallCard` for `Program`, `Hardware`).
  - Enhancing installed cards (`BoostProgram`, `ModifyTarget`).
  - Finding combo pieces (`DrawCards`, tutoring effects).
  - Leveraging synergistic interactions (`ComboEffect`, `KeywordSynergy`).
  - Modifying base stats (`IncreaseMemory`, improving efficiency).
- **Component Preferences**: `InstallCard`, `BoostProgram`, `ModifyTarget`, `ComboEffect`, `DrawCards`, `StateModificationComponent` (`IncreaseMemory`), `Program` (Keyword), `Hardware` (Keyword), `Mod` (Keyword). Accepts higher initial `CreditCost`/`ActionCost`.
- **Gameplay Pattern**: Invests significant resources (time, actions, credits) early to build a complex, synergistic rig. Aims to create an "engine" that provides overwhelming advantage in the late game.

## Component Execution Flow

Components execute in a defined sequence:

1.  **Cost Components** (Check if payable: `CreditCost`, `ActionCost`, `TrashCost`, `HealthCost`, `KeywordRequirement`)
2.  **Targeting Components** (Determine targets: `SelfTarget`, `SingleEntityTarget`, `MultiEntityTarget`, `LocationTarget`)
3.  **Pre-Effect Conditional Components** (Check conditions before applying core effect: `RunCondition`, `ResourceThreshold`)
4.  **Control Flow Components (Early)** (Interventions before core effect: `PauseQueue`, `CancelCard` - if cancelling self)
5.  **Pay Costs** (Deduct resources based on Cost Components)
6.  **Effect Components** (Apply main effect: `DealDamage`, `GainCredits`, `InstallCard`, `BypassSecurity`, etc.)
7.  **Post-Effect Conditional / Synergy Components** (Check conditions after core effect, apply bonuses: `KeywordSynergy`, `FactionSynergy`, `ComboEffect`, `RiskReward` resolution)
8.  **State Modification Components** (Apply persistent changes: `IncreaseMemory`, `AddCounters`)
9.  **Information Components** (Reveal info: `RevealCard`, `ScanEntity`)
10. **Control Flow Components (Late)** (Cleanup/chaining: `ChainEffect`)

This sequence ensures costs are checked before targeting, paid before effects, and conditionals modify effects appropriately.

## Component Types and Runner Faction Affinities

### Cost Components
- **CreditCost**:
  - *Criminal*: High Affinity (Willing to pay for powerful, efficient effects).
  - *Shaper*: Medium Affinity (Accept high initial costs for long-term value).
  - *Anarch*: Low Affinity (Prefer alternative costs like health/trash).
- **ActionCost**:
  - *Shaper*: High Affinity (Setup often takes multiple actions).
  - *Anarch*: Medium Affinity (Standard action economy).
  - *Criminal*: Low Affinity (Seek action efficiency, multi-action turns).
- **TrashCost (Self)**:
  - *Anarch*: High Affinity (Core mechanic, recycling theme).
  - *Shaper*: Medium Affinity (Acceptable for upgrades/combos).
  - *Criminal*: Low Affinity (Value preserving resources).
- **HealthCost (Self)**:
  - *Anarch*: High Affinity (Risk-taking for power).
  - *Criminal*: Very Low Affinity (Avoid direct harm).
  - *Shaper*: Very Low Affinity (Avoid direct harm).
- **KeywordRequirement**:
  - *Shaper*: High Affinity (Combo/synergy focus).
  - *Anarch*: Medium Affinity (Virus synergy).
  - *Criminal*: Low Affinity (More self-contained effects).

### Effect Components
- **DealDamage (to Corp/ICE)**:
  - *Anarch*: High Affinity (Direct destruction).
  - *Criminal*: Low Affinity (Prefer bypass/manipulation).
  * *Shaper*: Low Affinity (Prefer efficient breaking/building).
- **GainCredits**:
  - *Criminal*: High Affinity (Core economic engine).
  - *Shaper*: Medium Affinity (Resource building for setup).
  - *Anarch*: Low Affinity (Less focused on pure economy).
- **DrawCards**:
  - *Shaper*: High Affinity (Finding combo pieces).
  - *Criminal*: Medium Affinity (Options and flexibility).
  - *Anarch*: Medium Affinity (Digging for specific destructive tools).
- **InstallCard**:
  - *Shaper*: High Affinity (Core building mechanic).
  - *Criminal*: Medium Affinity (Deploying specific tools/resources).
  - *Anarch*: Low Affinity (Less emphasis on building complex rigs).
- **TrashTargetCard (e.g., ICE)**:
  - *Anarch*: High Affinity (Destruction focus).
  - *Criminal*: Low Affinity (Prefer bypass/leaving no trace).
  - *Shaper*: Medium Affinity (Only if efficient or part of a combo).
- **BypassSecurity**:
  - *Criminal*: High Affinity (Core evasion mechanic).
  - *Shaper*: Medium Affinity (If more efficient than breaking).
  - *Anarch*: Low Affinity (Prefer direct confrontation/destruction).
- **RecycleCard**:
  - *Anarch*: High Affinity (Synergy with self-trashing).
  - *Shaper*: Medium Affinity (Recovering key combo pieces).
  - *Criminal*: Low Affinity (Prefer not losing cards in the first place).
- **AddCounters**:
  - *Anarch*: High Affinity (Virus counters).
  - *Shaper*: Medium Affinity (Power counters, charge counters for setup).
  - *Criminal*: Low Affinity (Less common).
- **ModifyTarget**:
  - *Shaper*: High Affinity (Boosting programs, modifying hardware).
  - *Anarch*: Medium Affinity (Weakening ICE via viruses).
  - *Criminal*: Low Affinity (Less direct modification).

### Conditional Components
- **KeywordSynergy**:
  - *Shaper*: High Affinity (Core combo mechanic).
  - *Anarch*: Medium Affinity (Virus interactions).
  - *Criminal*: Low Affinity (Less dependent on specific keywords).
- **RunCondition**:
  - *Criminal*: High Affinity (Rewards for successful runs, specific server access).
  - *Anarch*: Medium Affinity (Triggering effects after destruction/runs).
  - *Shaper*: Medium Affinity (Triggering effects after setup/installs).
- **RiskReward**:
  - *Anarch*: High Affinity (Embraces unpredictability).
  - *Criminal*: Low Affinity (Prefers reliable outcomes).
  - *Shaper*: Low Affinity (Prefers calculated results).
- **ComboEffect**:
  - *Shaper*: High Affinity (Primary payoff mechanic).
  - *Anarch*: Low Affinity.
  - *Criminal*: Medium Affinity (Synergy between specific tools/events).

### Control Components
- **CancelCard**:
  - *Criminal*: High Affinity (Control and denial).
  - *Shaper*: Medium Affinity (Technical countermeasures).
  - *Anarch*: Low Affinity (Prefers overwhelming force).
- **RedirectEffect**:
  - *Criminal*: High Affinity (Manipulation and control).
  - *Anarch*: Medium Affinity (If it causes chaos).
  - *Shaper*: Low Affinity (Prefers building own strategy).

### State Modification Components
- **IncreaseMemory**:
  - *Shaper*: High Affinity (Needed for large rigs).
  - *Criminal*: Medium Affinity (Supports diverse toolkits).
  - *Anarch*: Low Affinity (Often uses fewer, more impactful programs).
- **ModifyAttribute**:
  - *Shaper*: High Affinity (Core part of rig building/tuning).
  - *Anarch*: Medium Affinity (Virus effects).
  - *Criminal*: Low Affinity.

## Runner Card Design Guidelines by Faction

### Anarch Cards
- Often include `TrashCost`, `HealthCost`, or `RiskReward`.
- Feature direct destruction (`TrashTargetCard`, `DealDamage`) or virus mechanics (`AddCounters`, `ProgressiveEffect`).
- Enable recycling (`RecycleCard`) or benefit from self-destruction.
- Effects can be powerful but potentially unpredictable or costly.

### Criminal Cards
- Focus on resource efficiency (`GainCredits`, `GainAction`, effective `CreditCost`).
- Include evasion (`BypassSecurity`, `Stealth` keyword) or control (`CancelCard`, `RedirectEffect`).
- Reward successful runs (`RunCondition`).
- Leverage `Connection` keyword for unique benefits or information.

### Shaper Cards
- Emphasize installation (`InstallCard`) and modification (`BoostProgram`, `ModifyTarget`, `IncreaseMemory`).
- Rely on synergy (`KeywordSynergy`, `ComboEffect`) between installed cards (`Program`, `Hardware`).
- Include card draw (`DrawCards`) or tutoring to assemble combos.
- Often involve a setup phase with higher initial costs (`CreditCost`, `ActionCost`).

## Component Implementation Strategy

(Remains largely the same - general principles)
1.  **Stateless Components**: Components should not maintain state between executions.
2.  **Context-Aware**: Components receive a `GameContext` object with game state.
3.  **Sequential Execution**: Adhere to the defined execution order.
4.  **Pause and Resume**: Support pausing for user input (targeting).
5.  **Target Selection**: Targeting components handle identifying valid targets based on context.
6.  **Effect Application**: Effect components modify the `GameContext`.

## Usage in Card Execution Service

(Remains largely the same - conceptual code)
```typescript
// Simplified example
export class CardExecutionService {
  private executionState: { queue: EnhancedCard[], currentIndex: number, isPaused: boolean, selectedTargets: any[] } = { queue: [], currentIndex: 0, isPaused: false, selectedTargets: [] };

  queueCard(card: EnhancedCard): void {
    this.executionState.queue.push(card);
    // Potentially trigger execution if not already running
  }

  // Executes the next step or component of the current card
  tickExecution(gameState: any, addLogMessage: (message: string) => void): boolean {
    if (this.executionState.isPaused || this.executionState.currentIndex >= this.executionState.queue.length) {
      return false; // Nothing to execute or paused
    }

    const card = this.executionState.queue[this.executionState.currentIndex];
    const context = this.createExecutionContext(gameState, card, this.executionState.selectedTargets);

    // Find the next component to execute based on internal card state/pointer
    const nextComponent = this.getNextComponentToExecute(card, context);

    if (!nextComponent) {
        // Card finished
        addLogMessage(`${card.name} finished execution.`);
        this.executionState.currentIndex++;
        this.executionState.selectedTargets = []; // Clear targets for next card
        return this.executionState.currentIndex < this.executionState.queue.length; // Return true if more cards in queue
    }

    // Check costs *before* executing targeting or effects (simplified here)
    if (nextComponent instanceof CostComponent) {
        if (!nextComponent.canPay(context)) {
             addLogMessage(`Cannot pay cost for ${card.name}. Aborting.`);
             this.abortCurrentCard();
             return this.executionState.currentIndex < this.executionState.queue.length;
        }
        // Cost payment might happen later in the sequence
    }

    addLogMessage(`Executing ${nextComponent.constructor.name} for ${card.name}`);
    const shouldPause = nextComponent.apply(context); // Apply the component's logic

    if (shouldPause) {
      addLogMessage(`${card.name} execution paused for input.`);
      this.executionState.isPaused = true;
      return false; // Execution paused
    }

    // Move to the next component within the card internally
    this.advanceComponentPointer(card);

    return true; // Execution continues (potentially next component in next tick)
  }


  provideTargets(targets: any[]): void {
    if (this.executionState.isPaused) {
        this.executionState.selectedTargets = targets;
        this.executionState.isPaused = false;
        // Trigger tickExecution again
    }
  }

  private createExecutionContext(gameState: any, card: EnhancedCard, targets: any[]): GameContext {
    // Implementation details...
    return { gameState, currentCard: card, targets };
  }

  private getNextComponentToExecute(card: EnhancedCard, context: GameContext): Component | null {
     // Logic to determine the next component based on card's internal execution pointer and potentially context
     // ...
     return null; // Placeholder
  }

   private advanceComponentPointer(card: EnhancedCard): void {
     // Logic to move to the next component in the card's sequence
     // ...
   }

   private abortCurrentCard(): void {
       // Logic to remove the current card from the queue or mark it as aborted
       this.executionState.currentIndex++;
       this.executionState.selectedTargets = [];
       this.executionState.isPaused = false;
   }
}
```

Next Steps for Runner Implementation

Implement Core Runner Components: Prioritize components central to Anarch, Criminal, and Shaper identities (e.g., TrashCost, BypassSecurity, InstallCard, BoostProgram, AddCounters (Virus)).

Refine Component Execution Logic: Ensure the CardExecutionService correctly handles the sequence, conditionals, and context passing.

Text Parser Patterns: Develop initial regex/parsing rules for common Runner card text patterns.

Basic UI Feedback: Implement visual cues for core Runner actions (installing programs, gaining credits, taking damage, bypassing ICE).
Test Runner Interactions: Create test scenarios focusing on Runner vs. basic Corp defenses (placeholder ICE/Assets).