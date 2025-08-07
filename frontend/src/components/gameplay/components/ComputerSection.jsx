import React from "react";
import { motion } from "motion/react";

const ComputerSection = ({
	computerChoice,
	gameState,
	finalResult,
}) => {
	const getComputerStatus = () => {
		switch (gameState) {
			case "waiting":
				return "Ready for battle";
			case "countdown":
				return "Preparing...";
			case "capturing":
				return "Thinking...";
			case "waitingForResult":
				return "Calculating...";
			case "result":
				return "Move revealed!";
			case "finished":
				return "Game complete";
			default:
				return "Standby";
		}
	};

	const getStatusColor = () => {
		switch (gameState) {
			case "capturing":
				return "text-orange-400";
			case "waitingForResult":
				return "text-yellow-400";
			case "result":
				return "text-green-400";
			case "finished":
				return "text-purple-400";
			default:
				return "text-red-400";
		}
	};

	const isThinking = gameState === "capturing" || gameState === "waitingForResult";
	const showChoice = gameState === "result" || gameState === "finished";

	return (
		<div className="flex flex-col h-full">
			{/* Section Header */}
			<div className="text-center mb-4">
				<h2 className="text-3xl font-bold text-white mb-2">Computer</h2>
				<p className={`text-lg ${getStatusColor()}`}>
					{getComputerStatus()}
				</p>
			</div>

			{/* Computer Display Container */}
			<div className="flex-1 relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 flex items-center justify-center">
				
				{/* Computer Avatar/Choice Display */}
				<div className="text-center">
					{!showChoice ? (
						// Thinking state or default
						<motion.div
							animate={isThinking ? { 
								scale: [1, 1.1, 1],
								rotate: [0, 5, -5, 0]
							} : {}}
							transition={isThinking ? { 
								duration: 2, 
								repeat: Infinity,
								ease: "easeInOut"
							} : {}}
							className="text-9xl mb-4"
						>
							{isThinking ? (
								<motion.div
									animate={{ opacity: [0.3, 1, 0.3] }}
									transition={{ duration: 1.5, repeat: Infinity }}
								>
									🤖
								</motion.div>
							) : (
								computerChoice
							)}
						</motion.div>
					) : (
						// Result state - show computer's choice
						<motion.div
							initial={{ scale: 0, rotate: 180 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{ 
								type: "spring", 
								stiffness: 200, 
								damping: 15,
								delay: 0.2
							}}
							className="text-9xl mb-4"
						>
							{computerChoice}
						</motion.div>
					)}

					{/* Computer Status Text */}
					<div className="space-y-2">
						{isThinking && (
							<motion.div
								animate={{ opacity: [0.5, 1, 0.5] }}
								transition={{ duration: 1, repeat: Infinity }}
								className="text-lg text-yellow-400"
							>
								{gameState === "capturing" ? "Analyzing your move..." : "Processing..."}
							</motion.div>
						)}

						{showChoice && (
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5 }}
								className="space-y-2"
							>
								<p className="text-red-300 text-lg">Computer chose:</p>
								<p className="text-2xl font-bold text-white">
									{finalResult?.game_result?.computer_move?.toUpperCase() || "ROCK"}
								</p>
							</motion.div>
						)}
					</div>
				</div>

				{/* Thinking Animation Overlay */}
				{isThinking && (
					<div className="absolute inset-0 pointer-events-none">
						{/* Floating particles */}
						{[...Array(6)].map((_, i) => (
							<motion.div
								key={i}
								className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-60"
								animate={{
									x: [
										Math.random() * 100 + "%",
										Math.random() * 100 + "%",
										Math.random() * 100 + "%"
									],
									y: [
										Math.random() * 100 + "%",
										Math.random() * 100 + "%",
										Math.random() * 100 + "%"
									],
									opacity: [0.6, 0.2, 0.6]
								}}
								transition={{
									duration: 3 + Math.random() * 2,
									repeat: Infinity,
									ease: "linear",
									delay: i * 0.5
								}}
							/>
						))}
					</div>
				)}

				{/* Result Glow Effect */}
				{showChoice && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 0.3, scale: 1.2 }}
						transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
						className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl"
					/>
				)}
			</div>

			{/* AI Info Footer */}
			<div className="mt-4 text-center">
				<div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
					<p className="text-sm text-slate-400 mb-1">AI Status</p>
					<div className="flex items-center justify-center gap-2">
						<motion.div
							animate={{ scale: [1, 1.2, 1] }}
							transition={{ duration: 1, repeat: Infinity }}
							className={`w-3 h-3 rounded-full ${
								isThinking ? "bg-yellow-400" : 
								showChoice ? "bg-green-400" : 
								"bg-cyan-400"
							}`}
						/>
						<span className="text-white text-sm font-medium">
							{isThinking ? "Computing" : showChoice ? "Complete" : "Ready"}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ComputerSection;
