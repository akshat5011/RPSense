import mediapipe as mp
import cv2
from utils.config import Config


class HandDetector:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils

        self.hands = self.mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=Config.MAX_HANDS,
            min_detection_confidence=Config.HAND_DETECTION_CONFIDENCE,
            min_tracking_confidence=Config.HAND_TRACKING_CONFIDENCE,
        )

    def detect_hands(self, image):
        """
        Detect hands in image
        Returns: (status, message, results)
        """
        try:
            # Get image dimensions
            height, width = image.shape[:2]
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Process the image
            results = self.hands.process(rgb_image)

            if not results.multi_hand_landmarks:
                return "no_hands", "No hands detected", None

            # Check for multiple hands
            if len(results.multi_hand_landmarks) > 1:
                return "invalid", "Multiple hands detected", None
            
            # Single hand detected - normalize landmarks with image dimensions
            hand_landmarks = results.multi_hand_landmarks[0]
            
            # # Convert normalized landmarks to pixel coordinates
            # landmark_coords = []
            # for landmark in hand_landmarks.landmark:
            #     x = int(landmark.x * width)
            #     y = int(landmark.y * height)
            #     z = landmark.z
            #     landmark_coords.append([x, y, z])

            return "success", "Single hand detected", hand_landmarks

            # return "success", "Single hand detected", {
            #     'landmarks': hand_landmarks,
            #     'coordinates': landmark_coords,
            #     'image_dims': (width, height)
            # }
        except Exception as e:
            return "error", f"Hand detection error: {str(e)}", None

    def draw_landmarks(self, image, hand_landmarks):
        """
        Draw hand landmarks on image
        """
        self.mp_drawing.draw_landmarks(
            image, hand_landmarks, self.mp_hands.HAND_CONNECTIONS
        )
        return image

    def detect_and_draw(self, image):
        """
        Detect hands and draw landmarks on image
        Returns: (status, message, hand_landmarks, annotated_image)
        """
        # Make a copy for drawing
        annotated_image = image.copy()

        # Detect hands
        status, message, hand_landmarks = self.detect_hands(image)

        # Draw landmarks if hand detected successfully
        if status == "success" and hand_landmarks:
            annotated_image = self.draw_landmarks(annotated_image, hand_landmarks)

        return status, message, hand_landmarks, annotated_image

    def __del__(self):
        if hasattr(self, "hands"):
            self.hands.close()
