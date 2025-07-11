"use client";
import React from "react";
import { motion } from "framer-motion";

const PlayerInput = ({ playerName, setPlayerName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-3"
    >
      <label className="block text-cyan-400 font-semibold text-sm items-center gap-2">
        <motion.span
          animate={{ 
            rotate: [0, 10, -10, 0],
            textShadow: [
              "0 0 5px rgba(0, 255, 255, 0.5)",
              "0 0 10px rgba(0, 255, 255, 0.8)",
              "0 0 5px rgba(0, 255, 255, 0.5)",
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          👤
        </motion.span>
        Player Identity
      </label>
      
      <motion.div className="relative">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your handle..."
          className="w-full py-4 px-4 bg-black/40 border-2 border-cyan-400/30 rounded-xl text-cyan-300 placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 backdrop-blur-sm transition-all duration-300 font-medium"
          maxLength={20}
          style={{
            boxShadow: "inset 0 0 20px rgba(0, 255, 255, 0.1)"
          }}
        />
        
        <motion.div
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-400"
          animate={{ 
            opacity: playerName ? 1 : 0.3,
            scale: playerName ? [1, 1.2, 1] : 1,
            textShadow: playerName ? "0 0 10px rgba(0, 255, 255, 0.8)" : "none"
          }}
          transition={{ duration: 0.5 }}
        >
          ⚡
        </motion.div>
      </motion.div>
      
      {playerName && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-emerald-400 text-xs font-medium flex items-center gap-1"
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            🔄
          </motion.span>
          System ready for combat!
        </motion.p>
      )}
    </motion.div>
  );
};

export default PlayerInput;