import React from "react";

const ComputerDisplay = ({ choice, state, finalResult }) => {
  const computerChoices = {
    rock: { emoji: "🗿", name: "Rock" },
    paper: { emoji: "📄", name: "Paper" },
    scissors: { emoji: "✂️", name: "Scissors" },
  };

  // Show question mark or thinking state before reveal
  const getDisplayChoice = () => {
    if (state === "waiting") {
      return { emoji: "🤖", name: "Ready" };
    } else if (state === "thinking") {
      return { emoji: "🤔", name: "Thinking..." };
    } else if (state === "revealed" && finalResult?.game_result) {
      const computerMove = finalResult.game_result.computer_move;
      return (
        computerChoices[computerMove] || { emoji: choice, name: "Unknown" }
      );
    }
    return { emoji: choice, name: "Ready" };
  };

  const displayChoice = getDisplayChoice();

  return (
    <div className="text-center">
      <div
        className={`text-9xl mb-4 ${
          state === "thinking"
            ? "animate-pulse"
            : state === "revealed"
            ? "animate-bounce"
            : ""
        }`}
      >
        {displayChoice.emoji}
      </div>
      <div className="text-2xl font-bold text-purple-400">
        {displayChoice.name}
      </div>
      <div className="text-slate-400 mt-2">
        {state === "revealed" ? "Final Choice" : "Computer's Choice"}
      </div>
    </div>
  );
};

export default ComputerDisplay;
