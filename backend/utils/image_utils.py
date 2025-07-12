import cv2
import numpy as np
import base64


def decode_frame_from_base64(base64_string):
    """Decode base64 string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if "data:image" in base64_string:
            base64_string = base64_string.split(",")[1]

        # Decode base64 to bytes
        img_bytes = base64.b64decode(base64_string)

        # Convert to numpy array
        nparr = np.frombuffer(img_bytes, np.uint8)

        # Decode to OpenCV image
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        return img  # BGR color image
    except Exception as e:
        print(f"Error decoding frame: {str(e)}")
        return None


def encode_frame_to_base64(img):
    """Encode OpenCV image to base64 string"""
    try:
        # Encode image to JPEG
        _, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])

        # Convert to base64
        img_base64 = base64.b64encode(buffer).decode("utf-8")

        return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        print(f"Error encoding frame: {str(e)}")
        return None


def extract_hand_roi(image, hand_landmarks, padding=20):
    """Extract hand region of interest from image using MediaPipe landmarks"""
    if hand_landmarks is None or len(hand_landmarks.landmark) == 0:
        return None, None

    h, w, _ = image.shape

    x_coords = [landmark.x * w for landmark in hand_landmarks.landmark]
    y_coords = [landmark.y * h for landmark in hand_landmarks.landmark]

    x_min = max(0, int(min(x_coords)) - padding)
    x_max = min(w, int(max(x_coords)) + padding)
    y_min = max(0, int(min(y_coords)) - padding)
    y_max = min(h, int(max(y_coords)) + padding)

    if x_max - x_min <= 0 or y_max - y_min <= 0:
        return None, None

    roi = image[y_min:y_max, x_min:x_max]
    return roi, (x_min, y_min, x_max, y_max)


def draw_prediction_overlay(image, bbox, prediction, confidence):
    """Draw prediction overlay on image"""
    x_min, y_min, x_max, y_max = bbox

    # Define colors for each class
    colors = {
        "rock": (0, 255, 0),  # Green
        "paper": (255, 0, 0),  # Blue
        "scissors": (0, 0, 255),  # Red
        "invalid": (128, 128, 128),  # Gray
    }

    color = colors.get(prediction, (255, 255, 255))

    # Draw bounding box
    cv2.rectangle(image, (x_min, y_min), (x_max, y_max), color, 2)

    # Draw label background
    label = f"{prediction.upper()}: {confidence:.2f}"
    (label_width, label_height), _ = cv2.getTextSize(
        label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
    )

    cv2.rectangle(
        image,
        (x_min, y_min - label_height - 10),
        (x_min + label_width, y_min),
        color,
        -1,
    )

    # Draw label text
    cv2.putText(
        image,
        label,
        (x_min, y_min - 5),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2,
    )

    return image
