import React, { useRef, useEffect, useState } from "react";
import { CircleDot, Play, Pause, Volume2, VolumeX } from "lucide-react";

const VideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isLive, setIsLive] = useState(true);
  const [maxTime, setMaxTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // When metadata is loaded, set video to start from the middle
    const handleMetadata = () => {
      const middlePoint = videoElement.duration * 0.6;
      videoElement.currentTime = middlePoint;
      setMaxTime(middlePoint);
      setDuration(videoElement.duration);
    };
    
    // Monitor time updates to maintain "live" status
    const handleTimeUpdate = () => {
      if (!videoElement || isDragging) return;
      
      setCurrentTime(videoElement.currentTime);
      
      // If current time exceeds previous max, update max (we're still "live")
      if (videoElement.currentTime > maxTime) {
        setMaxTime(videoElement.currentTime);
        setIsLive(true);
      } else {
        // If we're behind the max time, we're no longer "live"
        setIsLive(videoElement.currentTime >= maxTime - 0.5);
      }
    };
    
    // Handle play state changes
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    videoElement.addEventListener('loadedmetadata', handleMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    
    // Auto-play when component loads
    videoElement.play().catch(e => console.log('Auto-play prevented:', e));
    
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, [maxTime, isDragging]);
  
  // Toggle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    const newMutedState = !isMuted;
    videoRef.current.muted = newMutedState;
    setIsMuted(newMutedState);
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };
  
  // Function to catch up to live point
  const catchUpToLive = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = maxTime;
      setIsLive(true);
    }
  };
  
  // Handle click on progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const clickTime = duration * clickPosition;
    
    // Prevent seeking beyond the "live" point
    if (clickTime <= maxTime) {
      videoRef.current.currentTime = clickTime;
      setCurrentTime(clickTime);
      setIsLive(clickTime >= maxTime - 0.5);
    }
  };
  
  // Format time for display (MM:SS)
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Calculate progress percentages
  const playedPercentage = duration ? (currentTime / duration) * 100 : 0;
  const livePercentage = duration ? (maxTime / duration) * 100 : 0;

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
      
      {/* Video Player (without native controls) */}
      <video 
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay 
        muted
        playsInline
      >
        <source src="/videos/livestream_converted.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress bar with visual indication of "live" boundary */}
        <div 
          ref={progressBarRef}
          className="relative h-2 mb-2 rounded-full overflow-hidden bg-gray-700 cursor-pointer"
          onClick={handleProgressClick}
        >
          {/* Played progress */}
          <div 
            className="absolute h-full bg-red-500"
            style={{ width: `${playedPercentage}%` }}
          />
          
          {/* Available range (up to "live" point) */}
          <div 
            className="absolute h-full bg-gray-500 opacity-60"
            style={{ width: `${livePercentage}%`, left: `${playedPercentage}%` }}
          />
          
          {/* Unavailable range (beyond "live" point) */}
          <div 
            className="absolute h-full bg-gray-800"
            style={{ width: `${100 - livePercentage}%`, left: `${livePercentage}%` }}
          />
          
          {/* Live point indicator */}
          <div 
            className="absolute h-full w-1 bg-red-600"
            style={{ left: `${livePercentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <button 
              className="text-white hover:text-gray-200" 
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            {/* Volume control */}
            <div className="flex items-center gap-2">
              <button 
                className="text-white hover:text-gray-200"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 accent-red-500"
              />
            </div>
          </div>
          
          {/* Time display */}
          <div className="text-white text-sm">
            {formatTime(currentTime)} / {isLive ? 'LIVE' : formatTime(maxTime)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
