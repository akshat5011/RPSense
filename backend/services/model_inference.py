import tensorflow as tf
import numpy as np
from utils.config import Config
import os

# Optimize TensorFlow for inference
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TF logging
tf.config.optimizer.set_jit(True)  # Enable XLA JIT compilation

# Process only 1 frame at a time
class ModelInference:
    def __init__(self):
        self.model = None
        self.classes = Config.CLASSES
        self.load_model()

    def load_model(self):
        """Load the trained MobileNetV2 model"""
        try:
            self.model = tf.keras.models.load_model(Config.MODEL_PATH)
            print(f"✅ Model loaded successfully from {Config.MODEL_PATH}")
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            self.model = None

    def predict(self, preprocessed_image):
        """
        Run inference on preprocessed image
        Returns: (class_name, confidence, all_predictions)
        """
        if self.model is None:
            return "invalid", 0.0, None

        try:
            # Run prediction
            predictions = self.model.predict(preprocessed_image, verbose=0)
            # print(f"✅ Predictions: {predictions}")

            # Get class with highest probability
            predicted_class_idx = np.argmax(predictions[0])
            # print(f"✅ Predicted class index: {predicted_class_idx}")

            confidence = float(predictions[0][predicted_class_idx])
            # print(f"✅ Confidence: {confidence}")

            # Get class name
            predicted_class = self.classes[predicted_class_idx]
            # print(f"✅ Predicted class: {predicted_class}")

            # Create prediction dictionary
            all_predictions = {
                class_name: float(prob)
                for class_name, prob in zip(self.classes, predictions[0])
            }
            # print(f"✅ All predictions: {all_predictions}")

            return predicted_class, confidence, all_predictions

        except Exception as e:
            print(f"Inference error: {str(e)}")
            return "invalid", 0.0, None
