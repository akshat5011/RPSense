/**
 * Round Management Utilities
 * 
 * Handles round initialization, countdown management, and round sequence control
 * for both classic and tournament game modes.
 */

/**
 * Start the round sequence with countdown
 * @param {Object} roundConfig - Configuration for the round
 * @param {Object} resources - Camera and game resources
 * @param {Object} stateSetters - Functions to set game state
 * @param {Function} initCamera - Function to initialize camera
 * @param {Function} clearRoundState - Function to clear round state
 */
export const startRound = async (roundConfig, resources, stateSetters, initCamera, clearRoundState) => {
	const { gameState, gameMode, currentRound, rounds } = roundConfig;
	const { cameraStream, videoRef } = resources;
	const { setGameState, setCountdown } = stateSetters;

	// Prevent starting if game is already in progress
	if (gameState !== "waiting") {
		console.log("⚠️ Game already in progress, cannot start new round");
		return;
	}

	console.log(
		`🚀 Starting round ${currentRound + 1}/${rounds} in ${gameMode} mode`
	);

	// Initialize camera only if not already available or not working
	if (!cameraStream || !videoRef.current?.srcObject) {
		console.log("🎥 Initializing camera for round...");
		await initCamera();
	} else {
		console.log("🎥 Camera already active, reusing connection");
	}

	// Prepare for new round
	console.log("🧹 Clearing previous round state...");
	clearRoundState();
	setGameState("countdown");
	setCountdown(3);

	// 3-second countdown timer
	const countdownTimer = setInterval(() => {
		setCountdown((prev) => {
			if (prev <= 1) {
				clearInterval(countdownTimer);
				console.log("⏰ Countdown complete! Transition to capturing state handled by main component");
				return 0;
			}
			console.log(`⏰ Countdown: ${prev - 1}`);
			return prev - 1;
		});
	}, 1000);
};

/**
 * Check API connection status
 * @param {Object} apiRef - Reference to API instance
 * @param {Function} setApiConnected - State setter for API connection status
 */
export const checkAPIConnection = async (apiRef, setApiConnected) => {
	try {
		await apiRef.current.healthCheck();
		setApiConnected(true);
		console.log("✅ API connected successfully!");
	} catch (error) {
		setApiConnected(false);
		console.error("❌ API connection failed:", error);
	}
};
