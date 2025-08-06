import React from "react";

/**
 * GameHeader Component
 * 
 * Top navigation and game information display for the active gameplay screen.
 * Shows exit button, game branding, current round progress, and live scores.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.navigateTo - Navigation function to exit game
 * @param {Object} props.gameInfo - Current game state information
 * @param {number} props.gameInfo.currentRound - Current round number (1-indexed)
 * @param {number} props.gameInfo.totalRounds - Total rounds in game
 * @param {number} props.gameInfo.playerScore - Player's current score
 * @param {number} props.gameInfo.computerScore - Computer's current score
 * @param {number} props.gameInfo.drawScore - Number of draw rounds
 * @param {string} props.gameMode - Game mode ("classic" or "tournament")
 */
const GameHeader = ({ navigateTo, gameInfo, gameMode }) => {
  return (
    <div className="flex items-center justify-between px-8 py-4">
      {/* Exit Game Button */}
      <div
        onClick={navigateTo}
        className="
          text-lg font-semibold py-2 px-4 cursor-pointer
          text-purple-400 hover:text-purple-300 
          hover:scale-105 transition-all duration-300
          relative
        "
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            navigateTo();
          }
        }}
      >
        ← Exit Game
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 hover:scale-x-100 transition-transform duration-300" />
      </div>

      {/* Game Info - Title and Round Progress */}
      <div className="text-center">
        <h1 className="text-4xl mb-1 font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent tracking-wide">
          RPSense
        </h1>
        <div className="text-cyan-400">
          Round {gameInfo.currentRound} of {gameInfo.totalRounds} •{" "}
          <span className="uppercase font-medium">{gameMode}</span> MODE
        </div>
      </div>

      {/* Score Display */}
      <div className="text-right">
        <div className="text-white font-semibold mb-1">Score</div>
        <div className="text-green-400 font-medium">Player: {gameInfo.playerScore}</div>
        <div className="text-red-400 font-medium">Computer: {gameInfo.computerScore}</div>
        {gameInfo.drawScore > 0 && (
          <div className="text-yellow-400 font-medium">Draws: {gameInfo.drawScore}</div>
        )}
      </div>
    </div>
  );
};

export default GameHeader;
