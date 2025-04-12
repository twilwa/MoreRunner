# Component System Implementation Todos (Runner Scenario Prototype Focus)

This document outlines the tasks needed to implement the component-based card system for the Runner factions in the scenario mode prototype. Items related to Corporations or the strategic layer are deferred.

*(Priority: 1=Critical for Prototype, 2=Important for Prototype, 3=Enhancement/Later)*

## Core Infrastructure

- [x] Create base `Component` interface
- [x] Implement `GameContext` interface
- [x] Develop `CardExecutionService` (basic sequential execution) - **Priority 1**
- [ ] Refine `CardExecutionService` for conditionals, context passing, queue management - **Priority 1**
- [x] Add basic pause/resume for player targeting - **Priority 1**

## Component Implementation (Runner Focus)

### Targeting Components
- [x] Implement `SingleEntityTarget` - **Priority 1**
- [x] Implement `SelfTarget` - **Priority 1**
- [ ] Implement `MultiEntityTarget` - **Priority 2**
- [ ] Implement `LocationTarget` (Heap, Stack for Runners) - **Priority 2**
- [ ] Add type validation for targets - **Priority 2**
- [ ] Implement target filtering (e.g., by keyword 'ICE', 'Program') - **Priority 2**

### Cost Components
- [x] Implement `CreditCost` - **Priority 1**
- [x] Implement `ActionCost` - **Priority 1**
- [x] Implement `TrashCost` (Self - targeting own cards) - **Priority 1 (Anarch)**
- [x] Implement `HealthCost` (Self - Meat/Brain damage) - **Priority 1 (Anarch)**
- [ ] Implement `KeywordRequirement` (Check for installed keywords) - **Priority 2 (Shaper)**
- [ ] Add visual feedback when costs cannot be paid - **Priority 2**

### Effect Components
- [x] Implement `GainCredits` - **Priority 1**
- [x] Implement `DealDamage` (Net/Meat/Brain - primarily vs ICE/Assets for Runner context) - **Priority 1**
- [ ] Implement `PreventDamage` (e.g., from ICE subroutines) - **Priority 2**
- [x] Implement `DrawCards` - **Priority 1**
- [x] Implement `DiscardCards` (Self - e.g., from hand size limit or effects) - **Priority 1**
- [x] Implement `GainAction` - **Priority 1 (Criminal)**
- [x] Implement `InstallCard` (Programs, Hardware, Resources) - **Priority 1 (Shaper)**
- [x] Implement `TrashTargetCard` (e.g., ICE, Assets) - **Priority 1 (Anarch)**
- [x] Implement `BypassSecurity` (ICE, Subroutines) - **Priority 1 (Criminal)**
- [x] Implement `RecycleCard` (From Heap to Hand/Stack) - **Priority 1 (Anarch)**
- [x] Implement `AddCounters` (Virus, Power) - **Priority 1 (Anarch/Shaper)**
- [x] Implement `ModifyTarget` (Boost program strength, modify ICE state temporarily) - **Priority 1 (Shaper/Anarch)**
- [ ] Implement `ForceDiscard` (Targeting Corp hand - Lower priority for scenario) - **Priority 3**

### Conditional Components
- [x] Implement `KeywordSynergy` (Check installed cards) - **Priority 2 (Shaper/Anarch)**
- [x] Implement `RunCondition` (Based on run success, server accessed, ICE encountered) - **Priority 1 (Criminal)**
- [ ] Implement `FactionSynergy` (Bonus based on Runner faction) - **Priority 3**
- [ ] Implement `HealthThreshold` (Effects based on Runner damage taken) - **Priority 2 (Anarch)**
- [x] Implement `ResourceThreshold` (Based on credits, cards in hand) - **Priority 2**
- [x] Implement `RiskReward` (Chance-based outcomes) - **Priority 1 (Anarch)**
- [x] Implement `ComboEffect` (Requires specific other cards/keywords in play) - **Priority 2 (Shaper)**

### Control Flow Components
- [x] Implement `PauseQueue` (For targeting/decisions) - **Priority 1**
- [ ] Implement `CancelCard` (Targeting Corp effects - Lower priority for scenario) - **Priority 3**
- [ ] Implement `CancelCard` (Targeting own triggered effects?) - **Priority 3**
- [ ] Implement `RedirectEffect` (Changing targets of effects - Lower priority for scenario) - **Priority 3**
- [ ] Implement `ChainEffect` (Trigger another card/effect) - **Priority 2**
- [ ] Implement `BranchExecution` (if/then/else based on conditions) - **Priority 3**
- [ ] Implement `RepeatEffect` (e.g., 'Do X for each virus counter') - **Priority 2 (Anarch/Shaper)**

### Information Components
- [ ] Implement `RevealCard` (From Corp hand/R&D - Lower priority for scenario) - **Priority 3**
- [ ] Implement `ScanEntity` (Get info on ICE/Assets) - **Priority 2**
- [ ] Implement `PeekLocation` (Look at Corp R&D/HQ - Lower priority for scenario) - **Priority 3**

### State Modification Components
- [x] Implement `IncreaseMemory` - **Priority 1 (Shaper)**
- [x] Implement `ModifyAttribute` (Program strength, hand size limit) - **Priority 1 (Shaper)**
- [ ] Implement `AddTag` (Primarily Corp effect, but Runner may interact/clear) - **Priority 3**

## UI Integration (Runner Scenario Focus)

- [x] Create `CardTargetingModal` - **Priority 1**
- [ ] Create visual feedback for core effects (credits gained/lost, damage taken, ICE bypassed/broken/trashed, cards installed/trashed) - **Priority 1**
- [ ] Display Virus/Power counters on cards - **Priority 1**
- [ ] Show current Memory Units (MU) used/available - **Priority 1 (Shaper)**
- [ ] Show current Runner health/damage - **Priority 1**
- [ ] Create `ComponentInfoTooltip` (Optional display on hover) - **Priority 3**
- [ ] Implement visual indicators for active synergies/conditions - **Priority 3**

## Text-to-Component System (Runner Focus)

- [ ] Create Text Parser for basic Runner phrases - **Priority 2**
- [ ] Implement Component Mapper for core Runner components - **Priority 2**
- [ ] Define initial set of `TextPattern` rules for Runner cards - **Priority 2**
- [ ] Build basic Card Factory using the mapper - **Priority 2**
- [ ] Develop validator to check generated components against card text (manual check initially) - **Priority 3**

## Faction & Keyword System (Runner Focus)

- [ ] Implement basic Faction property on Runner identity - **Priority 1**
- [ ] Implement Keyword property on cards (`Program`, `Hardware`, `Virus`, `Connection` etc.) - **Priority 1**
- [ ] Implement Keyword tracker in `GameContext` (what keywords are installed/in play) - **Priority 2**
- [ ] Implement basic `KeywordSynergy` component logic - **Priority 2**

## Testing & Balancing (Runner Scenario Focus)

- [ ] Create unit tests for core Runner components - **Priority 2**
- [ ] Implement basic integration tests for common Runner card sequences (e.g., install breaker -> break ICE) - **Priority 2**
- [ ] Setup manual playtesting process for Runner vs. basic Corp scenarios - **Priority 1**
- [ ] Define initial balance parameters for core Runner costs/effects - **Priority 1**

## Documentation & Tutorials (Internal Focus)

- [ ] Document implemented Runner components (parameters, behavior) - **Priority 2**
- [ ] Document core execution flow - **Priority 2**

## Priority Implementation Order for Prototype

1.  **Sprint 1: Core Execution & Basic Runner Actions**
    *   `CardExecutionService` (Sequential execution)
    *   Basic `GameContext`
    *   Components: `CreditCost`, `ActionCost`, `SelfTarget`, `SingleEntityTarget`, `GainCredits`, `DrawCards`, `DiscardCards` (Self), `InstallCard` (Basic), `DealDamage` (Basic), `BypassSecurity` (Basic)
    *   Basic UI: Hand display, play card action, show credits/cards drawn.
    *   Manual testing setup.
2.  **Sprint 2: Faction Mechanics - Criminal & Anarch Basics**
    *   Components: `TrashCost`, `HealthCost`, `TrashTargetCard` (ICE), `RunCondition`, `BypassSecurity` (Refined), `AddCounters` (Virus), `RecycleCard`, `RiskReward`.
    *   Keyword System: Basic keywords on cards.
    *   UI: Show damage, basic ICE interaction feedback, Virus counters.
    *   Implement 2-3 core Criminal & Anarch cards.
3.  **Sprint 3: Faction Mechanics - Shaper Basics & Synergies**
    *   Components: `IncreaseMemory`, `ModifyAttribute` (Strength), `BoostProgram`, `InstallCard` (Refined), `KeywordRequirement`, `KeywordSynergy` (Basic), `ComboEffect` (Basic).
    *   Keyword Tracker in `GameContext`.
    *   UI: Show MU, program strength changes.
    *   Implement 2-3 core Shaper cards.
4.  **Sprint 4: Refinement & Playtesting**
    *   Refine component interactions and execution logic.
    *   Implement remaining Priority 1/2 components needed for core loops.
    *   Improve UI feedback.
    *   Balance initial cards based on playtesting.
    *   Start Text-to-Component system implementation.