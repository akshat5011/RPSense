from collections import Counter, defaultdict
import numpy as np
from utils.config import Config


class PredictionPostprocessor:
    def __init__(self):
        self.confidence_threshold = Config.CONFIDENCE_THRESHOLD
        self.frame_buffer = []
        self.max_frames = Config.MAX_FRAMES_IN_WINDOW

    def add_prediction(self, prediction, confidence, frame_data):
        """Add a prediction to the buffer"""
        if confidence >= self.confidence_threshold:
            self.frame_buffer.append(
                {
                    "prediction": prediction,
                    "confidence": confidence,
                    "frame_data": frame_data,
                    "timestamp": frame_data.get("timestamp"),
                }
            )

        # Keep only recent frames
        if len(self.frame_buffer) > self.max_frames:
            self.frame_buffer.pop(0)

    def get_aggregated_result(self):
        """
        Aggregate predictions over the time window
        Returns the most common prediction and the frame with highest confidence
        """
        if not self.frame_buffer:
            return None, None

        # Count predictions
        prediction_counts = Counter(
            [frame["prediction"] for frame in self.frame_buffer]
        )

        # Get most common prediction
        most_common_prediction = prediction_counts.most_common(1)[0][0]

        # Find frame with highest confidence for the most common prediction
        best_frame = max(
            [
                frame
                for frame in self.frame_buffer
                if frame["prediction"] == most_common_prediction
            ],
            key=lambda x: x["confidence"],
        )

        # Calculate aggregation stats
        total_frames = len(self.frame_buffer)
        prediction_percentage = (
            prediction_counts[most_common_prediction] / total_frames
        ) * 100

        result = {
            "final_prediction": most_common_prediction,
            "confidence": best_frame["confidence"],
            "frame_count": total_frames,
            "prediction_percentage": prediction_percentage,
            "all_predictions": dict(prediction_counts),
            "best_frame": best_frame,
        }

        return result, best_frame

    def clear_buffer(self):
        """Clear the prediction buffer"""
        self.frame_buffer.clear()

    def should_send_final_result(self):
        """Check if we have enough frames to send a final result"""
        return len(self.frame_buffer) >= self.max_frames * 0.8  # 80% of expected frames
