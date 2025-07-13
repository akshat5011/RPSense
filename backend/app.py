from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from pyngrok import ngrok
from datetime import datetime
from utils.config import Config
from utils.image_utils import decode_frame_from_base64
from services.frame_processor import FrameProcessor
from flask_socketio import SocketIO, emit
from services.game_engine import GameEngine

# Initialize Flask app
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize frame processor
frame_processor = FrameProcessor()
# Initialize game engine
game_engine = GameEngine()


@app.route("/test", methods=["GET"])
def test_interface():
    """Render test interface for backend testing"""
    return render_template("test.html")


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


@socketio.on("frame_data")
def handle_frame_data(data):
    """Handle incoming frame data via WebSocket"""
    try:
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

        # Send real-time result immediately
        emit("real_time_result", real_time_result)

        # Send final result if ready
        if should_send_final and final_result:
            # Get player move from final result
            player_move = final_result["final_prediction"]

            # Only play if valid move (not 'invalid')
            if player_move in ["rock", "paper", "scissors"]:
                game_result = game_engine.play_round(player_move)
                final_result["game_result"] = game_result

            emit("final_result", final_result)

    except Exception as e:
        print(f"❌ WebSocket frame processing error: {str(e)}")
        emit("error", {"message": f"Processing failed: {str(e)}"})


@socketio.on("start_game")
def handle_start_game(data):
    """Handle game start event"""
    print(f"🎮 Game started with data: {data}")
    emit("game_started", {"message": "Game session started!", "data": data})


@socketio.on("stop_game")
def handle_stop_game():
    """Handle game stop event"""
    print("🛑 Game stopped")
    # Clear frame processor buffer
    frame_processor.postprocessor.clear_buffer()
    emit("game_stopped", {"message": "Game session ended!"})


def run_with_ngrok():
    """Run Flask app with ngrok tunnel"""
    ngrok.kill()

    port = Config.PORT
    public_url = ngrok.connect(port)

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
