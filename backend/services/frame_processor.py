import time
from services.hand_detector import HandDetector
from services.preprocessor import ImagePreprocessor
from services.model_inference import ModelInference
from services.postprocessor import PredictionPostprocessor
from utils.image_utils import (
    extract_hand_roi,
    draw_prediction_overlay,
    encode_frame_to_base64,
)


class FrameProcessor:
    def __init__(self):
        self.hand_detector = HandDetector()
        self.preprocessor = ImagePreprocessor()
        self.model_inference = ModelInference()
        self.postprocessor = PredictionPostprocessor()

    def process_frame(self, image, frame_metadata=None):
        """
        Process a single frame through the entire pipeline
        Returns: (status, real_time_result, should_send_final, final_result)
        """
        timestamp = time.time()

        # 1. Hand Detection
        hand_status, hand_message, hand_landmarks = self.hand_detector.detect_hands(
            image
        )

        if hand_status != "success":
            return (
                hand_status,
                {
                    "status": hand_status,
                    "message": hand_message,
                    "timestamp": timestamp,
                },
                False,
                None,
            )

        try:
            # 2. Extract hand ROI
            roi_image, bbox = extract_hand_roi(image, hand_landmarks)

            # 3. Preprocess for model
            preprocessed_roi = self.preprocessor.preprocess_for_model(roi_image)
            if preprocessed_roi is None:
                return (
                    "error",
                    {
                        "status": "error",
                        "message": "Preprocessing failed",
                        "timestamp": timestamp,
                    },
                    False,
                    None,
                )

            # 4. Run inference
            prediction, confidence, all_predictions = self.model_inference.predict(
                preprocessed_roi
            )

            # 5. Create frame data
            frame_data = {
                "timestamp": timestamp,
                "bbox": bbox,
                "original_image": image.copy(),
                "roi": roi_image,
                "metadata": frame_metadata or {},
            }

            # 6. Add to postprocessor buffer
            self.postprocessor.add_prediction(prediction, confidence, frame_data)

            # 7. Create overlay image for real-time feedback
            overlay_image = image.copy()
            overlay_image = draw_prediction_overlay(
                overlay_image, bbox, prediction, confidence
            )
            overlay_base64 = encode_frame_to_base64(overlay_image)

            # 8. Real-time result
            real_time_result = {
                "status": "success",
                "prediction": prediction,
                "confidence": confidence,
                "all_predictions": all_predictions,
                "overlay_image": overlay_base64,
                "timestamp": timestamp,
                "buffer_size": len(self.postprocessor.frame_buffer),
            }

            # 9. Check if we should send final result
            should_send_final = self.postprocessor.should_send_final_result()
            final_result = None

            if should_send_final:
                aggregated_result, best_frame = (
                    self.postprocessor.get_aggregated_result()
                )
                if aggregated_result and best_frame:
                    # Create final overlay with best frame
                    final_overlay = best_frame["frame_data"]["original_image"].copy()
                    final_overlay = draw_prediction_overlay(
                        final_overlay,
                        best_frame["frame_data"]["bbox"],
                        aggregated_result["final_prediction"],
                        aggregated_result["confidence"],
                    )
                    final_overlay_base64 = encode_frame_to_base64(final_overlay)

                    final_result = {
                        "status": "final_result",
                        "final_prediction": aggregated_result["final_prediction"],
                        "confidence": aggregated_result["confidence"],
                        "frame_count": aggregated_result["frame_count"],
                        "prediction_percentage": aggregated_result[
                            "prediction_percentage"
                        ],
                        "all_predictions": aggregated_result["all_predictions"],
                        "final_overlay_image": final_overlay_base64,
                        "timestamp": timestamp,
                    }

                    # Clear buffer after sending final result
                    self.postprocessor.clear_buffer()

            return "success", real_time_result, should_send_final, final_result

        except Exception as e:
            return (
                "error",
                {
                    "status": "error",
                    "message": f"Processing error: {str(e)}",
                    "timestamp": timestamp,
                },
                False,
                None,
            )
