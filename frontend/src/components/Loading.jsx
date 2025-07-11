"use client";
import React from "react";
import { motion } from "motion/react";

const Loading = () => {
  const loadingText = "LOADING...";

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="text-center z-50"
      >
        {/* Animated LOADING Text */}
        <div className="flex justify-center space-x-2 mb-8">
          {loadingText.split("").map((letter, index) => (
            <motion.span
              key={index}
              className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent"
              animate={{
                y: [0, -20, 0],
                textShadow: [
                  "0 0 20px rgba(0, 255, 255, 0.5)",
                  "0 0 30px rgba(160, 0, 255, 0.8)",
                  "0 0 20px rgba(0, 255, 255, 0.5)",
                ],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                delay: index * 0.1,
                ease: "easeInOut",
              }}
            >
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Loading;