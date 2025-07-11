"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import PageTransition from "../components/PageTransition";
import MainMenu from "../components/MainMenu/MainMenu";
import GamePlay from "../components/MainMenu/GamePlay";
import Scores from "../components/Scores";
import Settings from "../components/Settings";
import HowToPlay from "../components/HowToPlay";
import Loading from "../components/CustomUI/Loading";
import { selectCurrentView, setCurrentView } from "../redux/slices/viewSlice";
import RPSense from "@/components/CustomUI/RPSense";
import { changePlayerByName } from "../redux/slices/gameDataSlice";


function SinglePageApp() {
  const dispatch = useDispatch();
  const currentView = useSelector(selectCurrentView);

  const [playerName, setPlayerName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setMounted(true);
      setIsLoading(false);
    }, 2000); // 2 second loading

    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
      dispatch(changePlayerByName(savedName));
    }

    return () => clearTimeout(loadingTimer);
  }, [dispatch]);

   useEffect(() => {
    if (playerName) {
      localStorage.setItem("playerName", playerName);
      dispatch(changePlayerByName(playerName));
    }
  }, [playerName, dispatch]);

  // Navigation function using Redux
  const navigateTo = (view) => {
    dispatch(setCurrentView(view)); // Update global Redux state
  };

  // Show loading screen
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen overflow-hidden relative">
        <Loading />
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (
      currentView // Using Redux state
      
    ) {
      case "menu":
        return (
          <MainMenu
            navigateTo={navigateTo}
          />
        );
      case "play":
        return <GamePlay playerName={playerName} navigateTo={navigateTo} />;
      case "scores":
        return <Scores playerName={playerName} navigateTo={navigateTo} />;
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

  return (
     <div className="h-screen w-screen overflow-hidden relative">
    <PageTransition currentView={currentView}>
      {renderCurrentView()}
    </PageTransition>
  </div>
  );
}

export default SinglePageApp;
