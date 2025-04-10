import { Card, evaluateCardSynergies, getStartingDeck } from './cards';
import { Market, createMarket, removeCard, refillMarket } from './market';
import { 
  Player, 
  createPlayer, 
  startTurn, 
  endTurn, 
  playCard, 
  buyCard, 
  applyDamage, 
  forceDiscard,
  shuffleDeck,
  trashCard 
} from './player';

export type GamePhase = 'action' | 'buy' | 'cleanup' | 'waiting' | 'game_over';
export type GameLog = {
  message: string;
  timestamp: number;
};

export interface GameState {
  players: Player[];
  activePlayerIndex: number;
  market: Market;
  phase: GamePhase;
  turnNumber: number;
  logs: GameLog[];
  // A pile of cards that are completely removed from the game
  trashPile: Card[];
}

// Initialize a new game with players and market
export function initializeGame(playerNames: string[]): GameState {
  // Create players
  const players: Player[] = [];
  for (let i = 0; i < playerNames.length; i++) {
    const player = createPlayer(`player_${i}`, playerNames[i]);
    
    // Give each player a shuffled starting deck
    const startingDeck = getStartingDeck();
    player.deck = shuffleDeck(startingDeck);
    
    // Draw initial hand
    const updatedPlayer = startTurn(player);
    players.push(updatedPlayer);
  }
  
  // Create market
  const market = createMarket(5);
  
  return {
    players,
    activePlayerIndex: 0,
    market,
    phase: 'action',
    turnNumber: 1,
    logs: [{ message: 'Game started.', timestamp: Date.now() }],
    trashPile: []
  };
}

// Add a log message to the game state
export function addLog(gameState: GameState, message: string): GameState {
  const updatedGameState = { ...gameState };
  updatedGameState.logs = [
    ...updatedGameState.logs, 
    { message, timestamp: Date.now() }
  ];
  return updatedGameState;
}

// Play a card from the active player's hand
export function playCardFromHand(gameState: GameState, cardIndex: number): GameState {
  let updatedGameState = { ...gameState };
  const activePlayer = updatedGameState.players[updatedGameState.activePlayerIndex];
  
  // Check if in action phase and player has actions left
  if (updatedGameState.phase !== 'action' || activePlayer.actions <= 0) {
    return addLog(updatedGameState, "Cannot play card: Not in action phase or no actions left.");
  }
  
  // Check if the card exists in hand
  if (cardIndex < 0 || cardIndex >= activePlayer.hand.length) {
    return addLog(updatedGameState, "Cannot play card: Invalid card selection.");
  }
  
  // Evaluate card synergies based on already played cards
  const cardToPlay = evaluateCardSynergies(
    activePlayer.hand[cardIndex], 
    activePlayer.inPlay
  );
  
  // Play the card
  const { player: updatedPlayer, playedCard } = playCard(activePlayer, cardIndex);
  if (!playedCard) {
    return addLog(updatedGameState, "Failed to play card.");
  }
  
  // Update the player
  updatedGameState.players[updatedGameState.activePlayerIndex] = updatedPlayer;
  
  // Handle card effects that impact the opponent(s)
  const opponentIndices = updatedGameState.players
    .map((_, index) => index)
    .filter(index => index !== updatedGameState.activePlayerIndex);
  
  for (const effect of playedCard.effects) {
    // Handle effects that impact other players
    if (effect.type === 'damage_opponent') {
      for (const opponentIndex of opponentIndices) {
        const opponent = updatedGameState.players[opponentIndex];
        updatedGameState.players[opponentIndex] = applyDamage(opponent, effect.value);
        updatedGameState = addLog(
          updatedGameState, 
          `${activePlayer.name} deals ${effect.value} damage to ${opponent.name}.`
        );
      }
    }
    else if (effect.type === 'force_discard') {
      for (const opponentIndex of opponentIndices) {
        const opponent = updatedGameState.players[opponentIndex];
        const { player: updatedOpponent, discardedCards } = forceDiscard(opponent, effect.value);
        updatedGameState.players[opponentIndex] = updatedOpponent;
        updatedGameState = addLog(
          updatedGameState, 
          `${activePlayer.name} forces ${opponent.name} to discard ${discardedCards.length} card(s).`
        );
      }
    }
    else if (effect.type === 'trash_cards') {
      // Ask player to select cards to trash (simulated with random selection)
      if (updatedPlayer.hand.length > 0 && effect.value > 0) {
        const { player: playerAfterTrash, trashedCard } = trashCard(
          updatedGameState.players[updatedGameState.activePlayerIndex],
          Math.floor(Math.random() * updatedPlayer.hand.length)
        );
        
        if (trashedCard) {
          updatedGameState.players[updatedGameState.activePlayerIndex] = playerAfterTrash;
          updatedGameState.trashPile.push(trashedCard);
          updatedGameState = addLog(
            updatedGameState, 
            `${activePlayer.name} trashed ${trashedCard.name}.`
          );
        }
      }
    }
  }
  
  // Reduce an action for playing the card
  updatedGameState.players[updatedGameState.activePlayerIndex].actions -= 1;
  
  // Add log about the played card
  updatedGameState = addLog(
    updatedGameState, 
    `${activePlayer.name} played ${playedCard.name}.`
  );
  
  // Check for game over condition
  if (updatedGameState.players.some(player => player.health <= 0)) {
    updatedGameState.phase = 'game_over';
    updatedGameState = addLog(updatedGameState, "Game over!");
  }
  
  return updatedGameState;
}

// Buy a card from the market
export function buyCardFromMarket(gameState: GameState, cardIndex: number): GameState {
  let updatedGameState = { ...gameState };
  const activePlayer = updatedGameState.players[updatedGameState.activePlayerIndex];
  
  // Check if in buy phase and player has buys left
  if (updatedGameState.phase !== 'buy' || activePlayer.buys <= 0) {
    return addLog(updatedGameState, "Cannot buy card: Not in buy phase or no buys left.");
  }
  
  // Check if the card exists in market
  if (cardIndex < 0 || cardIndex >= updatedGameState.market.availableCards.length) {
    return addLog(updatedGameState, "Cannot buy card: Invalid card selection.");
  }
  
  const cardToBuy = updatedGameState.market.availableCards[cardIndex];
  
  // Check if player has enough credits
  if (activePlayer.credits < cardToBuy.cost) {
    return addLog(
      updatedGameState, 
      `Cannot buy ${cardToBuy.name}: Not enough credits (cost: ${cardToBuy.cost}, available: ${activePlayer.credits}).`
    );
  }
  
  // Buy the card
  const updatedPlayer = buyCard(activePlayer, cardToBuy);
  updatedGameState.players[updatedGameState.activePlayerIndex] = updatedPlayer;
  
  // Remove card from market
  const { market: updatedMarket } = removeCard(updatedGameState.market, cardIndex);
  updatedGameState.market = updatedMarket;
  
  // Refill the market
  updatedGameState.market = refillMarket(updatedGameState.market);
  
  // Add log
  updatedGameState = addLog(
    updatedGameState, 
    `${activePlayer.name} bought ${cardToBuy.name} for ${cardToBuy.cost} credits.`
  );
  
  return updatedGameState;
}

// End the current phase and proceed to the next phase
export function endPhase(gameState: GameState): GameState {
  let updatedGameState = { ...gameState };
  
  // Handle phase transitions
  switch (updatedGameState.phase) {
    case 'action':
      updatedGameState.phase = 'buy';
      updatedGameState = addLog(updatedGameState, `${updatedGameState.players[updatedGameState.activePlayerIndex].name} enters buy phase.`);
      break;
      
    case 'buy':
      updatedGameState.phase = 'cleanup';
      // End the player's turn
      const activePlayer = updatedGameState.players[updatedGameState.activePlayerIndex];
      updatedGameState.players[updatedGameState.activePlayerIndex] = endTurn(activePlayer);
      updatedGameState = addLog(updatedGameState, `${activePlayer.name} ends their turn.`);
      
      // Move to the next player
      updatedGameState.activePlayerIndex = (updatedGameState.activePlayerIndex + 1) % updatedGameState.players.length;
      
      // If we've gone through all players, increment turn number
      if (updatedGameState.activePlayerIndex === 0) {
        updatedGameState.turnNumber += 1;
        updatedGameState = addLog(updatedGameState, `Turn ${updatedGameState.turnNumber} begins.`);
      }
      
      // Start the next player's turn
      const nextPlayer = updatedGameState.players[updatedGameState.activePlayerIndex];
      updatedGameState.players[updatedGameState.activePlayerIndex] = startTurn(nextPlayer);
      updatedGameState = addLog(updatedGameState, `${nextPlayer.name}'s turn begins.`);
      
      // Set phase to action for the next player
      updatedGameState.phase = 'action';
      break;
      
    case 'waiting':
    case 'game_over':
      // Do nothing in these phases
      break;
  }
  
  return updatedGameState;
}

// Get the current game status as a formatted string
export function getGameStatus(gameState: GameState): string {
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  
  return `Turn ${gameState.turnNumber} | ${activePlayer.name}'s turn | Phase: ${gameState.phase} | 
  Actions: ${activePlayer.actions} | Buys: ${activePlayer.buys} | Credits: ${activePlayer.credits} | 
  Health: ${activePlayer.health} | Hand: ${activePlayer.hand.length} cards | Deck: ${activePlayer.deck.length} cards`;
}
