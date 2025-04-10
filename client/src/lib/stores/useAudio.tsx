import { create } from "zustand";
import { useEffect } from 'react';

interface AudioState {
  // Audio elements
  backgroundMusic: HTMLAudioElement | null;
  cardPlaySound: HTMLAudioElement | null;
  cardBuySound: HTMLAudioElement | null;
  errorSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Initialize audio
  initializeAudio: () => void;
  
  // Control functions
  toggleMute: () => void;
  playCardPlay: () => void;
  playCardBuy: () => void;
  playError: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  cardPlaySound: null,
  cardBuySound: null,
  errorSound: null,
  isMuted: true, // Start muted by default
  
  // Initialize all game audio
  initializeAudio: () => {
    // Create background music
    const backgroundMusic = new Audio();
    backgroundMusic.src = "/sounds/cyberpunk-background.mp3"; // Replace with actual file
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;
    
    // Create game sounds
    const cardPlaySound = new Audio();
    cardPlaySound.src = "/sounds/card-play.mp3"; // Replace with actual file
    cardPlaySound.volume = 0.5;
    
    const cardBuySound = new Audio();
    cardBuySound.src = "/sounds/card-buy.mp3"; // Replace with actual file
    cardBuySound.volume = 0.5;
    
    const errorSound = new Audio();
    errorSound.src = "/sounds/error.mp3"; // Replace with actual file
    errorSound.volume = 0.5;
    
    // Update the store with the audio elements
    set({
      backgroundMusic,
      cardPlaySound,
      cardBuySound,
      errorSound
    });
    
    // Start background music (will be muted by default)
    backgroundMusic.volume = 0; // Start silent until unmuted by user
    
    // Attempt to play background music (may be blocked by browser)
    backgroundMusic.play().catch(error => {
      console.log("Background music autoplay prevented:", error);
    });
  },
  
  // Toggle mute for all sounds
  toggleMute: () => {
    const { isMuted, backgroundMusic } = get();
    const newMutedState = !isMuted;
    
    // Update background music volume
    if (backgroundMusic) {
      backgroundMusic.volume = newMutedState ? 0 : 0.3;
    }
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  // Play card being played sound
  playCardPlay: () => {
    const { cardPlaySound, isMuted } = get();
    if (cardPlaySound && !isMuted) {
      cardPlaySound.currentTime = 0;
      cardPlaySound.play().catch(error => {
        console.log("Card play sound play prevented:", error);
      });
    }
  },
  
  // Play card being bought sound
  playCardBuy: () => {
    const { cardBuySound, isMuted } = get();
    if (cardBuySound && !isMuted) {
      cardBuySound.currentTime = 0;
      cardBuySound.play().catch(error => {
        console.log("Card buy sound play prevented:", error);
      });
    }
  },
  
  // Play error sound
  playError: () => {
    const { errorSound, isMuted } = get();
    if (errorSound && !isMuted) {
      errorSound.currentTime = 0;
      errorSound.play().catch(error => {
        console.log("Error sound play prevented:", error);
      });
    }
  }
}));

// Hook to initialize audio on component mount
export const useInitializeAudio = () => {
  const initializeAudio = useAudio(state => state.initializeAudio);
  
  useEffect(() => {
    // Initialize audio when component mounts
    initializeAudio();
    
    // Clean up when component unmounts
    return () => {
      const backgroundMusic = useAudio.getState().backgroundMusic;
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
    };
  }, [initializeAudio]);
};
