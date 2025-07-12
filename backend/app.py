from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from pyngrok import ngrok
import json
from datetime import datetime

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'RPSense Server is running!',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })


def run_with_ngrok():
    """Run Flask app with ngrok tunnel"""
    # Kill any existing ngrok processes
    ngrok.kill()
    
    # Start ngrok tunnel
    port = 5000
    public_url = ngrok.connect(port)
    
    print("=" * 50)
    print("🚀 RPSense Server Starting...")
    print("=" * 50)
    print(f"📡 Local URL:  http://localhost:{port}")
    print(f"🌐 Public URL: {public_url}")
    print("=" * 50)
    print("✅ Server is ready to receive requests!")
    print("🔄 Use Ctrl+C to stop the server")
    print("=" * 50)
    
    return public_url

if __name__ == '__main__':
    try:
        # Get ngrok URL
        public_url = run_with_ngrok()
        
        # Run Flask app
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=False  # Disable reloader to avoid ngrok conflicts
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down server...")
        ngrok.kill()
        print("✅ Server stopped successfully!")
    except Exception as e:
        print(f"❌ Error starting server: {str(e)}")
        ngrok.kill()