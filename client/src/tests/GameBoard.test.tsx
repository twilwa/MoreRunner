import { render, fireEvent, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import GameBoard from '../components/GameBoard';
import { useDeckBuilder } from '../lib/stores/useDeckBuilder';
import { TargetingRequest } from '../lib/game/components';
import * as useGameModule from '../lib/stores/useGame';

vi.mock('../lib/stores/useDeckBuilder');
vi.spyOn(useGameModule, 'useGame').mockReturnValue({ phase: 'playing' });

// Mock initial store state
const defaultCardFields = {
  cost: 0,
  cardType: 'Event',
  faction: 'Neutral',
  keywords: [],
  description: '',
  effects: [],
};

function withDefaults(card) {
  return { ...defaultCardFields, ...card };
}

const defaultPlayerFields = {
  id: '',
  hand: [],
  inPlay: [],
  discard: [],
  deck: [],
  credits: 0,
  actions: 0,
  buys: 0,
  health: 10,
  name: 'Test Player',
  reputation: {},
  faction: 'Neutral',
  factionReputation: { Corp: 0, Runner: 0, Street: 0 },
};

function withPlayerDefaults(player) {
  return { ...defaultPlayerFields, ...player };
}

const defaultMarketFields = {
  availableCards: [],
  trashedCards: [],
};

function withMarketDefaults(market) {
  return { ...defaultMarketFields, ...market };
}

const mockStoreState = {
  gameState: {
    phase: 'playing',
    activePlayerIndex: 0,
    logs: [],
    market: withMarketDefaults({
      availableCards: [withDefaults({ id: 'market1', name: 'Market Card', cost: 3 })],
    }),
    players: [
      withPlayerDefaults({
        id: 'p1',
        hand: [withDefaults({ id: 'hand1', name: 'Hand Card' })],
        credits: 5,
        actions: 1,
        buys: 1,
      }),
      withPlayerDefaults({
        id: 'p2',
        credits: 5,
        actions: 1,
        buys: 1,
      }),
    ],
    location: { id: 'loc1', name: 'Test Location', description: 'A test location.' },
  },
  isTargetingModalOpen: false,
  currentTargetingRequest: undefined,
  playCardFromHand: vi.fn(),
  buyMarketCard: vi.fn(),
  endCurrentPhase: vi.fn(),
  executeTurnActions: vi.fn(),
  provideTargets: vi.fn(),
  cancelTargeting: vi.fn(),
  _setTargetingModalOpen: vi.fn(),
  _setIsExecuting: vi.fn(),
  _updateGameState: vi.fn(),
};

describe('GameBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockStoreState, {
      isTargetingModalOpen: false,
      currentTargetingRequest: undefined,
      gameState: {
        phase: 'playing',
        activePlayerIndex: 0,
        logs: [],
        market: withMarketDefaults({
          availableCards: [withDefaults({ id: 'market1', name: 'Market Card', cost: 3 })],
        }),
        players: [
          withPlayerDefaults({
            id: 'p1',
            hand: [withDefaults({ id: 'hand1', name: 'Hand Card' })],
            credits: 5,
            actions: 1,
            buys: 1,
          }),
          withPlayerDefaults({
            id: 'p2',
            credits: 5,
            actions: 1,
            buys: 1,
          }),
        ],
        location: { id: 'loc1', name: 'Test Location', description: 'A test location.' },
      },
    });
    vi.mocked(useDeckBuilder).mockReturnValue(mockStoreState);
  });

  it('renders initial components correctly', () => {
    render(<GameBoard />);
    expect(screen.getByText('NETRUNNER')).toBeInTheDocument();
    expect(screen.getByTestId('location-card')).toBeInTheDocument();
    // Use getByTestId for player-p1 to ensure no duplicates
    const playerP1Element = screen.getByTestId('player-p1');
    expect(playerP1Element).toBeInTheDocument();
    expect(screen.getByText(/YOUR HAND/)).toBeInTheDocument();
    expect(screen.getByTestId('game-log')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^market-card-/).length).toBeGreaterThan(0);
    expect(screen.getByTestId('end-phase-btn')).toBeInTheDocument();
  });

  it('calls playCardFromHand when a hand card is clicked', () => {
    render(<GameBoard />);
    const handCardButtons = screen.getAllByTestId(/^hand-card-/);
    expect(handCardButtons.length).toBeGreaterThan(0);
    fireEvent.click(handCardButtons[0]);
    expect(mockStoreState.playCardFromHand).toHaveBeenCalledWith(0);
  });

  it('calls buyMarketCard when a market card is clicked', () => {
    act(() => {
      mockStoreState.gameState.phase = 'buy';
      mockStoreState.gameState.players[0].credits = 10;
    });
    render(<GameBoard />);
    const marketCardButtons = screen.getAllByTestId(/^market-card-/);
    expect(marketCardButtons.length).toBeGreaterThan(0);
    fireEvent.click(marketCardButtons[0]);
    expect(mockStoreState.buyMarketCard).toHaveBeenCalledWith(0);
  });

  it('calls endCurrentPhase when End Phase button is clicked', () => {
    // Ensure phase and player state so button is rendered
    act(() => {
      mockStoreState.gameState.phase = 'action';
      mockStoreState.gameState.activePlayerIndex = 0;
    });
    render(<GameBoard />);
    const endPhaseButton = screen.getByTestId('end-phase-btn');
    fireEvent.click(endPhaseButton);
    expect(mockStoreState.endCurrentPhase).toHaveBeenCalled();
  });

  it('calls executeTurnActions when Execute button is clicked', () => {
    act(() => {
      mockStoreState.gameState.players[0].inPlay.push(withDefaults({ id: 'queued1', name: 'Queued Card' }));
      mockStoreState.gameState.phase = 'action';
      mockStoreState.gameState.activePlayerIndex = 0;
    });
    render(<GameBoard />);
    const executeButton = screen.getByTestId('execute-btn');
    expect(executeButton).not.toBeDisabled();
    fireEvent.click(executeButton);
    expect(mockStoreState.executeTurnActions).toHaveBeenCalled();
  });

  it('shows targeting modal when isTargetingModalOpen is true', () => {
    act(() => {
      mockStoreState.isTargetingModalOpen = true;
      mockStoreState.currentTargetingRequest = { message: 'Select Test Target' } as TargetingRequest;
    });
    render(<GameBoard />);
    expect(screen.getByTestId('targeting-modal')).toBeInTheDocument();
  });

  it('calls provideTargets when confirming target selection in modal', () => {
    act(() => {
      mockStoreState.isTargetingModalOpen = true;
      mockStoreState.currentTargetingRequest = { message: 'Select Target', validTargets: [{ id: 't1', name: 'Target 1' }] } as TargetingRequest;
    });
    render(<GameBoard />);
    // Simulate selecting the first target (checkbox or button)
    const targetOption = screen.getByTestId('target-option-t1');
    fireEvent.click(targetOption);
    // Simulate clicking the confirm/submit button
    const confirmButton = screen.getByTestId('targeting-confirm-btn');
    fireEvent.click(confirmButton);
    expect(mockStoreState.provideTargets).toHaveBeenCalled();
  });

  it('calls cancelTargeting when cancel button is clicked in modal', () => {
    act(() => {
      mockStoreState.isTargetingModalOpen = true;
      mockStoreState.currentTargetingRequest = { message: 'Select Target', validTargets: [{ id: 't1', name: 'Target 1' }] } as TargetingRequest;
    });
    render(<GameBoard />);
    // Simulate clicking the cancel button
    const cancelButton = screen.getByTestId('targeting-cancel-btn');
    fireEvent.click(cancelButton);
    expect(mockStoreState.cancelTargeting).toHaveBeenCalled();
  });
});
