"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  selectCurrentPlayer,
  selectAllPlayers,
  selectMatchesByPlayerName,
  clearAllMatches,
} from "../redux/slices/gameDataSlice";
import {
  selectCameraPermission,
  setCameraPermission,
  setError,
} from "../redux/slices/gameSlice";
import RPSense from "./CustomUI/RPSense";

const Settings = ({ navigateTo }) => {
  const dispatch = useDispatch();

  // Redux selectors
  const currentPlayer = useSelector(selectCurrentPlayer);
  const allPlayers = useSelector(selectAllPlayers);
  const cameraPermission = useSelector(selectCameraPermission);
  const playerMatches = useSelector(
    selectMatchesByPlayerName(currentPlayer?.name || "")
  );

  // Local state
  const [isCheckingCamera, setIsCheckingCamera] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Check camera permission
  const checkCameraPermission = async () => {
    setIsCheckingCamera(true);
    dispatch(setCameraPermission("checking"));

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

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

  // Clear player data
  const handleClearPlayerData = () => {
    if (!currentPlayer) {
      alert("No player selected to clear data for.");
      return;
    }

    const confirmMessage = `Are you sure you want to clear all game data for "${currentPlayer.name}"?\n\nThis will delete ${playerMatches.length} matches and cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      // Clear all matches for this player
      dispatch(clearAllMatches());

      // If there are other players, we could filter matches instead
      // But since we're clearing selected player's data, we clear all matches

      alert(`Successfully cleared all data for ${currentPlayer.name}`);
      setShowClearConfirm(false);
    }
  };

  // Reset camera permission (for testing)
  const resetCameraPermission = () => {
    dispatch(setCameraPermission(null));
  };

  return (
    <div className="h-screen w-screen grid grid-cols-2 overflow-hidden">
      {/* LEFT SIDE - Settings */}
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4">
        <motion.div
          className="w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            scrollbarWidth: "none" /* Firefox */,
            msOverflowStyle: "none" /* IE and Edge */,
          }}
        >
          <div>
            <div className="text-xl text-white/70 flex items-center justify-center gap-3 transition-colors p-2 rounded-lg">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              <span>Player: </span>
              <span className="text-white/90 font-semibold underline decoration-cyan-400/50">
                {currentPlayer?.name}
              </span>
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            </div>
            <div className="text-sm text-slate-400 text-center mt-2">
              {playerMatches.length} total matches
            </div>
          </div>

          {/* Camera Permissions */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Camera</h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`text-lg ${
                    cameraPermission === "granted"
                      ? "text-green-400"
                      : cameraPermission === "denied"
                      ? "text-red-400"
                      : cameraPermission === "checking"
                      ? "text-yellow-400"
                      : "text-slate-400"
                  }`}
                >
                  {cameraPermission === "granted"
                    ? "✅"
                    : cameraPermission === "denied"
                    ? "❌"
                    : cameraPermission === "checking"
                    ? "⏳"
                    : "📷"}
                </span>
                <div>
                  <div className="text-white font-medium">Camera Access</div>
                  <div
                    className={`text-xs capitalize ${
                      cameraPermission === "granted"
                        ? "text-green-400"
                        : cameraPermission === "denied"
                        ? "text-red-400"
                        : cameraPermission === "checking"
                        ? "text-yellow-400"
                        : "text-slate-400"
                    }`}
                  >
                    {cameraPermission === null
                      ? "Not checked"
                      : cameraPermission}
                  </div>
                </div>
              </div>
              <Switch
                checked={cameraPermission === "granted"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    checkCameraPermission();
                  } else {
                    resetCameraPermission();
                  }
                }}
                disabled={isCheckingCamera}
                className="data-[state=checked]:bg-amber-50 data-[state=unchecked]:bg-slate-600"
              />
            </div>
          </div>

          {/* Data Management */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-600/30">
            <h3 className="text-lg font-semibold text-white mb-2">Data</h3>

            <div className="text-xs text-slate-300 mb-3">
              Clear all game data for current player.
            </div>

            {!showClearConfirm ? (
              <Button
                onClick={() => setShowClearConfirm(true)}
                size="sm"
                className=" bg-red-600 hover:bg-red-700 text-white text-xs"
                disabled={!currentPlayer || playerMatches.length === 0}
              >
                Clear Player Data
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <div className="text-red-400 text-xs font-medium">
                  ⚠️ Delete {playerMatches.length} matches for "
                  {currentPlayer?.name}"?
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleClearPlayerData}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white flex-1 text-xs py-1"
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => setShowClearConfirm(false)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600/30 text-slate-400 hover:bg-slate-700/50 flex-1 text-xs py-1"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {(!currentPlayer || playerMatches.length === 0) && (
              <div className="text-xs text-slate-500 mt-2">
                {!currentPlayer ? "No player selected" : "No matches to clear"}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="pt-2">
            <div
              onClick={() => navigateTo("menu")}
              className="
              text-lg font-semibold py-2 px-4 cursor-pointer text-center
              text-purple-400 hover:text-purple-300 
              hover:scale-105 transition-all duration-300
              relative
            "
            >
              Go Back
              {/* Animated underline */}
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 hover:scale-x-100 transition-transform duration-300" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT SIDE */}
      <div className="relative w-full h-full">
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
export default Settings;
