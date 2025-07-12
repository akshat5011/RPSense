import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectGameMode, selectRounds, selectCurrentRound } from '@/redux/slices/gameSlice';

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
  const [computerChoice, setComputerChoice] = useState('🗿'); // Static rock for now
  const [gameInfo, setGameInfo] = useState({
    gameMode,
    totalRounds: rounds,
    currentRound: currentRound + 1,
    playerScore: 0,
    computerScore: 0
  });

  const ML_SERVER = process.env.REACT_APP_ML_SERVER || 'http://localhost:5000';

  // Initialize camera
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  // Send frame to ML server
  const sendFrameToAPI = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const formData = new FormData();
      formData.append('frame', blob, 'frame.jpg');
      formData.append('gameData', JSON.stringify(gameInfo));
      
      try {
        const response = await fetch(`${ML_SERVER}/gameplay`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('ML Server Response:', result);
          // Handle response (player gesture detection, game logic, etc.)
        }
      } catch (error) {
        console.error('Error sending frame to ML server:', error);
      }
    }, 'image/jpeg', 0.8);
  };

  // Start/Stop capturing frames
  const toggleCapture = () => {
    setIsCapturing(!isCapturing);
  };

  // Send frames periodically when capturing
  useEffect(() => {
    let interval;
    if (isCapturing) {
      interval = setInterval(sendFrameToAPI, 1000); // Send frame every second
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCapturing, gameInfo]);

  // Initialize camera on component mount
  useEffect(() => {
    initCamera();
    
    // Cleanup function
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Computer choices for display
  const computerChoices = {
    rock: '🗿',
    paper: '📄',
    scissors: '✂️'
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4">
        <div
          onClick={() => navigateTo("menu")}
          className="
            text-lg font-semibold py-2 px-4 cursor-pointer
            text-purple-400 hover:text-purple-300 
            hover:scale-105 transition-all duration-300
            relative
          "
        >
          ← Exit Game
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 hover:scale-x-100 transition-transform duration-300" />
        </div>

        {/* Game Info */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Rock Paper Scissors</h1>
          <div className="text-cyan-400">
            Round {gameInfo.currentRound} of {gameInfo.totalRounds} • {gameMode.toUpperCase()} MODE
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className="text-white font-semibold">Score</div>
          <div className="text-green-400">Player: {gameInfo.playerScore}</div>
          <div className="text-red-400">Computer: {gameInfo.computerScore}</div>
        </div>
      </div>

      {/* Main Game Area - Two Grids */}
      <div className="grid grid-cols-2 gap-8 px-8 h-[calc(100vh-120px)]">
        
        {/* LEFT SIDE - Player Camera */}
        <div className="flex flex-col">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-cyan-400 mb-2">Your Move</h2>
            <p className="text-slate-300 text-sm">Show your hand gesture to the camera</p>
          </div>
          
          <div className="relative flex-1 rounded-lg border-2 border-cyan-500/30 bg-slate-900/50 overflow-hidden">
            {/* Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none" />
            
            {/* Camera Status */}
            <div className="absolute top-4 left-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                cameraStream ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  cameraStream ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`} />
                <span className="text-sm font-medium">
                  {cameraStream ? 'Camera Active' : 'No Camera'}
                </span>
              </div>
            </div>

            {/* Capture Button */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                onClick={toggleCapture}
                disabled={!cameraStream}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  isCapturing
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                } ${!cameraStream ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isCapturing ? 'Stop Capture' : 'Start Capture'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Computer Choice */}
        <div className="flex flex-col">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-purple-400 mb-2">Computer's Move</h2>
            <p className="text-slate-300 text-sm">AI is thinking...</p>
          </div>
          
          <div className="relative flex-1 rounded-lg border-2 border-purple-500/30 bg-slate-900/50 flex items-center justify-center">
            {/* Computer Choice Display */}
            <div className="text-center">
              <div className="text-9xl mb-4 animate-pulse">
                {computerChoice}
              </div>
              <div className="text-2xl font-bold text-purple-400">
                Rock
              </div>
              <div className="text-slate-400 mt-2">
                Computer's Choice
              </div>
            </div>

            {/* AI Status */}
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-sm font-medium">AI Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Canvas for Frame Capture */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-slate-900/50 p-2 rounded">
          <div>ML Server: {ML_SERVER}</div>
          <div>Capturing: {isCapturing ? 'Yes' : 'No'}</div>
          <div>Camera: {cameraStream ? 'Connected' : 'Disconnected'}</div>
        </div>
      )}

      {/* Neon Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default ActivePlay;