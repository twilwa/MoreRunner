import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useDeckBuilder } from './useDeckBuilder';

// Game phase types
type GamePhase = 'ready' | 'playing' | 'paused' | 'game_over' | null;

interface GameState {
  phase: GamePhase;
  
  // Game state changes
  start: () => void;
  pause: () => void;
  resume: () => void;
  end: () => void;
  restart: () => void;
  
  // Audio toggles
  isMuted: boolean;
  toggleMute: () => void;
}

export const useGame = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    phase: 'ready',
    isMuted: false,
    
    start: () => {
      // Reset the deck builder state
      const resetDeckBuilder = useDeckBuilder.getState().resetGame;
      resetDeckBuilder();
      
      // Initialize with the player name and AI opponent
      const playerName = 'Player';
      const initializeGame = useDeckBuilder.getState().initializeGame;
      initializeGame([playerName, 'SENTINEL AI']);
      
      // Set game to playing phase
      set({ phase: 'playing' });
    },
    
    pause: () => {
      set({ phase: 'paused' });
    },
    
    resume: () => {
      set({ phase: 'playing' });
    },
    
    end: () => {
      set({ phase: 'game_over' });
    },
    
    restart: () => {
      // Reset game to ready state for a new game
      set({ phase: 'ready' });
    },
    
    toggleMute: () => {
      set(state => ({ isMuted: !state.isMuted }));
    }
  }))
);