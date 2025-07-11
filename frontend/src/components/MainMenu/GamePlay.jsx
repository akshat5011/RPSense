"use client";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loading from "@/components/CustomUI/Loading";
import { selectCurrentPlayer } from "@/redux/slices/gameDataSlice";
import {
  selectGameMode,
  selectRounds,
  selectCameraPermission,
  selectIsLoading,
  selectGameError,
  setGameMode,
  setRounds,
  setCameraPermission,
  setIsLoading,
  startGame,
  setError,
} from "@/redux/slices/gameSlice";
import RPSense from "../CustomUI/RPSense";

const GamePlay = ({ navigateTo }) => {
  const dispatch = useDispatch();

  // Redux selectors
  const currentPlayer = useSelector(selectCurrentPlayer);
  const gameMode = useSelector(selectGameMode);
  const rounds = useSelector(selectRounds);
  const cameraPermission = useSelector(selectCameraPermission);
  const isLoading = useSelector(selectIsLoading);
  const gameError = useSelector(selectGameError);

  // Local state
  const [isCheckingCamera, setIsCheckingCamera] = useState(false);

  // Check camera permission on component mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    if (cameraPermission !== null) return;

    setIsCheckingCamera(true);
    dispatch(setCameraPermission("checking"));

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // Permission granted, stop the stream
      stream.getTracks().forEach((track) => track.stop());
      dispatch(setCameraPermission("granted"));
    } catch (error) {
      console.error("Camera permission error:", error);
      dispatch(setCameraPermission("denied"));
      dispatch(setError(error.message));
    } finally {
      setIsCheckingCamera(false);
    }
  };

  const handleGameModeChange = (mode) => {
    dispatch(setGameMode(mode));
  };

  const handleRoundsChange = (newRounds) => {
    if (gameMode === "tournament") {
      let rounds = parseInt(newRounds) || 3;

      // Ensure odd number
      if (rounds % 2 === 0) {
        rounds = rounds < 15 ? rounds + 1 : rounds - 1;
      }

      // Ensure within bounds (3-15, odd only)
      rounds = Math.max(3, Math.min(15, rounds));

      dispatch(setRounds(rounds));
    }
  };

  const validateGameStart = () => {
    const errors = [];

    if (!currentPlayer) {
      errors.push("No player selected");
    }

    if (cameraPermission !== "granted") {
      errors.push("Camera permission required");
    }

    if (gameMode === "tournament" && rounds < 3) {
      errors.push("Tournament mode requires at least 3 rounds");
    }

    return errors;
  };

  const handleStartGame = () => {
    const errors = validateGameStart();

    if (errors.length > 0) {
      alert("Cannot start game:\n" + errors.join("\n"));
      return;
    }

    dispatch(setIsLoading(true));

    // Simulate game initialization delay
    setTimeout(() => {
      dispatch(startGame());
      dispatch(setIsLoading(false));
      navigateTo("game-active");
    }, 2000);
  };

  const GameModeCard = ({
    mode,
    title,
    isSelected,
    onClick,
    disabled = false,
  }) => (
    <motion.div
      onClick={!disabled ? onClick : undefined}
      className={`
        p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer
        ${
          isSelected
            ? "border-cyan-500 bg-cyan-500/10"
            : "border-slate-600/30 bg-slate-800/50 hover:border-cyan-500/50"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <div className="text-center">
        <h4
          className={`text-xl font-bold mb-2 ${
            isSelected ? "text-cyan-300" : "text-white"
          }`}
        >
          {title}
        </h4>
      </div>
    </motion.div>
  );

  const StatusIndicator = ({ status, label }) => {
    const statusColors = {
      granted: "text-green-400",
      denied: "text-red-400",
      checking: "text-yellow-400",
      null: "text-slate-400",
    };

    const statusIcons = {
      granted: "✅",
      denied: "❌",
      checking: "⏳",
      null: "⚪",
    };

    return (
      <div className="flex items-center gap-2">
        <span className={statusColors[status]}>{statusIcons[status]}</span>
        <span className="text-white">{label}</span>
      </div>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="h-screen w-screen grid grid-cols-2 overflow-hidden">
      {/* LEFT SIDE - Game Setup */}
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-slate-900/30 via-purple-900/20 to-slate-900/30 p-8">
        <motion.div
          className="w-full max-w-md space-y-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Player Status */}
          <div>
            <div
              className={`text-xl text-white/70 flex items-center justify-center gap-3 cursor-pointer hover:text-cyan-300 transition-colors p-2 rounded-lg hover:bg-cyan-500/10`}
            >
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              <span>Player: </span>
              <span
                className={`text-white/90 font-semibold underline decoration-cyan-400/50`}
              >
                {currentPlayer?.name}
              </span>
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            </div>
          </div>

          {/* Game Mode Selection */}
          <div className="space-y-4">
            <Label className="text-white text-lg font-semibold">
              Game Mode:
            </Label>

            <div className="grid grid-cols-2 gap-3">
              <GameModeCard
                mode="classic"
                title="Classic Mode"
                isSelected={gameMode === "classic"}
                onClick={() => handleGameModeChange("classic")}
              />

              <GameModeCard
                mode="tournament"
                title="Tournament Mode"
                isSelected={gameMode === "tournament"}
                onClick={() => handleGameModeChange("tournament")}
              />
            </div>
          </div>

          {/* Rounds Selection (Tournament only) */}
          {gameMode === "tournament" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <Label className="text-white">Number of Rounds:</Label>
              <Input
                type="number"
                min="3"
                max="15"
                step="2"
                value={rounds}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 3;
                  // Ensure odd number: if even, make it odd
                  const oddValue = value % 2 === 0 ? value + 1 : value;
                  // Ensure within bounds
                  const finalValue = Math.max(3, Math.min(15, oddValue));
                  handleRoundsChange(finalValue);
                }}
                onBlur={(e) => {
                  // Double-check on blur to ensure odd number
                  const value = parseInt(e.target.value) || 3;
                  if (value % 2 === 0) {
                    const oddValue = value < 15 ? value + 1 : value - 1;
                    handleRoundsChange(oddValue);
                  }
                }}
                className="bg-slate-800 border-cyan-500/30 text-white"
              />
            </motion.div>
          )}

          {/* System Status */}
          <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-slate-600/30">
            <Label className="text-white font-semibold">System Status:</Label>
            <StatusIndicator
              status={cameraPermission}
              label="Camera Permission"
            />

            {cameraPermission === "denied" && (
              <div className="mt-2">
                <Button
                  onClick={checkCameraPermission}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700"
                  disabled={isCheckingCamera}
                >
                  {isCheckingCamera ? "Checking..." : "Request Camera"}
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-6 text-center flex justify-center">
            <div
              onClick={handleStartGame}
              className={`
                    text-2xl font-bold py-3 px-6 cursor-pointer
                    transition-all duration-300 relative
                    ${
                      validateGameStart().length > 0
                        ? "text-slate-500 cursor-not-allowed"
                        : "text-cyan-400 hover:text-cyan-300 hover:scale-105"
                    }
                    `}
            >
              Start Game
            </div>

            <div
              onClick={() => navigateTo("menu")}
              className="text-xl font-semibold py-3 px-4 cursor-pointer text-purple-400 hover:text-purple-300 hover:scale-105 transition-all duration-300 relative"
            >
              Go Back
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE - Preview/Instructions */}
      <div className="relative w-full h-full ">
        <div
          className="absolute w-full flex justify-center z-10"
          style={{ top: "25vh" }}
        >
          <RPSense className="relative" />
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
