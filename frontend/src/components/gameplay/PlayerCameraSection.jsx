import React from "react";
import CameraView from "./ui/CameraView";
import StatusIndicator from "./ui/StatusIndicator";
import CaptureButton from "./ui/CaptureButton";

const PlayerCameraSection = ({
  videoRef,
  cameraStream,
  isCapturing,
  onToggleCapture,
}) => {
  return (
    <div className="flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-cyan-400 mb-2">Your Move</h2>
        <p className="text-slate-300 text-sm">
          Show your hand gesture to the camera
        </p>
      </div>

      <div className="relative flex-1 rounded-lg border-2 border-cyan-500/30 bg-slate-900/50 overflow-hidden">
        <CameraView videoRef={videoRef} />

        <StatusIndicator
          isActive={cameraStream}
          label={cameraStream ? "Camera Active" : "No Camera"}
          type="camera"
          position="top-left"
        />

        <CaptureButton
          isCapturing={isCapturing}
          onToggle={onToggleCapture}
          disabled={!cameraStream}
        />
      </div>
    </div>
  );
};

export default PlayerCameraSection;
