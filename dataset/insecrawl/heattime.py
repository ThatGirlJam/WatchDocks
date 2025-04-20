import cv2
import numpy as np
from datetime import datetime
import time

# --- Configuration ---
VIDEO_SOURCE = "ten-min-test.mp4" # Use the pre-recorded video file
# Optical Flow Parameters (Farneback) - Can be tuned
FLOW_PYR_SCALE = 0.5  # Pyramid scale (< 1)
FLOW_LEVELS = 3       # Number of pyramid levels
FLOW_WINSIZE = 15     # Averaging window size
FLOW_ITERATIONS = 3   # Iterations at each pyramid level
FLOW_POLY_N = 5       # Size of pixel neighborhood for polynomial expansion
FLOW_POLY_SIGMA = 1.1 # Std dev for Gaussian smoothing for polynomial expansion
# Motion Detection Thresholds
MIN_FLOW_MAGNITUDE = 1.0 # Minimum magnitude of flow vector to be considered motion (pixels/frame)
MIN_MOTION_AREA_PERCENT = 0.5 # Minimum percentage of ROI area that needs motion to trigger detection
# --- End Configuration ---

# --- Global variables for ROI selection ---
roi_points = []
roi_selected = False
ROI_COORDS = None # Will be set by mouse selection (list of points for polygon)
frame_display = None # To store the current frame for drawing callback

# --- Mouse callback function for ROI selection ---
def select_roi_callback(event, x, y, flags, param):
    global roi_points, roi_selected, ROI_COORDS, frame_display

    if not roi_selected: # Only allow adding points if ROI is not yet finalized
        if event == cv2.EVENT_LBUTTONDOWN:
            roi_points.append((x, y))
            print(f"Added point: ({x}, {y}). Points: {len(roi_points)}")
            # Draw the point on the frame
            if frame_display is not None:
                 cv2.circle(frame_display, (x, y), 3, (0, 0, 255), -1)
                 # Draw lines between points as they are added
                 if len(roi_points) > 1:
                     cv2.line(frame_display, roi_points[-2], roi_points[-1], (0, 255, 255), 2)
                 cv2.imshow("Video Feed", frame_display)

        # Use Right Click or 'd' key (handled in main loop) to finalize the polygon
        elif event == cv2.EVENT_RBUTTONDOWN:
             if len(roi_points) >= 3:
                 ROI_COORDS = np.array(roi_points, dtype=np.int32)
                 roi_selected = True
                 print(f"ROI Polygon Finalized with {len(roi_points)} points.")
                 # Draw the final polygon
                 if frame_display is not None:
                     cv2.polylines(frame_display, [ROI_COORDS], isClosed=True, color=(0, 255, 0), thickness=2)
                     cv2.putText(frame_display, "ROI Selected. Press 's' to start.", (10, 50),
                                 cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                     cv2.imshow("Video Feed", frame_display)
             else:
                 print("Need at least 3 points to define a polygon ROI. Right-click ignored.")


# Helper function to draw ROI (polygon)
def draw_roi_polygon(frame, roi_coords_list, color=(0, 255, 0), thickness=2):
    if roi_coords_list is not None and len(roi_coords_list) >= 3:
        pts = np.array(roi_coords_list, dtype=np.int32)
        cv2.polylines(frame, [pts], isClosed=True, color=color, thickness=thickness)
        # Put text near the first point
        if pts.size > 0: # Check if pts is not empty
             cv2.putText(frame, "ROI", (pts[0][0], pts[0][1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, thickness)

# Initialize video capture
cap = cv2.VideoCapture(VIDEO_SOURCE)
if not cap.isOpened():
    print(f"Error: Could not open video source '{VIDEO_SOURCE}'")
    exit()

# --- ROI Selection Phase ---
print("Click points on the 'Video Feed' window to define the polygon ROI.")
print("Right-click or press 'd' when done (at least 3 points).")
print("Press 's' AFTER finalizing ROI to start motion detection, or 'q' to quit.")
cv2.namedWindow("Video Feed")
cv2.setMouseCallback("Video Feed", select_roi_callback)

roi_finalized_for_detection = False

while not roi_finalized_for_detection:
    ret, frame = cap.read()
    if not ret:
        if isinstance(VIDEO_SOURCE, str):
            print("End of video reached during ROI selection. Restarting video.")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if not ret:
                 print("Error restarting video file.")
                 break
        else:
            print("Error reading frame for ROI selection.")
            break

    frame_display = frame.copy()

    if not roi_selected:
        if len(roi_points) > 0:
            for i in range(len(roi_points)):
                cv2.circle(frame_display, roi_points[i], 3, (0, 0, 255), -1)
                if i > 0:
                    cv2.line(frame_display, roi_points[i-1], roi_points[i], (0, 255, 255), 2)
        cv2.putText(frame_display, "Click points for ROI. Right-click/'d' to finish.", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    else:
        draw_roi_polygon(frame_display, ROI_COORDS, color=(0, 255, 0))
        cv2.putText(frame_display, "ROI Selected. Press 's' to start detection.", (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    cv2.imshow("Video Feed", frame_display)
    key = cv2.waitKey(33) & 0xFF # ~30 FPS playback

    if key == ord('q'):
        print("Exiting during ROI selection.")
        cap.release()
        cv2.destroyAllWindows()
        exit()
    elif key == ord('d'):
        if not roi_selected and len(roi_points) >= 3:
             ROI_COORDS = np.array(roi_points, dtype=np.int32)
             roi_selected = True
             print(f"ROI Polygon Finalized with {len(roi_points)} points (using 'd' key).")
             cv2.polylines(frame_display, [ROI_COORDS], isClosed=True, color=(0, 255, 0), thickness=2)
             cv2.putText(frame_display, "ROI Selected. Press 's' to start.", (10, 50),
                         cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
             cv2.imshow("Video Feed", frame_display)
        elif not roi_selected:
             print("Need at least 3 points to define a polygon ROI. 'd' key ignored.")
    elif key == ord('s') and roi_selected:
        print("ROI confirmed. Starting motion detection.")
        roi_finalized_for_detection = True
        break

# --- Motion Detection Phase (Optical Flow) ---
if not roi_selected or ROI_COORDS is None:
    print("ROI was not selected or finalized. Exiting.")
    cap.release()
    cv2.destroyAllWindows()
    exit()

# Read the first frame for optical flow initialization
ret, prev_frame = cap.read()
if not ret:
    print("Error reading the first frame for motion detection.")
    cap.release()
    cv2.destroyAllWindows()
    exit()

prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
hsv_mask = np.zeros_like(prev_frame) # For visualizing flow (optional)
hsv_mask[..., 1] = 255

# Create the ROI mask once
roi_mask = np.zeros(prev_gray.shape, dtype=np.uint8)
cv2.fillPoly(roi_mask, [ROI_COORDS], 255)
# Calculate the total number of pixels inside the ROI for percentage calculation
total_roi_pixels = np.count_nonzero(roi_mask)
if total_roi_pixels == 0:
    print("Error: ROI has zero area. Check selected points.")
    total_roi_pixels = 1 # Avoid division by zero

print("Starting motion detection using Optical Flow...")
motion_detected_in_roi_previously = False
cv2.namedWindow("Motion Magnitude (ROI)") # Optional debug window

while True:
    ret, frame = cap.read()
    if not ret:
        print("End of video stream or error reading frame.")
        break

    timestamp = datetime.now()
    frame_display = frame.copy() # Use a copy for drawing
    current_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # --- Calculate Dense Optical Flow ---
    flow = cv2.calcOpticalFlowFarneback(prev_gray, current_gray, None,
                                        FLOW_PYR_SCALE, FLOW_LEVELS, FLOW_WINSIZE,
                                        FLOW_ITERATIONS, FLOW_POLY_N, FLOW_POLY_SIGMA, 0)

    # --- Analyze Flow Magnitude within ROI ---
    magnitude, angle = cv2.cartToPolar(flow[..., 0], flow[..., 1])

    # Apply ROI mask to the magnitude map
    magnitude_roi = cv2.bitwise_and(magnitude, magnitude, mask=roi_mask)

    # Threshold the magnitude to find significant motion pixels within ROI
    motion_mask = (magnitude_roi >= MIN_FLOW_MAGNITUDE).astype(np.uint8) * 255

    # --- Find and Draw Contours of Motion ---
    # Find contours in the motion mask
    contours, _ = cv2.findContours(motion_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Draw contours onto the display frame
    # You can filter contours by area here if needed, e.g., if cv2.contourArea(c) > some_min_area:
    cv2.drawContours(frame_display, contours, -1, (0, 0, 255), 1) # Draw red contours with thickness 1

    # --- End Find and Draw Contours ---

    # Calculate the number of motion pixels within the ROI
    motion_pixels_in_roi = np.count_nonzero(motion_mask)

    # Calculate the percentage of ROI area with motion
    motion_percentage = (motion_pixels_in_roi / total_roi_pixels) * 100

    current_motion_in_roi = motion_percentage >= MIN_MOTION_AREA_PERCENT

    # --- Output Timestamp ---
    if current_motion_in_roi:
        if not motion_detected_in_roi_previously: # Trigger only on the start of motion
             print(f"Motion DETECTED in ROI at: {timestamp.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]} ({motion_percentage:.2f}%)")
             # !!! PLACEHOLDER: Trigger your analysis process here !!!
        motion_detected_in_roi_previously = True
        roi_color = (0, 0, 255) # Red when motion detected in ROI
    else:
        if motion_detected_in_roi_previously: # Optional: Log when motion stops
            print(f"Motion STOPPED in ROI at: {timestamp.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}")
        motion_detected_in_roi_previously = False
        roi_color = (0, 255, 0) # Green when no motion detected in ROI

    # --- Display ---
    # Draw the ROI polygon
    draw_roi_polygon(frame_display, ROI_COORDS, color=roi_color)

    # Show the original frame with ROI
    cv2.imshow("Video Feed", frame_display)

    # Show the motion mask within ROI (for debugging)
    cv2.imshow("Motion Magnitude (ROI)", motion_mask)

    # --- Optional: Visualize Flow ---
    # hsv_mask[..., 0] = angle * 180 / np.pi / 2
    # hsv_mask[..., 2] = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
    # bgr_flow = cv2.cvtColor(hsv_mask, cv2.COLOR_HSV2BGR)
    # cv2.imshow('Optical Flow', bgr_flow)
    # --- End Optional Visualization ---

    # Update previous frame and gray image
    prev_gray = current_gray.copy()

    # Exit on 'q' key press
    if cv2.waitKey(33) & 0xFF == ord('q'): # ~30 FPS
        print("Exiting...")
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()
print("Resources released.")