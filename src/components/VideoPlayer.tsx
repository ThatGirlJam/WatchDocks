import React, { useRef, useEffect, useState } from "react";
import { CircleDot } from "lucide-react";

const VideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLive, setIsLive] = useState(true);
  const [maxTime, setMaxTime] = useState(0);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // When metadata is loaded, set video to start from the middle
    const handleMetadata = () => {
      // Start from ~60% through the video to allow some backward scrubbing
      const middlePoint = videoElement.duration * 0.6;
      videoElement.currentTime = middlePoint;
      setMaxTime(middlePoint);
    };
    
    // Monitor time updates to maintain "live" status
    const handleTimeUpdate = () => {
      if (!videoElement) return;
      
      // If current time exceeds previous max, update max (we're still "live")
      if (videoElement.currentTime > maxTime) {
        setMaxTime(videoElement.currentTime);
        setIsLive(true);
      } else {
        // If we're behind the max time, we're no longer "live"
        setIsLive(videoElement.currentTime >= maxTime - 0.5);
      }
    };
    
    // Prevent scrubbing forward past the "live" point
    const handleSeek = () => {
      if (!videoElement) return;
      if (videoElement.currentTime > maxTime) {
        videoElement.currentTime = maxTime;
      }
    };
    
    videoElement.addEventListener('loadedmetadata', handleMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('seeking', handleSeek);
    
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('seeking', handleSeek);
    };
  }, [maxTime]);
  
  // Function to catch up to live point
  const catchUpToLive = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = maxTime;
      setIsLive(true);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Live Indicator */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
        <CircleDot className={`h-4 w-4 ${isLive ? 'text-red-500' : 'text-gray-400'}`} />
        <span className={`text-sm font-medium ${isLive ? 'text-white' : 'text-gray-300'}`}>
          {isLive ? 'LIVE' : 'DELAYED'}
        </span>
        
        {!isLive && (
          <button 
            onClick={catchUpToLive}
            className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
          >
            Go Live
          </button>
        )}
      </div>
      
      {/* Video Player */}
      <video 
        ref={videoRef}
        className="w-full h-full object-cover"
        controls 
        autoPlay 
        muted
      >
        <source src="/videos/livestream_converted.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Time Controls Info (Optional) */}
      <div className="absolute bottom-14 right-4 text-xs bg-black/70 text-white px-2 py-1 rounded opacity-80">
        {isLive ? 'Live Broadcast' : 'Viewing Past Footage'}
      </div>
    </div>
  );
};

export default VideoPlayer;
