import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Calendar, Filter, Clock, MapPin } from "lucide-react";
import { Alert } from "../types";
import { formatDistanceToNow } from "../utils/dateUtils";
import AlertModal from "../components/AlertModal"; // Import it

const History: React.FC = () => {
  const { state } = useApp();
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<Alert["status"] | "all">(
    "all"
  );

  // Get unique locations from alerts
  const locations = [...new Set(state.alerts.map((alert) => alert.location))];

  // Filter alerts based on selected filters
  const filteredAlerts = state.alerts
    .filter((alert) => {
      // Filter by status
      if (
        statusFilter.toLowerCase() !== "all" &&
        alert.status.toLowerCase() !== statusFilter.toLowerCase()
      )
        return false;

      // Filter by location
      if (
        locationFilter.toLowerCase() !== "all" &&
        alert.location.toLowerCase() !== locationFilter.toLowerCase()
      )
        return false;

      // Filter by date (simple implementation - would need refinement for real app)
      if (dateFilter.toLowerCase() !== "all") {
        const today = new Date();
        const alertDate = new Date(alert.timestamp);

        switch (dateFilter) {
          case "today":
            return alertDate.toDateString() === today.toDateString();
          case "yesterday": {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return alertDate.toDateString() === yesterday.toDateString();
          }
          case "week": {
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return alertDate >= oneWeekAgo;
          }
          case "month": {
            const oneMonthAgo = new Date(today);
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return alertDate >= oneMonthAgo;
          }
          default:
            return true;
        }
      }

      return true;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first

  const getStatusColor = (status: Alert["status"]) => {
    switch (status) {
      case "new":
        return "bg-red-500";
      case "reviewing":
        return "bg-yellow-500";
      case "resolved":
        return "bg-green-500";
      case "false-alarm":
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: Alert["status"]) => {
    switch (status) {
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
  // Inside AlertsList component
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  console.log(filteredAlerts);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Detection History</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter Events
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Time Period
            </label>
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Location
            </label>
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="all">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as Alert["status"] | "all")
              }
            >
              <option value="all">All Statuses</option>
              <option value="new">New Alerts</option>
              <option value="reviewing">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="false-alarm">False Alarms</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-gray-600 dark:text-gray-400">
          Showing {filteredAlerts.length}{" "}
          {filteredAlerts.length === 1 ? "event" : "events"}
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {filteredAlerts.length > 0 ? (
          <div className="space-y-6">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-4">
                {/* Timeline line and dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(
                      alert.status
                    )} mt-1.5`}
                  ></div>
                  <div className="w-0.5 bg-gray-300 dark:bg-gray-600 h-full flex-grow mt-1"></div>
                </div>

                {/* Event card */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex flex-col sm:flex-row gap-4 w-full">
                  {/* Thumbnail */}
                  <div className="sm:w-1/4 relative">
                    <img
                      src={alert.imageUrl}
                      alt="Detection snapshot"
                      className="w-full aspect-video object-cover rounded"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {alert.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <h3 className="font-bold">Potential Theft Detected</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${
                          alert.status === "new"
                            ? "bg-red-100 text-red-800"
                            : alert.status === "reviewing"
                            ? "bg-yellow-100 text-yellow-800"
                            : alert.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${getStatusColor(
                            alert.status
                          )}`}
                        ></span>
                        {getStatusText(alert.status)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <p className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {alert.location}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(alert.timestamp)} •
                        {alert.timestamp.toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <p className="text-sm mb-2">
                      <span
                        className={`font-medium ${
                          alert.confidence > 0.8
                            ? "text-red-500"
                            : alert.confidence > 0.7
                            ? "text-yellow-500"
                            : "text-gray-500"
                        }`}
                      >
                        {Math.round(alert.confidence * 100)}% confidence
                      </span>
                    </p>

                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500">
              No detection events match your filters
            </p>
            <button
              onClick={() => {
                setDateFilter("all");
                setLocationFilter("all");
                setStatusFilter("all");
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
      {selectedAlert && (
        <AlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
};

export default History;
