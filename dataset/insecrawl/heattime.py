import cv2
import numpy as np
from datetime import datetime
import time

# --- Configuration ---
VIDEO_SOURCE = "night-test-12min.mp4" # Use the pre-recorded video file
# Minimum contour area to be considered motion
MIN_CONTOUR_AREA = 500
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
        # If reading from a file, loop back to the beginning for selection phase
        if isinstance(VIDEO_SOURCE, str):
            print("End of video reached during ROI selection. Restarting video.")
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
            if not ret:
                 print("Error restarting video file.")
                 break # Exit if restart fails
        else:
            print("Error reading frame for ROI selection.")
            break # Exit if reading from webcam fails

    frame_display = frame.copy() # Update global frame for callback drawing

    # Draw existing points and lines during selection
    if not roi_selected:
        if len(roi_points) > 0:
            for i in range(len(roi_points)):
                cv2.circle(frame_display, roi_points[i], 3, (0, 0, 255), -1)
                if i > 0:
                    cv2.line(frame_display, roi_points[i-1], roi_points[i], (0, 255, 255), 2)
        # Instructions
        cv2.putText(frame_display, "Click points for ROI. Right-click/'d' to finish.", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    else:
        # Draw the finalized ROI polygon
        draw_roi_polygon(frame_display, ROI_COORDS, color=(0, 255, 0))
        cv2.putText(frame_display, "ROI Selected. Press 's' to start detection.", (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)


    cv2.imshow("Video Feed", frame_display)

    # key = cv2.waitKey(200) & 0xFF # Use waitKey(200) for ~5 FPS
    key = cv2.waitKey(33) & 0xFF # Use waitKey(33) for ~30 FPS

    if key == ord('q'):
        print("Exiting during ROI selection.")
        cap.release()
        cv2.destroyAllWindows()
        exit()
    elif key == ord('d'): # Alternative key to finalize ROI
        if not roi_selected and len(roi_points) >= 3:
             ROI_COORDS = np.array(roi_points, dtype=np.int32)
             roi_selected = True
             print(f"ROI Polygon Finalized with {len(roi_points)} points (using 'd' key).")
             # Draw final polygon on the current frame_display before next loop iteration
             cv2.polylines(frame_display, [ROI_COORDS], isClosed=True, color=(0, 255, 0), thickness=2)
             cv2.putText(frame_display, "ROI Selected. Press 's' to start.", (10, 50),
                         cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
             cv2.imshow("Video Feed", frame_display) # Update display immediately
        elif not roi_selected:
             print("Need at least 3 points to define a polygon ROI. 'd' key ignored.")
    elif key == ord('s') and roi_selected:
        print("ROI confirmed. Starting motion detection.")
        roi_finalized_for_detection = True # Set flag to exit loop
        break # Exit ROI selection loop

# --- Motion Detection Phase ---
if not roi_selected or ROI_COORDS is None:
    print("ROI was not selected or finalized. Exiting.")
    cap.release()
    cv2.destroyAllWindows()
    exit()

# Initialize background subtractor AFTER ROI selection
bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=100, varThreshold=40, detectShadows=True)

# Allow the background subtractor some time to initialize if using a live feed
if isinstance(VIDEO_SOURCE, int):
     print("Allowing background subtractor to initialize...")
     for _ in range(30):
         ret, frame = cap.read()
         if ret:
             bg_subtractor.apply(frame)
     print("Initialization complete.")


print("Starting motion detection...")
motion_detected_in_roi = False
cv2.namedWindow("Foreground Mask ROI") # Create window for mask display

while True:
    ret, frame = cap.read()
    if not ret:
        print("End of video stream or error reading frame.")
        break

    timestamp = datetime.now()
    frame_height, frame_width = frame.shape[:2]
    frame_display = frame.copy() # Use a copy for drawing

    # --- Motion Detection ---
    fg_mask = bg_subtractor.apply(frame) # Apply to full frame

    # Create a mask for the polygon ROI area
    roi_mask = np.zeros(frame.shape[:2], dtype=np.uint8)
    cv2.fillPoly(roi_mask, [ROI_COORDS], 255) # Use fillPoly with the list of points

    # Keep only the foreground mask within the ROI
    fg_mask_roi = cv2.bitwise_and(fg_mask, fg_mask, mask=roi_mask)

    # Optional: Apply morphological operations to reduce noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    fg_mask_roi = cv2.morphologyEx(fg_mask_roi, cv2.MORPH_OPEN, kernel)

    # Find contours in the ROI's foreground mask
    contours, _ = cv2.findContours(fg_mask_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    current_motion_in_roi = False
    motion_contours = []
    for contour in contours:
        if cv2.contourArea(contour) > MIN_CONTOUR_AREA:
            current_motion_in_roi = True
            motion_contours.append(contour)

    # --- Output Timestamp ---
    if current_motion_in_roi:
        if not motion_detected_in_roi: # Trigger only on the start of motion
             print(f"Motion DETECTED in ROI at: {timestamp.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}")
             # !!! PLACEHOLDER: Trigger your analysis process here !!!
        motion_detected_in_roi = True
        roi_color = (0, 0, 255) # Red when motion detected
    else:
        if motion_detected_in_roi: # Optional: Log when motion stops
            print(f"Motion STOPPED in ROI at: {timestamp.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}")
        motion_detected_in_roi = False
        roi_color = (0, 255, 0) # Green when no motion

    # --- Display (Optional) ---
    # Draw the ROI polygon on the frame
    draw_roi_polygon(frame_display, ROI_COORDS, color=roi_color)

    # Show the original frame with ROI
    cv2.imshow("Video Feed", frame_display)
    # Show the foreground mask within ROI (for debugging)
    cv2.imshow("Foreground Mask ROI", fg_mask_roi)

    # Exit on 'q' key press
    # if cv2.waitKey(200) & 0xFF == ord('q'): # Use waitKey(200) for ~5 FPS
    if cv2.waitKey(33) & 0xFF == ord('q'): # Use waitKey(33) for ~30 FPS
        print("Exiting...")
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()
print("Resources released.")