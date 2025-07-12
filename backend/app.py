from flask import Flask, request, jsonify,  render_template
from flask_cors import CORS
import os
from pyngrok import ngrok
import json
from datetime import datetime
from utils.config import Config
from utils.image_utils import decode_frame_from_base64
from services.frame_processor import FrameProcessor
from flask_socketio import SocketIO, emit

# Initialize Flask app
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize frame processor
frame_processor = FrameProcessor()


@app.route('/test', methods=['GET'])
def test_interface():
    """Render test interface for backend testing"""
    return render_template('index.html')


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

@app.route("/gameplay", methods=["POST"])
def gameplay():
    """Handle gameplay requests from frontend"""
    try:
        # Get uploaded frame
        if "frame" not in request.files:
            return jsonify({"status": "error", "message": "No frame provided"}), 400

        frame_file = request.files["frame"]

        # Get game data
        game_data_str = request.form.get("gameData", "{}")
        game_data = json.loads(game_data_str)

        # Read frame as image
        frame_bytes = frame_file.read()
        import cv2
        import numpy as np

        nparr = np.frombuffer(frame_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            return jsonify({"status": "error", "message": "Invalid image format"}), 400

        # Process frame
        status, real_time_result, should_send_final, final_result = (
            frame_processor.process_frame(image, frame_metadata=game_data)
        )

        # Prepare response
        response_data = {"real_time": real_time_result}

        if should_send_final and final_result:
            response_data["final_result"] = final_result

        return jsonify(response_data)

    except Exception as e:
        print(f"Error processing gameplay request: {str(e)}")
        return (
            jsonify({"status": "error", "message": f"Processing failed: {str(e)}"}),
            500,
        )


@socketio.on("connect")
def handle_connect():
    print("Client connected")
    emit("server_message", {"message": "Welcome to RPSense WebSocket!"})


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


def run_with_ngrok():
    """Run Flask app with ngrok tunnel"""
    ngrok.kill()

    port = Config.PORT
    public_url = ngrok.connect(port)

    print("=" * 50)
    print("🚀 RPSense ML Server Starting...")
    print("=" * 50)
    print(f"📡 Local URL:  http://localhost:{port}")
    print(f"🌐 Public URL: {public_url}")
    print("=" * 50)
    print("📋 Available Endpoints:")
    print("   GET  /          - Health check")
    print("   POST /gameplay  - Process game frames")
    print("=" * 50)
    print("✅ Server is ready to receive requests!")
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
