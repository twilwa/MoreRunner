# Card Component System Architecture

This document visualizes the relationships between card mechanics, keywords, and components in our Cyberpunk deck-builder game.

## Component Type Hierarchy

```mermaid
classDiagram
    Component <|-- TargetingComponent
    Component <|-- CostComponent
    Component <|-- EffectComponent
    Component <|-- ConditionalComponent
    Component <|-- ControlFlowComponent
    Component <|-- InformationComponent
    
    TargetingComponent <|-- SingleEntityTarget
    TargetingComponent <|-- MultiEntityTarget
    TargetingComponent <|-- SelfTarget
    
    CostComponent <|-- CreditCost
    CostComponent <|-- ActionCost
    CostComponent <|-- KeywordRequirement
    
    EffectComponent <|-- GainCredits
    EffectComponent <|-- DealDamage
    EffectComponent <|-- PreventDamage
    EffectComponent <|-- DrawCards
    EffectComponent <|-- DiscardCards
    EffectComponent <|-- GainAction
    
    ConditionalComponent <|-- KeywordSynergy
    
    ControlFlowComponent <|-- PauseQueue
    ControlFlowComponent <|-- CancelCard
    
    InformationComponent <|-- RevealCard
    InformationComponent <|-- ScanEntity
    
    class Component {
        +type: string
        +apply(context: GameContext): void
    }
    
    class TargetingComponent {
        <<abstract>>
    }
    
    class CostComponent {
        <<abstract>>
    }
    
    class EffectComponent {
        <<abstract>>
    }
    
    class ConditionalComponent {
        <<abstract>>
    }
    
    class ControlFlowComponent {
        <<abstract>>
    }
    
    class InformationComponent {
        <<abstract>>
    }
    
    class SingleEntityTarget {
        +targetType: string
        +allowTargetSelection: boolean
        +filter?: function
    }
    
    class MultiEntityTarget {
        +targetType: string
        +maxTargets: number
        +filter?: function
    }
    
    class SelfTarget {
    }
    
    class CreditCost {
        +amount: number
    }
    
    class ActionCost {
        +amount: number
    }
    
    class KeywordRequirement {
        +keyword: CardKeyword
        +count: number
        +location: string
    }
    
    class GainCredits {
        +amount: number
    }
    
    class DealDamage {
        +amount: number
    }
    
    class PreventDamage {
        +amount: number
    }
    
    class DrawCards {
        +amount: number
    }
    
    class DiscardCards {
        +amount: number
        +random: boolean
    }
    
    class GainAction {
        +amount: number
    }
    
    class KeywordSynergy {
        +keyword: CardKeyword
        +targetComponent: string
        +bonusAmount: number
    }
    
    class PauseQueue {
        +message: string
    }
    
    class CancelCard {
        +targetCardIndex?: number
        +targetCardCondition?: function
    }
    
    class RevealCard {
    }
    
    class ScanEntity {
        +revealFullInfo: boolean
    }
```

## Card Execution Flow

```mermaid
flowchart TB
    Start([Start Card Execution]) --> CheckCost
    CheckCost{Check Costs} -- "Sufficient" --> ProcessTarget
    CheckCost -- "Insufficient" --> Abort([Abort Execution])
    
    ProcessTarget{Process Targeting} -- "Requires Player Selection" --> PauseForInput
    ProcessTarget -- "Auto-target" --> ApplyEffects
    
    PauseForInput[Pause for Player Input] --> WaitForSelection
    WaitForSelection[Wait for Selection] --> TargetsSelected
    
    TargetsSelected[Targets Selected] --> ApplyEffects
    
    ApplyEffects[Apply Card Effects] --> CheckConditions
    
    CheckConditions{Check Conditions} -- "Synergies Trigger" --> ApplyBonuses
    CheckConditions -- "No Synergies" --> CompleteExecution
    
    ApplyBonuses[Apply Synergy Bonuses] --> CompleteExecution
    
    CompleteExecution([Complete Execution])
```

## Keyword Synergy Network

```mermaid
graph TB
    %% Faction nodes
    Runner[Runner Faction]
    Corp[Corp Faction]
    Street[Street Faction]
    
    %% Keyword nodes
    Virus[Virus]
    ICE[ICE]
    Stealth[Stealth]
    Memory[Memory]
    Hardware[Hardware]
    Program[Program]
    Cyberware[Cyberware]
    Weapon[Weapon]
    
    %% Effect nodes
    DealDamage[Deal Damage]
    PreventDamage[Prevent Damage]
    DrawCards[Draw Cards]
    GainCredits[Gain Credits]
    DiscardCards[Discard Cards]
    CancelCard[Cancel Card]
    CopyCard[Copy Card]
    
    %% Runner faction connections
    Runner --- Virus
    Runner --- Stealth
    Runner --- Program
    
    %% Corp faction connections
    Corp --- ICE
    Corp --- Memory
    Corp --- Cyberware
    
    %% Street faction connections
    Street --- Weapon
    Street --- Hardware
    
    %% Keyword to effect connections
    Virus ==> |Enhances| DealDamage
    Virus ==> |Enhances| DrawCards
    
    ICE ==> |Enhances| PreventDamage
    ICE -.-> |Can be targeted by| CancelCard
    
    Stealth ==> |Enhances| DiscardCards
    Stealth ==> |Enables| CancelCard
    
    Cyberware ==> |Enables| CopyCard
    Cyberware ==> |Enhances| DrawCards
    
    Memory ==> |Enhances| DrawCards
    
    Weapon ==> |Enhances| DealDamage
    
    Hardware ==> |Enhances| GainCredits
    
    Program ==> |Various effects| GainCredits
    Program ==> |Various effects| DrawCards
```

## Component Usage in Cards

```mermaid
graph LR
    %% Card nodes
    CreditChip[Credit Chip]
    CryptoWallet[Crypto Wallet]
    DarkMarket[Dark Market]
    MaliciousCode[Malicious Code]
    DataBreach[Data Breach]
    Firewall[Firewall]
    SystemPurge[System Purge]
    NeuralImplant[Neural Implant]
    Backdoor[Backdoor]
    TraceProgram[Trace Program]
    
    %% Component nodes
    SelfTarget[Self Target]
    SingleTarget[Single Entity Target]
    ActionCost[Action Cost]
    CreditCost[Credit Cost]
    GainCredits[Gain Credits]
    DrawCards[Draw Cards]
    DealDamage[Deal Damage]
    DiscardCards[Discard Cards]
    PreventDamage[Prevent Damage]
    GainAction[Gain Action]
    KeywordSynergy[Keyword Synergy]
    PauseQueue[Pause Queue]
    
    %% Card to component connections
    CreditChip --> SelfTarget
    CreditChip --> ActionCost
    CreditChip --> GainCredits
    
    CryptoWallet --> SelfTarget
    CryptoWallet --> ActionCost
    CryptoWallet --> GainCredits
    
    DarkMarket --> SelfTarget
    DarkMarket --> ActionCost
    DarkMarket --> GainCredits
    DarkMarket --> DrawCards
    DarkMarket --> GainAction
    
    MaliciousCode --> CreditCost
    MaliciousCode --> ActionCost
    MaliciousCode --> PauseQueue
    MaliciousCode --> SingleTarget
    MaliciousCode --> DealDamage
    MaliciousCode --> KeywordSynergy
    
    DataBreach --> SelfTarget
    DataBreach --> ActionCost
    DataBreach --> DrawCards
    DataBreach --> SingleTarget
    DataBreach --> DiscardCards
    DataBreach --> KeywordSynergy
    
    Firewall --> CreditCost
    Firewall --> ActionCost
    Firewall --> SelfTarget
    Firewall --> PreventDamage
    Firewall --> KeywordSynergy
    
    SystemPurge --> SelfTarget
    SystemPurge --> ActionCost
    SystemPurge --> DrawCards
    SystemPurge --> DiscardCards
    SystemPurge --> GainAction
    
    NeuralImplant --> SelfTarget
    NeuralImplant --> ActionCost
    NeuralImplant --> DrawCards
    NeuralImplant --> KeywordSynergy
    
    Backdoor --> ActionCost
    Backdoor --> SelfTarget
    Backdoor --> DrawCards
    
    TraceProgram --> ActionCost
    TraceProgram --> SingleTarget
    TraceProgram --> DiscardCards
```

## Text-to-Component Mapping Process

```mermaid
flowchart TB
    CardText[Card Text] --> ParseText
    
    ParseText[Parse Text for Patterns] --> IdentifyComponents
    
    IdentifyComponents{Identify Components} --> TargetingComponent
    IdentifyComponents --> CostComponent
    IdentifyComponents --> EffectComponent
    IdentifyComponents --> ConditionalComponent
    
    TargetingComponent[Determine Targeting Components] --> CreateComponentList
    CostComponent[Determine Cost Components] --> CreateComponentList
    EffectComponent[Determine Effect Components] --> CreateComponentList
    ConditionalComponent[Determine Conditional Components] --> CreateComponentList
    
    CreateComponentList[Create Component List] --> SequenceComponents
    
    SequenceComponents[Sequence Components in Execution Order] --> AttachToCard
    
    AttachToCard[Attach Component List to Card] --> EnhancedCard[Enhanced Card with Components]
```