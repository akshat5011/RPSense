"use client";
import React from "react";
import { motion } from "motion/react";
import RPSense from "./CustomUI/RPSense";

const HowToPlay = ({ navigateTo }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const gestureVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
    hover: {
      scale: 1.1,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        {/* Go Back Button */}
        <motion.div
          onClick={() => navigateTo("menu")}
          className="
            text-lg font-semibold py-2 px-4 cursor-pointer
            text-purple-400 hover:text-purple-300 
            hover:scale-105 transition-all duration-300
            relative
          "
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
         Go Back
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 hover:scale-x-100 transition-transform duration-300" />
        </motion.div>

        {/* RPSense Logo */}
        <RPSense size="text-4xl" />

        {/* Spacer for balance */}
        <div className="w-36"></div>
      </div>

      {/* Main Content */}
      <div className="px-8 pb-8 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Left Column - Game Rules */}
            <motion.div className="space-y-6" variants={itemVariants}>
              {/* Game Introduction */}
              <div className="rounded-lg border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm p-6">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
                  🎮 About RPSense
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  RPSense is an AI-powered Rock Paper Scissors game that uses
                  your camera and machine learning to detect your hand gestures
                  in real-time. Show your move to the camera and watch as our AI
                  recognizes it instantly!
                </p>
              </div>

              {/* Basic Rules */}
              <div className="rounded-lg border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm p-6">
                <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                  📋 Game Rules
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <span className="text-2xl">🗿</span>
                    <span className="text-green-400 font-semibold">
                      Rock crushes
                    </span>
                    <span className="text-2xl">✂️</span>
                    <span className="text-slate-300">Scissors</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <span className="text-2xl">✂️</span>
                    <span className="text-green-400 font-semibold">
                      Scissors cuts
                    </span>
                    <span className="text-2xl">📄</span>
                    <span className="text-slate-300">Paper</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <span className="text-2xl">📄</span>
                    <span className="text-green-400 font-semibold">
                      Paper covers
                    </span>
                    <span className="text-2xl">🗿</span>
                    <span className="text-slate-300">Rock</span>
                  </div>
                </div>
              </div>

              {/* Game Modes */}
              <div className="rounded-lg border border-green-500/30 bg-slate-900/50 backdrop-blur-sm p-6">
                <h2 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
                  🏆 Game Modes
                </h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">
                      Classic Mode
                    </h3>
                    <p className="text-slate-300 text-sm">
                      Quick single round games. Perfect for testing the AI or
                      having a quick match.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-purple-500/20">
                    <h3 className="text-lg font-semibold text-purple-400 mb-2">
                      Tournament Mode
                    </h3>
                    <p className="text-slate-300 text-sm">
                      Best of 3, 5, 7, 9, 11, 13, or 15 rounds. First to win the
                      majority wins the tournament!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - How to Play */}
            <motion.div className="space-y-6" variants={itemVariants}>
              {/* Hand Gestures */}
              <div className="rounded-lg border border-yellow-500/30 bg-slate-900/50 backdrop-blur-sm p-6">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                  ✋ Hand Gestures
                </h2>
                <p className="text-slate-300 mb-4 text-sm">
                  Show these gestures clearly to your camera for best AI
                  recognition:
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <motion.div
                    className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-600/30"
                    variants={gestureVariants}
                    whileHover="hover"
                  >
                    <div className="text-6xl mb-2">🗿</div>
                    <div className="text-white font-semibold">Rock</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Closed fist
                    </div>
                  </motion.div>
                  <motion.div
                    className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-600/30"
                    variants={gestureVariants}
                    whileHover="hover"
                  >
                    <div className="text-6xl mb-2">📄</div>
                    <div className="text-white font-semibold">Paper</div>
                    <div className="text-xs text-slate-400 mt-1">Open palm</div>
                  </motion.div>
                  <motion.div
                    className="text-center p-4 rounded-lg bg-slate-800/50 border border-slate-600/30"
                    variants={gestureVariants}
                    whileHover="hover"
                  >
                    <div className="text-6xl mb-2">✂️</div>
                    <div className="text-white font-semibold">Scissors</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Two fingers
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* How to Play Steps */}
              <div className="rounded-lg border border-orange-500/30 bg-slate-900/50 backdrop-blur-sm p-6">
                <h2 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                  🎯 How to Play
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "Setup Camera",
                      description:
                        "Allow camera access and position yourself clearly in view",
                      icon: "📹",
                    },
                    {
                      step: 2,
                      title: "Choose Game Mode",
                      description:
                        "Select Classic for quick games or Tournament for longer matches",
                      icon: "⚙️",
                    },
                    {
                      step: 3,
                      title: "Get Ready",
                      description:
                        "When the countdown starts, prepare your hand gesture",
                      icon: "⏰",
                    },
                    {
                      step: 4,
                      title: "Show Your Move",
                      description:
                        "Display your gesture clearly when capture begins (2 seconds)",
                      icon: "✋",
                    },
                    {
                      step: 5,
                      title: "See Results",
                      description:
                        "AI detects your move and determines the winner!",
                      icon: "🏆",
                    },
                  ].map((item) => (
                    <motion.div
                      key={item.step}
                      className="flex items-start gap-4 p-3 rounded-lg bg-slate-800/30"
                      variants={itemVariants}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 font-bold text-sm">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{item.icon}</span>
                          <h3 className="text-white font-semibold">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-slate-400 text-sm">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-lg border border-blue-500/30 bg-slate-900/50 backdrop-blur-sm p-6">
                <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                  💡 Pro Tips
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-slate-300 text-sm">
                      Ensure good lighting for better AI recognition
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-slate-300 text-sm">
                      Keep your hand steady during the 2-second capture
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-slate-300 text-sm">
                      Position your hand clearly in the camera frame
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-slate-300 text-sm">
                      Use distinct gestures - avoid partial hand positions
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-400 mt-1">⚠️</span>
                    <span className="text-slate-300 text-sm">
                      Show only one hand to avoid confusion
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Neon Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default HowToPlay;
