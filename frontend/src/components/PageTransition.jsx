"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PageTransition Component
 * 
 * Provides smooth page transitions using Framer Motion animations.
 * Handles entrance and exit animations for different views in the application.
 * 
 * @param {Object} props - Component props
 * @param {string} props.currentView - Current view identifier for animation key
 * @param {React.ReactNode} props.children - Child components to animate
 */
const PageTransition = ({ currentView, children }) => {
  // Animation variants for page transitions
  const pageVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.95 
    },
    in: { 
      opacity: 1, 
      scale: 1 
    },
    out: { 
      opacity: 0, 
      scale: 0.95 
    },
  };

  // Transition configuration for smooth spring animations
  const pageTransition = {
    type: "spring",
    stiffness: 120,
    damping: 20,
    duration: 0.6,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="relative z-10 h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;