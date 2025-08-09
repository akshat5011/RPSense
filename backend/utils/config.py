import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Base paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_PATH = os.path.join(BASE_DIR, 'model', 'finetuned_after100layers_mobilenetv2_rpsense.h5')
    # MODEL_PATH = '/content/drive/MyDrive/RPSense_Dataset/finetuned_after100layers_mobilenetv2_rpsense.h5'
    
    # Model configuration
    MODEL_INPUT_SIZE = (224, 224)
    CLASSES = ['invalid', 'paper', 'rock', 'scissors']
    CONFIDENCE_THRESHOLD = 0.75
    
    # Frame processing configuration
    INFERENCE_WINDOW_DURATION = 2.0  # seconds
    FRAMES_PER_SECOND = 10  # Expected frames per second from frontend
    MAX_FRAMES_IN_WINDOW = int(INFERENCE_WINDOW_DURATION * FRAMES_PER_SECOND)
    
    # MediaPipe configuration
    HAND_DETECTION_CONFIDENCE = 0.5
    HAND_TRACKING_CONFIDENCE = 0.5
    MAX_HANDS = 2  # We'll check if more than 1 hand is detected
    
    # Server configuration
    SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 5000
    
    # Image processing
    HAND_BBOX_PADDING = 30  # Pixels to add around detected hand