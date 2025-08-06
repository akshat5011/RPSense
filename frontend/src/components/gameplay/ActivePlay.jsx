import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import {
	selectGameMode,
	selectRounds,
	selectCurrentRound,
	updateScore,
	nextRound,
	resetGame,
} from "@/redux/slices/gameSlice";
import { selectCurrentPlayer, addMatch } from "@/redux/slices/gameDataSlice";

// Components
import GameHeader from "./GameHeader";
import PlayerCameraSection from "./PlayerCameraSection";
import ComputerSection from "./ComputerSection";
import DebugPanel from "./DebugPanel";
import NeonEffects from "./ui/NeonEffects";
import HiddenCanvas from "./ui/HiddenCanvas";
import CountdownOverlay from "./ui/CountdownOverlay";
import ResultOverlay from "./ui/ResultOverlay";
import NextRoundButton from "./ui/NextRoundButton";

/**
 * ActivePlay Component - Main Game Interface
 *
 * This is the core gameplay component that handles:
 * - Real-time camera capture and video processing
 * - WebSocket communication with ML backend
 * - Game state management (waiting, countdown, capturing, result, finished)
 * - Round progression and scoring
 * - Error handling and timeout management
 *
 * The component manages a complete game session from start to finish,
 * maintaining persistent camera and socket connections across multiple rounds.
 */

const ActivePlay = ({ navigateTo }) => {
	const dispatch = useDispatch();

	// Refs for DOM elements and persistent data across renders
	const videoRef = useRef(null); // Reference to HTML video element for camera display
	const canvasRef = useRef(null); // Hidden canvas for frame processing and image capture
	const socketRef = useRef(null); // WebSocket connection to ML backend
	const frameIntervalRef = useRef(null); // Timer for frame capture interval
	const resultReceivedRef = useRef(false); // Prevent duplicate final results from backend
	const frameTimestampRef = useRef(0); // Monotonic timestamp counter for MediaPipe compatibility

	// Redux state - Game configuration and round management
	const gameMode = useSelector(selectGameMode); // "classic" or "tournament"
	const rounds = useSelector(selectRounds); // Total number of rounds (1, 3, 5, 7, 9, 11, 13, 15)
	const currentRound = useSelector(selectCurrentRound); // Zero-indexed current round
	const currentPlayer = useSelector(selectCurrentPlayer); // Player information object

	// Local component state for UI and game flow
	const [cameraStream, setCameraStream] = useState(null); // MediaStream from getUserMedia
	const [gameState, setGameState] = useState("waiting"); // Game flow: waiting → countdown → capturing → result → finished
	const [countdown, setCountdown] = useState(3); // 3-second countdown before capture
	const [computerChoice, setComputerChoice] = useState("🤖"); // Emoji representation of computer's move
	const [playerScore, setPlayerScore] = useState(0); // Player's wins in current game
	const [computerScore, setComputerScore] = useState(0); // Computer's wins in current game
	const [drawScore, setDrawScore] = useState(0); // Number of draws in current game
	const [isCapturing, setIsCapturing] = useState(false); // Whether currently capturing frames

	// ML Processing Results from backend
	const [realtimeResult, setRealtimeResult] = useState(null); // Live prediction during capture
	const [finalResult, setFinalResult] = useState(null); // Final aggregated result after processing
	const [overlayImage, setOverlayImage] = useState(null); // Processed image with hand detection overlay
	const [socketConnected, setSocketConnected] = useState(false); // WebSocket connection status

	// Backend server URL (from environment variable or localhost fallback)
	const ML_SERVER =
		process.env.NEXT_PUBLIC_ML_SERVER || "http://localhost:5000";

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
	 * Update game scores based on round result
	 * Handles player wins, computer wins, and draws
	 * Updates both local state and Redux store for persistence
	 */
	const updateGameScore = (winner) => {
		if (winner === "player") {
			setPlayerScore((prev) => prev + 1);
			dispatch(updateScore({ player: 1, computer: 0 }));
		} else if (winner === "computer") {
			setComputerScore((prev) => prev + 1);
			dispatch(updateScore({ player: 0, computer: 1 }));
		} else if (winner === "draw") {
			setDrawScore((prev) => prev + 1);
			// Draw doesn't update Redux game score, just local tracking
		}
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

	/**
	 * Initialize WebSocket connection to ML backend
	 * Sets up event listeners for all game-related socket events
	 * Includes special configuration for ngrok tunneling and transport fallbacks
	 */
	const initSocket = () => {
		// Disconnect any existing connection before creating new one
		if (socketRef.current) {
			socketRef.current.disconnect();
		}

		console.log("🔍 Connecting to:", ML_SERVER);

		// Create Socket.IO connection with comprehensive configuration
		socketRef.current = io(ML_SERVER, {
			// Transport strategy: Try WebSocket first, fallback to HTTP polling
			transports: ["websocket", "polling"],

			// Connection reliability options
			forceNew: true, // Always create a fresh connection
			upgrade: true, // Allow transport upgrades
			autoConnect: true, // Connect immediately
			reconnection: true, // Enable automatic reconnection
			timeout: 20000, // 20 second connection timeout

			// Special headers for ngrok tunnel compatibility
			extraHeaders: {
				"ngrok-skip-browser-warning": "true",
				Origin: window.location.origin,
			},

			// Transport-specific configuration for ngrok
			transportOptions: {
				polling: {
					extraHeaders: {
						"ngrok-skip-browser-warning": "true",
						Origin: window.location.origin,
					},
				},
				websocket: {
					extraHeaders: {
						"ngrok-skip-browser-warning": "true",
					},
				},
			},

			// Disable features that can cause issues with ngrok
			rememberUpgrade: false,
			timestampRequests: false,
		});

		// === Socket Event Handlers ===

		// Connection successful - log details and update UI
		socketRef.current.on("connect", () => {
			console.log("✅ Socket connected successfully!");
			console.log(
				"✅ Transport:",
				socketRef.current.io.engine.transport.name
			);
			console.log("✅ Socket ID:", socketRef.current.id);
			setSocketConnected(true);
		});

		// Connection lost - handle graceful reconnection
		socketRef.current.on("disconnect", (reason) => {
			console.log("🔌 Socket disconnected:", reason);
			setSocketConnected(false);

			// Attempt reconnection for server-side disconnections
			if (
				reason === "io server disconnect" ||
				reason === "ping timeout"
			) {
				console.log("🔄 Attempting to reconnect...");
				setTimeout(() => {
					if (socketRef.current) {
						socketRef.current.connect();
					}
				}, 2000);
			}
		});

		// Connection error - try transport fallback and handle capture failures
		socketRef.current.on("connect_error", (error) => {
			console.error("❌ Connection error:", error.message);
			setSocketConnected(false);

			// Switch to polling if WebSocket fails
			if (error.type === "TransportError") {
				console.log("🔄 Switching to polling transport...");
				socketRef.current.io.opts.transports = ["polling"];
			}
		});

		// === Game-Specific Event Handlers ===

		// Initial connection confirmation from server
		socketRef.current.on("connected", (data) => {
			console.log("✅ Connected to ML server:", data);
		});

		// Real-time predictions during frame capture (sent for each frame)
		socketRef.current.on("real_time_result", (data) => {
			console.log("📊 Real-time result:", data);

			// Only process if we haven't received final result yet
			if (!resultReceivedRef.current) {
				setRealtimeResult(data);

				// Display processed image with hand detection overlay
				if (data.overlay_image) {
					setOverlayImage(data.overlay_image);
				}
			}
		});

		// Final aggregated result after processing all frames
		socketRef.current.on("final_result", (data) => {
			console.log("🎯 Final result:", data);

			// Prevent duplicate final results from race conditions
			if (resultReceivedRef.current) {
				console.log("⚠️ Duplicate final result ignored");
				return;
			}

			resultReceivedRef.current = true;
			setFinalResult(data);

			// Stop frame capture immediately
			stopCapturing();

			// Update UI with computer's choice and game scores
			if (data.game_result) {
				setComputerChoice(
					getEmojiForChoice(data.game_result.computer_move)
				);
				updateGameScore(data.game_result.winner);
			}

			// Show result overlay and proceed to next round after delay
			setGameState("result");
			setTimeout(() => {
				handleRoundCompletion();
			}, 3000);
		});

		// Game session started confirmation
		socketRef.current.on("game_started", (data) => {
			console.log("🎮 Game started:", data);
		});

		// Generic error handling from server
		socketRef.current.on("error", (data) => {
			console.error("❌ Socket error:", data);

			// Force result if we're in the middle of capturing
			if (isCapturing && !resultReceivedRef.current) {
				console.log("🔄 Forcing result due to socket error");
				handleSocketError();
			}
		});

		// Additional connection error handling with transport fallback
		socketRef.current.on("connect_error", (error) => {
			console.error("❌ Connection error:", error.message);
			setSocketConnected(false);

			// Handle capture failures during connection errors
			if (isCapturing && !resultReceivedRef.current) {
				handleSocketError();
			}

			// Try switching to more reliable polling transport
			if (error.type === "TransportError") {
				console.log("🔄 Switching to polling transport...");
				socketRef.current.io.opts.transports = ["polling"];
			}
		});
	};

	/**
	 * Stop frame capture process
	 * Clears the capture interval timer and updates UI state
	 */
	const stopCapturing = () => {
		if (frameIntervalRef.current) {
			clearInterval(frameIntervalRef.current);
			frameIntervalRef.current = null;
		}
		setIsCapturing(false);
		console.log("🛑 Stopped capturing frames");
	};

	/**
	 * Handle socket errors and connection failures during gameplay
	 * Creates a default result where computer wins and proceeds with game flow
	 * Ensures game doesn't get stuck even when technical issues occur
	 */
	const handleSocketError = () => {
		stopCapturing();

		if (!resultReceivedRef.current) {
			resultReceivedRef.current = true;

			// Create error result where computer wins by default
			const errorResult = {
				status: "error",
				final_prediction: "error",
				confidence: 0.0,
				message: "Connection error - Computer wins",
				game_result: {
					computer_move: "rock",
					player_move: "error",
					winner: "computer",
					valid_move: false,
					reason: "Connection error",
				},
			};

			// Update UI and continue game flow
			setFinalResult(errorResult);
			setComputerChoice("🗿");
			updateGameScore("computer");

			setGameState("result");
			setTimeout(() => {
				handleRoundCompletion();
			}, 3000);
		}
	};

	/**
	 * Capture current video frame and send to backend via WebSocket
	 * Converts video frame to base64 JPEG and includes game metadata
	 * Uses monotonic timestamps to prevent MediaPipe processing errors
	 */
	const sendFrameToSocket = () => {
		// Verify required resources are available (video, canvas, socket)
		if (!videoRef.current || !canvasRef.current || !socketRef.current)
			return;

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
	 * Convert choice string to corresponding emoji
	 * Maps game choices to their visual representations
	 * Used for displaying player and computer moves
	 */
	const getEmojiForChoice = (choice) => {
		const choices = {
			rock: "🗿",
			paper: "📄",
			scissors: "✂️",
		};
		return choices[choice] || "🤖";
	};

	/**
	 * Handle progression to next round
	 * Resets round state and prepares for next game
	 * Used in tournament mode between rounds
	 */
	const handleNextRound = () => {
		clearRoundState(); // Reset all round-specific state
		setGameState("waiting"); // Return to waiting state for next round
	};

	/**
	 * Handle game exit and cleanup
	 * Stops all active processes and releases resources
	 * Navigates back to main menu or previous screen
	 */
	const handleExitGame = () => {
		// Stop any active frame capturing
		stopCapturing();

		// Release camera resources if active
		if (cameraStream) {
			cameraStream.getTracks().forEach((track) => track.stop());
		}

		// Clean up WebSocket connection
		if (socketRef.current) {
			socketRef.current.emit("stop_game"); // Notify backend of game termination
			socketRef.current.disconnect(); // Close connection
			socketRef.current = null; // Clear reference
		}

		// Reset game state in Redux store
		dispatch(resetGame());
		// Navigate back to main menu
		navigateTo("menu");
	};

	/**
	 * Component initialization effect
	 * Sets up socket connection on mount and cleans up on unmount
	 * Ensures proper resource management throughout component lifecycle
	 */
	useEffect(() => {
		initSocket(); // Initialize WebSocket connection

		// Cleanup function runs on component unmount
		return () => {
			stopCapturing(); // Stop any active frame capture

			// Release camera resources
			if (cameraStream) {
				cameraStream.getTracks().forEach((track) => track.stop());
			}

			// Disconnect WebSocket
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, []);

	// Handle game completion
	useEffect(() => {
		if (gameState === "finished") {
			setTimeout(() => {
				navigateTo("scores");
			}, 4000);
		}
	}, [gameState]);

	return (
		<div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 overflow-hidden relative">
			<GameHeader
				navigateTo={handleExitGame}
				gameInfo={{
					gameMode,
					totalRounds: rounds,
					currentRound: currentRound + 1,
					playerScore,
					computerScore,
					drawScore,
				}}
				gameMode={gameMode}
			/>

			<div className="grid grid-cols-2 gap-8 px-8 h-[calc(100vh-120px)]">
				<PlayerCameraSection
					videoRef={videoRef}
					cameraStream={cameraStream}
					isCapturing={isCapturing} // Use local state instead of gameState
					overlayImage={overlayImage}
					realtimeResult={realtimeResult}
				/>

				<ComputerSection
					computerChoice={computerChoice}
					finalResult={finalResult}
				/>
			</div>

			<HiddenCanvas canvasRef={canvasRef} />

			{/* Game State Overlays */}
			{gameState === "waiting" &&
				(currentRound < rounds || gameMode === "classic") && (
					<div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
						<div className="text-center">
							<h2 className="text-4xl font-bold text-white mb-4">
								{gameMode === "classic"
									? "Ready to Play?"
									: `Round ${currentRound + 1} of ${rounds}`}
							</h2>
							<button
								onClick={startRound}
								disabled={!socketConnected}
								className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold rounded-lg transition-all duration-300"
							>
								{socketConnected
									? "Start Round"
									: "Connecting..."}
							</button>
						</div>
					</div>
				)}

			{gameState === "countdown" && (
				<CountdownOverlay countdown={countdown} />
			)}

			{gameState === "result" && finalResult && (
				<ResultOverlay
					finalResult={finalResult}
					playerScore={playerScore}
					computerScore={computerScore}
				/>
			)}

			{gameState === "waiting" &&
				currentRound < rounds - 1 &&
				gameMode !== "classic" && (
					<NextRoundButton onClick={handleNextRound} />
				)}

			{gameState === "finished" && (
				<div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
					<div className="text-center">
						<h2 className="text-4xl font-bold text-white mb-4">
							Game Complete!
						</h2>
						<p className="text-xl text-white mb-4">
							Final Score: You {playerScore} - {computerScore}{" "}
							Computer{" "}
							{drawScore > 0 ? `- ${drawScore} Draws` : ""}
						</p>
						<p className="text-lg text-cyan-400">
							Redirecting to results...
						</p>
					</div>
				</div>
			)}

			<DebugPanel
				mlServer={ML_SERVER}
				isCapturing={isCapturing}
				cameraStream={cameraStream}
				gameState={gameState}
				socketConnected={socketConnected}
			/>

			<NeonEffects />
		</div>
	);
};

export default ActivePlay;
