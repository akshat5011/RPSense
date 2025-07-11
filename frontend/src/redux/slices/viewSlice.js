import { createSlice } from "@reduxjs/toolkit";

const nullStateHandler = {
  currentView: "menu",
  isTransitioning: false,
  viewHistory: [],
};

// Load initial state from localStorage if available
const loadStateFromStorage = () => {
  if (typeof window === "undefined") {
    return nullStateHandler;
  }
  try {
    const serializedState = localStorage.getItem("rpsense_view_state");
    if (serializedState === null) {
      return nullStateHandler;
    }
    const parsed = JSON.parse(serializedState);
    // Reset transitioning state on reload
    return {
      ...parsed,
      isTransitioning: false,
    };
  } catch (err) {
    console.warn("Could not load view state from localStorage:", err);
    return nullStateHandler;
  }
};

const initialState = loadStateFromStorage();

const viewSlice = createSlice({
  name: "view",
  initialState,
  reducers: {
    setCurrentView: (state, action) => {
      const newView = action.payload;

      // Don't add to history if it's the same view
      if (newView !== state.currentView) {
        // Add current view to history before changing
        if (state.currentView) {
          state.viewHistory.push({
            view: state.currentView,
            timestamp: Date.now(),
          });
        }

        // Keep only last 10 views in history
        if (state.viewHistory.length > 10) {
          state.viewHistory = state.viewHistory.slice(-10);
        }

        state.currentView = newView;
      }
    },

    goBack: (state) => {
      if (state.viewHistory.length > 0) {
        const lastHistoryItem = state.viewHistory.pop();
        state.currentView = lastHistoryItem.view;
      }
    },

    goToHistoryView: (state, action) => {
      const targetView = action.payload;
      const historyIndex = state.viewHistory.findIndex(
        (item) => item.view === targetView
      );

      if (historyIndex !== -1) {
        state.currentView = targetView;
        state.viewHistory = state.viewHistory.slice(0, historyIndex);
      }
    },

    setTransitioning: (state, action) => {
      state.isTransitioning = action.payload;
    },

    resetView: (state) => {
      state.currentView = "menu";
      state.isTransitioning = false;
      state.viewHistory = [];
    },

    clearHistory: (state) => {
      state.viewHistory = [];
    },

    // Navigation shortcuts
    goHome: (state) => {
      if (state.currentView !== "menu") {
        state.currentView = "menu";
      }
    },

    goToPlay: (state) => {
      if (state.currentView !== "play") {
        state.currentView = "play";
      }
    },
  },
});

export const {
  setCurrentView,
  goBack,
  goToHistoryView,
  setTransitioning,
  resetView,
  clearHistory,
  goHome,
  goToPlay,
} = viewSlice.actions;

// Selectors
export const selectCurrentView = (state) => state.view.currentView;
export const selectIsTransitioning = (state) => state.view.isTransitioning;
export const selectViewHistory = (state) => state.view.viewHistory;
export const selectCanGoBack = (state) => state.view.viewHistory.length > 0;

export default viewSlice.reducer;
