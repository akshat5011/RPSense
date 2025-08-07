from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from pyngrok import ngrok
from datetime import datetime
from utils.config import Config
from utils.image_utils import decode_frame_from_base64
from services.frame_processor import FrameProcessor
from services.game_engine import GameEngine
import time

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


# Handle preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response


# Initialize components
frame_processor = FrameProcessor()
game_engine = GameEngine()


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


@app.route("/test", methods=["GET"])
def test_interface():
    """Render test interface for backend testing"""
    return render_template("index2.html")


@app.route("/model-test", methods=["GET"])
def model_test_interface():
    """Render real-time model testing interface with camera and gesture detection"""
    return render_template("model_test.html")


@app.route("/process-single-frame", methods=["POST"])
def process_single_frame():
    """
    Process a single frame for real-time model testing
    Returns gesture prediction, confidence, and bounding box data
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        frame_base64 = data.get("frame")
        if not frame_base64:
            return jsonify({"error": "No frame provided"}), 400
            
        print("📥 Processing single frame for model testing")
        
        # Decode frame
        image = decode_frame_from_base64(frame_base64)
        if image is None:
            return jsonify({"error": "Failed to decode frame"}), 400
            
        # Add minimal frame metadata for testing
        frame_metadata = {
            "timestamp": data.get("timestamp", time.time()),
            "frameId": data.get("frameId", 1),
            "testing_mode": True
        }
        
        # Process frame
        status, real_time_result, should_send_final, final_result = (
            frame_processor.process_frame(image, frame_metadata=frame_metadata)
        )
        
        if status == "success" and real_time_result:
            print(f"✅ Frame processed successfully: {real_time_result.get('prediction', 'unknown')}")
            return jsonify({
                "status": "success",
                "prediction": real_time_result.get("prediction", "unknown"),
                "confidence": real_time_result.get("confidence", 0.0),
                "detected_hand": real_time_result.get("detected_hand", False),
                "bounding_box": real_time_result.get("bounding_box", None),
                "landmarks": real_time_result.get("landmarks", None),
                "processed_image": real_time_result.get("processed_image", None),
                "timestamp": time.time()
            })
        else:
            print("⚠️ No detection in frame")
            return jsonify({
                "status": "no_detection",
                "prediction": "none",
                "confidence": 0.0,
                "detected_hand": False,
                "bounding_box": None,
                "landmarks": None,
                "processed_image": None,
                "timestamp": time.time()
            })
        
    except Exception as e:
        print(f"❌ Error in process_single_frame: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/process-frames", methods=["POST"])
def process_frames():
    """
    Process a batch of frames via HTTP POST
    Expects JSON payload with frames array and game metadata
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        frames = data.get("frames", [])
        game_data = data.get("gameData", {})
        
        if not frames:
            return jsonify({"error": "No frames provided"}), 400
            
        print(f"📥 Processing {len(frames)} frames from HTTP request")
        print(f"🎮 Game data: {game_data}")
        
        # Clear frame processor buffer for fresh start
        frame_processor.postprocessor.clear_buffer()
        
        # Process each frame in the batch
        processed_count = 0
        last_real_time_result = None
        
        for i, frame_data in enumerate(frames):
            frame_base64 = frame_data.get("frame")
            if not frame_base64:
                continue
                
            # Decode frame
            image = decode_frame_from_base64(frame_base64)
            if image is None:
                continue
                
            # Add frame metadata
            frame_metadata = {
                **game_data,
                "timestamp": frame_data.get("timestamp"),
                "frameId": frame_data.get("frameId", i)
            }
            
            # Process frame
            status, real_time_result, should_send_final, final_result = (
                frame_processor.process_frame(image, frame_metadata=frame_metadata)
            )
            
            if status == "success":
                processed_count += 1
                last_real_time_result = real_time_result
                
                # If we have a final result, use it
                if should_send_final and final_result:
                    player_move = final_result["final_prediction"]
                    game_result = game_engine.play_round(player_move)
                    final_result["game_result"] = game_result
                    
                    print(f"✅ Final result ready after {processed_count} frames")
                    return jsonify(final_result)
        
        # If no final result but we processed frames, return last real-time result
        if last_real_time_result:
            print(f"📤 Returning last real-time result after {processed_count} frames")
            player_move = last_real_time_result.get("prediction", "timeout")
            game_result = game_engine.play_round(player_move)
            
            response = {
                "status": "success",
                "final_prediction": player_move,
                "confidence": last_real_time_result.get("confidence", 0.0),
                "detected_hand": last_real_time_result.get("detected_hand", False),
                "game_result": game_result,
                "timestamp": time.time(),
                "processed_frames": processed_count
            }
            return jsonify(response)
        
        # No valid frames processed
        print("❌ No valid frames could be processed")
        game_result = game_engine.play_round("timeout")
        
        return jsonify({
            "status": "no_detection",
            "final_prediction": "timeout", 
            "confidence": 0.0,
            "detected_hand": False,
            "game_result": game_result,
            "timestamp": time.time(),
            "processed_frames": 0
        })
        
    except Exception as e:
        print(f"❌ Error in process_frames: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Create the tunnel with pyngrok
    tunnel = ngrok.connect(5000, "http")
    print("🌐 Public URL:", tunnel.public_url)
    
    # Run Flask app
    print("🚀 Starting RPSense server...")
    print("💡 Server is ready for HTTP requests!")
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
