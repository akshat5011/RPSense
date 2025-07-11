"use client";
import React from "react";
import { motion } from "motion/react";
import { useSelector } from "react-redux";
import RPSense from "../CustomUI/RPSense";
import PlayerModal from "./PlayerModal";
import { selectCurrentPlayer } from "../../redux/slices/gameDataSlice";

const MainMenu = ({ navigateTo }) => {
  // Get current player from Redux
  const currentPlayer = useSelector(selectCurrentPlayer);
  const playerName = currentPlayer?.name || "Guest";

  // Different white variants for testing
  const whiteVariants = {
    primary: "text-white/90",
    secondary: "text-white/70",
    accent: "text-white/60",
    muted: "text-white/50",
  };

  const MenuText = ({ children, onClick, className = "" }) => {
    return (
      <motion.div
        onClick={onClick}
        className={`
          cursor-pointer ${whiteVariants.secondary} text-2xl font-bold py-4 px-6
          transition-all duration-300 ease-out
          relative overflow-hidden
          ${className}
        `}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        whileHover={{
          scale: 1.08,
          x: 10,
          textShadow: "0 0 20px rgba(255, 255, 255, 0.8)",
          transition: { duration: 0.2 },
        }}
        whileTap={{
          scale: 0.95,
          transition: { duration: 0.1 },
        }}
      >
        {/* Animated underline */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400"
          initial={{ width: 0 }}
          whileHover={{ width: "100%" }}
          transition={{ duration: 0.3 }}
        />

        {/* Hover background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg"
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        />

        <span className="relative z-10">{children}</span>
      </motion.div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleExit = () => {
    const confirmExit = window.confirm("Exit RPSense?");
    
    if (confirmExit) {
      localStorage.setItem("rpsense_last_exit", new Date().toISOString());
      window.close();
      
      setTimeout(() => {
        if (!window.closed) {
          const shortcutKey = navigator.platform.includes('Mac') ? 'Cmd+W' : 'Ctrl+W';
          alert(`Please press ${shortcutKey} to close this tab`);
        }
      }, 500);
    }
  };

  return (
    <div className="h-screen w-screen grid grid-cols-2 overflow-hidden">
      {/* LEFT SIDE */}
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <motion.div
          className="text-center space-y-8 max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header Section */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <PlayerModal>
              <div
                className={`text-xl ${whiteVariants.secondary} flex items-center justify-center gap-3 cursor-pointer hover:text-cyan-300 transition-colors p-2 rounded-lg hover:bg-cyan-500/10`}
              >
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                <span>Player: </span>
                <span className={`${whiteVariants.primary} font-semibold underline decoration-cyan-400/50`}>
                  {playerName}
                </span>
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              </div>
            </PlayerModal>
          </motion.div>

          {/* Menu Options */}
          <motion.div className="space-y-6" variants={containerVariants}>
            <motion.div variants={itemVariants}>
              <MenuText onClick={() => navigateTo("play")}>
                Play
              </MenuText>
            </motion.div>

            <motion.div variants={itemVariants}>
              <MenuText onClick={() => navigateTo("scores")}>
              Scores
              </MenuText>
            </motion.div>

            <motion.div variants={itemVariants}>
              <MenuText onClick={() => navigateTo("settings")}>
                Settings
              </MenuText>
            </motion.div>

            <motion.div variants={itemVariants}>
              <MenuText onClick={() => navigateTo("how-to-play")}>
                How to Play
              </MenuText>
            </motion.div>

            <motion.div variants={itemVariants}>
              <MenuText
                onClick={handleExit}
                className="text-red-400/80 hover:text-red-300"
              >
                Exit Game
              </MenuText>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* RIGHT SIDE */}
      <div className="relative w-full h-full ">
        <div
          className="absolute w-full flex justify-center z-10"
          style={{ top: "25vh" }}
        >
          <RPSense className="relative" />
        </div>
      </div>
    </div>
  );
};

export default MainMenu;