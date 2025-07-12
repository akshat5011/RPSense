import cv2
import numpy as np
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from utils.config import Config


class ImagePreprocessor:
    def __init__(self):
        self.input_size = Config.MODEL_INPUT_SIZE

    def preprocess_for_model(self, roi_image):
        """
        Preprocess hand ROI for MobileNetV2 model
        """
        try:
            # Resize to model input size
            resized = cv2.resize(roi_image, self.input_size)

            # Convert BGR to RGB (MobileNetV2 expects RGB)
            rgb_image = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

            # Expand dimensions for batch processing
            img_array = np.expand_dims(rgb_image, axis=0)

            # Apply MobileNetV2 preprocessing
            preprocessed = preprocess_input(img_array.astype(np.float32))

            return preprocessed

        except Exception as e:
            print(f"Preprocessing error: {str(e)}")
            return None
