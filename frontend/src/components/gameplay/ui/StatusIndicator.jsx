import React from "react";

const StatusIndicator = ({ isActive, label, type, position = "top-left" }) => {
  const typeStyles = {
    camera: {
      active: "bg-green-500/20 text-green-400",
      inactive: "bg-red-500/20 text-red-400",
      dotActive: "bg-green-400 animate-pulse",
      dotInactive: "bg-red-400",
    },
    ai: {
      active: "bg-purple-500/20 text-purple-400",
      inactive: "bg-gray-500/20 text-gray-400",
      dotActive: "bg-purple-400 animate-pulse",
      dotInactive: "bg-gray-400",
    },
  };

  const positionStyles = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  const styles = typeStyles[type];

  return (
    <div className={`absolute ${positionStyles[position]}`}>
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          isActive ? styles.active : styles.inactive
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            isActive ? styles.dotActive : styles.dotInactive
          }`}
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
};

export default StatusIndicator;
