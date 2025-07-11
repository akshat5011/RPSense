import { configureStore } from '@reduxjs/toolkit';
import viewReducer from './slices/viewSlice';

// Middleware to save view state to localStorage
const localStorageMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Only save view state for view-related actions
  if (action.type.startsWith('view/')) {
    try {
      const viewState = store.getState().view;
      // Don't persist isTransitioning state
      const stateToPersist = {
        ...viewState,
        isTransitioning: false,
      };
      localStorage.setItem('rpsense_view_state', JSON.stringify(stateToPersist));
    } catch (err) {
      console.warn('Could not save view state to localStorage:', err);
    }
  }
  
  return result;
};

const store = configureStore({
  reducer: {
    view: viewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(localStorageMiddleware),
});

export default store;