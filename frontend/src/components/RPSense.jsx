"use client";
import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const RPSense = ({
  size = "text-6xl",
  className = "",
  glowIntensity = "medium",
}) => {
  const letters = "RPSense".split("");

  const glowVariants = {
    low: "0 0 15px rgba(0, 255, 255, 0.4)",
    medium: "0 0 25px rgba(0, 255, 255, 0.6)",
    high: "0 0 40px rgba(0, 255, 255, 0.8)",
  };

  return (
    <div className={cn(className, "text-center")}>
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
              textShadow: glowVariants[glowIntensity],
            }}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
              ease: "easeOut",
            }}
            whileHover={{
              scale: 1.2,
              y: -10,
              textShadow: "0 0 30px rgba(0, 255, 255, 1)",
              transition: { type: "tween", duration: 0.2 },
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
            width: ["20%", "80%"],
            boxShadow: [
              "0 0 10px rgba(0, 255, 255, 0.5)",
              "0 0 20px rgba(160, 0, 255, 0.7)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Floating Particles */}
      <div className="relative pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + Math.sin(i) * 20}%`,
            }}
            animate={{
              y: [0, -20],
              opacity: [0.3, 1],
              scale: [1, 1.5],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default RPSense;
