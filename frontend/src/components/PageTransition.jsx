"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const PageTransition = ({ currentView, children }) => {
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
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;