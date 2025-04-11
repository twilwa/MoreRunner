# Card Component System

This document outlines the entity-component system (ECS) for card mechanics in the Cyberpunk Deck-Builder game.

## Overview

Instead of hardcoding card effects, we use a flexible component-based system where each card can have multiple components that define its behavior. This makes it easier to:

1. Create new cards by combining existing components
2. Modify card behavior by adding/removing components
3. Reuse logic across different cards
4. Extend the system with new components without rewriting existing cards

## Core Components

### Target Components

Components that define how a card selects targets:

| Component | Description |
|-----------|-------------|
| `SingleEntityTarget` | Targets a single entity (player, opponent, or location threat) |
| `MultiEntityTarget` | Targets multiple entities (e.g., "all threats" or "all players") |
| `SelfTarget` | Targets the player using the card (default if no target specified) |
| `RandomTarget` | Randomly selects a target from eligible targets |
| `ConditionalTarget` | Selects targets based on a condition (e.g., "entities with > 3 health") |

### Cost Components

Components that define prerequisites or costs to play a card:

| Component | Description |
|-----------|-------------|
| `CreditCost` | Requires a specific number of credits to play |
| `ActionCost` | Requires actions to play (most cards use this) |
| `HealthCost` | Requires sacrificing health points |
| `DiscardCost` | Requires discarding other cards |
| `CardTypeRequirement` | Requires having a specific type of card in play |
| `KeywordRequirement` | Requires having a card with a specific keyword in play |

### Effect Components

Components that define what happens when a card is played:

| Component | Description |
|-----------|-------------|
| `GainCredits` | Adds credits to the player |
| `DealDamage` | Deals damage to the target |
| `PreventDamage` | Prevents a certain amount of damage to the target |
| `DrawCards` | Allows the player to draw cards |
| `DiscardCards` | Forces target to discard cards |
| `GainAction` | Grants additional actions to the player |
| `ModifyKeyword` | Adds or removes keywords from a card |
| `InstallProgram` | Installs a program with persistent effects |
| `BuffEffect` | Temporarily modifies stats of a target |
| `DebuffEffect` | Temporarily reduces stats of a target |

### Conditional Components

Components that modify effects based on conditions:

| Component | Description |
|-----------|-------------|
| `KeywordSynergy` | Enhances effects if cards with specific keywords are in play |
| `FactionBonus` | Enhances effects if cards of specific factions are in play |
| `HealthThreshold` | Modifies effects based on a health threshold |
| `ResourceThreshold` | Modifies effects based on resource levels |
| `QueuePositionModifier` | Effect varies based on position in the execution queue |

### Control Flow Components

Components that affect the flow of gameplay:

| Component | Description |
|-----------|-------------|
| `PauseQueue` | Pauses the execution queue until player makes a choice |
| `ReorderQueue` | Allows reordering of cards in the execution queue |
| `CancelCard` | Cancels the effect of another card |
| `DelayEffect` | Delays an effect until a later turn |
| `RepeatEffect` | Repeats an effect multiple times |
| `ConditionalBranch` | Branches execution based on a condition |

### Information Components

Components that provide information or modify how information is displayed:

| Component | Description |
|-----------|-------------|
| `RevealCard` | Reveals a face-down card |
| `ScanEntity` | Provides information about an entity |
| `TagEntity` | Adds a visible tag to an entity for tracking |
| `HideCard` | Conceals a card from other players |

## Component Interaction

Components can interact with each other to create complex behaviors:

1. Target components determine what entities receive the effects
2. Effect components apply changes to those targets
3. Conditional components modify how effects are applied
4. Control flow components determine when and how effects activate

## Implementation Example

A "Network Breach" card might have:
- `ActionCost(1)` - Costs 1 action to play
- `CreditCost(3)` - Costs 3 credits to play
- `PauseQueue` - Pauses the queue when played
- `SingleEntityTarget` - Requires selecting a single threat
- `KeywordRequirement("Stealth")` - Requires a Stealth card in play
- `DealDamage(2)` - Deals 2 damage to target
- `DrawCards(1)` - Draws 1 card
- `KeywordSynergy("Virus", "DealDamage", 1)` - Deal 1 extra damage if a Virus card is in play

## Game Loop Interaction

1. Card is queued in the execution area
2. When executed, the system processes each component in order
3. Target components are resolved first (may pause for player input)
4. Cost components are checked (card fails if costs can't be paid)
5. Effect components are applied to the selected targets
6. Conditional components may modify the base effects
7. Control flow components may affect how/when the above happens

## Entity Types That Can Be Targeted

- Player
- Opponent AI
- Location Threats
- Cards in play
- Cards in hand
- Cards in discard pile