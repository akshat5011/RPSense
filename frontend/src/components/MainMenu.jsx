"use client";
import React from "react";
import { motion } from "motion/react";
import { useSelector } from "react-redux";
import RPSense from "./RPSense";
import { selectCurrentPlayer } from "../redux/slices/gameDataSlice";

const MainMenu = ({ navigateTo }) => {
  // Get current player from Redux
  const currentPlayer = useSelector(selectCurrentPlayer);
  const playerName = currentPlayer?.name || "Guest";

  const MenuText = ({ children, onClick, className = "" }) => {
    return (
      <motion.div
        onClick={onClick}
        className={`
          cursor-pointer text-white text-xl font-medium py-2 px-4
          transition-all duration-300
          ${className}
        `}
        whileHover={{
          scale: 1.3,
          textShadow: "0 0 15px rgba(255, 255, 255, 0.8)",
        }}
        whileTap={{
          scale: 0.95
        }}
      >
        {children}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen grid grid-cols-2 text-white">
      {/* LEFT SIDE */}
      <div className="flex flex-col justify-center items-center">
        <div className="text-center space-y-4">
          
          <div className="text-lg mb-8">
            Player: {playerName}
          </div>
          
          <div className="space-y-3">
            <MenuText onClick={() => navigateTo("play")}>
              Start Game
            </MenuText>
            
            <MenuText onClick={() => navigateTo("scores")}>
              High Scores
            </MenuText>
            
            <MenuText onClick={() => navigateTo("settings")}>
              Settings
            </MenuText>
            
            <MenuText onClick={() => navigateTo("how-to-play")}>
              How to Play
            </MenuText>
            
            <MenuText 
              onClick={() => window.close()}
              className="text-red-400"
            >
              Exit Game
            </MenuText>
          </div>
        </div>
      </div>
      
      {/* RIGHT SIDE */}
      <div className="relative w-full h-full">
        <div
          className="absolute w-full flex justify-center z-10"
          style={{ top: "25vh" }}
        >
          <RPSense className="relative" />
        </div>
      </div>
    </div>
  );
};

export default MainMenu;