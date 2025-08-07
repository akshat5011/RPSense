/**
 * Game State Management Utilities
 * 
 * Handles game state transitions, round progression, and mode-specific logic
 * for both classic and tournament modes in the Rock Paper Scissors game.
 */

/**
 * Handle round completion and determine if game continues or ends
 * @param {Object} gameContext - Game context containing mode, rounds, etc.
 * @param {Object} handlers - Handler functions for different completion scenarios
 */
export const handleRoundCompletion = (gameContext, handlers) => {
	const { gameMode, currentRound, rounds } = gameContext;
	const { handleClassicMode, handleTournamentGame, handleTournamentRound } = handlers;

	const isClassicMode = gameMode === "classic";
	const roundJustCompleted = currentRound + 1;
	const isLastRound = roundJustCompleted >= rounds;

	console.log("🏁 Round completion check:");
	console.log(`   - Game Mode: ${gameMode}`);
	console.log(`   - Round just completed: ${roundJustCompleted}/${rounds}`);
	console.log(`   - Current Redux round: ${currentRound}`);
	console.log(`   - Is Classic Mode: ${isClassicMode}`);
	console.log(`   - Is Last Round: ${isLastRound}`);

	if (isClassicMode) {
		handleClassicMode();
	} else if (isLastRound) {
		handleTournamentGame();
	} else {
		handleTournamentRound();
	}
};

/**
 * Handle completion of classic mode (single round)
 * @param {Object} resources - Camera stream, video ref, API ref
 * @param {Function} saveMatchData - Function to save match data
 * @param {Function} setGameState - State setter for game state
 */
export const handleClassicModeCompletion = (resources, saveMatchData, setGameState) => {
	console.log("🎯 Classic mode finished! Saving match data and cleaning up...");

	const { cameraStream, setCameraStream, videoRef, apiRef } = resources;

	// Immediately release camera resources to stop the flash/indicator
	if (cameraStream) {
		cameraStream.getTracks().forEach((track) => track.stop());
		setCameraStream(null);
	}

	// Clear video element source immediately
	if (videoRef.current) {
		videoRef.current.srcObject = null;
	}

	setGameState("finished");
	saveMatchData();

	// Clear API buffer
	if (apiRef.current) {
		apiRef.current.clearBuffer();
	}
};

/**
 * Handle completion of entire tournament (all rounds finished)
 * @param {Object} resources - Camera stream, video ref, API ref
 * @param {Function} saveMatchData - Function to save match data
 * @param {Function} setGameState - State setter for game state
 */
export const handleTournamentGameCompletion = (resources, saveMatchData, setGameState) => {
	console.log("🎯 Tournament finished! Saving match data and cleaning up...");

	const { cameraStream, setCameraStream, videoRef, apiRef } = resources;

	// Immediately release camera resources
	if (cameraStream) {
		cameraStream.getTracks().forEach((track) => track.stop());
		setCameraStream(null);
	}

	// Clear video element source
	if (videoRef.current) {
		videoRef.current.srcObject = null;
	}

	setGameState("finished");
	saveMatchData();

	// Clear API buffer
	if (apiRef.current) {
		apiRef.current.clearBuffer();
	}
};

/**
 * Handle completion of a single round in tournament mode (more rounds to play)
 * @param {Object} tournamentState - Tournament UI state management
 * @param {Object} refs - References for timeout management
 * @param {Function} proceedToNextRoundAutomatically - Auto proceed function
 */
export const handleTournamentRoundCompletion = (tournamentState, refs, proceedToNextRoundAutomatically) => {
	console.log("🔄 Tournament round completed, more rounds to play...");

	const { setShowNextRoundPrompt, setNextRoundCountdown } = tournamentState;
	const { nextRoundTimeoutRef } = refs;

	// Show "Next Round" prompt with countdown
	setShowNextRoundPrompt(true);
	setNextRoundCountdown(5);

	// Clear any existing countdown interval first
	if (nextRoundTimeoutRef.current) {
		clearInterval(nextRoundTimeoutRef.current);
		nextRoundTimeoutRef.current = null;
	}

	// Start 5-second countdown to automatically proceed
	let countdown = 5;
	nextRoundTimeoutRef.current = setInterval(() => {
		countdown -= 1;
		setNextRoundCountdown(countdown);

		if (countdown <= 0) {
			clearInterval(nextRoundTimeoutRef.current);
			nextRoundTimeoutRef.current = null;

			// Automatically proceed to next round
			proceedToNextRoundAutomatically();
		}
	}, 1000);

	console.log(`⏱️ 5-second countdown started for next round`);
};

/**
 * Proceed to the next round automatically (after countdown)
 * @param {Object} tournamentState - Tournament UI state management
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} nextRound - Redux action to increment round
 * @param {Function} clearRoundStateForNextRound - Round cleanup function
 * @param {Function} setGameState - State setter for game state
 */
export const proceedToNextRoundAutomatically = (tournamentState, dispatch, nextRound, clearRoundStateForNextRound, setGameState) => {
	console.log("➡️ Auto-proceeding to next round...");

	const { setShowNextRoundPrompt } = tournamentState;

	// Clear the next round prompt
	setShowNextRoundPrompt(false);

	// Increment round counter in Redux
	dispatch(nextRound());

	// Clear round state and prepare for next round
	clearRoundStateForNextRound();

	// Set game state to waiting for next round
	setGameState("waiting");
};

/**
 * Proceed to the next round manually (user clicked button)
 * @param {Object} tournamentState - Tournament UI state management
 * @param {Object} refs - References for timeout management
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} nextRound - Redux action to increment round
 * @param {Function} clearRoundStateForNextRound - Round cleanup function
 * @param {Function} setGameState - State setter for game state
 */
export const proceedToNextRoundManually = (tournamentState, refs, dispatch, nextRound, clearRoundStateForNextRound, setGameState) => {
	console.log("➡️ Manually proceeding to next round...");

	const { setShowNextRoundPrompt } = tournamentState;
	const { nextRoundTimeoutRef } = refs;

	// Clear any active countdown timer
	if (nextRoundTimeoutRef.current) {
		clearInterval(nextRoundTimeoutRef.current);
		nextRoundTimeoutRef.current = null;
	}

	// Clear the next round prompt
	setShowNextRoundPrompt(false);

	// Increment round counter in Redux
	dispatch(nextRound());

	// Clear round state and prepare for next round
	clearRoundStateForNextRound();

	// Set game state to waiting for next round
	setGameState("waiting");
};
