/**
 * Frame Processing Utilities
 * 
 * Handles camera initialization, frame capture, buffering, and ML processing
 * for the Rock Paper Scissors hand gesture recognition system.
 */

/**
 * Initialize camera stream from user's webcam
 * @param {Function} setCameraStream - State setter for camera stream
 * @param {Object} videoRef - React ref to video element
 */
export const initCamera = async (setCameraStream, videoRef) => {
	try {
		// Request camera access with optimal settings for hand detection
		const stream = await navigator.mediaDevices.getUserMedia({
			video: {
				width: { ideal: 640 }, // Optimal resolution for processing speed
				height: { ideal: 480 }, // Maintains 4:3 aspect ratio
				facingMode: "user", // Front-facing camera preferred
			},
			audio: false, // No audio needed for gesture recognition
		});

		setCameraStream(stream);

		// Connect stream to video element for display
		if (videoRef.current) {
			videoRef.current.srcObject = stream;
		}
	} catch (error) {
		console.error("Error accessing camera:", error);
		alert("Failed to access camera. Please check permissions.");
	}
};

/**
 * Start capturing frames for ML processing
 * @param {Object} captureConfig - Configuration for frame capture
 * @param {Object} refs - React refs for API, frame interval, etc.
 * @param {Object} stateSetter - State management functions
 * @param {Function} captureFrameToBuffer - Function to capture individual frames
 * @param {Function} processFrameBuffer - Function to process captured frames
 * @param {Function} handleAPIError - Error handler function
 */
export const startCapturing = (captureConfig, refs, stateSetters, captureFrameToBuffer, processFrameBuffer, handleAPIError) => {
	const { apiConnected } = captureConfig;
	const { apiRef, frameIntervalRef, resultReceivedRef } = refs;
	const { setGameState, setIsCapturing } = stateSetters;

	// Verify API connection before starting capture
	if (!apiRef.current || !apiConnected) {
		console.error("❌ API not connected, cannot start capturing");
		handleAPIError();
		return;
	}

	// Prevent starting capture if already capturing or result already received
	if (captureConfig.isCapturing || resultReceivedRef.current) {
		console.log("⚠️ Already capturing or result received, skipping");
		return;
	}

	// Initialize capture session
	console.log("📹 Starting frame capture - frame collection only (gameState managed by main component)");
	setIsCapturing(true);
	resultReceivedRef.current = false;

	// Reset timestamp for monotonic sequence (MediaPipe requirement)
	refs.frameTimestampRef.current = 1000; // Start from 1000 to avoid zero

	// Clear any previous frame buffer
	apiRef.current.clearBuffer();

	let frameCount = 0;
	const maxFrames = 20; // Capture exactly 20 frames (2 seconds at 10fps)

	// Frame capture loop - runs every 100ms for 10fps rate
	frameIntervalRef.current = setInterval(() => {
		if (frameCount < maxFrames && !resultReceivedRef.current) {
			captureFrameToBuffer(); // Add current frame to buffer
			frameCount++;
		} else {
			// Capture complete - stop and process frames
			stopCapturing(frameIntervalRef, setIsCapturing);
			
			// Only process if we have frames and haven't received result yet
			if (frameCount > 0 && !resultReceivedRef.current && apiRef.current && apiRef.current.getBufferSize() > 0) {
				console.log(`📊 Captured ${frameCount} frames, processing...`);
				processFrameBuffer();
			} else {
				console.log(`⚠️ Skipping frame processing - frameCount: ${frameCount}, resultReceived: ${resultReceivedRef.current}, bufferSize: ${apiRef.current ? apiRef.current.getBufferSize() : 'N/A'}`);
				// Provide fallback result if no frames were captured
				handleAPIError();
			}
		}
	}, 100); // 100ms interval = 10fps
};

/**
 * Stop frame capture process
 * @param {Object} frameIntervalRef - Ref to frame capture interval
 * @param {Function} setIsCapturing - State setter for capturing status
 */
export const stopCapturing = (frameIntervalRef, setIsCapturing) => {
	if (frameIntervalRef.current) {
		clearInterval(frameIntervalRef.current);
		frameIntervalRef.current = null;
	}
	setIsCapturing(false);
	console.log("🛑 Stopped capturing frames");
};

/**
 * Capture current video frame and add to buffer
 * @param {Object} refs - Video, canvas, API, and timestamp refs
 * @param {Object} gameContext - Current game state for metadata
 */
export const captureFrameToBuffer = (refs, gameContext) => {
	const { videoRef, canvasRef, apiRef, frameTimestampRef } = refs;
	const { gameMode, rounds, currentRound, playerScore, computerScore } = gameContext;

	// Verify required resources are available (video, canvas, API)
	if (!videoRef.current || !canvasRef.current || !apiRef.current) return;

	const canvas = canvasRef.current;
	const video = videoRef.current;
	const ctx = canvas.getContext("2d");

	// Check if video stream is ready (has valid dimensions)
	if (video.videoWidth === 0 || video.videoHeight === 0) {
		console.log("⏳ Video not ready, skipping frame");
		return;
	}

	// Set canvas dimensions to match video resolution
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;

	// Draw current video frame onto canvas for processing
	ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

	// Convert canvas to base64 JPEG with quality control (70% to balance quality/size)
	const frameBase64 = canvas.toDataURL("image/jpeg", 0.7);

	// Generate monotonic timestamp (required by MediaPipe for proper frame ordering)
	frameTimestampRef.current += 1000;

	// Add frame to buffer with metadata
	apiRef.current.addFrame(frameBase64, {
		gameMode,
		totalRounds: rounds,
		currentRound: currentRound + 1,
		playerScore,
		computerScore,
		timestamp: frameTimestampRef.current,
	});
};

/**
 * Process buffered frames via HTTP API
 * @param {Object} processConfig - Configuration for processing
 * @param {Object} refs - API and result refs
 * @param {Object} gameContext - Current game context
 * @param {Object} resultHandlers - Functions to handle results
 * @param {Function} handleAPIError - Error handler function
 */
export const processFrameBuffer = async (processConfig, refs, gameContext, resultHandlers, handleAPIError) => {
	const { apiRef, resultReceivedRef } = refs;
	const { gameMode, rounds, currentRound, currentPlayer } = gameContext;
	const { setComputerChoice, updateGameScore, setFinalResult, setGameState, handleRoundCompletion, getEmojiForChoice } = resultHandlers;

	if (!apiRef.current || resultReceivedRef.current) {
		console.log("⚠️ API not available or result already received");
		return;
	}

	// Check if we have frames to process
	const bufferSize = apiRef.current.getBufferSize();
	if (bufferSize === 0) {
		console.log("⚠️ No frames in buffer to process, using fallback");
		handleAPIError();
		return;
	}

	// Prevent multiple simultaneous calls
	if (apiRef.current.isCurrentlyProcessing()) {
		console.log("⚠️ Already processing frames, skipping duplicate call");
		return;
	}

	try {
		console.log(`📤 Processing ${bufferSize} frames via HTTP`);

		const gameData = {
			gameMode,
			totalRounds: rounds,
			currentRound: currentRound + 1,
			playerName: currentPlayer?.name || "Player",
		};

		const result = await apiRef.current.processFrames(gameData);
		
		// Double-check result hasn't been received already
		if (resultReceivedRef.current) {
			console.log("⚠️ Duplicate result ignored - already processed");
			return;
		}

		resultReceivedRef.current = true;
		console.log("🎯 Final result:", result);

		// Process the result with better safety checks
		if (result && result.game_result && result.game_result.computer_move) {
			setComputerChoice(getEmojiForChoice(result.game_result.computer_move));
			updateGameScore(result.game_result.winner);
		} else {
			console.log("⚠️ Invalid result format, using fallback");
			// Handle timeout/error cases
			setComputerChoice("🗿");
			updateGameScore("computer");
		}

		setFinalResult(result);
		setGameState("result");

		// Show result overlay and proceed to next round after delay
		setTimeout(() => {
			handleRoundCompletion();
		}, 3000);

	} catch (error) {
		console.error("❌ Error processing frames:", error);
		// Only handle API error if it's not just a duplicate call
		if (!error.message.includes('Already processing') && !error.message.includes('No frames to process')) {
			handleAPIError();
		} else if (error.message.includes('No frames to process')) {
			console.log("⚠️ No frames error caught, using fallback");
			handleAPIError();
		}
	}
};
