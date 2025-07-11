import { configureStore } from '@reduxjs/toolkit';
import viewReducer from './slices/viewSlice';
import gameDataReducer from './slices/gameDataSlice';

// Middleware to save state to localStorage
const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Save view state for view-related actions
  if (action.type.startsWith('view/')) {
    try {
      const viewState = store.getState().view;
      const stateToPersist = {
        ...viewState,
        isTransitioning: false,
      };
      localStorage.setItem('rpsense_view_state', JSON.stringify(stateToPersist));
    } catch (err) {
      console.warn('Could not save view state to localStorage:', err);
    }
  }
  
  // Save game data for gameData-related actions
  if (action.type.startsWith('gameData/')) {
    try {
      const gameDataState = store.getState().gameData;
      localStorage.setItem('rpsense_game_data', JSON.stringify(gameDataState));
    } catch (err) {
      console.warn('Could not save game data to localStorage:', err);
    }
  }
  
  return result;
};

const store = configureStore({
  reducer: {
    view: viewReducer,
    gameData: gameDataReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(localStorageMiddleware),
});

export default store;