import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  gameMode: "classic", // "classic" or "tournament"
  rounds: 3,
  isGameActive: false,
  currentRound: 0,
  playerScore: 0,
  computerScore: 0,
  draws: 0,
  gameHistory: [], // Array of round results
  cameraPermission: null, // null, "granted", "denied", "checking"
  isLoading: false,
  error: null,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setGameMode: (state, action) => {
      state.gameMode = action.payload;
      // Reset rounds to 3 when switching to tournament
      if (action.payload === "tournament" && state.rounds < 3) {
        state.rounds = 3;
      }
    },
    
    setRounds: (state, action) => {
      if (state.gameMode === "tournament") {
        state.rounds = Math.max(3, action.payload);
      }
    },
    
    setCameraPermission: (state, action) => {
      state.cameraPermission = action.payload;
    },
    
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    startGame: (state) => {
      state.isGameActive = true;
      state.currentRound = 0;
      state.playerScore = 0;
      state.computerScore = 0;
      state.draws = 0;
      state.gameHistory = [];
      state.error = null;
    },
    
    endGame: (state) => {
      state.isGameActive = false;
    },
    
    updateScore: (state, action) => {
      const { player, computer } = action.payload;
      state.playerScore += player;
      state.computerScore += computer;
    },
    
    nextRound: (state) => {
      state.currentRound += 1;
    },
    
    addRoundResult: (state, action) => {
      const { playerChoice, computerChoice, result } = action.payload;
      
      state.gameHistory.push({
        round: state.currentRound + 1,
        playerChoice,
        computerChoice,
        result,
        timestamp: new Date().toISOString(),
      });
      
      if (result === "win") {
        state.playerScore += 1;
      } else if (result === "lose") {
        state.computerScore += 1;
      } else {
        state.draws += 1;
      }
      
      state.currentRound += 1;
    },
    
    resetGame: (state) => {
      return {
        ...initialState,
        cameraPermission: state.cameraPermission,
      };
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setGameMode,
  setRounds,
  setCameraPermission,
  setIsLoading,
  startGame,
  endGame,
  updateScore,
  nextRound,
  addRoundResult,
  resetGame,
  setError,
} = gameSlice.actions;

// Selectors
export const selectGameMode = (state) => state.game.gameMode;
export const selectRounds = (state) => state.game.rounds;
export const selectCameraPermission = (state) => state.game.cameraPermission;
export const selectIsLoading = (state) => state.game.isLoading;
export const selectIsGameActive = (state) => state.game.isGameActive;
export const selectGameStats = (state) => ({
  currentRound: state.game.currentRound,
  playerScore: state.game.playerScore,
  computerScore: state.game.computerScore,
  draws: state.game.draws,
});
export const selectGameHistory = (state) => state.game.gameHistory;
export const selectGameError = (state) => state.game.error;
export const selectCurrentRound = (state) => state.game.currentRound;

export default gameSlice.reducer;