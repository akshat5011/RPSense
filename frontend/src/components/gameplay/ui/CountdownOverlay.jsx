import React from "react";

const CountdownOverlay = ({ countdown }) => {
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-bold text-white mb-4 animate-pulse">
          {countdown > 0 ? countdown : "GO!"}
        </div>
        <p className="text-xl text-cyan-400">Get ready to show your move!</p>
      </div>
    </div>
  );
};

export default CountdownOverlay;
