import cv2
import numpy as np
import time
from datetime import datetime

# --- Configuration & defaults ---
VIDEO_SOURCE = "ucdavis.mp4"
DISPLAY_WIDTH = 900 # Max width for display windows (adjust as needed)

# Optical flow parameters
FLOW_PYR_SCALE   = 0.5  # Pyramid scale (<1)
FLOW_LEVELS      = 3    # Number of pyramid levels
FLOW_WINSIZE     = 15   # Averaging window size
FLOW_ITERATIONS  = 3    # Iterations at each pyramid level
FLOW_POLY_N      = 5    # Size of pixel neighborhood for polynomial expansion
FLOW_POLY_SIGMA  = 1.1  # Std dev for Gaussian smoothing for polynomial expansion

# Default thresholds
DEFAULT_MIN_FLOW       = 1.0    # px/frame
DEFAULT_MAX_FLOW       = 10.0   # px/frame
DEFAULT_MIN_AREA_PCT   = 20     # percent of ROI
DEFAULT_PERSON_HEIGHT  = 180    # pixels
DEFAULT_SIZE_TOL       = 30     # percent
DEFAULT_MIN_DWELL_TIME = 2      # seconds

# ROI globals
roi_points = []
roi_selected = False
ROI_COORDS = None

# --- Mouse callback: select polygon ROI ---
def select_roi_callback(event, x, y, flags, param):
    global roi_points, roi_selected, ROI_COORDS
    if not roi_selected and event == cv2.EVENT_LBUTTONDOWN:
        roi_points.append((x, y))
    elif not roi_selected and event == cv2.EVENT_RBUTTONDOWN and len(roi_points) >= 3:
        ROI_COORDS = np.array(roi_points, dtype=np.int32)
        roi_selected = True
        print(f"ROI selected with {len(roi_points)} points.")

# --- Helper: draw ROI polygon ---
def draw_roi_polygon(frame, roi_coords, color=(0,255,0), thickness=2):
    if roi_coords is not None and len(roi_coords) >= 3:
        pts = np.array(roi_coords, dtype=np.int32)
        cv2.polylines(frame, [pts], True, color, thickness)
        cv2.putText(frame, "ROI", (pts[0][0], pts[0][1]-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, thickness)

# --- Main ---
if __name__ == '__main__':
    # Settings GUI
    cv2.namedWindow("Settings", cv2.WINDOW_NORMAL)
    def nothing(x): pass
    cv2.createTrackbar("Min Flow x10", "Settings", int(DEFAULT_MIN_FLOW*10), 100, nothing)
    cv2.createTrackbar("Max Flow x10", "Settings", int(DEFAULT_MAX_FLOW*10), 200, nothing)
    cv2.createTrackbar("Min ROI %", "Settings", DEFAULT_MIN_AREA_PCT, 100, nothing)
    cv2.createTrackbar("Person Ht (px)", "Settings", DEFAULT_PERSON_HEIGHT, 500, nothing)
    cv2.createTrackbar("Size Tol (%)", "Settings", DEFAULT_SIZE_TOL, 100, nothing)
    cv2.createTrackbar("Min Dwell (s)", "Settings", DEFAULT_MIN_DWELL_TIME, 10, nothing)

    # Video capture
    cap = cv2.VideoCapture(VIDEO_SOURCE)
    if not cap.isOpened():
        print(f"Error opening video: {VIDEO_SOURCE}")
        exit()

    # ROI selection
    print("Draw ROI: left-click to add points, right-click to finalize.")
    cv2.namedWindow("Video Feed")
    cv2.setMouseCallback("Video Feed", select_roi_callback)
    while True:
        ret, frame_orig = cap.read() # Read original frame
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame_orig = cap.read()
            if not ret:
                print("Cannot read video frame.")
                exit()
        cv2.flip(frame_orig, 0, dst=frame_orig) # Flip frame vertically (0 = flip around x-axis)

        # --- Resize Frame for Display ---
        orig_h, orig_w = frame_orig.shape[:2]
        scale_factor = DISPLAY_WIDTH / orig_w
        new_h = int(orig_h * scale_factor)
        frame = cv2.resize(frame_orig, (DISPLAY_WIDTH, new_h), interpolation=cv2.INTER_AREA)
        # --- End Resize ---

        disp = frame.copy() # Use the resized frame
        # draw existing points/edges (coordinates are now relative to resized frame)
        for i, p in enumerate(roi_points):
            cv2.circle(disp, p, 3, (0,0,255), -1)
            if i > 0:
                cv2.line(disp, roi_points[i-1], p, (0,255,255), 2)
        if roi_selected:
            # draw_roi_polygon uses coordinates relative to the current frame (which is resized)
            draw_roi_polygon(disp, ROI_COORDS, (0,255,0))
            cv2.putText(disp, "ROI finalized. Press any key to start.", (10,30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0),2)
        else:
            cv2.putText(disp, "Define ROI: left-click, right-click to finish.", (10,30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255),2)

        cv2.imshow("Video Feed", disp) # Show the resized frame
        key = cv2.waitKey(33) & 0xFF
        if key == ord('q'):
            cap.release(); cv2.destroyAllWindows(); exit()
        if roi_selected:
            # Store the scale factor and dimensions used for processing
            process_width = DISPLAY_WIDTH
            process_height = new_h
            break # Exit loop

    # Prepare ROI mask using resized dimensions
    gray0 = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    roi_mask = np.zeros_like(gray0, dtype=np.uint8) # Use shape of resized gray image
    # ROI_COORDS are already relative to the resized frame
    cv2.fillPoly(roi_mask, [ROI_COORDS], 255)
    total_roi_px = np.count_nonzero(roi_mask)
    if total_roi_px == 0: total_roi_px = 1 # Avoid division by zero

    # Initialize prev_gray using resized dimensions
    prev_gray = gray0.copy()
    motion_active = False
    motion_start = 0

    print("Starting motion detection. Press 'q' to quit.")
    while True:
        ret, frame_orig = cap.read() # Read original frame
        if not ret:
            print("End of stream.")
            break
        cv2.flip(frame_orig, 0, dst=frame_orig) # Flip frame vertically (0 = flip around x-axis)

        # --- Resize Frame for Processing & Display ---
        # Use dimensions determined during ROI selection
        frame = cv2.resize(frame_orig, (process_width, process_height), interpolation=cv2.INTER_AREA)
        # --- End Resize ---

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) # Use resized frame
        # read sliders
        min_flow   = cv2.getTrackbarPos("Min Flow x10","Settings")/10.0
        max_flow   = cv2.getTrackbarPos("Max Flow x10","Settings")/10.0
        min_pct    = cv2.getTrackbarPos("Min ROI %","Settings")/100.0
        p_ht       = cv2.getTrackbarPos("Person Ht (px)","Settings")
        tol        = cv2.getTrackbarPos("Size Tol (%)","Settings")/100.0
        min_dwell  = cv2.getTrackbarPos("Min Dwell (s)","Settings")

        # size window (These might need adjustment if Person Ht was based on original resolution)
        min_h = int(p_ht*(1-tol))
        max_h = int(p_ht*(1+tol))

        # optical flow (calculated on resized gray images)
        flow = cv2.calcOpticalFlowFarneback(prev_gray, gray, None,
                                            FLOW_PYR_SCALE, FLOW_LEVELS,
                                            FLOW_WINSIZE, FLOW_ITERATIONS,
                                            FLOW_POLY_N, FLOW_POLY_SIGMA, 0)
        mag, _ = cv2.cartToPolar(flow[...,0], flow[...,1])

        # mask+threshold (using resized roi_mask)
        mag_roi = cv2.bitwise_and(mag, mag, mask=roi_mask)
        motion_mask = np.zeros_like(mag_roi, dtype=np.uint8)
        motion_mask[(mag_roi>=min_flow)&(mag_roi<=max_flow)] = 255

        # contours (found on resized motion_mask)
        cnts, _ = cv2.findContours(motion_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        valid = []
        valid_mask = np.zeros_like(motion_mask) # Use shape of resized mask
        for c in cnts:
            x,y,w,h = cv2.boundingRect(c) # Coordinates relative to resized frame
            # if h>=min_h and h<=max_h: # Height filter applied to resized contours
            valid.append(c)
            cv2.drawContours(valid_mask, [c], -1, 255, -1)

        pct = np.count_nonzero(valid_mask)/total_roi_px # Percentage relative to resized ROI

        # event logic
        now = time.time()
        if pct>=min_pct and not motion_active:
            motion_active = True
            motion_start = now
        elif pct<min_pct and motion_active:
            dwell = now-motion_start
            if dwell>=min_dwell:
                print(f"Loiterer detected: {dwell:.1f}s @ {datetime.now()}")
            motion_active = False

        # display (using resized frame 'disp')
        disp = frame.copy() # Copy the resized frame
        # ROI_COORDS and valid contours are relative to resized frame
        draw_roi_polygon(disp, ROI_COORDS, (0,0,255) if motion_active else (0,255,0))
        cv2.drawContours(disp, valid, -1, (0,0,255),2)
        cv2.putText(disp, f"Motion%: {pct*100:5.1f}%", (10,30), cv2.FONT_HERSHEY_SIMPLEX,0.7,(255,255,255),2)

        cv2.imshow("Video Feed", disp) # Show resized frame
        cv2.imshow("Motion Mask", valid_mask) # Show resized mask

        prev_gray = gray # Update with resized gray frame
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
