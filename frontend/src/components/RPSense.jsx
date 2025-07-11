"use client";
import React from "react";
import { motion } from "motion/react";

const RPSense = ({ 
  size = "text-6xl", 
  className = "",
  showSubtext = true,
  glowIntensity = "medium" 
}) => {
  const letters = "RPSense".split("");
  
  const glowVariants = {
    low: {
      textShadow: [
        "0 0 10px rgba(0, 255, 255, 0.3)",
        "0 0 15px rgba(160, 0, 255, 0.4)",
        "0 0 10px rgba(0, 255, 255, 0.3)",
      ],
    },
    medium: {
      textShadow: [
        "0 0 20px rgba(0, 255, 255, 0.5)",
        "0 0 30px rgba(160, 0, 255, 0.6)",
        "0 0 20px rgba(0, 255, 255, 0.5)",
      ],
    },
    high: {
      textShadow: [
        "0 0 30px rgba(0, 255, 255, 0.8)",
        "0 0 50px rgba(160, 0, 255, 0.9)",
        "0 0 30px rgba(0, 255, 255, 0.8)",
      ],
    },
  };

  return (
    <div className={`text-center ${className}`}>
      {/* Main RPSense Text */}
      <motion.div
        className="flex justify-center items-center space-x-1"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            className={`${size} font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent tracking-wide`}
            initial={{ 
              opacity: 0, 
              y: 50,
              rotateX: -90,
            }}
            animate={{ 
              opacity: 1, 
              y: 0,
              rotateX: 0,
              ...glowVariants[glowIntensity],
            }}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
              ease: "easeOut",
            }}
            whileHover={{
              scale: 1.2,
              y: -10,
              transition: { duration: 0.2 },
            }}
          >
            {letter}
          </motion.span>
        ))}
      </motion.div>

      {/* Animated Underline */}
      <motion.div
        className="flex justify-center mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          className="h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full"
          animate={{ 
            width: ["0%", "80%", "60%", "80%"],
            boxShadow: [
              "0 0 10px rgba(0, 255, 255, 0.5)",
              "0 0 20px rgba(160, 0, 255, 0.7)",
              "0 0 10px rgba(0, 255, 255, 0.5)",
            ],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
      </motion.div>

      {/* Subtext */}
      {showSubtext && (
        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <motion.p
            className="text-cyan-400/80 text-lg font-medium tracking-wider"
            animate={{ 
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            AI-Powered Gesture Recognition
          </motion.p>
        </motion.div>
      )}

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + Math.sin(i) * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Neural Network Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Connection Lines */}
          {[...Array(3)].map((_, i) => (
            <motion.path
              key={i}
              d={`M50,${80 + i * 20} Q200,${60 + i * 30} 350,${80 + i * 20}`}
              stroke="rgba(0, 255, 255, 0.2)"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                stroke: [
                  "rgba(0, 255, 255, 0.2)",
                  "rgba(160, 0, 255, 0.4)",
                  "rgba(0, 255, 255, 0.2)",
                ],
              }}
              transition={{
                duration: 4,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
          
          {/* Neural Nodes */}
          {[...Array(5)].map((_, i) => (
            <motion.circle
              key={i}
              cx={80 + i * 60}
              cy={100}
              r="2"
              fill="cyan"
              animate={{
                r: [2, 4, 2],
                opacity: [0.5, 1, 0.5],
                fill: ["#0ff", "#a0f", "#0ff"],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      </motion.div>
    </div>
  );
};

export default RPSense;