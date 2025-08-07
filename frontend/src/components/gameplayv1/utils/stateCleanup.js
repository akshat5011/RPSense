/**
 * State Cleanup Utilities
 * 
 * Handles state cleanup and resource management between rounds
 * and during game transitions.
 */

/**
 * Clear state between rounds while preserving session resources
 * @param {Object} stateSetters - Functions to reset UI state
 * @param {Object} refs - References for API and result tracking
 * @param {Function} stopCapturing - Function to stop frame capturing
 */
export const clearRoundState = (stateSetters, refs, stopCapturing) => {
	const { 
		setRealtimeResult, 
		setFinalResult, 
		setOverlayImage, 
		setComputerChoice, 
		setIsCapturing 
	} = stateSetters;
	const { apiRef, resultReceivedRef } = refs;

	// Stop any active frame capturing first
	stopCapturing();
	
	// Reset UI state for next round
	setRealtimeResult(null);
	setFinalResult(null);
	setOverlayImage(null);
	setComputerChoice("🤖");
	resultReceivedRef.current = false;
	setIsCapturing(false);

	// Clear any existing frame buffer
	if (apiRef.current) {
		apiRef.current.clearBuffer();
	}

	// IMPORTANT: Keep camera and API connections active between rounds
	// This prevents reconnection delays and improves user experience
	// Timestamp will be reset at the start of next capture session

	console.log("🧹 Round state cleared (camera kept active)");
};

/**
 * Clear round state specifically for tournament mode round transitions
 * @param {Object} stateSetters - Functions to reset all state
 * @param {Object} refs - References for comprehensive cleanup
 * @param {Function} stopCapturing - Function to stop frame capturing
 */
export const clearRoundStateForNextRound = (stateSetters, refs, stopCapturing) => {
	console.log("🧹 Clearing round state for tournament next round...");

	const { 
		setRealtimeResult, 
		setFinalResult, 
		setOverlayImage, 
		setComputerChoice, 
		setIsCapturing,
		setGameState
	} = stateSetters;
	const { apiRef, resultReceivedRef, frameTimestampRef, frameIntervalRef } = refs;

	// Stop any active frame capturing
	stopCapturing();

	// Reset all round-specific state
	setRealtimeResult(null);
	setFinalResult(null);
	setOverlayImage(null);
	setComputerChoice("🤖");
	resultReceivedRef.current = false;
	setIsCapturing(false);
	setGameState("waiting");

	// Clear API buffer completely
	if (apiRef.current) {
		apiRef.current.clearBuffer();
		console.log("🗑️ API buffer cleared for next round");
	}

	// Reset frame timestamp for next round
	frameTimestampRef.current = 0;

	// Clear any frame capture intervals
	if (frameIntervalRef.current) {
		clearInterval(frameIntervalRef.current);
		frameIntervalRef.current = null;
	}

	console.log("✅ Round state completely cleared for next tournament round");
};

/**
 * Handle game exit and cleanup all resources
 * @param {Object} resources - All game resources to cleanup
 * @param {Function} stopCapturing - Function to stop frame capturing
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} resetGame - Redux action to reset game
 * @param {Function} navigateTo - Navigation function
 */
export const handleExitGame = (resources, stopCapturing, dispatch, resetGame, navigateTo) => {
	console.log("🚪 Exiting game and cleaning up resources...");

	const { cameraStream, setCameraStream, videoRef, apiRef } = resources;

	// Stop any active frame capturing
	stopCapturing();

	// Release camera resources if active
	if (cameraStream) {
		cameraStream.getTracks().forEach((track) => track.stop());
		setCameraStream(null);
	}

	// Clear video element source
	if (videoRef.current) {
		videoRef.current.srcObject = null;
	}

	// Clear API buffer
	if (apiRef.current) {
		apiRef.current.clearBuffer();
	}

	// Reset game state in Redux store
	dispatch(resetGame());
	console.log("🔄 Game state reset in Redux");

	// Navigate back to main menu
	console.log("🏠 Navigating back to main menu");
	navigateTo("menu");
};

/**
 * Component cleanup for unmounting
 * @param {Object} resources - All resources to cleanup
 * @param {Object} refs - All refs to clear
 * @param {Function} stopCapturing - Function to stop frame capturing
 */
export const componentCleanup = (resources, refs, stopCapturing) => {
	const { cameraStream, videoRef } = resources;
	const { nextRoundTimeoutRef, apiRef } = refs;

	stopCapturing(); // Stop any active frame capture

	// Clear countdown timer if active
	if (nextRoundTimeoutRef.current) {
		clearInterval(nextRoundTimeoutRef.current);
	}

	// Release camera resources
	if (cameraStream) {
		cameraStream.getTracks().forEach((track) => track.stop());
	}

	// Clear video element source
	if (videoRef.current) {
		videoRef.current.srcObject = null;
	}

	// Clear API buffer
	if (apiRef.current) {
		apiRef.current.clearBuffer();
	}
};
