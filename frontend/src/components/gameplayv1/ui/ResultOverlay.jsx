import React from "react";

const ResultOverlay = ({ finalResult, playerScore, computerScore }) => {
  const getWinnerText = (winner) => {
    if (winner === "player") return "You Win!";
    if (winner === "computer") return "Computer Wins!";
    return "It's a Draw!";
  };

  const getWinnerColor = (winner) => {
    if (winner === "player") return "text-green-400";
    if (winner === "computer") return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto p-8">
        {finalResult.final_overlay_image && (
          <img
            src={finalResult.final_overlay_image}
            alt="Final prediction"
            className="w-96 h-72 object-cover rounded-lg border-2 border-cyan-500 mb-6 mx-auto"
          />
        )}

        <h2 className="text-4xl font-bold text-white mb-2">
          Your Move: {finalResult.final_prediction?.toUpperCase()}
        </h2>

        <h3 className="text-3xl font-bold text-purple-400 mb-4">
          Computer: {finalResult.game_result?.computer_move?.toUpperCase()}
        </h3>

        <div
          className={`text-5xl font-bold mb-4 ${getWinnerColor(
            finalResult.game_result?.winner
          )}`}
        >
          {getWinnerText(finalResult.game_result?.winner)}
        </div>

        <div className="text-xl text-white">
          Score: You {playerScore} - {computerScore} Computer
        </div>

        <div className="text-sm text-slate-400 mt-4">
          Confidence: {(finalResult.confidence * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

export default ResultOverlay;
