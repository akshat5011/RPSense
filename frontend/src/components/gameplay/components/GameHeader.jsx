import React from "react";
import { Button } from "@/components/ui/button";

const GameHeader = ({
	currentRound,
	totalRounds,
	playerScore,
	computerScore,
	drawScore,
	gameMode,
	onExit,
}) => {
	return (
		<header className="flex justify-between items-center p-6 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50">
			{/* Left side - Round info */}
			<div className="flex items-center gap-6">
				<div className="text-white">
					<h1 className="text-2xl font-bold">
						Round {currentRound} of {totalRounds}
					</h1>
					<p className="text-cyan-300 capitalize">
						{gameMode} Mode
					</p>
				</div>
			</div>

			{/* Center - Score display */}
			<div className="flex items-center gap-8">
				<div className="text-center">
					<p className="text-cyan-300 text-sm">Player</p>
					<p className="text-3xl font-bold text-white">{playerScore}</p>
				</div>
				
				<div className="text-2xl text-slate-400">-</div>
				
				<div className="text-center">
					<p className="text-red-300 text-sm">Computer</p>
					<p className="text-3xl font-bold text-white">{computerScore}</p>
				</div>

				{drawScore > 0 && (
					<>
						<div className="text-2xl text-slate-400">|</div>
						<div className="text-center">
							<p className="text-yellow-300 text-sm">Draws</p>
							<p className="text-3xl font-bold text-white">{drawScore}</p>
						</div>
					</>
				)}
			</div>

			{/* Right side - Exit button */}
			<Button
				onClick={onExit}
				variant="ghost"
				size="sm"
				className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
			>
				<span className="w-5 h-5 mr-2">✕</span>
				Exit Game
			</Button>
		</header>
	);
};

export default GameHeader;
