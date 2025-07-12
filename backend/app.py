from flask import Flask, request, jsonify
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

@app.route('/gameplay', methods=['POST'])
def gameplay():
    """Handle gameplay requests from frontend"""
    try:
        # Get uploaded frame
        if 'frame' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No frame provided'
            }), 400
        
        frame_file = request.files['frame']
        
        # Get game data
        game_data_str = request.form.get('gameData', '{}')
        game_data = json.loads(game_data_str)
        
        # Read frame as image
        frame_bytes = frame_file.read()
        import cv2
        import numpy as np
        nparr = np.frombuffer(frame_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({
                'status': 'error',
                'message': 'Invalid image format'
            }), 400
        
        # Process frame
        status, real_time_result, should_send_final, final_result = frame_processor.process_frame(
            image, 
            frame_metadata=game_data
        )
        
        # Prepare response
        response_data = {
            'real_time': real_time_result
        }
        
        if should_send_final and final_result:
            response_data['final_result'] = final_result
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error processing gameplay request: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Processing failed: {str(e)}'
        }), 500



@socketio.on("connect")
def handle_connect():
    print("Client connected")
    emit("server_message", {"message": "Welcome to RPSense WebSocket!"})


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


if __name__ == "__main__":
    socketio.run(app, host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
