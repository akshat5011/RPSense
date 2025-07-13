import React from "react";

const ComputerDisplay = ({ choice }) => {
  const computerChoices = {
    rock: { emoji: "🗿", name: "Rock" },
    paper: { emoji: "📄", name: "Paper" },
    scissors: { emoji: "✂️", name: "Scissors" },
  };

  const currentChoice = computerChoices.rock; // Default for now

  return (
    <div className="text-center">
      <div className="text-9xl mb-4 animate-pulse">{choice}</div>
      <div className="text-2xl font-bold text-purple-400">Rock</div>
      <div className="text-slate-400 mt-2">Computer's Choice</div>
    </div>
  );
};

export default ComputerDisplay;
