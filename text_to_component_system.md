
# Text-to-Component Mapping System (Runner Focused)

This document outlines the design and implementation plan for the text-to-component mapping system, focusing on automatically generating card components from Runner card descriptions for scenario mode.

## System Overview

The system parses Runner card text, identifies patterns corresponding to game mechanics, generates appropriate components, and sequences them correctly.

```mermaid
flowchart TB
    CardText[Card Text] --> TextParser[Text Parser]
    TextParser --> PatternMatcher[Pattern Matcher]
    PatternMatcher --> ComponentGenerator[Component Generator]
    ComponentGenerator --> ComponentSequencer[Component Sequencer]
    ComponentSequencer --> EnhancedCard[Enhanced Card (Runner)]
```

Pattern Definition System
We use structured rules mapping text patterns to component configurations.

```typescript
interface TextPattern {
  pattern: string | RegExp; // Pattern to match
  components: ComponentGeneratorConfig[]; // Components to generate
  precedence: number; // Order for handling overlaps
  factionAffinity?: string[]; // Optional: Factions this pattern is common for (Anarch, Criminal, Shaper)
}

interface ComponentGeneratorConfig {
  type: string; // Component type
  parameterMap: { // Maps captures to parameters
    [paramName: string]: string | number | boolean | ((captures: RegExpMatchArray) => any);
  };
  executionOrder: number; // Relative order (e.g., Costs=10, Targeting=20, Effects=50, Conditionals=60)
}



Example Runner Pattern Definitions
const patterns = [
  // Criminal Example: Gain Credits
  {
    pattern: /Gain (\d+) credits?/i,
    components: [
      { type: 'SelfTarget', parameterMap: {}, executionOrder: 20 },
      { type: 'GainCredits', parameterMap: { amount: (c) => parseInt(c[1]) }, executionOrder: 50 }
    ],
    precedence: 1,
    factionAffinity: ['Criminal', 'Shaper']
  },
  // Criminal Example: Bypass ICE
  {
    pattern: /Bypass the first piece of ICE you encounter(?: this run)?/i,
    components: [
      { type: 'RunCondition', parameterMap: { conditionType: 'EncounterICE', count: 1 }, executionOrder: 30 }, // Condition checked during run
      { type: 'BypassSecurity', parameterMap: { targetType: 'ICE' }, executionOrder: 50 } // Effect applied if condition met
    ],
    precedence: 2,
    factionAffinity: ['Criminal']
  },
   // Criminal Example: Event Cost + Conditional Effect
  {
    pattern: /Pay (\d+) credits? to cancel a trace attempt/i,
    components: [
      { type: 'CreditCost', parameterMap: { amount: (c) => parseInt(c[1]) }, executionOrder: 10 },
      { type: 'SingleEntityTarget', parameterMap: { targetType: 'TraceEffect', allowTargetSelection: true }, executionOrder: 20 }, // Hypothetical target
      { type: 'CancelCard', parameterMap: {}, executionOrder: 50 } // Cancels the targeted trace effect
    ],
    precedence: 3,
    factionAffinity: ['Criminal']
  },
  // Anarch Example: Trash Self for Effect
  {
    pattern: /Trash an? installed program to trash a piece of ICE/i,
    components: [
      { type: 'TrashCost', parameterMap: { targetFilter: 'installed program', count: 1 }, executionOrder: 10 },
      { type: 'SingleEntityTarget', parameterMap: { targetType: 'ICE', allowTargetSelection: true }, executionOrder: 20 }, // Target ICE
      { type: 'TrashTargetCard', parameterMap: {}, executionOrder: 50 } // Trash the target
    ],
    precedence: 2,
    factionAffinity: ['Anarch']
  },
  // Anarch Example: Virus Counters
  {
    pattern: /Place (\d+) virus counter(?:s)? on (?:this card|itself)/i,
    components: [
       { type: 'SelfTarget', parameterMap: {}, executionOrder: 20 },
       { type: 'AddCounters', parameterMap: { counterType: 'Virus', amount: (c) => parseInt(c[1]) }, executionOrder: 60 }
    ],
    precedence: 1,
    factionAffinity: ['Anarch']
  },
   // Anarch Example: Health Cost
  {
    pattern: /Take (\d+) (meat|brain) damage to break all subroutines/i,
    components: [
       { type: 'HealthCost', parameterMap: { amount: (c) => parseInt(c[1]), damageType: (c) => c[2] }, executionOrder: 10 },
       { type: 'SingleEntityTarget', parameterMap: { targetType: 'ICE', context: 'encountered' }, executionOrder: 20 }, // Target encountered ICE
       { type: 'BypassSecurity', parameterMap: { targetType: 'Subroutine', scope: 'all' }, executionOrder: 50 } // Break all subs
    ],
    precedence: 2,
    factionAffinity: ['Anarch']
  },
  // Shaper Example: Install Program + Discount
  {
    pattern: /Install a program(?: from your stack)?, paying (\d+) less/i,
    components: [
      // Targeting/Selection component would be needed here to choose the program
      { type: 'PauseQueue', parameterMap: { message: 'Select a program to install' }, executionOrder: 25 },
      { type: 'SingleEntityTarget', parameterMap: { targetType: 'Program', location: 'StackOrHand', allowTargetSelection: true }, executionOrder: 26 },
      { type: 'InstallCard', parameterMap: { costModifier: (c) => -parseInt(c[1]) }, executionOrder: 50 }
    ],
    precedence: 2,
    factionAffinity: ['Shaper']
  },
  // Shaper Example: Boost Program Strength
  {
    pattern: /(\d+) credit(?:s)?: \+(\d+) strength(?: for the remainder of this run)?/i,
    components: [
      // This describes an *ability* on an installed card, harder to parse directly into triggerable components.
      // Better handled by defining the ability structure on the card itself.
      // We might parse it into a potential action component:
      { type: 'Ability', parameterMap: {
          cost: [ { type: 'CreditCost', amount: (c)=>parseInt(c[1]) } ],
          effect: { type: 'ModifyTarget', attribute: 'strength', delta: (c)=>parseInt(c[2]), duration: 'Run' }
        }, executionOrder: 50 } // Hypothetical 'Ability' component
    ],
    precedence: 1,
    factionAffinity: ['Shaper', 'Anarch', 'Criminal'] // Breakers use this
  },
   // Shaper Example: Conditional Draw
  {
    pattern: /If you installed a (program|hardware) this turn, draw (\d+) card(?:s)?/i,
    components: [
      { type: 'ConditionalComponent', parameterMap: { conditionType: 'InstalledKeywordThisTurn', keyword: (c) => c[1] }, executionOrder: 30 },
      { type: 'SelfTarget', parameterMap: {}, executionOrder: 40 },
      { type: 'DrawCards', parameterMap: { amount: (c) => parseInt(c[2]) }, executionOrder: 50 }
    ],
    precedence: 3,
    factionAffinity: ['Shaper']
  }
];
```

```typescript
Implementation Plan
1. Pattern Matching Engine
(Remains largely the same, needs robust regex handling)

class PatternMatchingEngine {
  patterns: TextPattern[];

  constructor(patterns: TextPattern[]) {
    this.patterns = patterns.sort((a, b) => b.precedence - a.precedence);
  }

  // Finds all non-overlapping matches, prioritizing higher precedence patterns
  findMatches(text: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    let remainingText = text;
    let currentIndex = 0;

    while (remainingText.length > 0) {
        let bestMatch: PatternMatch | null = null;
        let matchFound = false;

        for (const pattern of this.patterns) {
            const regex = pattern.pattern instanceof RegExp
                ? new RegExp(pattern.pattern.source, pattern.pattern.flags) // Clone regex to avoid state issues
                : new RegExp(pattern.pattern, 'i');

            const matchResult = remainingText.match(regex);

            if (matchResult && matchResult.index === 0) { // Match must be at the start of remaining text
                 // Basic precedence check - already sorted, so first found is highest precedence
                 bestMatch = {
                     pattern,
                     match: matchResult, // The actual match object
                     index: currentIndex, // Original index in the full text
                     length: matchResult[0].length
                 };
                 matchFound = true;
                 break; // Found highest precedence match for this position
            }
        }

        if (bestMatch) {
            matches.push(bestMatch);
            currentIndex += bestMatch.length;
            remainingText = remainingText.substring(bestMatch.length);
        } else {
             // No match found at the current position, advance one character
             // This handles parts of the text that don't match any pattern
             if (remainingText.length > 0) {
                 currentIndex++;
                 remainingText = remainingText.substring(1);
             } else {
                 break; // End of text
             }
        }
    }

    return matches;
  }
}

interface PatternMatch {
  pattern: TextPattern;
  match: RegExpMatchArray;
  index: number;
  length: number;
}
```

```typescript
2. Component Generator
(Remains largely the same, relies on a Component Factory)
class ComponentGenerator {
  generateComponents(matches: PatternMatch[]): Component[] {
    const componentConfigs: (ComponentGeneratorConfig & { processedParams: any })[] = [];

    for (const match of matches) {
      for (const config of match.pattern.components) {
        const configCopy = { ...config, processedParams: {} }; // Clone

        // Process parameter mapping using the *actual* match result
        for (const [paramName, paramValue] of Object.entries(config.parameterMap)) {
          if (typeof paramValue === 'function') {
            try {
               configCopy.processedParams[paramName] = paramValue(match.match);
            } catch (e) {
                console.error(`Error processing parameter '${paramName}' for pattern ${match.pattern.pattern}`, e);
                // Handle error - maybe skip this param or component?
            }
          } else {
            configCopy.processedParams[paramName] = paramValue;
          }
        }
        componentConfigs.push(configCopy);
      }
    }

    // Sort by defined execution order
    componentConfigs.sort((a, b) => a.executionOrder - b.executionOrder);

    // Use a factory to create actual component instances
    return componentConfigs.map(config => ComponentFactory.createComponent(config.type, config.processedParams));
  }
}

// Example Factory (Simplified)
class ComponentFactory {
    static createComponent(type: string, params: any): Component {
        switch (type) {
            case 'CreditCost': return new CreditCost(params.amount);
            case 'GainCredits': return new GainCredits(params.amount);
            case 'BypassSecurity': return new BypassSecurity(params.targetType);
            case 'TrashCost': return new TrashCost(params.targetFilter, params.count);
            // ... other component types using params
            default: throw new Error(`Unknown component type: ${type}`);
        }
    }
}
```

3. Context-Aware Synergy Resolution
(Needs refinement, focus on Runner examples)
```typescript

class SynergyResolver {
  // This is complex. Might need more context than just text.
  // Example: Linking a condition to an effect.
  resolveContextualDependencies(components: Component[], text: string): Component[] {
    const resolvedComponents = [...components]; // Work on a copy

    for (let i = 0; i < resolvedComponents.length; i++) {
        const component = resolvedComponents[i];

        // Example: Linking a RunCondition to the *next* effect component
        if (component instanceof RunCondition && i + 1 < resolvedComponents.length) {
            const nextComponent = resolvedComponents[i+1];
            if (nextComponent instanceof EffectComponent || nextComponent instanceof ControlFlowComponent) {
               // Link the condition to the effect it gates
               // component.setTargetEffect(nextComponent); // Hypothetical linking
               // console.log(`Linked ${component.constructor.name} to ${nextComponent.constructor.name}`);
            }
        }

        // Example: Linking KeywordSynergy bonus to a specific effect
        if (component instanceof KeywordSynergy) {
             // Find the likely target effect based on proximity or text cues
             // e.g., find the preceding DealDamage component if text says "...deal 1 *more* damage"
             // component.setTargetEffectComponent(foundEffect); // Hypothetical
        }
    }
    return resolvedComponents;
  }
}

4. Card Factory (Runner Focused)
```javascript
class TextToComponentCardFactory {
  patternEngine: PatternMatchingEngine;
  componentGenerator: ComponentGenerator;
  synergyResolver: SynergyResolver;

  constructor() {
    // Load Runner-specific patterns
    this.patternEngine = new PatternMatchingEngine(runnerPatterns);
    this.componentGenerator = new ComponentGenerator();
    this.synergyResolver = new SynergyResolver();
  }

  createRunnerCardFromText(baseCard: BaseRunnerCard, description: string): EnhancedRunnerCard {
    const matches = this.patternEngine.findMatches(description);
    let components = this.componentGenerator.generateComponents(matches);
    components = this.synergyResolver.resolveContextualDependencies(components, description);

    return { ...baseCard, description, components }; // Combine base info with generated components
  }
}

interface BaseRunnerCard { name: string; type: string; faction: string; /* other base stats */ }
interface EnhancedRunnerCard extends BaseRunnerCard { components: Component[]; }

// Placeholder for actual Runner patterns
const runnerPatterns: TextPattern[] = patterns; // Use the examples defined above
```


Implementation Stages (Runner Focus)
Phase 1: Core Runner Patterns
Implement patterns for basic Runner actions: Gain Credits, Install Program/Hardware, Bypass simple ICE, basic Virus counters, simple Self-Trash/Damage costs.
Basic Pattern Matching & Component Generation.
Phase 2: Conditional & Synergy Patterns
Handle "If/When" conditions (RunCondition, KeywordSynergy).
Parse more complex cost structures (multiple costs).
Basic context resolution (linking simple conditions to effects).
Phase 3: Advanced Runner Mechanics
Patterns for Recycling, Program Boosting, Multi-target effects, Complex Virus interactions.
Improved context resolution.
Phase 4: Validation & Refinement
Tools to compare generated components against expected behavior.
Refine patterns based on testing with actual card text.
Phase 5: Editor Integration (If needed)
UI for pattern definition and testing.