import { createSlice } from "@reduxjs/toolkit";

const nullStateHandler = {
  matches: [],
};

// Load game data from localStorage
const loadGameDataFromStorage = () => {
  try {
    const serializedData = localStorage.getItem("rpsense_game_data");
    if (serializedData === null) {
      return nullStateHandler;
    }
    return JSON.parse(serializedData);
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
  },
});

export const { addMatch, deleteMatch, clearAllMatches } = gameDataSlice.actions;

// Selectors
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
export default gameDataSlice.reducer;
