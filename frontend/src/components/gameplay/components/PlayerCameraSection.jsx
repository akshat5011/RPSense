import React from "react";
import { motion } from "motion/react";

const PlayerCameraSection = ({
	videoRef,
	gameState,
	isCapturing,
	timer,
	playerChoice,
	cameraStream,
}) => {
	const getStatusMessage = () => {
		switch (gameState) {
			case "waiting":
				return "Ready to start";
			case "countdown":
				return "Get ready...";
			case "capturing":
				return `Make your move! ${timer}s`;
			case "waitingForResult":
				return "Move captured! Processing...";
			case "result":
				return "Round complete";
			case "finished":
				return "Game finished";
			default:
				return "Initializing...";
		}
	};

	const getStatusColor = () => {
		switch (gameState) {
			case "capturing":
				return "text-green-400";
			case "waitingForResult":
				return "text-yellow-400";
			case "result":
				return "text-blue-400";
			case "finished":
				return "text-purple-400";
			default:
				return "text-cyan-400";
		}
	};

	return (
		<div className="flex flex-col h-full">
			{/* Section Header */}
			<div className="text-center mb-4">
				<h2 className="text-3xl font-bold text-white mb-2">You</h2>
				<p className={`text-lg ${getStatusColor()}`}>
					{getStatusMessage()}
				</p>
			</div>

			{/* Video Feed Container */}
			<div className="flex-1 relative rounded-xl overflow-hidden bg-slate-800 border-2 border-slate-600">
				{/* Video Element */}
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					className="w-full h-full object-cover"
				/>

				{/* Camera Status Overlay */}
				{!cameraStream && (
					<div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
						<div className="text-center text-white">
							<div className="text-4xl mb-4">📹</div>
							<p className="text-lg">Initializing camera...</p>
						</div>
					</div>
				)}

				{/* Capture Indicator */}
				{isCapturing && (
					<motion.div
						animate={{ opacity: [1, 0.3, 1] }}
						transition={{ duration: 0.5, repeat: Infinity }}
						className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold"
					>
						● REC
					</motion.div>
				)}

				{/* Timer Overlay */}
				{gameState === "capturing" && (
					<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
						<motion.div
							key={timer}
							initial={{ scale: 1.2 }}
							animate={{ scale: 1 }}
							className="bg-black/70 text-white text-2xl font-bold px-4 py-2 rounded-full"
						>
							{timer}
						</motion.div>
					</div>
				)}

				{/* Processing Indicator */}
				{gameState === "waitingForResult" && (
					<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
							className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full"
						/>
					</div>
				)}

				{/* Player Choice Display */}
				{playerChoice && gameState === "result" && (
					<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
						<div className="bg-black/80 text-white text-center px-6 py-3 rounded-lg">
							<p className="text-sm text-cyan-300 mb-1">Your Choice</p>
							<div className="text-4xl">{playerChoice}</div>
						</div>
					</div>
				)}
			</div>

			{/* Additional Status Info */}
			<div className="mt-4 text-center">
				{gameState === "capturing" && (
					<motion.p
						animate={{ opacity: [0.5, 1, 0.5] }}
						transition={{ duration: 1, repeat: Infinity }}
						className="text-green-400 text-lg font-semibold"
					>
						Show your hand gesture clearly!
					</motion.p>
				)}
				{gameState === "waitingForResult" && (
					<p className="text-yellow-400 text-lg">
						Analyzing your move...
					</p>
				)}
			</div>
		</div>
	);
};

export default PlayerCameraSection;
