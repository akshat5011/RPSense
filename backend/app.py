from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pyngrok import ngrok
import json
from datetime import datetime
from utils.config import Config
from flask_socketio import SocketIO, emit

# Initialize Flask app
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")


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


@socketio.on("connect")
def handle_connect():
    print("Client connected")
    emit("server_message", {"message": "Welcome to RPSense WebSocket!"})


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


if __name__ == "__main__":
    socketio.run(app, host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
