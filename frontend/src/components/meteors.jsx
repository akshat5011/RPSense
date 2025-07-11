"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React from "react";

export const Meteors = ({
  number,
  className
}) => {
  const meteors = new Array(number || 20).fill(true);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 w-full h-full overflow-hidden"
    >
      {meteors.map((el, idx) => {
        
        return (
          <span
            key={"meteor" + idx}
            className={cn(
              "animate-meteor-effect absolute h-1 w-1 rotate-[45deg] rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10]",
              className
            )}
            style={{
              top: Math.random() * -100 - 50 + "px", // Start above screen
              left: Math.random() * 100 + "%", // Random horizontal position across full width
              animationDelay: Math.random() * 8 + "s",
              animationDuration: Math.floor(Math.random() * (12 - 6) + 6) + "s",
            }}
          />
        );
      })}
      
    </motion.div>
  );
};