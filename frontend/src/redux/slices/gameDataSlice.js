import { createSlice } from "@reduxjs/toolkit";

const nullStateHandler = {
  matches: [],
  players: [],
  currentPlayer: null,
};

// Load game data from localStorage
const loadGameDataFromStorage = () => {
  // Check if we're on the client side
  if (typeof window === "undefined") {
    return nullStateHandler;
  }

  try {
    const serializedData = localStorage.getItem("rpsense_game_data");
    if (serializedData === null) {
      return nullStateHandler;
    }
    const data = JSON.parse(serializedData);

    // Ensure backward compatibility
    return {
      matches: data.matches || [],
      players: data.players || [],
      currentPlayer: data.currentPlayer || null,
    };
  } catch (err) {
    console.warn("Could not load game data from localStorage:", err);
    return nullStateHandler;
  }
};

const initialState = loadGameDataFromStorage();

const gameDataSlice = createSlice({
  name: "gameData",
  initialState,
  reducers: {
    addMatch: (state, action) => {
      const matchData = {
        id: Date.now() + Math.random(), // Unique ID
        playerName: action.payload.playerName,
        model: action.payload.model || "AI", // AI model used
        rounds: action.payload.rounds,
        datetime: action.payload.datetime || new Date().toISOString(),
        playerWins: action.payload.playerWins,
        computerWins: action.payload.computerWins,
        draws: action.payload.draws || 0,
        streak: action.payload.streak || 0,
        gameMode: action.payload.gameMode || "classic",
      };

      // Add match to beginning of array (most recent first)
      state.matches.unshift(matchData);

      // Keep only last 100 matches to prevent localStorage bloat
      if (state.matches.length > 100) {
        state.matches = state.matches.slice(0, 100);
      }
    },

    deleteMatch: (state, action) => {
      const matchId = action.payload;
      const matchIndex = state.matches.findIndex(
        (match) => match.id === matchId
      );

      if (matchIndex !== -1) {
        state.matches.splice(matchIndex, 1);
      }
    },

    clearAllMatches: (state) => {
      state.matches = [];
    },

    clearAllPlayers: (state) => {
      state.players = [];
      state.currentPlayer = null;
      state.matches = [];
    },

    createPlayer: (state, action) => {
      const { name } = action.payload;

      // Check if player already exists
      const existingPlayer = state.players.find(
        (player) => player.name.toLowerCase() === name.toLowerCase()
      );

      if (existingPlayer) {
        return;
      }

      const newPlayer = {
        id: Date.now() + Math.random(),
        name: name.trim(),
      };

      state.players.push(newPlayer);

      // Auto-select new player if no current player
      if (!state.currentPlayer) {
        state.currentPlayer = newPlayer;
      }
    },

    updatePlayer: (state, action) => {
      const { playerId, updates } = action.payload;
      const playerIndex = state.players.findIndex(
        (player) => player.id === playerId
      );

      if (playerIndex !== -1) {
        state.players[playerIndex] = {
          ...state.players[playerIndex],
          ...updates,
        };

        // Update current player if it's the one being updated
        if (state.currentPlayer && state.currentPlayer.id === playerId) {
          state.currentPlayer = state.players[playerIndex];
        }
      }
    },

    deletePlayer: (state, action) => {
      const playerId = action.payload;
      const playerIndex = state.players.findIndex(
        (player) => player.id === playerId
      );

      if (playerIndex !== -1) {
        const deletedPlayer = state.players[playerIndex];

        // Remove player
        state.players.splice(playerIndex, 1);

        // Remove player's matches
        state.matches = state.matches.filter(
          (match) => match.playerName !== deletedPlayer.name
        );

        // Update current player if deleted
        if (state.currentPlayer && state.currentPlayer.id === playerId) {
          state.currentPlayer =
            state.players.length > 0 ? state.players[0] : null;
        }
      }
    },

    setCurrentPlayer: (state, action) => {
      const playerId = action.payload;
      const player = state.players.find((player) => player.id === playerId);

      if (player) {
        state.currentPlayer = player;
      }
    },

    changePlayerByName: (state, action) => {
      const playerName = action.payload.trim();
      const player = state.players.find(
        (player) => player.name.toLowerCase() === playerName.toLowerCase()
      );

      if (player) {
        state.currentPlayer = player;
      } else {
        gameDataSlice.caseReducers.createPlayer(state, {
          payload: { name: playerName },
        });
        const newPlayer = state.players[state.players.length - 1];
        state.currentPlayer = newPlayer;
      }
    },
  },
});

export const {
  addMatch,
  deleteMatch,
  clearAllMatches,
  clearAllPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  setCurrentPlayer,
  changePlayerByName,
} = gameDataSlice.actions;

// Selectors
export const selectAllPlayers = (state) => state.gameData.players;
export const selectCurrentPlayer = (state) => state.gameData.currentPlayer;
export const selectAllMatches = (state) => state.gameData.matches;
export const selectRecentMatches =
  (count = 10) =>
  (state) =>
    state.gameData.matches.slice(0, count);
export const selectMatchesByPlayer = (playerName) => (state) =>
  state.gameData.matches.filter(
    (match) =>
      match.playerName.toLowerCase() === playerName.trim().toLowerCase()
  );
export const selectWinRate = (state) => {
  const matches = state.gameData.matches;
  const totalWins = matches.reduce((sum, match) => sum + match.playerWins, 0);
  const totalLosses = matches.reduce(
    (sum, match) => sum + match.computerWins,
    0
  );
  if (totalWins + totalLosses === 0) return 0;
  return (totalWins / (totalWins + totalLosses)) * 100;
};

export const selectMatchesByPlayerName = (playerName) => (state) =>
  state.gameData.matches.filter(
    (match) => match.playerName.toLowerCase() === playerName.toLowerCase()
  );

export const selectPlayerById = (playerId) => (state) =>
  state.gameData.players.find((player) => player.id === playerId);

export const selectPlayerByName = (playerName) => (state) =>
  state.gameData.players.find(
    (player) => player.name.toLowerCase() === playerName.toLowerCase()
  );

export default gameDataSlice.reducer;
