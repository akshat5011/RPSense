import requests
import json
import base64

def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get('http://localhost:5000/')
        print("Health Check Response:", response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_process_frames():
    """Test the process frames endpoint with dummy data"""
    try:
        # Create a simple dummy frame (1x1 pixel white image)
        dummy_frame = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A=="
        
        test_data = {
            "frames": [
                {
                    "frame": dummy_frame,
                    "timestamp": 1000,
                    "frameId": "test1"
                }
            ],
            "gameData": {
                "gameMode": "classic",
                "totalRounds": 1,
                "currentRound": 1,
                "playerName": "Test Player"
            }
        }
        
        response = requests.post(
            'http://localhost:5000/process-frames',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print("Process Frames Response:", response.json())
        return response.status_code == 200
        
    except Exception as e:
        print(f"Process frames test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing HTTP API...")
    
    if test_health_check():
        print("✅ Health check passed")
    else:
        print("❌ Health check failed")
    
    if test_process_frames():
        print("✅ Process frames test passed")
    else:
        print("❌ Process frames test failed")
