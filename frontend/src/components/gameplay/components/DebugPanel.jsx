import React from "react";
import { motion } from "motion/react";

const DebugPanel = ({
	apiConnected,
	gameState,
	isCapturing,
	bufferSize,
}) => {
	const getConnectionStatus = () => {
		if (apiConnected) {
			return { text: "Connected", color: "text-green-400", icon: "🟢" };
		} else {
			return { text: "Disconnected", color: "text-red-400", icon: "🔴" };
		}
	};

	const getGameStateDisplay = () => {
		const states = {
			waiting: { text: "Waiting", color: "text-cyan-400" },
			countdown: { text: "Countdown", color: "text-yellow-400" },
			capturing: { text: "Capturing", color: "text-green-400" },
			waitingForResult: { text: "Processing", color: "text-orange-400" },
			result: { text: "Result", color: "text-blue-400" },
			finished: { text: "Finished", color: "text-purple-400" },
		};
		
		return states[gameState] || { text: "Unknown", color: "text-slate-400" };
	};

	const connectionStatus = getConnectionStatus();
	const gameStateDisplay = getGameStateDisplay();

	return (
		<motion.div
			initial={{ opacity: 0, y: 50 }}
			animate={{ opacity: 1, y: 0 }}
			className="fixed bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4"
		>
			<div className="flex items-center justify-between">
				{/* Left side - Connection Status */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<span className="text-slate-400 text-sm">API:</span>
						<span className={connectionStatus.color}>
							{connectionStatus.icon} {connectionStatus.text}
						</span>
					</div>

					{/* Game State */}
					<div className="flex items-center gap-2">
						<span className="text-slate-400 text-sm">State:</span>
						<span className={gameStateDisplay.color}>
							{gameStateDisplay.text}
						</span>
					</div>

					{/* Capturing Status */}
					{isCapturing && (
						<motion.div
							animate={{ opacity: [1, 0.5, 1] }}
							transition={{ duration: 1, repeat: Infinity }}
							className="flex items-center gap-2"
						>
							<span className="text-slate-400 text-sm">Capturing:</span>
							<span className="text-red-400">● Active</span>
						</motion.div>
					)}
				</div>

				{/* Right side - Buffer Info */}
				<div className="flex items-center gap-4">
					{/* Buffer Size */}
					{bufferSize > 0 && (
						<div className="flex items-center gap-2">
							<span className="text-slate-400 text-sm">Buffer:</span>
							<span className="text-cyan-400">
								{bufferSize} frames
							</span>
						</div>
					)}

					{/* System Status */}
					<div className="flex items-center gap-2">
						<span className="text-slate-400 text-sm">System:</span>
						<motion.div
							animate={{ scale: [1, 1.1, 1] }}
							transition={{ duration: 2, repeat: Infinity }}
							className="w-2 h-2 bg-green-400 rounded-full"
						/>
						<span className="text-green-400 text-sm">Online</span>
					</div>
				</div>
			</div>

			{/* Additional Debug Info (only show when relevant) */}
			{(gameState === "capturing" || gameState === "waitingForResult") && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					className="mt-2 pt-2 border-t border-slate-600/30"
				>
					<div className="flex items-center justify-between text-sm">
						<span className="text-slate-400">
							{gameState === "capturing" 
								? "Collecting frames for ML analysis..." 
								: "Sending data to backend for processing..."
							}
						</span>
						
						{gameState === "waitingForResult" && (
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
								className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"
							/>
						)}
					</div>
				</motion.div>
			)}
		</motion.div>
	);
};

export default DebugPanel;
