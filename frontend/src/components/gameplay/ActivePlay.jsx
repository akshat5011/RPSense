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

const ActivePlay = ({ navigateTo }) => {
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const resultReceivedRef = useRef(false); // Prevent multiple final results
  const frameTimestampRef = useRef(0); // Monotonic timestamp counter

  // Redux state
  const gameMode = useSelector(selectGameMode);
  const rounds = useSelector(selectRounds);
  const currentRound = useSelector(selectCurrentRound);
  const currentPlayer = useSelector(selectCurrentPlayer);

  // Local state
  const [cameraStream, setCameraStream] = useState(null);
  const [gameState, setGameState] = useState("waiting"); // waiting, countdown, capturing, result, finished
  const [countdown, setCountdown] = useState(3);
  const [computerChoice, setComputerChoice] = useState("🤖");
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [drawScore, setDrawScore] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false); // Track capturing state

  // ML Results
  const [realtimeResult, setRealtimeResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [overlayImage, setOverlayImage] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const ML_SERVER =
    process.env.NEXT_PUBLIC_ML_SERVER || "http://localhost:5000";

  // Initialize Socket.IO connection
  const initSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log("🔍 Connecting to:", ML_SERVER);

    socketRef.current = io(ML_SERVER, {
      // Force WebSocket first, fallback to polling
      transports: ["websocket", "polling"],

      // Connection options
      forceNew: true,
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      timeout: 20000,

      // ngrok specific headers
      extraHeaders: {
        "ngrok-skip-browser-warning": "true",
        Origin: window.location.origin,
      },

      // Enhanced transport options for ngrok
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

      // Force immediate connection
      rememberUpgrade: false,
      timestampRequests: false,
    });

    // Connection handlers
    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected successfully!");
      console.log("✅ Transport:", socketRef.current.io.engine.transport.name);
      console.log("✅ Socket ID:", socketRef.current.id);
      setSocketConnected(true);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setSocketConnected(false);

      // Handle unexpected disconnections
      if (reason === "io server disconnect" || reason === "ping timeout") {
        console.log("🔄 Attempting to reconnect...");
        setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.connect();
          }
        }, 2000);
      }
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      setSocketConnected(false);

      // Try switching transport on error
      if (error.type === "TransportError") {
        console.log("🔄 Switching to polling transport...");
        socketRef.current.io.opts.transports = ["polling"];
      }
    });

    // Game event handlers
    socketRef.current.on("connected", (data) => {
      console.log("✅ Connected to ML server:", data);
    });

    socketRef.current.on("real_time_result", (data) => {
      console.log("📊 Real-time result:", data);

      // Only process if we haven't received final result yet
      if (!resultReceivedRef.current) {
        setRealtimeResult(data);

        // Show small overlay image if available
        if (data.overlay_image) {
          setOverlayImage(data.overlay_image);
        }
      }
    });

    socketRef.current.on("final_result", (data) => {
      console.log("🎯 Final result:", data);

      // Prevent duplicate final results
      if (resultReceivedRef.current) {
        console.log("⚠️ Duplicate final result ignored");
        return;
      }

      resultReceivedRef.current = true;
      setFinalResult(data);

      // Stop capturing immediately
      stopCapturing();

      // Update computer choice and scores
      if (data.game_result) {
        setComputerChoice(getEmojiForChoice(data.game_result.computer_move));
        updateGameScore(data.game_result.winner);
      }

      // Show result and handle round completion
      setGameState("result");

      // Use a longer delay to ensure state updates are complete
      setTimeout(() => {
        handleRoundCompletion();
      }, 3000);
    });

    // Add missing event listeners
    socketRef.current.on("game_started", (data) => {
      console.log("🎮 Game started:", data);
    });

    socketRef.current.on("error", (data) => {
      console.error("❌ Socket error:", data);

      // Force final result on error
      if (isCapturing && !resultReceivedRef.current) {
        console.log("🔄 Forcing result due to socket error");
        handleSocketError();
      }
    });

    // Connection timeout handling
    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      setSocketConnected(false);

      // If we're capturing and get connection error, handle it
      if (isCapturing && !resultReceivedRef.current) {
        handleSocketError();
      }

      // Try switching transport on error
      if (error.type === "TransportError") {
        console.log("🔄 Switching to polling transport...");
        socketRef.current.io.opts.transports = ["polling"];
      }
    });
  };

  // Stop capturing frames
  const stopCapturing = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    setIsCapturing(false);
    console.log("🛑 Stopped capturing frames");
  };

  // Handle round completion logic
  const handleRoundCompletion = () => {
    const isClassicMode = gameMode === "classic";
    const isLastRound = currentRound >= rounds - 1;

    if (isClassicMode || isLastRound) {
      // Game finished
      setGameState("finished");
      saveMatchData();

      // Close socket connection
      if (socketRef.current) {
        socketRef.current.emit("stop_game");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    } else {
      // More rounds to play
      dispatch(nextRound());
      setGameState("waiting");
      clearRoundState();
    }
  };

  // Clear state between rounds
  const clearRoundState = () => {
    setRealtimeResult(null);
    setFinalResult(null);
    setOverlayImage(null);
    setComputerChoice("🤖");
    resultReceivedRef.current = false;
    setIsCapturing(false);

    // Stop camera between rounds
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    console.log("🧹 Round state cleared");
  };

  // Handle socket errors
  const handleSocketError = () => {
    stopCapturing();

    if (!resultReceivedRef.current) {
      resultReceivedRef.current = true;

      // Create error result where computer wins
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

      setFinalResult(errorResult);
      setComputerChoice("🗿");
      updateGameScore("computer");

      setGameState("result");
      setTimeout(() => {
        handleRoundCompletion();
      }, 3000);
    }
  };

  // Initialize camera
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
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Failed to access camera. Please check permissions.");
    }
  };

  // Start round countdown
  const startRound = async () => {
    // Initialize camera if not already done
    if (!cameraStream) {
      await initCamera();
    }

    clearRoundState();
    setGameState("countdown");
    setCountdown(3);

    // Countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          startCapturing();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start capturing frames
  const startCapturing = () => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error("❌ Socket not connected, cannot start capturing");
      handleSocketError();
      return;
    }

    setGameState("capturing");
    setIsCapturing(true);
    resultReceivedRef.current = false;
    
    // Reset frame timestamp for monotonic sequence
    frameTimestampRef.current = 0;

    // Send start_game event
    socketRef.current.emit("start_game", {
      gameMode,
      totalRounds: rounds,
      currentRound: currentRound + 1,
      playerName: currentPlayer?.name || "Player",
    });

    let frameCount = 0;
    const maxFrames = 20; // 2 seconds at 10fps

    frameIntervalRef.current = setInterval(() => {
      if (frameCount < maxFrames && !resultReceivedRef.current) {
        sendFrameToSocket();
        frameCount++;
      } else {
        // Stop capturing and notify backend
        stopCapturing();

        // Tell backend we're done sending frames
        if (socketRef.current && !resultReceivedRef.current) {
          socketRef.current.emit("capture_complete", {
            totalFrames: frameCount,
            timestamp: Date.now(),
          });
          console.log(
            `📤 Notified backend: capture complete (${frameCount} frames)`
          );
        }
      }
    }, 100);
  };

  // Send frame via socket
  const sendFrameToSocket = () => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("⏳ Video not ready, skipping frame");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 with quality control
    const frameBase64 = canvas.toDataURL("image/jpeg", 0.7);

    // Use monotonically increasing timestamp
    frameTimestampRef.current += 33333; // 30fps = 33333 microseconds per frame

    // Send via socket with monotonic timestamp
    socketRef.current.emit("frame_data", {
      frame: frameBase64,
      gameData: {
        gameMode,
        totalRounds: rounds,
        currentRound: currentRound + 1,
        playerScore,
        computerScore,
        timestamp: frameTimestampRef.current,
        frameId: Math.random().toString(36).substr(2, 9),
      },
    });
  };

  // Update game score
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

  // Get emoji for choice
  const getEmojiForChoice = (choice) => {
    const choices = {
      rock: "🗿",
      paper: "📄",
      scissors: "✂️",
    };
    return choices[choice] || "🤖";
  };

  // Save match data to Redux
  const saveMatchData = () => {
    const matchData = {
      playerName: currentPlayer?.name || "Guest",
      model: "AI",
      rounds: gameMode === "classic" ? 1 : rounds,
      datetime: new Date().toISOString(),
      playerWins: playerScore,
      computerWins: computerScore,
      draws: drawScore,
      streak: playerScore > computerScore ? playerScore : 0,
      gameMode,
    };

    dispatch(addMatch(matchData));
  };

  // Next round handler
  const handleNextRound = () => {
    clearRoundState();
    setGameState("waiting");
  };

  // Exit game handler
  const handleExitGame = () => {
    stopCapturing();

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    // Stop socket
    if (socketRef.current) {
      socketRef.current.emit("stop_game");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    dispatch(resetGame());
    navigateTo("menu");
  };

  // Initialize socket on mount
  useEffect(() => {
    initSocket();

    return () => {
      stopCapturing();
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
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
      }, 2000);
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
              disabled={!socketConnected}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xl font-bold rounded-lg transition-all duration-300"
            >
              {socketConnected ? "Start Round" : "Connecting..."}
            </button>
          </div>
        </div>
      )}

      {gameState === "countdown" && <CountdownOverlay countdown={countdown} />}

      {gameState === "result" && finalResult && (
        <ResultOverlay
          finalResult={finalResult}
          playerScore={playerScore}
          computerScore={computerScore}
        />
      )}

      {gameState === "waiting" &&
        currentRound < rounds - 1 &&
        gameMode !== "classic" && <NextRoundButton onClick={handleNextRound} />}

      {gameState === "finished" && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Game Complete!
            </h2>
            <p className="text-xl text-white mb-4">
              Final Score: You {playerScore} - {computerScore} Computer {drawScore > 0 ? `- ${drawScore} Draws` : ''}
            </p>
            <p className="text-lg text-cyan-400">Redirecting to results...</p>
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
