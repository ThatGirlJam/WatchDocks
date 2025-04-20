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
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-72px)] overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          <div className="relative h-[60%] bg-gray-900 rounded-lg overflow-hidden">
            <VideoPlayer />
          </div>
          <div className="h-[40%] overflow-hidden">
            <BikeDockStatus />
          </div>
        </div>

        <div className="flex flex-col gap-6 h-full overflow-hidden">
          <div className="h-[25%]">
            <CameraSelector />
          </div>
          <div className="h-[25%] shadow-lg">
            <CameraMap camera={activeCamera} />
          </div>
          <div className="h-[50%]">
            <AlertsList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
