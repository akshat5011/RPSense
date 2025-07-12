import mediapipe as mp
import cv2
from utils.config import Config

class HandDetector:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=Config.MAX_HANDS,
            min_detection_confidence=Config.HAND_DETECTION_CONFIDENCE,
            min_tracking_confidence=Config.HAND_TRACKING_CONFIDENCE
        )
    
    def detect_hands(self, image):
        """
        Detect hands in image
        Returns: (status, message, results)
        """
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process the image
            results = self.mp_hands.process(rgb_image)
            
            if not results.multi_hand_landmarks:
                return "no_hands", "No hands detected", None
            
            # Check for multiple hands
            if len(results.multi_hand_landmarks) > 1:
                return "invalid", "Multiple hands detected", None
            
            # Single hand detected
            return "success", "Single hand detected", results.multi_hand_landmarks[0]
            
        except Exception as e:
            return "error", f"Hand detection error: {str(e)}", None
    
    def __del__(self):
        if hasattr(self, 'hands'):
            self.hands.close()