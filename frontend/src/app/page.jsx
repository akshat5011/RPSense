"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GameButton from '../components/GameButton';

function Page() {
  const [playerName, setPlayerName] = useState('player 1');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load player name from localStorage
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  useEffect(() => {
    // Save player name to localStorage whenever it changes
    if (playerName) {
      localStorage.setItem('playerName', playerName);
    }
  }, [playerName]);

  const handleExit = () => {
    window.close();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 max-w-md w-full"
      >
        {/* Game Title */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">
            🪨 📄 ✂️
          </h1>
          <h2 className="text-3xl font-bold  mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Rock Paper Scissors
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
        </motion.div>

        {/* Player Input */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-8"
        >
        </motion.div>

        {/* Game Buttons */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="space-y-4"
        >
          <GameButton 
            label="🎮 Play" 
            link="/play" 
            variant="primary"
            disabled={!playerName.trim()}
          />
          <GameButton 
            label="🏆 Scores" 
            link="/scores" 
            variant="secondary"
          />
          <GameButton 
            label="⚙️ Settings" 
            link="/settings" 
            variant="secondary"
          />
          <GameButton 
            label="❓ How to Play" 
            link="/how-to-play" 
            variant="secondary"
          />
          <button 
            onClick={handleExit}
            className="w-full py-3 px-6 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg backdrop-blur-sm border border-red-500/30"
          >
            🚪 Exit
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-center text-white/60 text-sm mt-6"
        >
          {playerName ? `Welcome back, ${playerName}!` : 'Enter your name to start playing'}
        </motion.p>
      </motion.div>
    </div>
  );
}

export default Page;