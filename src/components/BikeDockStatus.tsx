import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  BarChart4,
  Volume2,
  StretchHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { captureHighlightedFrame } from './VideoPlayer';
import { useAuth } from "../auth/AuthContext";

const BikeDockStatus: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [isSendingWarning, setIsSendingWarning] = useState(false);
  const [autoWarningEnabled, setAutoWarningEnabled] = useState(false);
  const [lastWarningTime, setLastWarningTime] = useState(0);
  const WARNING_COOLDOWN = 60000; // 1 minute cooldown in milliseconds
  
  // Check if user has admin privileges
  const isAdmin = userRole === 'admin';

  const handleClick = () => {
    navigate("/details");
  };

  // Function to handle the warning
  const handleSendWarning = async () => {
    if (isSendingWarning) return;

    try {
      setIsSendingWarning(true);
      
      // Get current video frame with loitering highlights if available
      const imageData = await captureHighlightedFrame();
      
      if (!imageData) {
        console.error("Failed to capture video frame");
        return;
      }
      
      // Send to backend for processing
      const response = await axios.post("http://localhost:5000/api/generate-warning", {
        imageData: imageData,
        cameraId: state.activeCamera,
      });

      // Show success toast/notification
      console.log("Warning sent:", response.data.message);
    } catch (error) {
      console.error("Failed to send warning:", error);
    } finally {
      setIsSendingWarning(false);
    }
  };

  // Add this effect to monitor loitering detection
  useEffect(() => {
    // Check current time against cooldown
    const currentTime = Date.now();
    const timeSinceLastWarning = currentTime - lastWarningTime;
    
    // Check if auto-warning is enabled, loitering is detected, not currently sending a warning,
    // and the cooldown period has passed
    if (autoWarningEnabled && 
        state.isLoitering && 
        !isSendingWarning && 
        timeSinceLastWarning > WARNING_COOLDOWN) {
      
      // Trigger the warning and update the last warning timestamp
      handleSendWarning();
      setLastWarningTime(currentTime);
    }
  }, [state.isLoitering, autoWarningEnabled, isSendingWarning, lastWarningTime]);

  // Alert stats summaries
  const totalAlerts = state.alerts.length;
  const newAlerts = state.alerts.filter((a) => a.status === "new").length;
  const reviewingAlerts = state.alerts.filter(
    (a) => a.status === "reviewing"
  ).length;
  const resolvedAlerts = state.alerts.filter(
    (a) => a.status === "resolved"
  ).length;

  let percentageDocksFull = 50;

  if (state.activeCamera === "cam2") {
    percentageDocksFull = 52;
  } else {
    percentageDocksFull = 78;
  }
  const percentageDocksEmpty = 100 - percentageDocksFull;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Bike Dock Status
        </h2>
        <button
          onClick={handleClick}
          className="text-blue-500 text-sm flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <span>Details</span>
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Alerts
            </span>
            <BarChart4 className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalAlerts}
          </span>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1 items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-xs">{newAlerts} new</span>
            </div>
            <div className="flex gap-1 items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-xs">{reviewingAlerts} reviewing</span>
            </div>
            <div className="flex gap-1 items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-xs">{resolvedAlerts} resolved</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Docking Space
            </span>
            <BarChart4 className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {percentageDocksEmpty}% Capacity
          </span>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1 items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-xs">{percentageDocksFull}% Full</span>
            </div>
            <div className="flex gap-1 items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-xs">{percentageDocksEmpty}% Empty</span>
            </div>
          </div>
        </div>

        {/* Only show TTS warning section for admin users */}
        {isAdmin && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Anti-Theft Warning
              </span>
              <Volume2 className="h-4 w-4 text-red-500" />
            </div>
            <button
              onClick={handleSendWarning}
              disabled={isSendingWarning}
              className={`mt-2 px-4 py-2 rounded-md ${
                isSendingWarning
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              } text-white font-medium transition-colors flex items-center justify-center gap-2`}
            >
              {isSendingWarning ? (
                <>
                  <span className="animate-pulse">Sending Warning...</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Send TTS Warning</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Sends AI-generated voice warning through speakers
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">Auto-warn loiterers</span>
              <button
                onClick={() => setAutoWarningEnabled(prev => !prev)}
                className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${
                  autoWarningEnabled 
                    ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200" 
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                <StretchHorizontal className={`h-3 w-3 ${autoWarningEnabled ? "text-red-500" : "text-gray-400"}`} />
                {autoWarningEnabled ? "Auto: ON" : "Auto: OFF"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-3">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Detection System Status
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Model Loaded</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Camera Feeds</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
              <div
                className={`w-3 h-3 rounded-full ${
                  state.isPredicting ? "bg-yellow-500" : "bg-green-500"
                }`}
              ></div>
              <span className="text-sm">
                Prediction Engine {state.isPredicting ? "Active" : "Idle"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Alert System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeDockStatus;
