import React from "react";

const CaptureButton = ({ isCapturing, onToggle, disabled }) => {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
          isCapturing
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-cyan-600 hover:bg-cyan-700 text-white"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isCapturing ? "Stop Capture" : "Start Capture"}
      </button>
    </div>
  );
};

export default CaptureButton;
