"use client";
import React from "react";
import { motion } from "framer-motion";

const GameButton = ({
  label,
  onClick,
  variant = "primary",
  disabled = false,
  delay = 0,
}) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg border-green-400/30",
    secondary:
      "bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50",
    danger:
      "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg border-red-400/30",
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay },
    },
    hover: {
      scale: disabled ? 1 : 1.05,
      boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
      transition: { type: "spring", stiffness: 400, damping: 17 },
    },
    tap: {
      scale: disabled ? 1 : 0.95,
    },
  };

  return (
    <motion.button
      variants={buttonVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 px-6 font-bold text-lg rounded-xl transition-all duration-300 backdrop-blur-sm border
        ${variants[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        relative overflow-hidden
      `}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />
      <span className="relative z-10">{label}</span>
    </motion.button>
  );
};

export default GameButton;
