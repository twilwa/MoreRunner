// Location types and utilities for the cyberpunk runner game

export type LocationType = 'entrance' | 'corridor' | 'server_room' | 'security' | 'exit' | 'objective';

export type LocationDifficulty = 'easy' | 'medium' | 'hard';

export type LocationThreat = {
  id: string; // Unique identifier for this threat
  name: string;
  description: string;
  dangerLevel: number; // 1-5
  defenseValue: number; // Health/defense points
  attack: number; // Damage this threat can deal to player
  isDead?: boolean; // Flag indicating if the threat has been defeated (defenseValue <= 0)
};

export interface Location {
  id: string;
  name: string;
  description: string;
  type: LocationType;
  difficulty: LocationDifficulty;
  hasObjective: boolean;
  isExit: boolean;
  threats: LocationThreat[];
  rewards: {
    credits: number;
    drawCards: number;
  };
  imageUrl?: string;
}

// Sample locations to start with
const LOCATIONS: Location[] = [
  {
    id: 'loc-001',
    name: 'Main Entrance',
    description: 'The heavily monitored front entrance to the corporate complex. Cameras and guards are everywhere.',
    type: 'entrance',
    difficulty: 'easy',
    hasObjective: false,
    isExit: false,
    threats: [
      {
        id: 'threat-security-scanner',
        name: 'Security Scanner',
        description: 'A biometric scanner checks all who enter.',
        dangerLevel: 1,
        defenseValue: 2,
        attack: 1
      }
    ],
    rewards: {
      credits: 1,
      drawCards: 1
    }
  },
  {
    id: 'loc-002',
    name: 'Server Farm',
    description: 'Rows of humming servers fill this cold room. The data you need is somewhere in this digital maze.',
    type: 'server_room',
    difficulty: 'medium',
    hasObjective: true,
    isExit: false,
    threats: [
      {
        id: 'threat-automated-defense-system',
        name: 'Automated Defense System',
        description: 'Motion sensors trigger counter-intrusion measures.',
        dangerLevel: 3,
        defenseValue: 4,
        attack: 2
      },
      {
        id: 'threat-security-ai',
        name: 'Security AI',
        description: 'An artificial intelligence monitors the server farm.',
        dangerLevel: 2,
        defenseValue: 3,
        attack: 2
      }
    ],
    rewards: {
      credits: 3,
      drawCards: 2
    }
  },
  {
    id: 'loc-003',
    name: 'Back Alley',
    description: 'A seldom-used service exit. Perfect for a quick escape if you can reach it.',
    type: 'exit',
    difficulty: 'easy',
    hasObjective: false,
    isExit: true,
    threats: [
      {
        id: 'threat-guard-patrol',
        name: 'Guard Patrol',
        description: 'Security guards occasionally check this exit.',
        dangerLevel: 2,
        defenseValue: 2,
        attack: 1
      }
    ],
    rewards: {
      credits: 2,
      drawCards: 1
    }
  },
  {
    id: 'loc-004',
    name: 'Research Lab',
    description: 'Experimental tech and valuable prototypes are developed here.',
    type: 'objective',
    difficulty: 'hard',
    hasObjective: true,
    isExit: false,
    threats: [
      {
        id: 'threat-elite-security-team',
        name: 'Elite Security Team',
        description: 'Heavily armed guards protect the valuables.',
        dangerLevel: 4,
        defenseValue: 5,
        attack: 3
      },
      {
        id: 'threat-advanced-alarm-system',
        name: 'Advanced Alarm System',
        description: 'State-of-the-art alarms will trigger reinforcements.',
        dangerLevel: 3,
        defenseValue: 4, attack: 2
      }
    ],
    rewards: {
      credits: 5,
      drawCards: 3
    }
  },
  {
    id: 'loc-005',
    name: 'Corporate Corridor',
    description: 'A long hallway connecting various departments of the megacorp.',
    type: 'corridor',
    difficulty: 'medium',
    hasObjective: false,
    isExit: false,
    threats: [
      {
        id: 'threat-security-cameras',
        name: 'Security Cameras',
        description: 'Rotating cameras monitor all movement.',
        dangerLevel: 2,
        defenseValue: 3, attack: 2
      }
    ],
    rewards: {
      credits: 2,
      drawCards: 1
    }
  },
  {
    id: 'loc-006',
    name: 'Security Center',
    description: 'The heart of the building\'s defense systems. Guards monitor feeds from throughout the facility.',
    type: 'security',
    difficulty: 'hard',
    hasObjective: false,
    isExit: false,
    threats: [
      {
        id: 'threat-security-chief',
        name: 'Security Chief',
        description: 'A veteran security professional with cybernetic enhancements.',
        dangerLevel: 5,
        defenseValue: 6, attack: 2
      },
      {
        id: 'threat-alarm-console',
        name: 'Alarm Console',
        description: 'This console can lock down the entire building.',
        dangerLevel: 3,
        defenseValue: 4, attack: 2
      }
    ],
    rewards: {
      credits: 4,
      drawCards: 2
    }
  }
];

// Functions to interact with locations

/**
 * Gets a random location from the location pool
 */
export function getRandomLocation(): Location {
  const randomIndex = Math.floor(Math.random() * LOCATIONS.length);
  return { ...LOCATIONS[randomIndex] };
}

/**
 * Creates a shuffled deck of locations with entrance at the beginning and exit at the end
 */
export function createLocationDeck(): Location[] {
  // Get the entrance locations
  const entrances = LOCATIONS.filter(loc => loc.type === 'entrance');
  const entrance = entrances[Math.floor(Math.random() * entrances.length)];
  
  // Get the exit locations
  const exits = LOCATIONS.filter(loc => loc.isExit);
  const exit = exits[Math.floor(Math.random() * exits.length)];
  
  // Get at least one objective location
  const objectives = LOCATIONS.filter(loc => loc.hasObjective && !loc.isExit);
  const objective = objectives[Math.floor(Math.random() * objectives.length)];
  
  // Get the rest of locations (excluding entrance and exit)
  const otherLocations = LOCATIONS.filter(
    loc => loc.id !== entrance.id && loc.id !== exit.id && loc.id !== objective.id
  );
  
  // Shuffle the remaining locations
  const shuffled = [...otherLocations].sort(() => 0.5 - Math.random());
  
  // Take a few random locations
  const selected = shuffled.slice(0, 3);
  
  // Place objective randomly in the middle
  const objectivePosition = Math.floor(Math.random() * (selected.length + 1));
  selected.splice(objectivePosition, 0, objective);
  
  // Create the deck with entrance at the beginning and exit at the end
  return [{ ...entrance }, ...selected.map(loc => ({ ...loc })), { ...exit }];
}

export interface LocationDeck {
  drawPile: Location[];
  currentLocation: Location | null;
  visitedLocations: Location[];
  hasFoundObjective: boolean;
  hasReachedExit: boolean;
}

export function initializeLocationDeck(): LocationDeck {
  const deck = createLocationDeck();
  const [current, ...rest] = deck;
  
  return {
    drawPile: rest,
    currentLocation: current,
    visitedLocations: [],
    hasFoundObjective: false,
    hasReachedExit: false
  };
}

export function drawNextLocation(locationDeck: LocationDeck): LocationDeck {
  if (locationDeck.drawPile.length === 0) {
    return locationDeck; // No more locations to draw
  }
  
  const [nextLocation, ...restDrawPile] = locationDeck.drawPile;
  
  // Update the visited locations
  const updatedVisited = locationDeck.currentLocation 
    ? [...locationDeck.visitedLocations, locationDeck.currentLocation]
    : locationDeck.visitedLocations;
  
  // Check if we found an objective or reached the exit
  const foundObjective = nextLocation.hasObjective 
    ? true 
    : locationDeck.hasFoundObjective;
    
  const reachedExit = nextLocation.isExit 
    ? true 
    : locationDeck.hasReachedExit;
  
  return {
    drawPile: restDrawPile,
    currentLocation: nextLocation,
    visitedLocations: updatedVisited,
    hasFoundObjective: foundObjective,
    hasReachedExit: reachedExit
  };
}