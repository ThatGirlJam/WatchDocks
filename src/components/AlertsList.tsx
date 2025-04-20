import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import AlertCard from "./AlertCard";
import { Alert } from "../types";
import { Bell, ShieldAlert } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const AlertsList: React.FC = () => {
  const { state, dispatch } = useApp();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [filter, setFilter] = useState<Alert["status"] | "all">("all");

  const filteredAlerts =
    filter === "all"
      ? state.alerts
      : state.alerts.filter((alert) => alert.status === filter);

  const handleStatusChange = (id: string, status: Alert["status"]) => {
    dispatch({
      type: "UPDATE_ALERT_STATUS",
      payload: { id, status },
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
          </h2>
          <div className="text-sm text-gray-500">
            {filteredAlerts.length} {filter === "all" ? "total" : filter}
          </div>
        </div>

        {/* Admin-only message */}
        {!isAdmin && (
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>
              Alert management is restricted to administrators. You can view alerts but not change their status.
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === "all"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("new")}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === "new"
                ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            New
          </button>
          
          {/* Only show these filter options to admins */}
          {isAdmin && (
            <>
              <button
                onClick={() => setFilter("reviewing")}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === "reviewing"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Reviewing
              </button>
              <button
                onClick={() => setFilter("resolved")}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === "resolved"
                    ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setFilter("false-alarm")}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === "false-alarm"
                    ? "bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-100"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                False Alarms
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onStatusChange={handleStatusChange}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bell className="h-12 w-12 mb-2 text-gray-300" />
            <p>No {filter !== "all" ? filter : ""} alerts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsList;
