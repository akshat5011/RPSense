import React from "react";

const DebugPanel = ({ mlServer, isCapturing, cameraStream }) => {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-slate-900/50 p-2 rounded">
      <div>ML Server: {mlServer}</div>
      <div>Capturing: {isCapturing ? "Yes" : "No"}</div>
      <div>Camera: {cameraStream ? "Connected" : "Disconnected"}</div>
    </div>
  );
};

export default DebugPanel;
