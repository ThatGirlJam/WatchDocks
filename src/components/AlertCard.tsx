import React from "react";
import { formatDistanceToNow } from "../utils/dateUtils";
import { Alert } from "../types";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

interface AlertCardProps {
  alert: Alert;
  onStatusChange: (id: string, status: Alert["status"]) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onStatusChange }) => {
  const getStatusIcon = () => {
    switch (alert.status) {
      case "new":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "reviewing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "resolved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "false-alarm":
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (alert.status) {
      case "new":
        return "New Alert";
      case "reviewing":
        return "Under Review";
      case "resolved":
        return "Resolved";
      case "false-alarm":
        return "False Alarm";
    }
  };

  const getStatusBgColor = () => {
    switch (alert.status) {
      case "new":
        return "bg-red-500/10";
      case "reviewing":
        return "bg-yellow-500/10";
      case "resolved":
        return "bg-green-500/10";
      case "false-alarm":
        return "bg-gray-500/10";
    }
  };

  const handleStatusChange = (newStatus: Alert["status"]) => {
    onStatusChange(alert.id, newStatus);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
      <div className="relative">
        <img
          src={alert.imageUrl}
          alt="Alert snapshot"
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-1 items-center text-sm rounded px-2 py-1 dark:bg-gray-900/80 bg-gray-100/90">
          <span className="font-mono">
            {alert.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="absolute top-2 left-2 flex gap-1 items-center text-sm rounded px-2 py-1 dark:bg-gray-900/80 bg-gray-100/90">
          <span
            className={`font-medium ${
              alert.confidence > 0.8
                ? "text-red-500"
                : alert.confidence > 0.7
                ? "text-yellow-500"
                : "text-gray-500"
            }`}
          >
            {Math.round(alert.confidence * 100)}% match
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              Potential Theft Detected
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {alert.location} • {formatDistanceToNow(alert.timestamp)}
            </p>
          </div>
          <div
            className={`flex items-center gap-1 ${getStatusBgColor()} px-2 py-1 rounded text-xs`}
          >
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {alert.status === "new" && (
            <>
              <button
                onClick={() => handleStatusChange("reviewing")}
                className="flex-1 px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full transition-colors hover:bg-yellow-200"
              >
                Review
              </button>
              <button
                onClick={() => handleStatusChange("false-alarm")}
                className="flex-1 px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full transition-colors hover:bg-gray-200"
              >
                Mark as False Alarm
              </button>
            </>
          )}

          {alert.status === "reviewing" && (
            <>
              <button
                onClick={() => handleStatusChange("resolved")}
                className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full transition-colors hover:bg-green-200"
              >
                Mark as Resolved
              </button>
              <button
                onClick={() => handleStatusChange("false-alarm")}
                className="flex-1 px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full transition-colors hover:bg-gray-200"
              >
                Mark as False Alarm
              </button>
            </>
          )}

          {(alert.status === "resolved" || alert.status === "false-alarm") && (
            <button
              onClick={() => handleStatusChange("reviewing")}
              className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full transition-colors hover:bg-blue-200"
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
