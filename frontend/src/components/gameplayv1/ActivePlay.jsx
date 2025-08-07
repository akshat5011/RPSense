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

// Utility functions
import { 
	initCamera as initCameraUtil,
	startCapturing as startCapturingUtil,
	stopCapturing,
	captureFrameToBuffer as captureFrameToBufferUtil
} from "@/components/gameplayv1/utils/frameProcessor";
import { 
	updateGameScore as updateGameScoreUtil,
	saveMatchData as saveMatchDataUtil,
	getEmojiForChoice,
	resetScores as resetScoresUtil
} from "@/components/gameplayv1/utils/gameLogic";
import { 
	clearRoundState as clearRoundStateUtil,
	clearRoundStateForNextRound as clearRoundStateForNextRoundUtil,
	handleExitGame as handleExitGameUtil,
	componentCleanup
} from "@/components/gameplayv1/utils/stateCleanup";
import { 
	startRound as startRoundUtil,
	checkAPIConnection as checkAPIConnectionUtil
} from "@/components/gameplayv1/utils/roundManager";

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
		await checkAPIConnectionUtil(apiRef, setApiConnected);
	};

	console.log(
		`🎮 Game Mode: ${gameMode} (${
			gameMode === "classic" ? "1 round" : `${rounds} rounds`
		})`
	);
	console.log(`🎯 Current Round: ${currentRound + 1}/${rounds} (0-indexed: ${currentRound})`);
	console.log(
		`📊 Current Scores - Player: ${playerScore}, Computer: ${computerScore}, Draws: ${drawScore}`
	);
	console.log(`🎛️ Game State: ${gameState}`);
	console.log(`🔄 Is Capturing: ${isCapturing}`);

	/**
	 * Initialize camera stream from user's webcam
	 */
	const initCamera = async () => {
		await initCameraUtil(setCameraStream, videoRef);
	};

	/**
	 * Start capturing frames for ML processing
	 */
	const startCapturing = () => {
		const captureConfig = { apiConnected, isCapturing };
		const refs = { apiRef, frameIntervalRef, resultReceivedRef, frameTimestampRef };
		const stateSetters = { setGameState, setIsCapturing };
		
		startCapturingUtil(
			captureConfig, 
			refs, 
			stateSetters, 
			captureFrameToBuffer, 
			processFrameBuffer, 
			handleAPIError
		);
	};

	/**
	 * Start the round sequence with countdown
	 */
	const startRound = async () => {
		console.log("🚀 ===== STARTING ROUND =====");
		console.log(`   - Current Round: ${currentRound + 1}/${rounds}`);
		console.log(`   - Game Mode: ${gameMode}`);
		console.log("🚀 ============================");
		
		const roundConfig = { gameState, gameMode, currentRound, rounds };
		const resources = { cameraStream, videoRef };
		const stateSetters = { setGameState, setCountdown };
		
		await startRoundUtil(
			roundConfig, 
			resources, 
			stateSetters, 
			initCamera, 
			clearRoundState
		);
		
		console.log("🔄 Round initialization complete - countdown started");
	};

	/**
	 * Update game scores based on round result
	 */
	const updateGameScore = (winner) => {
		const scoreRefs = { playerScoreRef, computerScoreRef, drawScoreRef };
		const scoreSetters = { setPlayerScore, setComputerScore, setDrawScore };
		updateGameScoreUtil(winner, scoreRefs, scoreSetters, dispatch, updateScore);
	};

	/**
	 * Save completed match data to Redux store
	 */
	const saveMatchData = () => {
		const matchContext = { gameMode, rounds, currentPlayer };
		const scoreRefs = { playerScoreRef, computerScoreRef, drawScoreRef };
		saveMatchDataUtil(matchContext, scoreRefs, dispatch, addMatch);
	};

	/**
	 * Handle round completion and determine if game continues or ends
	 */
	const handleRoundCompletion = () => {
		// Use Redux currentRound as the source of truth for round counting
		const currentReduxRound = currentRound; // Zero-indexed
		const roundsCompleted = currentReduxRound + 1; // 1-indexed for display
		const isClassicMode = gameMode === "classic";
		const isLastRound = roundsCompleted >= rounds;

		console.log("🏁 ===== ROUND COMPLETION CHECK =====");
		console.log(`   - Game Mode: ${gameMode}`);
		console.log(`   - Redux current round (0-indexed): ${currentReduxRound}`);
		console.log(`   - Total rounds configured: ${rounds}`);
		console.log(`   - Rounds completed: ${roundsCompleted}/${rounds}`);
		console.log(`   - Is Classic Mode: ${isClassicMode}`);
		console.log(`   - Is Last Round: ${isLastRound}`);
		console.log(`   - Player Score: ${playerScore}`);
		console.log(`   - Computer Score: ${computerScore}`);
		console.log("🏁 ================================");

		if (isClassicMode || isLastRound) {
			// Game completely finished
			console.log("🎯 GAME FINISHED! Saving match data and cleaning up...");
			handleGameCompletion();
		} else {
			// More rounds to play in tournament mode
			console.log("🔄 TOURNAMENT ROUND COMPLETED, more rounds to play...");
			handleTournamentRoundTransition();
		}
	};

	/**
	 * Handle complete game finish (classic mode or last tournament round)
	 */
	const handleGameCompletion = () => {
		console.log("🏁 ===== GAME COMPLETION =====");
		console.log("   - Stopping camera resources immediately");
		
		// Immediately release camera resources to stop the flash/indicator
		if (cameraStream) {
			cameraStream.getTracks().forEach((track) => {
				console.log(`   - Stopping camera track: ${track.kind} - ${track.label}`);
				track.stop();
			});
			setCameraStream(null);
			console.log("   - Camera stream cleared");
		}

		// Clear video element source immediately
		if (videoRef.current) {
			videoRef.current.srcObject = null;
			console.log("   - Video element source cleared");
		}

		console.log("   - Setting gameState to 'finished'");
		setGameState("finished");
		saveMatchData();

		// Clear API buffer
		if (apiRef.current) {
			apiRef.current.clearBuffer();
			console.log("   - API buffer cleared");
		}
		console.log("🏁 ========================");
	};

	/**
	 * Handle tournament round transition (more rounds to play)
	 */
	const handleTournamentRoundTransition = () => {
		console.log("🔄 ===== TOURNAMENT ROUND TRANSITION =====");
		console.log(`   - Current Redux Round: ${currentRound}`);
		console.log(`   - Total Rounds: ${rounds}`);
		console.log(`   - Next Round Will Be: ${currentRound + 2} (after nextRound() dispatch)`);
		console.log("🔄 ======================================");

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
	 */
	const proceedToNextRoundAutomatically = () => {
		console.log("🚀 ===== AUTO-PROCEEDING TO NEXT ROUND =====");
		console.log(`   - Current Redux Round (before nextRound): ${currentRound}`);
		console.log(`   - Total Rounds: ${rounds}`);
		
		setShowNextRoundPrompt(false);

		// CRITICAL: Check if we've reached the round limit BEFORE dispatching nextRound()
		if (currentRound + 1 >= rounds) {
			console.log("   - ⚠️ ROUND LIMIT REACHED! All rounds completed. Finishing game instead.");
			console.log(`   - Final scores - Player: ${playerScoreRef.current}, Computer: ${computerScoreRef.current}, Draws: ${drawScoreRef.current}`);
			console.log("🚀 =========================================");
			// Redirect to game completion instead of proceeding
			handleGameCompletion();
			return;
		}

		console.log(`   - ✅ More rounds available. Proceeding to round ${currentRound + 2}`);

		// Only increment Redux round counter if we have more rounds to play
		dispatch(nextRound());

		// Get the updated round number from Redux
		const nextReduxRound = currentRound + 1; // Will be the next round number (0-indexed)
		
		console.log(`   - Redux Round After Dispatch: ${nextReduxRound}`);
		console.log(`   - Starting round ${nextReduxRound + 1} (Redux index: ${nextReduxRound})`);
		console.log("🚀 =========================================");

		// Reset round state for the new round
		setGameState("waiting");
		clearRoundStateForNextRound();
	};

	/**
	 * Proceed to the next round manually (user clicked button)
	 */
	const proceedToNextRoundManually = () => {
		console.log("🚀 ===== MANUAL ROUND PROGRESSION =====");
		console.log(`   - Current Redux Round (before nextRound): ${currentRound}`);
		console.log(`   - Total Rounds: ${rounds}`);
		
		// Clear the automatic countdown if user proceeds manually
		if (nextRoundTimeoutRef.current) {
			clearInterval(nextRoundTimeoutRef.current);
			nextRoundTimeoutRef.current = null;
		}

		setShowNextRoundPrompt(false);

		// CRITICAL: Check if we've reached the round limit BEFORE dispatching nextRound()
		if (currentRound + 1 >= rounds) {
			console.log("   - ⚠️ ROUND LIMIT REACHED! All rounds completed. Finishing game instead.");
			console.log(`   - Final scores - Player: ${playerScoreRef.current}, Computer: ${computerScoreRef.current}, Draws: ${drawScoreRef.current}`);
			console.log("🚀 =========================================");
			// Redirect to game completion instead of proceeding
			handleGameCompletion();
			return;
		}

		console.log(`   - ✅ More rounds available. Proceeding to round ${currentRound + 2}`);

		// Only increment Redux round counter if we have more rounds to play
		dispatch(nextRound());

		// Get the updated round number from Redux
		const nextReduxRound = currentRound + 1; // Will be the next round number (0-indexed)
		
		console.log(`   - Redux Round After Dispatch: ${nextReduxRound}`);
		console.log(`   - Starting round ${nextReduxRound + 1} immediately with countdown`);
		console.log("🚀 =========================================");

		// Clear round state and immediately start countdown (bypass waiting state)
		clearRoundStateForNextRound();
		console.log("🔄 Setting gameState to 'countdown' - bypassing waiting state");
		setGameState("countdown");
		setCountdown(3);

		// Start countdown timer manually for immediate progression
		let countdownValue = 3;
		const manualCountdownTimer = setInterval(() => {
			countdownValue -= 1;
			console.log(`⏰ Manual countdown: ${countdownValue}`);
			setCountdown(countdownValue);

			if (countdownValue <= 0) {
				clearInterval(manualCountdownTimer);
				console.log("⏰ Manual countdown complete! Capture will start via useEffect");
			}
		}, 1000);
	};

	/**
	 * Legacy function for backward compatibility
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
	 */
	const clearRoundState = () => {
		const stateSetters = { 
			setRealtimeResult, 
			setFinalResult, 
			setOverlayImage, 
			setComputerChoice, 
			setIsCapturing 
		};
		const refs = { apiRef, resultReceivedRef };
		const stopCapturingFn = () => stopCapturing(frameIntervalRef, setIsCapturing);
		
		clearRoundStateUtil(stateSetters, refs, stopCapturingFn);
	};

	/**
	 * Clear round state specifically for tournament mode round transitions
	 */
	const clearRoundStateForNextRound = () => {
		const stateSetters = { 
			setRealtimeResult, 
			setFinalResult, 
			setOverlayImage, 
			setComputerChoice, 
			setIsCapturing
			// Removed setGameState - we manage it in main component now
		};
		const refs = { apiRef, resultReceivedRef, frameTimestampRef, frameIntervalRef };
		const stopCapturingFn = () => stopCapturing(frameIntervalRef, setIsCapturing);
		
		clearRoundStateForNextRoundUtil(stateSetters, refs, stopCapturingFn);
	};

	/**
	 * Capture current video frame and add to buffer
	 */
	const captureFrameToBuffer = () => {
		const refs = { videoRef, canvasRef, apiRef, frameTimestampRef };
		const gameContext = { gameMode, rounds, currentRound, playerScore, computerScore };
		captureFrameToBufferUtil(refs, gameContext);
	};

	/**
	 * Process buffered frames via HTTP API
	 */
	const processFrameBuffer = async () => {
		if (!apiRef.current || resultReceivedRef.current) {
			console.log("⚠️ API not available or result already received");
			return;
		}

		// Set state to waitingForResult to show processing indicator
		console.log("🔄 Setting gameState to 'waitingForResult' - API processing started");
		setGameState("waitingForResult");

		// Set a timeout for API processing to prevent infinite waiting
		const apiTimeout = setTimeout(() => {
			if (!resultReceivedRef.current) {
				console.log("⏰ API processing timeout - using fallback result");
				handleAPIError();
			}
		}, 10000); // 10 second timeout

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
				currentRound: currentRound + 1, // Send 1-indexed round number
				playerName: currentPlayer?.name || "Player",
			};

			const result = await apiRef.current.processFrames(gameData);
			
			// Double-check result hasn't been received already
			if (resultReceivedRef.current) {
				console.log("⚠️ Duplicate result ignored - already processed");
				return;
			}

			resultReceivedRef.current = true;
			clearTimeout(apiTimeout); // Clear the timeout since we got a result
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
			console.log("🎯 API processing complete - setting gameState to 'result'");
			setGameState("result");

			// Show result overlay and proceed to next round after delay
			setTimeout(() => {
				handleRoundCompletion();
			}, 3000);

		} catch (error) {
			clearTimeout(apiTimeout); // Clear timeout on error
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

	/**
	 * Handle API connection errors and continue game flow
	 */
	const handleAPIError = () => {
		console.log("❌ API Error - using fallback result");
		
		// Don't process if we already got a result
		if (resultReceivedRef.current) {
			console.log("⚠️ Result already received, ignoring API error");
			return;
		}
		
		resultReceivedRef.current = true;
		
		// Set fallback computer choice and result
		setFinalResult({ 
			game_result: { 
				computer_move: "rock", 
				winner: "computer",
				error: "API timeout" 
			} 
		});
		setComputerChoice("🗿");
		updateGameScore("computer");
		console.log("❌ API Error fallback - setting gameState to 'result'");
		setGameState("result");

		// Show result overlay and proceed after delay
		setTimeout(() => {
			handleRoundCompletion();
		}, 3000);
	};

	/**
	 * Handle game exit and cleanup
	 */
	const handleExitGame = () => {
		const resources = { cameraStream, setCameraStream, videoRef, apiRef };
		const stopCapturingFn = () => stopCapturing(frameIntervalRef, setIsCapturing);
		handleExitGameUtil(resources, stopCapturingFn, dispatch, resetGame, navigateTo);
	};

	/**
	 * Reset all score tracking (both state and refs)
	 */
	const resetScores = () => {
		const scoreSetters = { setPlayerScore, setComputerScore, setDrawScore };
		const scoreRefs = { playerScoreRef, computerScoreRef, drawScoreRef };
		resetScoresUtil(scoreSetters, scoreRefs);
	};

	/**
	 * Component initialization effect
	 */
	useEffect(() => {
		// Initialize Redux game state and scores for new game
		dispatch(startGame()); // This resets Redux currentRound, scores, etc.
		resetScores(); // Reset local scores and refs

		// Cleanup function runs on component unmount
		return () => {
			const resources = { cameraStream, videoRef };
			const refs = { nextRoundTimeoutRef, apiRef };
			const stopCapturingFn = () => stopCapturing(frameIntervalRef, setIsCapturing);
			
			componentCleanup(resources, refs, stopCapturingFn);
		};
	}, []);

	// Handle game completion
	useEffect(() => {
		if (gameState === "finished") {
			console.log("🏁 Game finished state detected - navigating to scores in 4 seconds");
			setTimeout(() => {
				console.log("🚀 Navigating to scores page");
				navigateTo("scores");
			}, 4000);
		}
	}, [gameState]);

	// Handle countdown completion and start frame capture
	useEffect(() => {
		if (gameState === "countdown" && countdown === 0) {
			console.log("⏰ ===== COUNTDOWN COMPLETION =====");
			console.log("   - Countdown reached 0");
			console.log("   - Transitioning from 'countdown' to 'capturing'");
			console.log("   - Starting frame capture...");
			console.log("⏰ =================================");
			setGameState("capturing");
			startCapturing();
		}
	}, [gameState, countdown]);

	// Log all game state transitions
	useEffect(() => {
		console.log(`🎛️ ===== GAME STATE TRANSITION =====`);
		console.log(`   - New State: ${gameState}`);
		console.log(`   - Current Round: ${currentRound + 1}/${rounds}`);
		console.log(`   - Is Capturing: ${isCapturing}`);
		console.log(`   - Countdown: ${countdown}`);
		console.log(`🎛️ ==================================`);
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
					gameState={gameState}
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

			{gameState === "capturing" && (
				<div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center pointer-events-none">
					<div className="text-center">
						<div className="text-6xl mb-4 animate-pulse">📹</div>
						<h2 className="text-3xl font-bold text-cyan-400 mb-2">
							Show Your Move!
						</h2>
						<p className="text-xl text-white">
							Capturing your gesture...
						</p>
					</div>
				</div>
			)}

			{gameState === "waitingForResult" && (
				<div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
					<div className="text-center">
						<div className="text-6xl mb-4 animate-spin">🔄</div>
						<h2 className="text-3xl font-bold text-purple-400 mb-2">
							Processing Move...
						</h2>
						<p className="text-xl text-white">
							AI is analyzing your gesture
						</p>
					</div>
				</div>
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
							onClick={proceedToNextRoundManually}
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
