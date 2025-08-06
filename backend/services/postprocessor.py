from collections import Counter, defaultdict
import numpy as np
from utils.config import Config
import time


class PredictionPostprocessor:
    def __init__(self):
        self.confidence_threshold = Config.CONFIDENCE_THRESHOLD
        self.frame_buffer = []
        self.max_frames = Config.MAX_FRAMES_IN_WINDOW

    def add_prediction(self, prediction, confidence, frame_data):
        """Add a prediction to the buffer"""
        print(f"📊 Adding prediction: {prediction} (confidence: {confidence:.3f})")
        
        if confidence >= self.confidence_threshold:
            self.frame_buffer.append(
                {
                    "prediction": prediction,
                    "confidence": confidence,
                    "frame_data": frame_data,
                    "timestamp": frame_data.get("timestamp"),
                }
            )
            print(f"✅ Prediction added to buffer. Buffer size: {len(self.frame_buffer)}")
        else:
            print(f"❌ Prediction rejected (confidence {confidence:.3f} < threshold {self.confidence_threshold})")

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
        # get this n=1 means top 1 most common  eg. [('rock', 3)]
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
        """Check if we have enough frames OR timeout reached"""
        has_enough_frames = len(self.frame_buffer) >= self.max_frames * 0.8
        
        print(f"🔍 Checking final result criteria:")
        print(f"   Buffer size: {len(self.frame_buffer)}/{self.max_frames}")
        print(f"   Has enough frames: {has_enough_frames} (need {self.max_frames * 0.8})")

        if self.frame_buffer:
            # Use current time vs first frame time
            oldest_frame_time = self.frame_buffer[0]["timestamp"]
            if oldest_frame_time is None:
                print(f"   No timestamp on oldest frame, using frame count only")
                return has_enough_frames

            try:
                current_time = time.time()
                time_elapsed = current_time - oldest_frame_time
                # More generous timeout - frames come over 2 seconds
                has_timeout = time_elapsed >= 3.0  # 3 seconds from first frame

                # Need at least 3 frames AND either enough frames OR timeout
                min_frames_met = len(self.frame_buffer) >= 3
                
                print(f"   Time elapsed: {time_elapsed:.1f}s (timeout at 3.0s)")
                print(f"   Has timeout: {has_timeout}")
                print(f"   Min frames met: {min_frames_met} (need 3)")
                
                result = has_enough_frames or (min_frames_met and has_timeout)
                print(f"   Should send final: {result}")

                return result
            except (TypeError, ValueError) as e:
                print(f"   Timestamp error: {e}, using frame count only")
                return has_enough_frames
        
        print(f"   No frames in buffer")
        return False
