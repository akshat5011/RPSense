import React from "react";

const NextRoundButton = ({ onClick }) => {
  return (
    <div className="absolute bottom-8 right-8">
      <button
        onClick={onClick}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-300 shadow-lg"
      >
        Next Round →
      </button>
    </div>
  );
};

export default NextRoundButton;
