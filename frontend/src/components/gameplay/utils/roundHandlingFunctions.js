/**
 * Initialize camera stream from user's webcam
 * Requests video permissions and sets up MediaStream
 * Uses specific resolution and front-facing camera when possible
 */
const initCamera = async () => {
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
 * Captures 20 frames over 2 seconds (10fps) and sends them to backend
 * Includes timeout safety mechanisms and proper session management
 */
const startCapturing = () => {
	// Verify socket connection before starting capture
	if (!socketRef.current || !socketRef.current.connected) {
		console.error("❌ Socket not connected, cannot start capturing");
		handleSocketError();
		return;
	}

	// Initialize capture session
	setGameState("capturing");
	setIsCapturing(true);
	resultReceivedRef.current = false;

	// Reset timestamp for monotonic sequence (MediaPipe requirement)
	frameTimestampRef.current = 1000; // Start from 1000 to avoid zero

	// Notify backend that new game session is starting
	socketRef.current.emit("start_game", {
		gameMode,
		totalRounds: rounds,
		currentRound: currentRound + 1,
		playerName: currentPlayer?.name || "Player",
	});

	let frameCount = 0;
	const maxFrames = 20; // Capture exactly 20 frames (2 seconds at 10fps)

	// Frame capture loop - runs every 100ms for 10fps rate
	frameIntervalRef.current = setInterval(() => {
		if (frameCount < maxFrames && !resultReceivedRef.current) {
			sendFrameToSocket(); // Send current frame to backend
			frameCount++;
		} else {
			// Capture complete - stop and notify backend
			stopCapturing();

			// Tell backend we're finished sending frames
			if (socketRef.current && !resultReceivedRef.current) {
				socketRef.current.emit("capture_complete", {
					totalFrames: frameCount,
					timestamp: Date.now(),
				});
				console.log(
					`📤 Notified backend: capture complete (${frameCount} frames)`
				);

				// Safety timeout - force result if backend doesn't respond within 8 seconds
				setTimeout(() => {
					if (!resultReceivedRef.current) {
						console.log(
							"⚠️ No result received within 8s, forcing default result"
						);
						handleSocketError();
					}
				}, 8000);
			}
		}
	}, 100); // 100ms interval = 10fps
};

/**
 * Start the round sequence with countdown
 * Initializes camera if needed, clears previous state, and begins countdown
 * Automatically proceeds to frame capture after countdown completes
 */
const startRound = async () => {
	// Initialize camera only if not already available or not working
	if (!cameraStream || !videoRef.current?.srcObject) {
		console.log("🎥 Initializing camera for round...");
		await initCamera();
	} else {
		console.log("🎥 Camera already active, reusing connection");
	}

	// Prepare for new round
	clearRoundState();
	setGameState("countdown");
	setCountdown(3);

	// 3-second countdown timer
	const countdownTimer = setInterval(() => {
		setCountdown((prev) => {
			if (prev <= 1) {
				clearInterval(countdownTimer);
				startCapturing(); // Begin frame capture when countdown ends
				return 0;
			}
			return prev - 1;
		});
	}, 1000);
};

/**
 * Capture current video frame and send to backend via WebSocket
 * Converts video frame to base64 JPEG and includes game metadata
 * Uses monotonic timestamps to prevent MediaPipe processing errors
 */
const sendFrameToSocket = () => {
	// Verify required resources are available (video, canvas, socket)
	if (!videoRef.current || !canvasRef.current || !socketRef.current) return;

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
	// Increment by 1000 microseconds to ensure each frame has unique, increasing timestamp
	frameTimestampRef.current += 1000;

	// Send frame data and game context to backend via WebSocket
	socketRef.current.emit("frame_data", {
		frame: frameBase64, // Base64 encoded JPEG image
		gameData: {
			gameMode, // Current game mode (classic/tournament)
			totalRounds: rounds, // Total rounds for this game
			currentRound: currentRound + 1, // Current round number (1-indexed)
			playerScore, // Current player score
			computerScore, // Current computer score
			timestamp: frameTimestampRef.current, // Monotonic timestamp for MediaPipe
			frameId: Math.random().toString(36).substr(2, 9), // Unique frame identifier
		},
	});
};

/**
 * Save completed match data to Redux store
 * Records game statistics and performance metrics
 * Used for player history and analytics tracking
 */
const saveMatchData = () => {
	const matchData = {
		playerName: currentPlayer?.name || "Guest", // Player identifier
		model: "AI", // Opponent type (always AI)
		rounds: gameMode === "classic" ? 1 : rounds, // Total rounds played
		datetime: new Date().toISOString(), // Match completion timestamp
		playerWins: playerScore, // Player's win count
		computerWins: computerScore, // Computer's win count
		draws: drawScore, // Number of draw rounds
		streak: playerScore > computerScore ? playerScore : 0, // Win streak calculation
		gameMode, // Game mode (classic/tournament)
	};

	// Add match to player's game history in Redux store
	dispatch(addMatch(matchData));
};

/**
 * Handle round completion and determine if game continues or ends
 * Manages the transition between rounds and final game completion
 * Handles resource cleanup when appropriate
 */
const handleRoundCompletion = () => {
	const isClassicMode = gameMode === "classic";
	const isLastRound = currentRound >= rounds - 1;

	if (isClassicMode || isLastRound) {
		// Game completely finished - cleanup all resources
		setGameState("finished");
		saveMatchData(); // Save results to Redux/localStorage

		// Disconnect socket and stop camera only when game is completely done
		if (socketRef.current) {
			socketRef.current.emit("stop_game");
			socketRef.current.disconnect();
			socketRef.current = null;
		}

		// Release camera resources
		if (cameraStream) {
			cameraStream.getTracks().forEach((track) => track.stop());
			setCameraStream(null);
		}
	} else {
		// More rounds to play - keep socket and camera active for performance
		dispatch(nextRound()); // Increment round counter in Redux
		setGameState("waiting"); // Return to waiting for next round
		clearRoundState(); // Clear round-specific data
	}
};

/**
 * Clear state between rounds while preserving session resources
 * Resets UI state but keeps camera and socket connections active
 * This approach improves performance and user experience
 */
const clearRoundState = () => {
	// Reset UI state for next round
	setRealtimeResult(null);
	setFinalResult(null);
	setOverlayImage(null);
	setComputerChoice("🤖");
	resultReceivedRef.current = false;
	setIsCapturing(false);

	// IMPORTANT: Keep camera and socket connections active between rounds
	// This prevents reconnection delays and improves user experience
	// Timestamp will be reset at the start of next capture session

	console.log("🧹 Round state cleared (camera kept active)");
};

