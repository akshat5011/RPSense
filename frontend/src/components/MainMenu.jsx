"use client";
import React from "react";
import { motion } from "framer-motion";
import PlayerInput from "./PlayerInput";

const MainMenu = ({ playerName, setPlayerName, navigateTo, handleExit }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      y: 50, 
      opacity: 0, 
      scale: 0.8 
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  // Word-by-word reveal animation for RPSense
  const titleVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.1,
      },
    },
  };

  const letterVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.8,
      rotateX: -90,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        duration: 0.6,
      },
    },
  };

  const CyberButton = ({ 
    children, 
    onClick, 
    variant = "outline", 
    disabled = false, 
    className = "" 
  }) => {
    const baseClasses = "relative overflow-hidden font-bold text-lg px-8 py-4 rounded-lg border transition-all duration-300 backdrop-blur-sm";
    
    const variantClasses = {
      outline: `border-cyan-400/50 text-cyan-400 bg-transparent hover:bg-cyan-400/10 hover:border-cyan-400 hover:text-cyan-300`,
      ghost: `border-transparent text-white/80 bg-white/5 hover:bg-white/10 hover:text-white`,
      primary: `border-emerald-400/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-400 hover:text-emerald-300`,
      danger: `border-red-400/50 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:border-red-400 hover:text-red-300`
    };

    return (
      <motion.button
        variants={itemVariants}
        whileHover={{
          scale: disabled ? 1 : 1.05,
          boxShadow: disabled ? "none" : "0 0 30px rgba(0, 255, 255, 0.3)",
          transition: { type: "spring", stiffness: 400, damping: 17 }
        }}
        whileTap={{
          scale: disabled ? 1 : 0.95
        }}
        onClick={onClick}
        disabled={disabled}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
          group w-full
        `}
      >
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        
        {/* Text with flicker effect */}
        <motion.span
          className="relative z-10"
          whileHover={{
            textShadow: [
              "0 0 0px rgba(0, 255, 255, 0)",
              "0 0 10px rgba(0, 255, 255, 0.8)",
              "0 0 5px rgba(0, 255, 255, 0.4)",
            ]
          }}
          transition={{ duration: 0.3, repeat: 2 }}
        >
          {children}
        </motion.span>
      </motion.button>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-cyan-400/20 max-w-md w-full"
        style={{
          boxShadow: "0 0 50px rgba(0, 255, 255, 0.1), inset 0 0 50px rgba(0, 255, 255, 0.05)"
        }}
      >
        {/* Game Title */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.h1
            className="text-5xl font-bold text-white mb-4 tracking-wide"
            animate={{
              textShadow: [
                "0 0 20px rgba(0, 255, 255, 0.5)",
                "0 0 30px rgba(160, 0, 255, 0.5)",
                "0 0 20px rgba(0, 255, 255, 0.5)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🤖 🎮 ⚡
          </motion.h1>
          
          {/* Word-by-word reveal for RPSense */}
          <motion.div
            variants={titleVariants}
            initial="hidden"
            animate="visible"
            className="text-4xl font-bold mb-4 tracking-wider"
          >
            {["R", "P", "S", "e", "n", "s", "e"].map((letter, index) => (
              <motion.span
                key={index}
                variants={letterVariants}
                className="inline-block bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent"
                style={{
                  textShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
                }}
                whileHover={{
                  scale: 1.2,
                  textShadow: "0 0 30px rgba(0, 255, 255, 0.8)",
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
          
          <motion.div
            className="w-20 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto rounded-full"
            animate={{ 
              width: [80, 120, 80],
              boxShadow: [
                "0 0 10px rgba(0, 255, 255, 0.5)",
                "0 0 20px rgba(160, 0, 255, 0.5)",
                "0 0 10px rgba(0, 255, 255, 0.5)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Player Input */}
        <motion.div variants={itemVariants} className="mb-8">
          <PlayerInput playerName={playerName} setPlayerName={setPlayerName} />
        </motion.div>

        {/* Game Buttons */}
        <motion.div variants={itemVariants} className="space-y-4">
          <CyberButton
            onClick={() => navigateTo("play")}
            variant="primary"
            disabled={!playerName.trim()}
          >
            🎮 Start Game
          </CyberButton>

          <CyberButton
            onClick={() => navigateTo("scores")}
            variant="outline"
          >
            🏆 High Scores
          </CyberButton>

          <CyberButton
            onClick={() => navigateTo("settings")}
            variant="ghost"
          >
            ⚙️ Settings
          </CyberButton>

          <CyberButton
            onClick={() => navigateTo("how-to-play")}
            variant="outline"
          >
            ❓ How to Play
          </CyberButton>

          <CyberButton
            onClick={handleExit}
            variant="danger"
          >
            🚪 Exit Game
          </CyberButton>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="text-center mt-8"
        >
          <motion.p 
            className="text-cyan-400/60 text-sm"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {playerName ? `Welcome, ${playerName}! Ready to play?` : "Enter your name to begin"}
          </motion.p>
          
          {/* Animated status dots */}
          <motion.div
            className="mt-4 flex justify-center space-x-2"
            variants={itemVariants}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-cyan-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MainMenu;