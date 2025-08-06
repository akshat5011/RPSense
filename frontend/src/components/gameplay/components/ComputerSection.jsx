import React from "react";
import ComputerDisplay from "../ui/ComputerDisplay";
import StatusIndicator from "../ui/StatusIndicator";

/**
 * ComputerSection Component
 * 
 * Displays the AI/Computer side of the Rock Paper Scissors game.
 * Manages computer choice display, thinking animations, and result revelation.
 * 
 * @param {Object} props - Component props
 * @param {string} props.computerChoice - Current computer choice emoji (🤖, 🗿, 📄, ✂️)
 * @param {Object|null} props.finalResult - Game result object containing winner and moves
 */
const ComputerSection = ({ computerChoice, finalResult }) => {
  /**
   * Determine computer display state based on game progress
   * Returns status, message, and choice for UI rendering
   * 
   * @returns {Object} Computer state object with status, message, and choice
   */
  const getComputerState = () => {
    // Game result is available - show what computer chose
    if (finalResult && finalResult.game_result) {
      return {
        status: "revealed",
        message: `Computer chose ${finalResult.game_result.computer_move.toUpperCase()}!`,
        choice: computerChoice,
      };
    } 
    // Computer has made a choice but result not yet revealed
    else if (computerChoice !== "🤖") {
      return {
        status: "thinking",
        message: "Computer is making its choice...",
        choice: computerChoice,
      };
    } 
    // Initial state - waiting for game to start
    else {
      return {
        status: "waiting",
        message: "AI is ready to play",
        choice: computerChoice,
      };
    }
  };

  const computerState = getComputerState();

  return (
    <div className="flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-purple-400 mb-2">
          Computer's Move
        </h2>
        <p className="text-slate-300 text-sm">{computerState.message}</p>
      </div>

      <div className="relative flex-1 rounded-lg border-2 border-purple-500/30 bg-slate-900/50 flex items-center justify-center">
        <ComputerDisplay
          choice={computerState.choice}
          state={computerState.status}
          finalResult={finalResult}
        />

        <StatusIndicator
          isActive={true}
          label={
            computerState.status === "revealed" ? "Choice Made" : "AI Ready"
          }
          type="ai"
          position="top-right"
        />

        {/* Show computer's choice name when revealed */}
        {finalResult && finalResult.game_result && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-purple-600/20 border border-purple-400/30 rounded-lg px-4 py-2">
              <div className="text-purple-400 text-sm font-medium text-center">
                Computer played:
              </div>
              <div className="text-white text-lg font-bold text-center">
                {finalResult.game_result.computer_move.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Thinking animation when computer is deciding */}
        {computerState.status === "thinking" && (
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 bg-purple-500/20 rounded-full px-3 py-1">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-purple-400 text-sm font-medium">
                Thinking
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComputerSection;
