from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from pyngrok import ngrok
from datetime import datetime
from utils.config import Config
from utils.image_utils import decode_frame_from_base64
from services.frame_processor import FrameProcessor
from flask_socketio import SocketIO, emit
from services.game_engine import GameEngine
import time
import threading
from threading import Timer

# Initialize Flask app
app = Flask(__name__)
CORS(
    app,
    origins="*",
    allow_headers=[
        "Content-Type",
        "Authorization",
        "ngrok-skip-browser-warning",
        "Origin",
    ],
    methods=["GET", "POST", "OPTIONS"],
    supports_credentials=True,
)

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    allow_upgrades=True,
    transports=["websocket", "polling"],
    engineio_logger=False,
    socketio_logger=False,
    ping_timeout=60,
    ping_interval=25,
    max_http_buffer_size=10000000,  # 10MB for large images
)

frame_start_times = {}
client_timers = {}  # Store timers for each client


# Handle preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response


# Initialize frame processor
frame_processor = FrameProcessor()
# Initialize game engine
game_engine = GameEngine()


def handle_client_timeout(client_id):
    """Handle timeout for a specific client"""
    print(f"⏰ Client {client_id} timeout - sending default result")

    if client_id in frame_start_times:
        del frame_start_times[client_id]

    if client_id in client_timers:
        del client_timers[client_id]

    # Send timeout result
    timeout_result = {
        "status": "timeout",
        "final_prediction": "timeout",
        "confidence": 0.0,
        "message": "Processing timeout - Computer wins",
        "timestamp": time.time(),
        "game_result": game_engine.play_round("timeout"),
    }

    try:
        socketio.emit("final_result", timeout_result, room=client_id)
    except Exception as e:
        print(f"⚠️ Failed to send timeout result to {client_id}: {e}")


@app.route("/test", methods=["GET"])
def test_interface():
    """Render test interface for backend testing"""
    return render_template("index2.html")


@app.route("/", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify(
        {
            "status": "success",
            "message": "RPSense Server is running!",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0",
        }
    )


# ===== WEBSOCKET EVENTS =====


@socketio.on("connect")
def handle_connect():
    print("🔌 Client connected")
    emit(
        "connected",
        {
            "message": "Connected to RPSense WebSocket!",
            "timestamp": datetime.now().isoformat(),
        },
    )


@socketio.on("disconnect")
def handle_disconnect():
    print("🔌 Client disconnected")
    client_id = request.sid

    # Clean up timing data for this client
    if client_id in frame_start_times:
        del frame_start_times[client_id]

    # Cancel timeout timer
    if client_id in client_timers:
        client_timers[client_id].cancel()
        del client_timers[client_id]

@socketio.on("capture_complete")
def handle_capture_complete(data):
    """Handle capture completion notification from frontend"""
    client_id = request.sid
    print(f"📥 Client {client_id} completed capture: {data['totalFrames']} frames")
    
    # Give processor 3 more seconds to finish after capture complete
    if client_id in client_timers:
        # Cancel existing timer
        client_timers[client_id].cancel()
        
        # Start new 3-second timer for processing
        timer = Timer(3.0, handle_client_timeout, args=[client_id])
        timer.start()
        client_timers[client_id] = timer
        print(f"⏰ Extended timeout: 3s for processing after capture complete")


@socketio.on("frame_data")
def handle_frame_data(data):
    """Handle incoming frame data via WebSocket"""
    try:
        # Track frame processing start time per client
        client_id = request.sid
        current_time = time.time()

        # Initialize or update frame timing
        if client_id not in frame_start_times:
            frame_start_times[client_id] = current_time

            # Start 6-second timeout from first frame
            timer = Timer(6.0, handle_client_timeout, args=[client_id])
            timer.start()
            client_timers[client_id] = timer
            print(f"⏰ Started 6s timeout for client {client_id}")
            
        # Update last frame time for this client
        frame_start_times[client_id] = current_time

        # Extract frame and game data
        frame_base64 = data.get("frame")
        game_data = data.get("gameData", {})

        # Decode base64 frame to image
        if not frame_base64:
            emit("error", {"message": "No frame data provided"})
            return

        image = decode_frame_from_base64(frame_base64)
        if image is None:
            emit("error", {"message": "Invalid image format"})
            return

        # Process frame
        status, real_time_result, should_send_final, final_result = (
            frame_processor.process_frame(image, frame_metadata=game_data)
        )

        # Always emit real-time result
        if status == "success":
            emit("real_time_result", real_time_result)
        else:
            emit(
                "real_time_result",
                {
                    "status": status,
                    "prediction": "invalid",
                    "confidence": 0.0,
                    "message": real_time_result.get("message", "Hand detection failed"),
                    "timestamp": real_time_result.get("timestamp", time.time()),
                },
            )

        # Send final result if ready
        if should_send_final:
            client_id = request.sid

            # Cancel timeout timer since we're sending result
            if client_id in client_timers:
                client_timers[client_id].cancel()
                del client_timers[client_id]

            # Clear timing for this client
            if client_id in frame_start_times:
                del frame_start_times[client_id]

            if final_result:
                player_move = final_result["final_prediction"]
                game_result = game_engine.play_round(player_move)
                final_result["game_result"] = game_result
                emit("final_result", final_result)
            else:
                # Handle case when should_send_final=True but no final_result
                invalid_result = {
                    "status": "invalid",
                    "final_prediction": "invalid",
                    "confidence": 0.0,
                    "message": "No valid gesture detected",
                    "timestamp": time.time(),
                    "game_result": game_engine.play_round("invalid"),
                }
                emit("final_result", invalid_result)

    except Exception as e:
        print(f"❌ WebSocket frame processing error: {str(e)}")

        # Clear timing on error
        client_id = request.sid
        if client_id in frame_start_times:
            del frame_start_times[client_id]
        if client_id in client_timers:
            client_timers[client_id].cancel()
            del client_timers[client_id]

        # Create error result where computer wins
        error_result = {
            "status": "error",
            "final_prediction": "error",
            "confidence": 0.0,
            "message": f"Processing failed: {str(e)}",
            "timestamp": time.time(),
            "game_result": game_engine.play_round("error"),
        }
        emit("final_result", error_result)


@socketio.on("start_game")
def handle_start_game(data):
    """Handle game start event"""
    print(f"🎮 Game started with data: {data}")

    client_id = request.sid

    # Clear any existing timing data for this client
    if client_id in frame_start_times:
        del frame_start_times[client_id]

    # Cancel any existing timer
    if client_id in client_timers:
        client_timers[client_id].cancel()
        del client_timers[client_id]

    # Clear frame processor buffer for fresh start
    frame_processor.postprocessor.clear_buffer()

    emit("game_started", {"message": "Game session started!", "data": data})


@socketio.on("stop_game")
def handle_stop_game():
    """Handle game stop event"""
    print("🛑 Game stopped")

    # Clear timing data for this client
    client_id = request.sid
    if client_id in frame_start_times:
        del frame_start_times[client_id]

    if client_id in client_timers:
        client_timers[client_id].cancel()
        del client_timers[client_id]

    # Clear frame processor buffer
    frame_processor.postprocessor.clear_buffer()

    emit("game_stopped", {"message": "Game session ended!"})


def run_with_ngrok():
    """Run Flask app with ngrok tunnel"""
    ngrok.kill()

    port = Config.PORT
    public_url = ngrok.connect(port, bind_tls=True)

    print("=" * 50)
    print("🚀 RPSense WebSocket Server Starting...")
    print("=" * 50)
    print(f"📡 Local URL:  http://localhost:{port}")
    print(f"🌐 Public URL: {public_url}")
    print("=" * 50)
    print("📋 Available Events:")
    print("   connect          - Client connection")
    print("   frame_data       - Process game frames")
    print("   start_game       - Start game session")
    print("   stop_game        - Stop game session")
    print("=" * 50)
    print("✅ WebSocket server is ready!")
    print("🔄 Use Ctrl+C to stop the server")
    print("=" * 50)

    return public_url


if __name__ == "__main__":
    try:
        # Get ngrok URL
        public_url = run_with_ngrok()

        # Run Flask app with SocketIO
        socketio.run(
            app,
            host=Config.HOST,
            port=Config.PORT,
            debug=Config.DEBUG,
            use_reloader=False,
        )

    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        ngrok.kill()
        print("✅ Server stopped successfully!")
    except Exception as e:
        print(f"❌ Error starting server: {str(e)}")
        ngrok.kill()
