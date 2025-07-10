"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const GameButton = ({ label, link, variant = "primary", disabled = false }) => {
  const router = useRouter();

  const handleClick = () => {
    if (!disabled) {
      router.push(link);
    }
  };

  const variants = {
    primary: "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg",
    secondary: "bg-white/20 hover:bg-white/30 text-white border border-white/30"
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-full py-4 px-6 font-semibold rounded-xl transition-all duration-200 backdrop-blur-sm
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
      `}
    >
      {label}
    </motion.button>
  );
};

export default GameButton;