import React from "react";

const GameHeader = ({ navigateTo, gameInfo, gameMode }) => {
  return (
    <div className="flex items-center justify-between px-8 py-4">
      <div
        onClick={navigateTo}
        className="
          text-lg font-semibold py-2 px-4 cursor-pointer
          text-purple-400 hover:text-purple-300 
          hover:scale-105 transition-all duration-300
          relative
        "
      >
        ← Exit Game
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 hover:scale-x-100 transition-transform duration-300" />
      </div>

      {/* Game Info */}
      <div className="text-center">
        <h1 className="text-4xl mb-1 font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent tracking-wide">
          RPSense
        </h1>
        <div className="text-cyan-400">
          Round {gameInfo.currentRound} of {gameInfo.totalRounds} •{" "}
          {gameMode.toUpperCase()} MODE
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-white font-semibold">Score</div>
        <div className="text-green-400">Player: {gameInfo.playerScore}</div>
        <div className="text-red-400">Computer: {gameInfo.computerScore}</div>
      </div>
    </div>
  );
};

export default GameHeader;
