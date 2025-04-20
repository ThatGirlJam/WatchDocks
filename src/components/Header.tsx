import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Settings,
  Shield,
  Clock,
  Home,
  Info,
  CheckCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import SettingsModal from "./SettingsModal";
import NotificationsModal from "./NotificationsModal";

const Header: React.FC = () => {
  const { state } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const newAlertsCount = state.alerts.filter(
    (alert) => alert.status === "new"
  ).length;
  const location = useLocation();

  return (
    <>
      <header className="bg-gray-900 text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-xl font-bold">WatchDocks</h1>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 hover:text-blue-400 ${
                location.pathname === "/" ? "text-blue-400" : "text-gray-300"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/history"
              className={`flex items-center space-x-1 hover:text-blue-400 ${
                location.pathname === "/history"
                  ? "text-blue-400"
                  : "text-gray-300"
              }`}
              onClick={e => {
                if (location.pathname !== "/history") {
                  e.preventDefault();
                  window.location.href = "/history";
                }
              }}
            >
              <Clock className="h-4 w-4" />
              <span>History</span>
            </Link>
            <Link
              to="/details"
              className={`flex items-center space-x-1 hover:text-blue-400 ${
                location.pathname === "/details"
                  ? "text-blue-400"
                  : "text-gray-300"
              }`}
              onClick={e => {
                if (location.pathname !== "/details") {
                  e.preventDefault();
                  window.location.href = "/details";
                }
              }}
            >
              <Info className="h-4 w-4" />
              <span>Details</span>
            </Link>
            <Link
              to="/review"
              className={`flex items-center space-x-1 hover:text-blue-400 ${
                location.pathname === "/review"
                  ? "text-blue-400"
                  : "text-gray-300"
              }`}
              onClick={e => {
                if (location.pathname !== "/review") {
                  e.preventDefault();
                  window.location.href = "/review";
                }
              }}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Review</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <div className="flex items-center mr-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  state.isConnected ? "bg-green-500" : "bg-red-500"
                } mr-2`}
              ></div>
              <span className="text-sm text-gray-300">
                {state.isConnected ? "System Online" : "Connection Lost"}
              </span>
            </div>

            <div className="relative">
              <button
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="h-5 w-5" />
                {newAlertsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newAlertsCount}
                  </span>
                )}
              </button>
            </div>

            <button
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-gray-800 text-white py-2 px-4 flex justify-between">
        <Link
          to="/"
          className={`flex flex-col items-center ${
            location.pathname === "/" ? "text-blue-400" : "text-gray-300"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Link>
        <Link
          to="/history"
          className={`flex flex-col items-center ${
            location.pathname === "/history" ? "text-blue-400" : "text-gray-300"
          }`}
          onClick={e => {
            if (location.pathname !== "/history") {
              e.preventDefault();
              window.location.href = "/history";
            }
          }}
        >
          <Clock className="h-5 w-5" />
          <span className="text-xs">History</span>
        </Link>
        <Link
          to="/details"
          className={`flex flex-col items-center ${
            location.pathname === "/details" ? "text-blue-400" : "text-gray-300"
          }`}
          onClick={e => {
            if (location.pathname !== "/details") {
              e.preventDefault();
              window.location.href = "/details";
            }
          }}
        >
          <Info className="h-5 w-5" />
          <span className="text-xs">Details</span>
        </Link>
        <Link
          to="/review"
          className={`flex flex-col items-center ${
            location.pathname === "/review" ? "text-blue-400" : "text-gray-300"
          }`}
        >
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs">Review</span>
        </Link>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default Header;
