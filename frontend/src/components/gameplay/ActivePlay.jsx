import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectGameMode,
  selectRounds,
  selectCurrentRound,
} from "@/redux/slices/gameSlice";

// Components
import GameHeader from "./GameHeader";
import PlayerCameraSection from "./PlayerCameraSection";
import ComputerSection from "./ComputerSection";
import DebugPanel from "./DebugPanel";
import NeonEffects from "./ui/NeonEffects";
import HiddenCanvas from "./ui/HiddenCanvas";

const ActivePlay = ({ navigateTo }) => {
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Redux state
  const gameMode = useSelector(selectGameMode);
  const rounds = useSelector(selectRounds);
  const currentRound = useSelector(selectCurrentRound);

  // Local state
  const [cameraStream, setCameraStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [computerChoice, setComputerChoice] = useState("🗿");
  const [gameInfo, setGameInfo] = useState({
    gameMode,
    totalRounds: rounds,
    currentRound: currentRound + 1,
    playerScore: 0,
    computerScore: 0,
  });

  const ML_SERVER = process.env.REACT_APP_ML_SERVER || "http://localhost:5000";

  // Initialize camera
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Failed to access camera. Please check permissions.");
    }
  };

  // Send frame to ML server
  const sendFrameToAPI = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("frame", blob, "frame.jpg");
        formData.append("gameData", JSON.stringify(gameInfo));

        try {
          const response = await fetch(`${ML_SERVER}/gameplay`, {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            console.log("ML Server Response:", result);
          }
        } catch (error) {
          console.error("Error sending frame to ML server:", error);
        }
      },
      "image/jpeg",
      0.8
    );
  };

  // Toggle capture
  const toggleCapture = () => {
    setIsCapturing(!isCapturing);
  };

  // Send frames periodically when capturing
  useEffect(() => {
    let interval;
    if (isCapturing) {
      interval = setInterval(sendFrameToAPI, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCapturing, gameInfo]);

  // Initialize camera on mount
  useEffect(() => {
    initCamera();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 overflow-hidden">
      <GameHeader
        navigateTo={navigateTo}
        gameInfo={gameInfo}
        gameMode={gameMode}
      />

      <div className="grid grid-cols-2 gap-8 px-8 h-[calc(100vh-120px)]">
        <PlayerCameraSection
          videoRef={videoRef}
          cameraStream={cameraStream}
          isCapturing={isCapturing}
          onToggleCapture={toggleCapture}
        />

        <ComputerSection computerChoice={computerChoice} />
      </div>

      <HiddenCanvas canvasRef={canvasRef} />

      <DebugPanel
        mlServer={ML_SERVER}
        isCapturing={isCapturing}
        cameraStream={cameraStream}
      />

      <NeonEffects />
    </div>
  );
};

export default ActivePlay;
