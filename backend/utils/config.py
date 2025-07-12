import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_PATH = os.path.join(BASE_DIR, 'model', 'finetuned_after100layers_mobilenetv2_rpsense.h5')
    
    MODEL_INPUT_SIZE = (224, 224)
    CLASSES = ['rock', 'paper', 'scissors', 'invalid']
    CONFIDENCE_THRESHOLD = 0.7
    
    INFERENCE_WINDOW_DURATION = 2.0 # seconds
    
    # Processing settings
    FRAME_BUFFER_SIZE = 50
    PROCESSING_INTERVAL = 0.033  # ~30 FPS
    
    # Server settings
    SECRET_KEY = os.getenv("SECRET_KEY")
    DEBUG = True
    HOST = '0.0.0.0'
    PORT = 5000
    

abc = Config()
print(abc.BASE_DIR)
print(abc.MODEL_PATH)