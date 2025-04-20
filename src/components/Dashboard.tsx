import React from "react";
import { useApp } from "../context/AppContext";
import CameraFeed from "./CameraFeed";
import CameraSelector from "./CameraSelector";
import AlertsList from "./AlertsList";
import SystemStatus from "./SystemStatus";
import VideoPlayer from "./VideoPlayer";

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-72px)] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          <div className="relative h-[60%] bg-gray-900 rounded-lg overflow-hidden">
            <VideoPlayer />
          </div>
          <div className="h-[40%] overflow-hidden">
            <SystemStatus />
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
