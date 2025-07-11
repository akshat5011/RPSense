import { configureStore } from "@reduxjs/toolkit";
import viewReducer from "./slices/viewSlice";
import gameDataReducer from "./slices/gameDataSlice";
import gameReducer from "./slices/gameSlice";

// Middleware to save state to localStorage
const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  if (typeof window !== "undefined") {
    try {
      const state = store.getState();

      // Save view state
      localStorage.setItem("rpsense_view_state", JSON.stringify(state.view));

      // Save game data
      localStorage.setItem("rpsense_game_data", JSON.stringify(state.gameData));
    } catch (error) {
      console.warn("Could not save state to localStorage:", error);
    }
  }

  return result;
};

const store = configureStore({
  reducer: {
    view: viewReducer,
    gameData: gameDataReducer,
    game: gameReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }).concat(localStorageMiddleware),
});

export default store;