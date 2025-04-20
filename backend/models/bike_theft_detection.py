"""
Bike theft detection model using Roboflow Inference.
"""

from inference import InferencePipeline
import cv2
import os
from typing import Callable, Dict, Any
import numpy as np
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class BikeTheftDetector:
    def __init__(self, workspace_name: str, workflow_id: str):
        """
        Initialize the bike theft detector.

        Args:
            workspace_name: Name of the Roboflow workspace
            workflow_id: ID of the workflow to use
        """
        self.api_key = os.getenv("ROBOFLOW_API_KEY")
        if not self.api_key:
            raise ValueError("ROBOFLOW_API_KEY environment variable is not set")

        self.workspace_name = workspace_name
        self.workflow_id = workflow_id
        self.pipeline = None

    def start_detection(
        self,
        video_source: str | int = 0,
        max_fps: int = 30,
        on_prediction: Callable[[Dict[str, Any], np.ndarray], None] = None,
    ):
        """
        Start the bike theft detection pipeline.

        Args:
            video_source: Path to video, device id, or RTSP stream url
            max_fps: Maximum frames per second to process
            on_prediction: Callback function for predictions
        """
        if on_prediction is None:
            on_prediction = self._default_sink

        self.pipeline = InferencePipeline.init_with_workflow(
            api_key=self.api_key,
            workspace_name=self.workspace_name,
            workflow_id=self.workflow_id,
            video_reference=video_source,
            max_fps=max_fps,
            on_prediction=on_prediction,
        )
        self.pipeline.start()

    def stop_detection(self):
        """Stop the detection pipeline."""
        if self.pipeline:
            self.pipeline.join()

    def _default_sink(self, result: Dict[str, Any], video_frame: np.ndarray):
        """
        Default callback for processing predictions.

        Args:
            result: Dictionary containing prediction results
            video_frame: The video frame being processed
        """
        if result.get("output_image"):
            # Convert to numpy array if needed
            if hasattr(result["output_image"], "numpy_image"):
                frame = result["output_image"].numpy_image
            else:
                frame = result["output_image"]

            # Display the frame
            cv2.imshow("Bike Theft Detection", frame)
            cv2.waitKey(1)
        print(result)  # Log the predictions


if __name__ == "__main__":
    detector = BikeTheftDetector(
        workspace_name="bike-theft-detection",
        workflow_id="small-object-detection-sahi-2",
    )
    detector.start_detection(video_source=0)
