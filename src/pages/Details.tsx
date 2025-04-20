import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart4,
} from "lucide-react";

const Details: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Bike Dock Status Details
        </h1>
        <button
          onClick={() => navigate("/")}
          className="mt-2 text-blue-500 text-sm flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <span>Back to Dashboard</span>
          {/* You could use a different icon for "back" if you prefer */}
        </button>
      </div>

      <section className="mb-6">
        <h2 className="font-semibold text-xl text-gray-900 dark:text-white mb-3">
          Alert Statuses
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              {/* You could add an icon here if desired */}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">New</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Indicates a recently detected issue or alert that requires
                attention. These alerts have not yet been reviewed or assigned.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
              {/* You could add an icon here if desired */}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Reviewing
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shows alerts that are currently being investigated or addressed
                by personnel. Someone is actively looking into these issues.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              {/* You could add an icon here if desired */}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Resolved
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                These alerts represent issues that have been successfully fixed
                or closed. No further action is required for these.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold text-xl text-gray-900 dark:text-white mb-3">
          Docking Space Status
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              {/* You could add an icon here */}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Full
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Indicates the percentage of bike docks that are currently
                occupied by bicycles.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              {/* You could add an icon here */}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Empty
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Indicates the percentage of bike docks that are currently
                available for parking.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            The overall docking space capacity is represented by the "Empty"
            percentage. The "Full" percentage shows the current occupancy.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-xl text-gray-900 dark:text-white mb-3">
          Detection System Statuses
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              {/* You could add an icon here */}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Model Loaded
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Signifies that the machine learning model responsible for
                detecting events (like unauthorized parking or dock
                malfunctions) has been successfully loaded and is ready for use.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              {/* You could add an icon here */}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Camera Feeds
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Indicates that the system is receiving live video streams from
                the monitoring cameras at the bike docks. These feeds are
                essential for the detection system to operate.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
              {/* You could add an icon here */}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Prediction Engine Active
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shows that the prediction engine is currently processing the
                camera feeds and actively looking for events or anomalies.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              {/* You could add an icon here */}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Prediction Engine Idle
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Indicates that the prediction engine is currently not actively
                processing feeds. This could be due to low activity or system
                configurations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              {/* You could add an icon here */}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Alert System
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Confirms that the alert system is functioning and will notify
                relevant personnel when a new event or issue is detected by the
                prediction engine.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Details;
