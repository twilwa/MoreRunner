# Component Relationship Matrix

This document visualizes the relationships between components, keywords, factions, and game mechanics in our Cyberpunk deck-builder.

## Component-Keyword Relationship Matrix

| Component        | Virus       | ICE          | Stealth       | Memory      | Hardware    | Program     | Cyberware    | Weapon      |
|------------------|-------------|--------------|---------------|-------------|-------------|-------------|--------------|-------------|
| GainCredits      | -           | -            | -             | -           | ✓✓          | ✓           | -            | -           |
| DealDamage       | ✓✓✓         | -            | ✓             | -           | -           | -           | -            | ✓✓          |
| PreventDamage    | -           | ✓✓✓          | ✓             | -           | ✓           | -           | ✓            | -           |
| DrawCards        | ✓           | -            | ✓             | ✓✓✓         | -           | ✓           | ✓✓           | -           |
| DiscardCards     | ✓           | -            | ✓✓✓           | -           | -           | -           | -            | ✓           |
| GainAction       | -           | -            | ✓             | ✓✓          | -           | ✓           | ✓            | -           |
| CopyCard         | ✓           | -            | -             | ✓           | -           | -           | ✓✓✓          | -           |
| CancelCard       | ✓           | ✓            | ✓✓✓           | -           | -           | ✓           | -            | -           |
| RevealCard       | ✓✓          | -            | ✓✓            | -           | -           | -           | -            | -           |
| ScanEntity       | -           | ✓✓           | ✓             | ✓✓          | ✓           | -           | -            | -           |

Legend:
- ✓: Minor synergy
- ✓✓: Medium synergy
- ✓✓✓: Strong synergy

## Faction-Component Affinity

| Component        | Runner      | Corp         | Street        |
|------------------|-------------|--------------|---------------|
| GainCredits      | ✓✓          | ✓✓✓          | ✓             |
| DealDamage       | ✓✓          | ✓            | ✓✓✓           |
| PreventDamage    | ✓           | ✓✓✓          | ✓             |
| DrawCards        | ✓✓✓         | ✓✓           | ✓             |
| DiscardCards     | ✓✓          | ✓            | ✓✓✓           |
| GainAction       | ✓✓✓         | ✓            | ✓✓            |
| CopyCard         | ✓✓          | ✓✓           | ✓             |
| CancelCard       | ✓✓✓         | ✓✓           | ✓             |
| RevealCard       | ✓✓✓         | ✓            | ✓✓            |
| ScanEntity       | ✓✓          | ✓✓✓          | ✓             |

## Component Interaction Diagram

```mermaid
flowchart TD
    %% Component Categories
    Targeting["Targeting Components"]
    Cost["Cost Components"]
    Effect["Effect Components"] 
    Conditional["Conditional Components"]
    Control["Control Flow Components"]
    Information["Information Components"]
    
    %% Main execution flow
    Cost --> |"Paid successfully"| Targeting
    Targeting --> |"Targets selected"| Effect
    Effect --> |"May trigger"| Conditional
    Conditional --> |"May modify"| Effect
    Conditional --> |"May invoke"| Control
    Control --> |"May redirect to"| Targeting
    Control --> |"May invoke"| Information
    Information --> |"Provides data for"| Effect
    
    %% Example component execution flows
    subgraph "Example: Malicious Code"
        CreditCost5["Credit Cost (5)"] --> ActionCost1["Action Cost (1)"]
        ActionCost1 --> PauseQueue["Pause Queue"]
        PauseQueue --> SingleEntityTarget["Single Entity Target (threat)"]
        SingleEntityTarget --> DealDamage2["Deal Damage (2)"]
        DealDamage2 --> VirusSynergy["Virus Synergy"]
        VirusSynergy --> |"If Virus card in play"| IncreaseDamage["+1 Damage"]
    end
    
    subgraph "Example: Firewall"
        CreditCost3["Credit Cost (3)"] --> ActionCost1_2["Action Cost (1)"]
        ActionCost1_2 --> SelfTarget["Self Target"]
        SelfTarget --> PreventDamage2["Prevent Damage (2)"]
        PreventDamage2 --> IceSynergy["ICE Synergy"]
        IceSynergy --> |"If ICE card in play"| IncreasePrevention["+1 Prevention"]
    end
```

## Component Usage Frequency in Cards

```mermaid
pie
    title "Component Usage in Existing Cards"
    "ActionCost" : 17
    "SelfTarget" : 12
    "GainCredits" : 8
    "DrawCards" : 7
    "KeywordSynergy" : 6
    "CreditCost" : 6
    "DealDamage" : 4
    "DiscardCards" : 4
    "SingleEntityTarget" : 4
    "PreventDamage" : 3
    "GainAction" : 3
    "PauseQueue" : 2
    "Other Components" : 6
```

## Strategy Archetypes and Component Relationships

### Virus Runner Archetype

Focus on virus proliferation and damage dealing with a secondary focus on card draw.

```mermaid
graph TD
    VirusRunner[Virus Runner Strategy]
    
    VirusRunner --> MaliciousCode[Malicious Code]
    VirusRunner --> RiskyHack[Risky Hack]
    VirusRunner --> DataBreach[Data Breach]
    
    MaliciousCode --> DealDamage[Deal Damage]
    RiskyHack --> DrawCards[Draw Cards]
    DataBreach --> DiscardCards[Force Discard]
    
    DealDamage --> VirusSynergy[Virus Synergy]
    DrawCards --> RiskLevel[Risk Mechanics]
    DiscardCards --> StealthSynergy[Stealth Synergy]
    
    VirusSynergy --> DamageBuff[Increased Damage]
    RiskLevel --> RewardRisk[High Reward/Risk]
    StealthSynergy --> DiscardBuff[Increased Discard]
```

### ICE Corp Archetype

Focus on defense, prevention, and control with information gathering.

```mermaid
graph TD
    ICECorp[ICE Corp Strategy]
    
    ICECorp --> Firewall[Firewall]
    ICECorp --> AmbushProtocol[Ambush Protocol]
    ICECorp --> TraceProgram[Trace Program]
    
    Firewall --> PreventDamage[Prevent Damage]
    AmbushProtocol --> SetTrap[Set Trap]
    TraceProgram --> TraceMechanic[Trace Mechanic]
    
    PreventDamage --> ICESynergy[ICE Synergy]
    SetTrap --> DealDamage[Deal Damage]
    TraceMechanic --> ForceDiscard[Force Discard]
    
    ICESynergy --> PreventionBuff[Increased Prevention]
    DealDamage --> SurpriseAttack[Surprise Attack]
    ForceDiscard --> InformationControl[Information Control]
```

### Street Weapon Archetype

Focus on direct damage and resource control.

```mermaid
graph TD
    StreetWeapon[Street Weapon Strategy]
    
    StreetWeapon --> StreetThug[Street Thug]
    StreetWeapon --> DarkMarket[Dark Market]
    
    StreetThug --> GainCredits[Gain Credits]
    StreetThug --> ForceDiscard[Force Discard]
    DarkMarket --> MultiEffect[Multiple Small Effects]
    
    GainCredits --> ResourceGain[Resource Advantage]
    ForceDiscard --> HandControl[Hand Control]
    MultiEffect --> Flexibility[Tactical Flexibility]
    
    ResourceGain --> EconomyAdvantage[Economy Advantage]
    HandControl --> DenyOptions[Deny Options]
    Flexibility --> AdaptivePlay[Adaptive Play]
```

## Component Progression Flow

How components typically build on each other in card design:

```mermaid
graph LR
    Basic[Basic Components] --> Intermediate[Intermediate Components] --> Advanced[Advanced Components]
    
    subgraph "Basic Components"
        GainCredits[Gain Credits]
        DrawCards[Draw Cards]
        SelfTarget[Self Target]
        SingleTarget[Single Target]
    end
    
    subgraph "Intermediate Components"
        KeywordSynergy[Keyword Synergy]
        DealDamage[Deal Damage]
        PreventDamage[Prevent Damage]
        GainAction[Gain Action]
    end
    
    subgraph "Advanced Components"
        CopyCard[Copy Card]
        CancelCard[Cancel Card]
        ConditionalTargeting[Conditional Targeting]
        MultiEffect[Multi-Effect Chains]
    end
    
    GainCredits --> KeywordSynergy
    DrawCards --> KeywordSynergy
    SelfTarget --> DealDamage
    SelfTarget --> PreventDamage
    SingleTarget --> DealDamage
    
    KeywordSynergy --> CopyCard
    KeywordSynergy --> CancelCard
    DealDamage --> ConditionalTargeting
    PreventDamage --> ConditionalTargeting
    GainAction --> MultiEffect
```