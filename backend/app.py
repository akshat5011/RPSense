from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pyngrok import ngrok
import json
from datetime import datetime
from utils.config import Config

# Initialize Flask app
app = Flask(__name__)
CORS(app) 

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'RPSense Server is running!',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })



if __name__ == '__main__':
    app.run(
            host=Config.HOST,
            port=Config.PORT,
            debug=Config.DEBUG,
        )