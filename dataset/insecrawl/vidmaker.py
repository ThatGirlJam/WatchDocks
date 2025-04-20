import cv2
import os
import glob
import re

# --- Configuration ---
# Folder containing the images, relative to this script's location or workspace root
image_folder_relative = 'images/241657_timelapse'
# Output video filename
output_video_file = 'timelapse_241657.mp4'
# Frames per second for the output video
fps = 5
# --- End Configuration ---

# Determine the absolute path to the image folder
# Assumes the script is run from the workspace root or adjusts path accordingly
workspace_root = os.getcwd()
image_folder = os.path.join(workspace_root, image_folder_relative)

if not os.path.isdir(image_folder):
    print(f"Error: Image folder not found at '{image_folder}'")
    exit(1)

# Get a list of all .jpg image files in the folder
image_files = glob.glob(os.path.join(image_folder, '*.jpg'))

# Sort files based on the timestamp in the filename if possible
# Example filename format: '[ID]_[YYYY-MM-DD]_[HH-MM-SS].jpg'
def sort_key(filename):
    # Extract timestamp parts using regex
    match = re.search(r'\[(\d{4}-\d{2}-\d{2})\]_\[(\d{2}-\d{2}-\d{2})\]', filename)
    if match:
        date_str, time_str = match.groups()
        # Return a string that sorts chronologically
        return f"{date_str} {time_str.replace('-', ':')}"
    # Fallback for files without timestamp or different format (simple name sort)
    return os.path.basename(filename)

image_files.sort(key=sort_key)

if not image_files:
    print(f"Error: No JPG images found in '{image_folder}'")
    exit(1)

print(f"Found {len(image_files)} images to process.")

# Read the first image to get frame dimensions
try:
    first_frame = cv2.imread(image_files[0])
    if first_frame is None:
        raise IOError(f"Could not read the first image: {image_files[0]}")
    height, width, layers = first_frame.shape
    frame_size = (width, height)
    print(f"Detected frame size: {width}x{height}")
except Exception as e:
    print(f"Error reading first image: {e}")
    exit(1)

# Initialize VideoWriter
# Use 'mp4v' codec for .mp4 file. You might need to experiment with codecs
# if 'mp4v' doesn't work (e.g., 'XVID' for .avi).
output_path = os.path.join(workspace_root, output_video_file)
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
video_writer = cv2.VideoWriter(output_path, fourcc, fps, frame_size)

if not video_writer.isOpened():
    print(f"Error: Could not open video writer for path '{output_path}'")
    exit(1)

print(f"Creating video '{output_video_file}' at {fps} FPS...")

# Initialize background subtractor AFTER ROI selection
# bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=100, varThreshold=40, detectShadows=True)
bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=100, varThreshold=16, detectShadows=True) # Try lower threshold (e.g., 16)

# Loop through images and write frames to video
for i, image_file in enumerate(image_files):
    try:
        frame = cv2.imread(image_file)
        if frame is None:
            print(f"\nWarning: Skipping unreadable image: {os.path.basename(image_file)}")
            continue
        # Ensure frame size matches (optional, uncomment if needed)
        # if (frame.shape[1], frame.shape[0]) != frame_size:
        #     frame = cv2.resize(frame, frame_size)
        video_writer.write(frame)
        # Print progress
        print(f"Processing frame {i + 1}/{len(image_files)}...", end='\r')
    except Exception as e:
        print(f"\nError processing image {os.path.basename(image_file)}: {e}")
        continue # Skip faulty frames

# Release the video writer
video_writer.release()
print(f"\nVideo creation complete: '{output_video_file}'")