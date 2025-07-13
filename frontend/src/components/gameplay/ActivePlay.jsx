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

  // ML Results
  const [realtimeResult, setRealtimeResult] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [overlayImage, setOverlayImage] = useState(null);

  const [socketConnected, setSocketConnected] = useState(false);

  const ML_SERVER =
    process.env.NEXT_PUBLIC_ML_SERVER || "http://localhost:5000";

  // Initialize Socket.IO connection
  const initSocket = () => {
    socketRef.current = io(ML_SERVER);

    socketRef.current.on("connected", (data) => {
      console.log("✅ Connected to ML server:", data);
    });

    socketRef.current.on("real_time_result", (data) => {
      console.log("📊 Real-time result:", data);
      setRealtimeResult(data);

      // Show small overlay image if available
      if (data.overlay_image) {
        setOverlayImage(data.overlay_image);
      }
    });

    socketRef.current.on("final_result", (data) => {
      console.log("🎯 Final result:", data);
      setFinalResult(data);

      // Stop capturing frames
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }

      // Update computer choice and scores
      if (data.game_result) {
        setComputerChoice(getEmojiForChoice(data.game_result.computer_move));
        updateGameScore(data.game_result.winner);
      }

      // Show result for 3 seconds then show next round button
      setGameState("result");
      setTimeout(() => {
        if (currentRound + 1 < rounds) {
          setGameState("waiting");
        } else {
          // Game finished
          setGameState("finished");
          saveMatchData();
        }
      }, 3000);
    });

    // Add missing event listeners
    socketRef.current.on("game_started", (data) => {
      console.log("🎮 Game started:", data);
    });

    socketRef.current.on("game_stopped", (data) => {
      console.log("🛑 Game stopped:", data);
    });

    socketRef.current.on("error", (data) => {
      console.error("❌ Socket error:", data);
    });

    // Add connection status tracking
    socketRef.current.on("connect", () => {
      console.log("🔌 Socket connected");
      setSocketConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setSocketConnected(false);
    });
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

    setGameState("countdown");
    setCountdown(3);
    setRealtimeResult(null);
    setFinalResult(null);
    setOverlayImage(null);
    setComputerChoice("🤖");

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
    setGameState("capturing");

    // Send start_game event
    socketRef.current.emit("start_game", {
      gameMode,
      totalRounds: rounds,
      currentRound: currentRound + 1,
      playerName: currentPlayer?.name || "Player",
    });

    // Start sending frames at 10fps for 2 seconds
    frameIntervalRef.current = setInterval(() => {
      sendFrameToSocket();
    }, 100); // 100ms = 10fps

    // Stop after 2 seconds
    setTimeout(() => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    }, 2000);
  };

  // Send frame via socket
  const sendFrameToSocket = () => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const frameBase64 = canvas.toDataURL("image/jpeg", 0.8);

    // Send via socket
    socketRef.current.emit("frame_data", {
      frame: frameBase64,
      gameData: {
        gameMode,
        totalRounds: rounds,
        currentRound: currentRound + 1,
        playerScore,
        computerScore,
        timestamp: Date.now(),
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
      dispatch(updateScore({ player: -1, computer: 1 }));
    }
    // Draw = no score change
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
      id: Date.now(),
      playerName: currentPlayer?.name || "Player",
      gameMode,
      totalRounds: rounds,
      playerScore,
      computerScore,
      winner:
        playerScore > computerScore
          ? "player"
          : computerScore > playerScore
          ? "computer"
          : "draw",
      timestamp: new Date().toISOString(),
      rounds: [], // Could store individual round results if needed
    };

    dispatch(addMatch(matchData));
  };

  // Next round handler
  const handleNextRound = () => {
    dispatch(nextRound());
    setGameState("waiting");

    // Pause camera between rounds
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Exit game handler
  const handleExitGame = () => {
    // Stop camera
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    // Stop socket
    if (socketRef.current) {
      socketRef.current.emit("stop_game");
      socketRef.current.disconnect();
    }

    // Clear intervals
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    // Reset game state
    dispatch(resetGame());

    // Navigate to menu
    navigateTo("menu");
  };

  // Initialize socket on mount
  useEffect(() => {
    initSocket();

    return () => {
      // Cleanup on unmount
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, []);

  // Handle game completion
  useEffect(() => {
    if (gameState === "finished") {
      setTimeout(() => {
        navigateTo("score");
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
        }}
        gameMode={gameMode}
      />

      <div className="grid grid-cols-2 gap-8 px-8 h-[calc(100vh-120px)]">
        <PlayerCameraSection
          videoRef={videoRef}
          cameraStream={cameraStream}
          isCapturing={gameState === "capturing"}
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
              Round {currentRound + 1} of {rounds}
            </h2>
            <button
              onClick={startRound}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white text-xl font-bold rounded-lg transition-all duration-300"
            >
              Start Round
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

      {gameState === "waiting" && currentRound > 0 && (
        <NextRoundButton onClick={handleNextRound} />
      )}

      {gameState === "finished" && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Game Complete!
            </h2>
            <p className="text-xl text-white mb-4">
              Final Score: You {playerScore} - {computerScore} Computer
            </p>
            <p className="text-lg text-cyan-400">Redirecting to results...</p>
          </div>
        </div>
      )}

      <DebugPanel
        mlServer={ML_SERVER}
        isCapturing={gameState === "capturing"}
        cameraStream={cameraStream}
        gameState={gameState}
        socketConnected={socketConnected} // Use state instead of socketRef.current?.connected
      />

      <NeonEffects />
    </div>
  );
};

export default ActivePlay;
