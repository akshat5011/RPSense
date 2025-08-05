import React from "react";
import CameraView from "./ui/CameraView";
import StatusIndicator from "./ui/StatusIndicator";

/**
 * PlayerCameraSection Component
 * 
 * Displays the player's camera feed and capture interface.
 * Shows real-time video, capture status, AI predictions, and recording indicators.
 * 
 * @param {Object} props - Component props
 * @param {React.RefObject} props.videoRef - Reference to video element for camera display
 * @param {MediaStream|null} props.cameraStream - Active camera stream object
 * @param {boolean} props.isCapturing - Whether frame capture is currently active
 * @param {string|null} props.overlayImage - Base64 image showing AI's view of current frame
 * @param {Object|null} props.realtimeResult - Real-time ML prediction results
 * @param {string} props.realtimeResult.prediction - Predicted gesture ("rock", "paper", "scissors", "invalid")
 * @param {number} props.realtimeResult.confidence - Prediction confidence (0-1)
 */
const PlayerCameraSection = ({
  videoRef,
  cameraStream,
  isCapturing,
  overlayImage,
  realtimeResult,
}) => {
  return (
    <div className="flex flex-col">
      {/* Section Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-cyan-400 mb-2">Your Move</h2>
        <p className="text-slate-300 text-sm">
          {isCapturing
            ? "Show your hand gesture now!"
            : "Get ready to show your hand gesture"}
        </p>
      </div>

      {/* Camera Display Container */}
      <div className="relative flex-1 rounded-lg border-2 border-cyan-500/30 bg-slate-900/50 overflow-hidden">
        {/* Main Camera View */}
        <CameraView videoRef={videoRef} />

        {/* Camera Status Indicator */}
        <StatusIndicator
          isActive={!!cameraStream}
          label={cameraStream ? "Camera Active" : "No Camera"}
          type="camera"
          position="top-left"
        />

        {/* Capture Status Indicator */}
        {isCapturing && (
          <StatusIndicator
            isActive={true}
            label="Capturing..."
            type="ai"
            position="top-right"
          />
        )}

        {/* Real-time Prediction Display */}
        {realtimeResult &&
          realtimeResult.prediction &&
          realtimeResult.prediction !== "invalid" && (
            <div className="absolute top-16 left-4 bg-black/70 rounded-lg p-2 border border-cyan-400/30">
              <div className="text-cyan-400 text-sm font-medium">
                Prediction: <span className="uppercase">{realtimeResult.prediction}</span>
              </div>
              <div className="text-white text-xs">
                Confidence: {(realtimeResult.confidence * 100).toFixed(1)}%
              </div>
            </div>
          )}

        {/* AI View Thumbnail - Shows what the AI sees */}
        {overlayImage && isCapturing && (
          <div className="absolute bottom-4 right-4">
            <img
              src={overlayImage}
              alt="AI's view of current frame"
              className="w-24 h-18 object-cover rounded border-2 border-cyan-400 opacity-80"
            />
            <div className="absolute -top-6 right-0 text-xs text-cyan-400 font-medium">
              AI View
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isCapturing && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/70 rounded-full px-3 py-1 border border-red-500/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">
                  Recording
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCameraSection;
