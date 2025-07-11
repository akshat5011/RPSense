"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainMenu from "../components/MainMenu";
import GamePlay from "../components/GamePlay";
import Scores from "../components/Scores";
import Settings from "../components/Settings";
import HowToPlay from "../components/HowToPlay";

function SinglePageApp() {
  const [currentView, setCurrentView] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [gameData, setGameData] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    totalGames: 0,
    streak: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    setMounted(true);
    // Load data from localStorage
    const savedName = localStorage.getItem("playerName");
    const savedGameData = localStorage.getItem("gameData");

    if (savedName) {
      setPlayerName(savedName);
    }
    if (savedGameData) {
      setGameData(JSON.parse(savedGameData));
    }
  }, []);

  useEffect(() => {
    // Save data to localStorage
    if (playerName) {
      localStorage.setItem("playerName", playerName);
    }
    localStorage.setItem("gameData", JSON.stringify(gameData));
  }, [playerName, gameData]);

  const navigateTo = (view) => {
    setCurrentView(view);
  };

  const handleExit = () => {
    window.close();
  };

  if (!mounted) return null;

  const pageVariants = {
    initial: { opacity: 0, scale: 0.95 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 0.95 },
  };

  const pageTransition = {
    type: "spring",
    stiffness: 120,
    damping: 20,
    duration: 0.6,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] overflow-hidden relative">
      {/* Neon Glow Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-gradient-radial from-cyan-400/10 via-purple-600/10 to-transparent"></div>
      </div>

      {/* Animated Particle Background */}
      <div className="absolute inset-0 z-0">
        {[...Array(60)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/30 rounded-full shadow-[0_0_16px_4px_rgba(0,255,255,0.4)]"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: Math.random() * 8 + 8,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>

      {/* Neon Hand Outline */}
      <div className="absolute left-1/2 top-1/2 z-0 pointer-events-none" style={{ transform: "translate(-50%, -60%)" }}>
        <svg width="320" height="320" viewBox="0 0 320 320" fill="none">
          <motion.path
            d="M80 220 Q100 180 120 220 Q140 260 160 220 Q180 180 200 220 Q220 260 240 220 Q260 180 280 220"
            stroke="cyan"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ filter: "drop-shadow(0 0 24px #0ff)" }}
            animate={{
              stroke: ["#0ff", "#a0f", "#0ff"],
              filter: [
                "drop-shadow(0 0 24px #0ff)",
                "drop-shadow(0 0 32px #a0f)",
                "drop-shadow(0 0 24px #0ff)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="relative z-10 h-screen flex items-center justify-center"
        >
          {currentView === "menu" && (
            <MainMenu
              playerName={playerName}
              setPlayerName={setPlayerName}
              navigateTo={navigateTo}
              handleExit={handleExit}
            />
          )}
          {currentView === "play" && (
            <GamePlay
              playerName={playerName}
              gameData={gameData}
              setGameData={setGameData}
              navigateTo={navigateTo}
            />
          )}
          {currentView === "scores" && (
            <Scores
              gameData={gameData}
              playerName={playerName}
              navigateTo={navigateTo}
            />
          )}
          {currentView === "settings" && (
            <Settings
              navigateTo={navigateTo}
              playerName={playerName}
              setPlayerName={setPlayerName}
            />
          )}
          {currentView === "how-to-play" && (
            <HowToPlay navigateTo={navigateTo} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default SinglePageApp;