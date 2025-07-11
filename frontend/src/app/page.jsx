"use client";
import React, { useState, useEffect } from "react";
import Background from "../components/Background";
import PageTransition from "../components/PageTransition";
import MainMenu from "../components/MainMenu";
import GamePlay from "../components/GamePlay";
import Scores from "../components/Scores";
import Settings from "../components/Settings";
import HowToPlay from "../components/HowToPlay";
import Loading from "../components/Loading";

function SinglePageApp() {
  const [currentView, setCurrentView] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameData, setGameData] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    totalGames: 0,
    streak: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    // setMounted(true);

       const loadingTimer = setTimeout(() => {
      setMounted(true);
      setIsLoading(false);
    }, 20000); // 2 second loading


    // Load data from localStorage
    const savedName = localStorage.getItem("playerName");
    const savedGameData = localStorage.getItem("gameData");

    if (savedName) {
      setPlayerName(savedName);
    }
    if (savedGameData) {
      setGameData(JSON.parse(savedGameData));
    }

    return () => clearTimeout(loadingTimer);

  }, []);

  useEffect(() => {
    // Save data to localStorage
    if (playerName) {
      localStorage.setItem("playerName", playerName);
    }
    localStorage.setItem("gameData", JSON.stringify(gameData));
  }, [playerName, gameData]);

  const navigateTo = (view) => {
    setCurrentView(view);
  };

  const handleExit = () => {
    window.close();
  };

  if (!mounted) return null;

  const renderCurrentView = () => {
    switch (currentView) {
      case "menu":
        return (
          <MainMenu
            playerName={playerName}
            setPlayerName={setPlayerName}
            navigateTo={navigateTo}
            handleExit={handleExit}
          />
        );
      case "play":
        return (
          <GamePlay
            playerName={playerName}
            gameData={gameData}
            setGameData={setGameData}
            navigateTo={navigateTo}
          />
        );
      case "scores":
        return (
          <Scores
            gameData={gameData}
            playerName={playerName}
            navigateTo={navigateTo}
          />
        );
      case "settings":
        return (
          <Settings
            navigateTo={navigateTo}
            playerName={playerName}
            setPlayerName={setPlayerName}
          />
        );
      case "how-to-play":
        return <HowToPlay navigateTo={navigateTo} />;
      default:
        return null;
    }
  };



  // Show loading screen
    return (
      <div className="min-h-screen overflow-hidden relative">
        <Background />
        <Loading />
      </div>
    );



  return (
    <div className="min-h-screen overflow-hidden relative">
      <Background />
      
      <PageTransition currentView={currentView}>
        {renderCurrentView()}
      </PageTransition>
    </div>
  );
}

export default SinglePageApp;