"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import RPSenseAPI from "@/services/api";

// Redux imports
import {
	selectGameMode,
	selectRounds,
	selectCurrentRound,
	updateScore,
	nextRound,
	resetGame,
	startGame,
	endGame,
} from "@/redux/slices/gameSlice";
import { selectCurrentPlayer, addMatch } from "@/redux/slices/gameDataSlice";

// Component imports (we'll create these if they don't exist)
import GameHeader from "./components/GameHeader";
import PlayerCameraSection from "./components/PlayerCameraSection";
import ComputerSection from "./components/ComputerSection";
import DebugPanel from "./components/DebugPanel";

const ActivePlay = ({ navigateTo }) => {
	const dispatch = useDispatch();

	// Redux selectors
	const gameMode = useSelector(selectGameMode);
	const rounds = useSelector(selectRounds);
	const currentRound = useSelector(selectCurrentRound);
	const currentPlayer = useSelector(selectCurrentPlayer);

	// DOM References
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const apiRef = useRef(null);
	const frameIntervalRef = useRef(null);
	const timerRef = useRef(null);
	const nextRoundTimeoutRef = useRef(null);
	const resultReceivedRef = useRef(false);

	// Score Tracking (dual approach for accuracy)
	const [playerScore, setPlayerScore] = useState(0);
	const [computerScore, setComputerScore] = useState(0);
	const [drawScore, setDrawScore] = useState(0);
	const playerScoreRef = useRef(0);
	const computerScoreRef = useRef(0);
	const drawScoreRef = useRef(0);

	// Game Flow State
	const [gameState, setGameState] = useState("waiting"); // waiting → countdown → capturing → waitingForResult → result → finished
	const [countdown, setCountdown] = useState(3);
	const [timer, setTimer] = useState(2); // 2-second capture window
	const [playerChoice, setPlayerChoice] = useState("");
	const [computerChoice, setComputerChoice] = useState("🤖");
	const [result, setResult] = useState("");
	const [finalResult, setFinalResult] = useState(null);

	// UI State
	const [showResult, setShowResult] = useState(false);
	const [showNextRoundPrompt, setShowNextRoundPrompt] = useState(false);
	const [nextRoundCountdown, setNextRoundCountdown] = useState(5);
	const [cameraStream, setCameraStream] = useState(null);
	const [apiConnected, setApiConnected] = useState(false);
	const [isCapturing, setIsCapturing] = useState(false);

	// Capture settings
	const captureTime = 2; // 2 seconds
	const frameRate = 10; // 10 fps
	const totalFrames = captureTime * frameRate; // 20 frames

	// Initialize API and camera on component mount
	useEffect(() => {
		initializeAPI();
		initCamera();

		return () => {
			cleanup();
		};
	}, []);

	// Utility function to get emoji for choice
	const getEmojiForChoice = (choice) => {
		const choices = {
			rock: "🗿",
			paper: "📄",
			scissors: "✂️",
		};
		return choices[choice?.toLowerCase()] || "🤖";
	};

	/**
	 * Initialize the API connection
	 */
	const initializeAPI = () => {
		try {
			apiRef.current = new RPSenseAPI();
			setApiConnected(true);
			console.log("✅ API initialized successfully");
		} catch (error) {
			console.error("❌ API initialization failed:", error);
			setApiConnected(false);
		}
	};

	/**
	 * Initialize camera stream from user's webcam
	 */
	const initCamera = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 640 },
					height: { ideal: 480 },
					facingMode: "user",
				},
				audio: false,
			});

			setCameraStream(stream);

			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}

			console.log("✅ Camera initialized successfully");
		} catch (error) {
			console.error("❌ Error accessing camera:", error);
			alert("Failed to access camera. Please check permissions.");
		}
	};

	/**
	 * Cleanup function for component unmount
	 */
	const cleanup = () => {
		// Stop camera stream
		if (cameraStream) {
			cameraStream.getTracks().forEach((track) => track.stop());
		}

		// Clear intervals and timeouts
		if (frameIntervalRef.current) {
			clearInterval(frameIntervalRef.current);
		}
		if (timerRef.current) {
			clearInterval(timerRef.current);
		}
		if (nextRoundTimeoutRef.current) {
			clearInterval(nextRoundTimeoutRef.current);
		}

		// Clear API buffer
		if (apiRef.current) {
			apiRef.current.clearBuffer();
		}
	};

	/**
	 * Start the round sequence with countdown
	 */
	const startRound = async () => {
		console.log(`🎮 Starting round ${currentRound + 1}/${rounds}`);

		if (!cameraStream) {
			await initCamera();
		}

		clearRoundState();
		setGameState("countdown");
		setCountdown(3);

		// Countdown sequence
		const countdownInterval = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(countdownInterval);
					startCapturing();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	/**
	 * Clear round state for fresh start
	 */
	const clearRoundState = () => {
		setPlayerChoice("");
		setComputerChoice("🤖");
		setResult("");
		setShowResult(false);
		setTimer(captureTime);
		resultReceivedRef.current = false;

		// Clear any existing intervals
		if (frameIntervalRef.current) {
			clearInterval(frameIntervalRef.current);
			frameIntervalRef.current = null;
		}
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	};

	/**
	 * Start capturing frames for ML processing
	 */
	const startCapturing = () => {
		if (!apiConnected || isCapturing) {
			console.log("⚠️ API not connected or already capturing");
			return;
		}

		console.log("📹 Starting frame capture...");
		setGameState("capturing");
		setIsCapturing(true);
		setTimer(captureTime);

		// Clear API buffer before starting
		if (apiRef.current) {
			apiRef.current.clearBuffer();
		}

		resultReceivedRef.current = false;

		// Start frame capture interval
		frameIntervalRef.current = setInterval(() => {
			captureFrameToBuffer();
		}, 1000 / frameRate); // 10 fps

		// Start capture timer countdown
		timerRef.current = setInterval(() => {
			setTimer((prev) => {
				if (prev <= 1) {
					// Capture complete
					clearInterval(frameIntervalRef.current);
					clearInterval(timerRef.current);
					frameIntervalRef.current = null;
					timerRef.current = null;
					setIsCapturing(false);
					processFrameBuffer();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	/**
	 * Capture a single frame and add to buffer
	 */
	const captureFrameToBuffer = () => {
		if (!videoRef.current || !canvasRef.current || !apiRef.current) {
			return;
		}

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		// Set canvas dimensions to match video
		canvas.width = video.videoWidth || 640;
		canvas.height = video.videoHeight || 480;

		// Draw current video frame to canvas
		context.drawImage(video, 0, 0, canvas.width, canvas.height);

		// Convert to base64
		const frameBase64 = canvas.toDataURL("image/jpeg", 0.8);

		// Add frame to API buffer with metadata
		apiRef.current.addFrame(frameBase64, {
			gameMode,
			totalRounds: rounds,
			currentRound: currentRound + 1, // Backend expects 1-indexed
			playerScore: playerScoreRef.current,
			computerScore: computerScoreRef.current,
			timestamp: Date.now(),
		});
	};

	/**
	 * Process buffered frames via HTTP API
	 */
	const processFrameBuffer = async () => {
		if (!apiRef.current || resultReceivedRef.current) {
			console.log("⚠️ API not available or result already received");
			return;
		}

		setGameState("waitingForResult");

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

			// Process the result - Backend returns different formats
			if (result && result.game_result) {
				// Backend returned a game_result object
				const gameResult = result.game_result;
				
				// Set player choice from final_prediction or player_move
				const playerMove = result.final_prediction || gameResult.player_move || "unknown";
				setPlayerChoice(getEmojiForChoice(playerMove));
				
				// Set computer choice
				if (gameResult.computer_move) {
					setComputerChoice(getEmojiForChoice(gameResult.computer_move));
				}
				
				// Update score based on winner
				updateGameScore(gameResult.winner);
			} else if (result && result.final_prediction) {
				// Backend returned direct prediction format (fallback from last real-time result)
				const playerMove = result.final_prediction;
				setPlayerChoice(getEmojiForChoice(playerMove));
				
				// Computer choice and winner should be in game_result, but handle missing case
				if (result.game_result) {
					setComputerChoice(getEmojiForChoice(result.game_result.computer_move));
					updateGameScore(result.game_result.winner);
				} else {
					// Fallback if game_result is missing
					console.log("⚠️ game_result missing, using fallback");
					setComputerChoice("🗿");
					updateGameScore("computer");
				}
			} else {
				console.log("⚠️ Invalid result format, using fallback");
				setPlayerChoice("❓"); // Unknown choice
				setComputerChoice("🗿");
				updateGameScore("computer");
			}

			setFinalResult(result);
			setGameState("result");

			// Show result for 5 seconds then proceed
			setTimeout(() => {
				handleRoundCompletion();
			}, 5000);

		} catch (error) {
			console.error("❌ Error processing frames:", error);
			if (!error.message.includes('Already processing') && !error.message.includes('No frames to process')) {
				handleAPIError();
			}
		}
	};

	/**
	 * Handle API connection errors and continue game flow
	 */
	const handleAPIError = () => {
		console.log("❌ API Error - using fallback result");

		if (resultReceivedRef.current) {
			console.log("⚠️ Result already received, ignoring API error");
			return;
		}

		resultReceivedRef.current = true;

		// Set fallback computer choice and result
		setFinalResult({
			status: "no_detection",
			final_prediction: "timeout",
			confidence: 0.0,
			detected_hand: false,
			game_result: {
				player_move: "timeout",
				computer_move: "rock",
				winner: "computer",
				error: "API timeout"
			},
			timestamp: Date.now(),
			processed_frames: 0
		});
		setPlayerChoice("❓");
		setComputerChoice("🗿");
		updateGameScore("computer");
		setGameState("result");

		// Show result overlay and proceed after delay
		setTimeout(() => {
			handleRoundCompletion();
		}, 5000);
	};

	/**
	 * Update game scores based on round result
	 */
	const updateGameScore = (winner) => {
		console.log(`🏆 Updating score - Winner: ${winner}`);

		if (winner === "player") {
			setPlayerScore((prev) => {
				const newScore = prev + 1;
				playerScoreRef.current = newScore;
				return newScore;
			});
			dispatch(updateScore({ player: 1, computer: 0 }));
		} else if (winner === "computer") {
			setComputerScore((prev) => {
				const newScore = prev + 1;
				computerScoreRef.current = newScore;
				return newScore;
			});
			dispatch(updateScore({ player: 0, computer: 1 }));
		} else if (winner === "draw") {
			setDrawScore((prev) => {
				const newScore = prev + 1;
				drawScoreRef.current = newScore;
				return newScore;
			});
		}

		console.log(
			`📊 Current totals - Player: ${playerScoreRef.current}, Computer: ${computerScoreRef.current}, Draws: ${drawScoreRef.current}`
		);
	};

	/**
	 * Handle round completion and determine if game continues or ends
	 */
	const handleRoundCompletion = () => {
		const currentReduxRound = currentRound;
		const roundsCompleted = currentReduxRound + 1;
		const isClassicMode = gameMode === "classic";
		const isLastRound = roundsCompleted >= rounds;

		console.log("🏁 Round completion check:");
		console.log(`   - Game Mode: ${gameMode}`);
		console.log(`   - Redux current round (0-indexed): ${currentReduxRound}`);
		console.log(`   - Rounds completed: ${roundsCompleted}/${rounds}`);
		console.log(`   - Is Classic Mode: ${isClassicMode}`);
		console.log(`   - Is Last Round: ${isLastRound}`);

		if (isClassicMode || isLastRound) {
			// Game completely finished
			console.log("🎯 Game finished! Saving match data and cleaning up...");
			handleGameCompletion();
		} else {
			// More rounds to play in tournament mode
			console.log("🔄 Tournament round completed, more rounds to play...");
			handleTournamentRoundTransition();
		}
	};

	/**
	 * Handle complete game finish (classic mode or last tournament round)
	 */
	const handleGameCompletion = () => {
		// Immediately release camera resources
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

		// Redirect after showing final scores
		setTimeout(() => {
			navigateTo("menu");
		}, 5000);
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
				proceedToNextRoundAutomatically();
			}
		}, 1000);

		console.log(`⏱️ 5-second countdown started for next round`);
	};

	/**
	 * Automatically proceed to the next round after countdown
	 */
	const proceedToNextRoundAutomatically = () => {
		console.log("🚀 ===== AUTO-PROCEEDING TO NEXT ROUND =====");
		console.log(`   - Current Redux Round (before nextRound): ${currentRound}`);
		console.log(`   - Total Rounds: ${rounds}`);

		setShowNextRoundPrompt(false);

		// Check if we've reached the round limit
		if (currentRound + 1 >= rounds) {
			console.log("   - ⚠️ ROUND LIMIT REACHED! Not proceeding to next round.");
			console.log("🚀 =========================================");
			return;
		}

		// Increment Redux round counter
		dispatch(nextRound());

		const nextReduxRound = currentRound + 1;

		console.log(`   - Redux Round After Dispatch: ${nextReduxRound}`);
		console.log(`   - Starting round ${nextReduxRound + 1} (Redux index: ${nextReduxRound})`);
		console.log("🚀 =========================================");

		// Reset round state for the new round
		setGameState("waiting");
		setIsCapturing(false);
		setTimer(captureTime);
		setPlayerChoice("");
		setComputerChoice("🤖");
		setResult("");
		setShowResult(false);

		// Clear any existing timers
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	};

	/**
	 * Manually proceed to the next round (when user clicks button)
	 */
	const proceedToNextRoundManually = () => {
		// Clear the automatic countdown if user proceeds manually
		if (nextRoundTimeoutRef.current) {
			clearInterval(nextRoundTimeoutRef.current);
			nextRoundTimeoutRef.current = null;
		}

		proceedToNextRoundAutomatically();
	};

	/**
	 * Save completed match data to Redux store
	 */
	const saveMatchData = () => {
		const matchData = {
			gameMode,
			rounds,
			playerScore: playerScoreRef.current,
			computerScore: computerScoreRef.current,
			drawScore: drawScoreRef.current,
			playerName: currentPlayer?.name || "Player",
			timestamp: new Date().toISOString(),
		};

		dispatch(addMatch(matchData));
		console.log("💾 Match data saved:", matchData);
	};

	/**
	 * Handle exit game
	 */
	const handleExitGame = () => {
		cleanup();
		dispatch(endGame());
		navigateTo("menu");
	};

	// Render different UI based on game state
	return (
		<div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
			{/* Hidden canvas for frame capture */}
			<canvas ref={canvasRef} className="hidden" />

			{/* Game Header */}
			<GameHeader
				currentRound={currentRound + 1}
				totalRounds={rounds}
				playerScore={playerScore}
				computerScore={computerScore}
				drawScore={drawScore}
				gameMode={gameMode}
				onExit={handleExitGame}
			/>

			{/* Main Game Area */}
			<div className="grid grid-cols-2 gap-8 px-8 h-[calc(100vh-120px)]">
				{/* Left side - Player Camera Section */}
				<PlayerCameraSection
					videoRef={videoRef}
					gameState={gameState}
					isCapturing={isCapturing}
					timer={timer}
					playerChoice={playerChoice}
					cameraStream={cameraStream}
				/>

				{/* Right side - Computer Section */}
				<ComputerSection
					computerChoice={computerChoice}
					gameState={gameState}
					finalResult={finalResult}
				/>
			</div>

			{/* Game State Overlays */}
			<AnimatePresence>
				{/* Waiting State Overlay */}
				{gameState === "waiting" && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
					>
						<motion.div
							initial={{ scale: 0.8, y: 50 }}
							animate={{ scale: 1, y: 0 }}
							className="bg-slate-800/90 p-8 rounded-xl border border-cyan-500/30"
						>
							<h2 className="text-3xl font-bold text-white mb-4 text-center">
								Round {currentRound + 1} of {rounds}
							</h2>
							<p className="text-cyan-300 text-lg mb-6 text-center">
								{gameMode === "classic" ? "Classic Mode" : "Tournament Mode"}
							</p>
							<Button
								onClick={startRound}
								className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xl py-4"
							>
								Start Round
							</Button>
						</motion.div>
					</motion.div>
				)}

				{/* Countdown Overlay */}
				{gameState === "countdown" && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
					>
						<motion.div
							key={countdown}
							initial={{ scale: 0.5, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 1.5, opacity: 0 }}
							transition={{ duration: 0.5 }}
							className="text-8xl font-bold text-cyan-400"
						>
							{countdown > 0 ? countdown : "GO!"}
						</motion.div>
					</motion.div>
				)}

				{/* Result Overlay */}
				{gameState === "result" && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
					>
						<motion.div
							initial={{ scale: 0.8, y: 50 }}
							animate={{ scale: 1, y: 0 }}
							className="bg-slate-800/90 p-8 rounded-xl border border-cyan-500/30 text-center"
						>
							<h2 className="text-4xl font-bold text-white mb-4">
								{finalResult?.game_result?.winner === "player" && "You Win!"}
								{finalResult?.game_result?.winner === "computer" && "Computer Wins!"}
								{finalResult?.game_result?.winner === "draw" && "It's a Draw!"}
								{finalResult?.game_result?.winner === "tie" && "It's a Draw!"}
								{!finalResult?.game_result?.winner && "Round Complete!"}
							</h2>
							<div className="flex justify-center gap-8 mb-6">
								<div className="text-center">
									<p className="text-cyan-300 mb-2">You</p>
									<div className="text-6xl">{playerChoice || "❓"}</div>
								</div>
								<div className="text-center">
									<p className="text-purple-300 mb-2">vs</p>
									<div className="text-4xl">⚔️</div>
								</div>
								<div className="text-center">
									<p className="text-red-300 mb-2">Computer</p>
									<div className="text-6xl">{computerChoice}</div>
								</div>
							</div>
							<div className="text-lg text-white">
								Score: {playerScore} - {computerScore}
								{drawScore > 0 && ` (${drawScore} draws)`}
							</div>
						</motion.div>
					</motion.div>
				)}

				{/* Next Round Prompt */}
				{showNextRoundPrompt && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
					>
						<motion.div
							initial={{ scale: 0.8, y: 50 }}
							animate={{ scale: 1, y: 0 }}
							className="bg-slate-800/90 p-8 rounded-xl border border-cyan-500/30 text-center"
						>
							<h2 className="text-3xl font-bold text-white mb-4">
								Round {currentRound + 1} Complete!
							</h2>
							<p className="text-cyan-300 text-lg mb-6">
								Starting Round {currentRound + 2} in {nextRoundCountdown} seconds...
							</p>
							<div className="space-y-4">
								<Button
									onClick={proceedToNextRoundManually}
									className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xl py-4"
								>
									Start Round {currentRound + 2} Now
								</Button>
								<p className="text-slate-400">
									Current Score: {playerScore} - {computerScore}
								</p>
							</div>
						</motion.div>
					</motion.div>
				)}

				{/* Game Complete Overlay */}
				{gameState === "finished" && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
					>
						<motion.div
							initial={{ scale: 0.8, y: 50 }}
							animate={{ scale: 1, y: 0 }}
							className="bg-slate-800/90 p-12 rounded-xl border border-cyan-500/30 text-center"
						>
							<h1 className="text-5xl font-bold text-white mb-6">
								Game Complete!
							</h1>
							<div className="space-y-4 mb-8">
								<div className="text-2xl text-white">
									Final Score: {playerScore} - {computerScore}
									{drawScore > 0 && ` (${drawScore} draws)`}
								</div>
								<div className="text-xl text-cyan-300">
									{playerScore > computerScore && "🎉 Congratulations! You won the match!"}
									{computerScore > playerScore && "😔 Computer won this time!"}
									{playerScore === computerScore && "🤝 It's a tie! Great game!"}
								</div>
							</div>
							<p className="text-slate-400 text-lg">
								Redirecting to menu...
							</p>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Debug Panel */}
			<DebugPanel
				apiConnected={apiConnected}
				gameState={gameState}
				isCapturing={isCapturing}
				bufferSize={apiRef.current?.getBufferSize() || 0}
			/>

			{/* Neon Effects */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
				<div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
				<div className="absolute top-1/2 left-1/2 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2" />
			</div>
		</div>
	);
};

export default ActivePlay;
