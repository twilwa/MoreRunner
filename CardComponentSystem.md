# Card Component System Design

This document outlines the design architecture for the component-based card system in our Cyberpunk deck-builder game. The component system allows for modular card creation, predictable execution, and faction-specific mechanics.

## System Architecture Overview

The card component system uses an entity-component pattern where each card is composed of multiple components that define its behavior. Components execute sequentially, providing a clear and predictable execution flow.

```
Card → Components → GameState Changes
```

## Faction Design Philosophy

Each faction has a distinct mechanical identity that is expressed through its component preferences and synergies:

### Anarch (Red)
- **Identity**: Destructive, high-risk/high-reward, "burn it down"
- **Mechanical Expression**:
  - Cards often have self-damage or resource costs for powerful effects
  - Virus programs that grow stronger over time
  - Effects that leverage chaos or destruction
  - Recycling destroyed resources into new advantages
- **Component Preferences**:
  - DealDamage
  - TrashCost
  - RiskReward
  - ProgressiveEffect (viruses)
- **Gameplay Pattern**:
  - Fast start with immediate impact
  - Accept high risk for potentially massive payoffs
  - Create and thrive in chaotic situations

### Criminal (Blue)
- **Identity**: Efficient, resourceful, stealthy, "configuration/tool user"
- **Mechanical Expression**:
  - Strong economy and resource generation
  - Bypass security rather than confronting it
  - Efficient action economy
  - Control and evasion
- **Component Preferences**:
  - GainCredits
  - BypassSecurity
  - CancelCard
  - RedirectEffect
- **Gameplay Pattern**:
  - Build resources early
  - Invest in efficient tools and configurations
  - Control the tempo through efficient plays
  - Create and exploit opportunities

### Shaper (Green)
- **Identity**: Engineering, building, construction, "masters of their craft"
- **Mechanical Expression**:
  - Installing and enhancing programs
  - Combining cards for powerful effects
  - Slower startup but overwhelming late-game
  - Technical solutions to problems
- **Component Preferences**:
  - InstallCard
  - BoostProgram
  - ComboEffect
  - ProgressiveEffect (constructive)
- **Gameplay Pattern**:
  - Slower startup phase (setting up infrastructure)
  - Methodically building synergistic systems
  - Creating powerful combos that enhance each other
  - Dominating late-game with superior technology

## Component Execution Flow

Components execute in a defined sequence that respects the logical flow of card effects:

1. **Cost Components** (CreditCost, ActionCost, TrashCost, etc.)
2. **Targeting Components** (SelfTarget, SingleEntityTarget, MultiEntityTarget)
3. **Control Flow Components** (PauseQueue, CancelCard, etc.)
4. **Effect Components** (DealDamage, GainCredits, DrawCards, etc.)
5. **Conditional Components** (KeywordSynergy, ComboEffect, etc.)
6. **Information Components** (RevealCard, ScanEntity, etc.)

This sequence ensures that costs are paid before effects resolve, targeting happens before effects are applied, and conditional modifiers can appropriately adjust effect outcomes.

## Component Types and Faction Affinities

### Cost Components
- **CreditCost**: Pay credits to play the card
  - *High Criminal affinity* - Higher costs but more efficient outcomes
  - *Medium Shaper affinity* - Moderate costs with long-term gain
  - *Low Anarch affinity* - Lower costs but higher risk
- **ActionCost**: Spend actions to play the card
  - *High Shaper affinity* - Multi-action setup costs
  - *Medium Anarch affinity* - Standard action costs
  - *Low Criminal affinity* - Action-efficient cards
- **TrashCost**: Trash cards or programs as part of the cost
  - *High Anarch affinity* - Recycling/destructive gameplay
  - *Medium Shaper affinity* - Upgrading older components
  - *Low Criminal affinity* - Prefer preservation of resources
- **HealthCost**: Take damage as part of the cost
  - *High Anarch affinity* - Risk-taking for power
  - *Low Criminal/Shaper affinity* - Prefer safer options

### Effect Components
- **DealDamage**: Deal damage to a target
  - *High Anarch affinity* - Direct, destructive approach
  - *Low Shaper affinity* - Prefer construction over destruction
- **GainCredits**: Gain credits
  - *High Criminal affinity* - Economic focus
  - *Medium Shaper affinity* - Resource building
  - *Low Anarch affinity* - Less economic efficiency
- **DrawCards**: Draw cards
  - *High Shaper affinity* - Card advantage for combo building
  - *Medium Criminal affinity* - Option flexibility
  - *Medium Anarch affinity* - Digging for key pieces
- **InstallCard**: Install cards from hand/stack/heap
  - *High Shaper affinity* - Building infrastructure
  - *Medium Criminal affinity* - Tool deployment
  - *Low Anarch affinity* - Less structured approach

### Conditional Components
- **KeywordSynergy**: Enhanced effects with matching keywords
  - *High Shaper affinity* - Combo-oriented gameplay
  - *Medium Anarch affinity* - Virus synergies
  - *Low Criminal affinity* - Less dependent on synergies
- **RiskReward**: Gamble on outcomes
  - *High Anarch affinity* - High-risk gameplay
  - *Low Criminal/Shaper affinity* - Prefer predictability
- **ComboEffect**: Power up when played with specific cards
  - *High Shaper affinity* - Combo-focused
  - *Medium Criminal affinity* - Tool synergies
  - *Low Anarch affinity* - More independent cards

### Control Components
- **CancelCard**: Cancel another card's effects
  - *High Criminal affinity* - Control-oriented
  - *Medium Shaper affinity* - Technical countermeasures
  - *Low Anarch affinity* - Prefer direct approaches
- **BypassSecurity**: Skip or ignore security mechanisms
  - *High Criminal affinity* - Evasion-focused
  - *Low Shaper/Anarch affinity* - Different approaches to obstacles

## Card Design Guidelines by Faction

### Anarch Cards
- Include at least one high-risk element (self-damage, resource sacrifice, randomness)
- Front-load power in exchange for future costs or drawbacks
- Create opportunities for explosive, unpredictable outcomes
- Use virus counters, progressive effects, and strength-over-time mechanics
- Leverage destruction as a resource (trash for benefit)

### Criminal Cards
- Focus on efficiency (credit-to-effect ratio, action economy)
- Include bypass, evasion, or control elements
- Create resource advantages that can be leveraged
- Prioritize consistency and reliability over explosive power
- Include stealth, social engineering, or economic mechanisms

### Shaper Cards
- Design for combo potential with other cards
- Include setup and payoff elements (initially expensive but powerful later)
- Focus on building, enhancing, or modifying infrastructure
- Create resource transformation rather than direct gains
- Emphasize technical solutions and program synergies

## Component Implementation Strategy

The component system implementation follows these principles:

1. **Stateless Components**: Components should not maintain state between executions
2. **Context-Aware**: Components receive a context object with game state information
3. **Sequential Execution**: Components execute in a defined order
4. **Pause and Resume**: Components can pause execution for user input
5. **Target Selection**: Targeting components handle selecting appropriate targets
6. **Effect Application**: Effect components apply changes to game state

## Usage in Card Execution Service

The CardExecutionService manages the execution flow:

```typescript
// Simplified example
export class CardExecutionService {
  // Queue and execute cards
  queueCard(card: EnhancedCard): void {
    this.executionState.queue.push(card);
  }
  
  executeNextCard(gameState: any, addLogMessage: (message: string) => void): boolean {
    const card = this.executionState.queue[this.executionState.currentIndex];
    const context = this.createExecutionContext(gameState);
    
    // Execute each component in sequence
    for (const component of card.components) {
      // Component may pause execution for user input
      if (component.execute(context)) {
        this.executionState.isPaused = true;
        return false; // Execution paused
      }
    }
    
    this.executionState.currentIndex++;
    return true; // Execution completed
  }
  
  // Resume execution after user input
  provideTargets(targets: any[]): void {
    this.executionState.selectedTargets = targets;
    this.executionState.isPaused = false;
  }
}
```

## Next Steps for Implementation

1. **Component Factory**: Create a factory for instantiating components from specifications
2. **Text Parser**: Develop a parser to extract component configurations from card text
3. **Faction-Specific Components**: Implement specialized components for each faction
4. **UI Integration**: Connect component execution to UI feedback and animations
5. **Balance Testing**: Create a test framework for balancing component parameters