import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import CameraFeed from "../components/CameraFeed";
import CameraSelector from "../components/CameraSelector";
import AlertsList from "../components/AlertsList";
import BikeDockStatus from "../components/BikeDockStatus";
import VideoPlayer from "../components/VideoPlayer";
import CameraMap from "../components/CameraMap";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";

const Dashboard: React.FC = () => {
  const { state } = useApp();
  const activeCamera = state.cameras.find(cam => cam.id === state.activeCamera);
  const [showMap, setShowMap] = useState(true);

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-72px)] overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          <div className="relative h-[60%] bg-gray-900 rounded-lg overflow-hidden">
            {/* Toggleable map above the video player */}
            <div className="absolute top-4 left-4 z-20">
              <button
                onClick={() => setShowMap(v => !v)}
                className="flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-white rounded shadow text-gray-700 text-xs mb-2"
              >
                <MapPin className="w-4 h-4" />
                {showMap ? "Hide Map" : "Show Map"}
                {showMap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showMap && (
                <div className="w-72 shadow-lg">
                  <CameraMap camera={activeCamera} />
                </div>
              )}
            </div>
            <VideoPlayer />
          </div>
          <div className="h-[40%] overflow-hidden">
            <BikeDockStatus />
          </div>
        </div>

        <div className="flex flex-col gap-6 h-full overflow-hidden">
          <div className="h-[30%]">
            <CameraSelector />
          </div>
          <div className="h-[70%]">
            <AlertsList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
