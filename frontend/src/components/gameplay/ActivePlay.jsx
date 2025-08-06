import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import RPSenseAPI from "@/services/api";
import {
	selectGameMode,
	selectRounds,
	selectCurrentRound,
	updateScore,
	nextRound,
	resetGame,
	startGame,
} from "@/redux/slices/gameSlice";
import { selectCurrentPlayer, addMatch } from "@/redux/slices/gameDataSlice";

// Components
import GameHeader from "./components/GameHeader";
import PlayerCameraSection from "./components/PlayerCameraSection";
import ComputerSection from "./components/ComputerSection";
import DebugPanel from "./components/DebugPanel";
import NeonEffects from "./ui/NeonEffects";
import HiddenCanvas from "./ui/HiddenCanvas";
import CountdownOverlay from "./ui/CountdownOverlay";
import ResultOverlay from "./ui/ResultOverlay";

/**
 * ActivePlay Component - Main Game Interface
 *
 * This is the core gameplay component that handles:
 * - Real-time camera capture and video processing
 * - HTTP API communication with ML backend for frame processing
 * - Game state management (waiting, countdown, capturing, result, finished)
 * - Round progression and scoring
 * - Error handling and timeout management
 *
 * The component manages a complete game session from start to finish,
 * maintaining persistent camera connections and frame buffering.
 */

const ActivePlay = ({ navigateTo }) => {
	const dispatch = useDispatch();

	// Refs for DOM elements and persistent data across renders
	const videoRef = useRef(null); // Reference to HTML video element for camera display
	const canvasRef = useRef(null); // Hidden canvas for frame processing and image capture
	const apiRef = useRef(null); // API instance for HTTP communication
	const frameIntervalRef = useRef(null); // Timer for frame capture interval
	const resultReceivedRef = useRef(false); // Prevent duplicate final results
	const frameTimestampRef = useRef(0); // Monotonic timestamp counter for MediaPipe compatibility

	// Score tracking refs to ensure accurate final scores for saving
	const playerScoreRef = useRef(0);
	const computerScoreRef = useRef(0);
	const drawScoreRef = useRef(0);

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
	const [apiConnected, setApiConnected] = useState(false); // API connection status

	// Round progression state for tournament mode
	const [showNextRoundPrompt, setShowNextRoundPrompt] = useState(false); // Show "Next Round" UI
	const [nextRoundCountdown, setNextRoundCountdown] = useState(5); // 5-second countdown to next round
	const nextRoundTimeoutRef = useRef(null); // Ref to store the countdown interval for cleanup

	// Backend server URL (from environment variable or localhost fallback)
	const ML_SERVER =
		process.env.NEXT_PUBLIC_ML_SERVER || "http://localhost:5000";

	// Initialize API on component mount
	useEffect(() => {
		apiRef.current = new RPSenseAPI(ML_SERVER);
		checkAPIConnection();
	}, [ML_SERVER]);

	/**
	 * Check API connection status
	 */
	const checkAPIConnection = async () => {
		try {
			await apiRef.current.healthCheck();
			setApiConnected(true);
			console.log("✅ API connected successfully!");
		} catch (error) {
			setApiConnected(false);
			console.error("❌ API connection failed:", error);
		}
	};

	console.log(
		`🎮 Game Mode: ${gameMode} (${
			gameMode === "classic" ? "1 round" : `${rounds} rounds`
		})`
	);
	console.log(`🎯 Current Round: ${currentRound + 1}/${rounds}`);
	console.log(
		`📊 Current Scores - Player: ${playerScore}, Computer: ${computerScore}, Draws: ${drawScore}`
	);

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
	 * Captures frames and buffers them, then sends to backend via HTTP
	 * Includes timeout safety mechanisms and proper session management
	 */
	const startCapturing = () => {
		// Verify API connection before starting capture
		if (!apiRef.current || !apiConnected) {
			console.error("❌ API not connected, cannot start capturing");
			handleAPIError();
			return;
		}

		// Initialize capture session
		setGameState("capturing");
		setIsCapturing(true);
		resultReceivedRef.current = false;

		// Reset timestamp for monotonic sequence (MediaPipe requirement)
		frameTimestampRef.current = 1000; // Start from 1000 to avoid zero

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
				stopCapturing();
				processFrameBuffer();
			}
		}, 100); // 100ms interval = 10fps
	};

	/**
	 * Start the round sequence with countdown
	 * Initializes camera if needed, clears previous state, and begins countdown
	 * Automatically proceeds to frame capture after countdown completes
	 */
	const startRound = async () => {
		console.log(
			`🚀 Starting round ${
				currentRound + 1
			}/${rounds} in ${gameMode} mode`
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
					startCapturing(); // Begin frame capture when countdown ends
					return 0;
				}
				console.log(`⏰ Countdown: ${prev - 1}`);
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
		console.log(`🏆 Updating score - Winner: ${winner}`);

		if (winner === "player") {
			setPlayerScore((prev) => {
				const newScore = prev + 1;
				playerScoreRef.current = newScore; // Keep ref in sync
				return newScore;
			});
			dispatch(updateScore({ player: 1, computer: 0 }));
		} else if (winner === "computer") {
			setComputerScore((prev) => {
				const newScore = prev + 1;
				computerScoreRef.current = newScore; // Keep ref in sync
				return newScore;
			});
			dispatch(updateScore({ player: 0, computer: 1 }));
		} else if (winner === "draw") {
			setDrawScore((prev) => {
				const newScore = prev + 1;
				drawScoreRef.current = newScore; // Keep ref in sync
				return newScore;
			});
			// Draw doesn't update Redux game score, just local tracking
		}

		console.log(
			`📊 Current totals - Player: ${playerScoreRef.current}, Computer: ${computerScoreRef.current}, Draws: ${drawScoreRef.current}`
		);
	};

	/**
	 * Save completed match data to Redux store
	 * Records game statistics and performance metrics
	 * Used for player history and analytics tracking
	 */
	const saveMatchData = () => {
		// Use current ref values to ensure we have the latest scores
		const finalPlayerWins = playerScoreRef.current;
		const finalComputerWins = computerScoreRef.current;
		const finalDraws = drawScoreRef.current;

		const matchData = {
			playerName: currentPlayer?.name || "Guest", // Player identifier
			model: "MobileNetV2", // AI model used for predictions
			rounds: gameMode === "classic" ? 1 : rounds, // Total rounds played
			datetime: new Date().toISOString(), // Match completion timestamp
			playerWins: finalPlayerWins, // Player's win count
			computerWins: finalComputerWins, // Computer's win count
			draws: finalDraws, // Number of draw rounds
			streak: finalPlayerWins > finalComputerWins ? finalPlayerWins : 0, // Win streak calculation
			gameMode, // Game mode (classic/tournament)
		};

		console.log("💾 Saving match data to Redux store:", matchData);
		console.log(
			`📊 Final Score - Player: ${finalPlayerWins}, Computer: ${finalComputerWins}, Draws: ${finalDraws}`
		);
		console.log(
			`🏆 Winner: ${
				finalPlayerWins > finalComputerWins
					? "Player"
					: finalComputerWins > finalPlayerWins
					? "Computer"
					: "Draw"
			}`
		);

		// Add match to player's game history in Redux store
		dispatch(addMatch(matchData));
		console.log("✅ Match data saved successfully!");
	};

	/**
	 * Handle round completion and determine if game continues or ends
	 * Manages the transition between rounds and final game completion
	 * Handles resource cleanup when appropriate
	 *
	 * CLASSIC MODE: Always ends after 1 round
	 * TOURNAMENT MODE: Shows round progression UI with 5-second countdown and manual override
	 */
	const handleRoundCompletion = () => {
		const isClassicMode = gameMode === "classic";
		const roundJustCompleted = currentRound + 1; // The round we just completed (1-indexed)
		const isLastRound = roundJustCompleted >= rounds;

		console.log("🏁 Round completion check:");
		console.log(`   - Game Mode: ${gameMode}`);
		console.log(
			`   - Round just completed: ${roundJustCompleted}/${rounds}`
		);
		console.log(`   - Current Redux round: ${currentRound}`);
		console.log(`   - Is Classic Mode: ${isClassicMode}`);
		console.log(`   - Is Last Round: ${isLastRound}`);

		if (isClassicMode || isLastRound) {
			// Game completely finished - cleanup all resources
			console.log(
				"🎯 Game finished! Saving match data and cleaning up..."
			);

			// Immediately release camera resources to stop the flash/indicator
			if (cameraStream) {
				cameraStream.getTracks().forEach((track) => track.stop());
				setCameraStream(null); // Clear camera stream state
			}

			// Clear video element source immediately
			if (videoRef.current) {
				videoRef.current.srcObject = null;
			}

			setGameState("finished");
			saveMatchData(); // Save results to Redux/localStorage

			// Clear API buffer
			if (apiRef.current) {
				apiRef.current.clearBuffer();
			}
		} else {
			// More rounds to play - show round progression UI
			console.log("🔄 More rounds to play, showing round progression...");

			// Clear round-specific data but keep scores
			clearRoundState();

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

					// Increment round counter and proceed
					dispatch(nextRound());
					proceedToNextRound();
				}
			}, 1000);

			console.log(
				`⏱️ 5-second countdown started for round ${
					roundJustCompleted + 1
				}/${rounds}`
			);
		}
	};

	/**
	 * Proceed to the next round (either automatically after countdown or manually)
	 * Transitions game state to "waiting" for the next round to begin
	 */
	const proceedToNextRound = () => {
		console.log("➡️ Proceeding to next round...");

		// Clear any active countdown timer
		if (nextRoundTimeoutRef.current) {
			clearInterval(nextRoundTimeoutRef.current);
			nextRoundTimeoutRef.current = null;
		}

		// If called manually, we need to increment round counter
		if (showNextRoundPrompt) {
			dispatch(nextRound());
		}

		setShowNextRoundPrompt(false);
		setGameState("waiting");
	};

	/**
	 * Clear state between rounds while preserving session resources
	 * Resets UI state but keeps camera and API connections active
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

		// IMPORTANT: Keep camera and API connections active between rounds
		// This prevents reconnection delays and improves user experience
		// Timestamp will be reset at the start of next capture session

		console.log("🧹 Round state cleared (camera kept active)");
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
	 * Capture current video frame and add to buffer
	 * Converts video frame to base64 JPEG and includes metadata
	 * Uses monotonic timestamps to prevent MediaPipe processing errors
	 */
	const captureFrameToBuffer = () => {
		// Verify required resources are available (video, canvas, API)
		if (!videoRef.current || !canvasRef.current || !apiRef.current)
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
	 * Sends all captured frames to backend and handles response
	 */
	const processFrameBuffer = async () => {
		if (!apiRef.current || resultReceivedRef.current) return;

		try {
			console.log(`📤 Processing ${apiRef.current.getBufferSize()} frames via HTTP`);

			const gameData = {
				gameMode,
				totalRounds: rounds,
				currentRound: currentRound + 1,
				playerName: currentPlayer?.name || "Player",
			};

			const result = await apiRef.current.processFrames(gameData);
			
			if (resultReceivedRef.current) {
				console.log("⚠️ Duplicate result ignored");
				return;
			}

			resultReceivedRef.current = true;
			console.log("🎯 Final result:", result);

			// Process the result
			if (result.game_result) {
				setComputerChoice(getEmojiForChoice(result.game_result.computer_move));
				updateGameScore(result.game_result.winner);
			} else {
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
			handleAPIError();
		}
	};

	/**
	 * Handle API connection errors and continue game flow
	 * Provides fallback result when backend is unavailable
	 */
	const handleAPIError = () => {
		console.log("⚠️ Handling API error - providing fallback result");

		if (!resultReceivedRef.current) {
			resultReceivedRef.current = true;

			// Create error result that awards point to computer
			const errorResult = {
				status: "error",
				final_prediction: "error",
				confidence: 0.0,
				detected_hand: false,
				game_result: {
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
	 * Handle game exit and cleanup
	 * Stops all active processes and releases resources
	 * Navigates back to main menu or previous screen
	 */
	const handleExitGame = () => {
		console.log("🚪 Exiting game and cleaning up resources...");

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
	 * Reset all score tracking (both state and refs)
	 * Used when starting a new game or resetting current game
	 */
	const resetScores = () => {
		setPlayerScore(0);
		setComputerScore(0);
		setDrawScore(0);
		playerScoreRef.current = 0;
		computerScoreRef.current = 0;
		drawScoreRef.current = 0;
		console.log("🔄 All scores reset to 0");
	};

	/**
	 * Component initialization effect
	 * Sets up API connection on mount and cleans up on unmount
	 * Ensures proper resource management throughout component lifecycle
	 */
	useEffect(() => {
		// Initialize Redux game state and scores for new game
		dispatch(startGame()); // This resets Redux currentRound, scores, etc.
		resetScores(); // Reset local scores and refs

		// Cleanup function runs on component unmount
		return () => {
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
			{gameState === "waiting" && (
				<div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
					<div className="text-center">
						<h2 className="text-4xl font-bold text-white mb-4">
							{gameMode === "classic"
								? "Ready to Play?"
								: `Round ${currentRound + 1} of ${rounds}`}
						</h2>
						<button
							onClick={startRound}
							disabled={!apiConnected}
							className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold rounded-lg transition-all duration-300"
						>
							{apiConnected ? "Start Round" : "Connecting..."}
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

			{/* Round Progression UI (Tournament Mode) */}
			{showNextRoundPrompt && gameMode === "tournament" && (
				<div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
					<div className="text-center space-y-4">
						<h2 className="text-3xl font-bold text-white mb-2">
							Round {currentRound + 1} Complete!
						</h2>
						<p className="text-xl text-white/80 mb-4">
							Current Score: You {playerScore} - {computerScore}{" "}
							Computer
							{drawScore > 0 ? ` - ${drawScore} Draws` : ""}
						</p>
						<p className="text-lg text-cyan-400 mb-6">
							Next round starts in {nextRoundCountdown} seconds...
						</p>
						<button
							onClick={proceedToNextRound}
							className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white text-xl font-bold rounded-lg transition-all duration-300"
						>
							Start Round {currentRound + 2} Now
						</button>
					</div>
				</div>
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
				apiConnected={apiConnected}
			/>

			<NeonEffects />
		</div>
	);
};

export default ActivePlay;
