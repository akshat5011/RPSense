import React from "react";

/**
 * DebugPanel Component
 * 
 * Development-only component that displays real-time debug information
 * including ML server status, socket connections, camera state, and game status.
 * Only renders in development environment.
 * 
 * @param {Object} props - Component props
 * @param {string} props.mlServer - ML server endpoint URL
 * @param {boolean} props.isCapturing - Whether frame capture is active
 * @param {MediaStream|null} props.cameraStream - Active camera stream object
 * @param {string} props.gameState - Current game state (waiting, countdown, capturing, etc.)
 * @param {boolean} props.socketConnected - WebSocket connection status
 */
const DebugPanel = ({
  mlServer,
  isCapturing,
  cameraStream,
  gameState,
  socketConnected,
}) => {
  // Only show debug panel in development environment
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-600/30">
      <div className="font-semibold text-slate-400 mb-1">Debug Info</div>
      <div>ML Server: <span className="text-cyan-400">{mlServer}</span></div>
      <div>Socket: <span className={socketConnected ? "text-green-400" : "text-red-400"}>
        {socketConnected ? "Connected" : "Disconnected"}
      </span></div>
      <div>Camera: <span className={cameraStream ? "text-green-400" : "text-red-400"}>
        {cameraStream ? "Connected" : "Disconnected"}
      </span></div>
      <div>Game State: <span className="text-purple-400">{gameState}</span></div>
      <div>Capturing: <span className={isCapturing ? "text-yellow-400" : "text-slate-400"}>
        {isCapturing ? "Yes" : "No"}
      </span></div>
    </div>
  );
};

export default DebugPanel;
