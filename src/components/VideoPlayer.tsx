import React, { useRef, useEffect, useState } from "react";
import { CircleDot, Play, Pause, Volume2, VolumeX, Rewind, ArrowRight, FastForward } from "lucide-react";
import { useApp } from '../context/AppContext';

const VideoPlayer: React.FC = () => {
  const { state } = useApp();
  const activeCamera = state.cameras.find(camera => camera.id === state.activeCamera);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const behindCounterRef = useRef<NodeJS.Timeout | null>(null);

  // Metadata
  const [duration, setDuration] = useState(0);
  const [maxSeek, setMaxSeek] = useState(0);

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isLive, setIsLive] = useState(true);
  
  // Track fixed delay mode
  const [fixedDelaySeconds, setFixedDelaySeconds] = useState<number | null>(null);
  
  // Track additional seconds behind when paused
  const [pausedBehindSeconds, setPausedBehindSeconds] = useState(0);

  // Fixed values
  const HISTORY_SEC = 15 * 60;
  const REWIND_SEC = 30; // 30 second rewind
  const FORWARD_SEC = 10; // 10 second forward

  // Select video file based on camera
  const videoSource = activeCamera?.name === "Bike Rack North" 
    ? "/videos/livestream_converted2.mp4" 
    : "/videos/livestream_converted.mp4";
    
  // Effect to handle video source changes
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    
    // Force reload when source changes
    vid.load();
    
    // Reset all playback states
    setIsLive(true);
    setFixedDelaySeconds(null);
    setPausedBehindSeconds(0);
    setMaxSeek(0);
    setCurrentTime(0);
    
    // This will trigger the onMeta event which will set the correct time
  }, [videoSource, activeCamera?.id]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onMeta = () => {
      const d = vid.duration;
      setDuration(d);
      // Start at 80% of the video for demo purposes
      const startPoint = d * 0.8;
      vid.currentTime = startPoint;
      setCurrentTime(startPoint);
      setMaxSeek(startPoint);
      vid.play().catch(() => {});
    };

    const onTimeUpdate = () => {
      if (!vid) return;
      const t = vid.currentTime;
      
      // Track current time
      setCurrentTime(t);
      
      if (fixedDelaySeconds !== null) {
        // In fixed delay mode:
        // 1. Update maxSeek normally
        if (t + fixedDelaySeconds > maxSeek) {
          setMaxSeek(t + fixedDelaySeconds);
        }
        
        // 2. We're never "live" in fixed delay mode
        setIsLive(false);
      } else {
        // Normal live mode:
        // 1. Update maxSeek if this is the furthest we've gotten
        if (t > maxSeek) {
          setMaxSeek(t);
        }
        
        // 2. We're live if we're at or very close to maxSeek
        setIsLive(t >= maxSeek - 0.5);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("timeupdate", onTimeUpdate);
    vid.addEventListener("play", onPlay);
    vid.addEventListener("pause", onPause);

    return () => {
      vid.removeEventListener("loadedmetadata", onMeta);
      vid.removeEventListener("timeupdate", onTimeUpdate);
      vid.removeEventListener("play", onPlay);
      vid.removeEventListener("pause", onPause);
    };
  }, [maxSeek, fixedDelaySeconds]);

  // Handle pause/play counter effect
  useEffect(() => {
    // Clear any existing interval
    if (behindCounterRef.current) {
      clearInterval(behindCounterRef.current);
      behindCounterRef.current = null;
    }

    // If paused, start counting how far behind we get
    if (!isPlaying) {
      behindCounterRef.current = setInterval(() => {
        setPausedBehindSeconds(prev => prev + 1);
      }, 1000);
    } else if (pausedBehindSeconds > 0) {
      // When resuming play, convert accumulated pause time to fixed delay
      // to maintain the correct delay
      if (fixedDelaySeconds === null) {
        setFixedDelaySeconds(pausedBehindSeconds);
      } else {
        setFixedDelaySeconds(fixedDelaySeconds + pausedBehindSeconds);
      }
      setPausedBehindSeconds(0);
    }

    // Cleanup on unmount
    return () => {
      if (behindCounterRef.current) {
        clearInterval(behindCounterRef.current);
      }
    };
  }, [isPlaying, pausedBehindSeconds, fixedDelaySeconds]);

  // Toggle play/pause
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    isPlaying ? v.pause() : v.play();
  };

  // Toggle mute
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const m = !isMuted;
    v.muted = m;
    setIsMuted(m);
  };

  // Adjust volume
  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const vol = parseFloat(e.target.value);
    v.volume = vol;
    setVolume(vol);
    v.muted = vol === 0;
    setIsMuted(vol === 0);
  };
  
  // Rewind 30 seconds - can be stacked multiple times
  const rewind30s = () => {
    const v = videoRef.current;
    if (!v) return;
    
    // If already in fixed delay, add another 30s
    const newDelay = fixedDelaySeconds !== null ? 
      fixedDelaySeconds + REWIND_SEC : 
      REWIND_SEC;
    
    // Limit max delay to 5 minutes (arbitrary limit)
    const cappedDelay = Math.min(newDelay, 5 * 60);
    setFixedDelaySeconds(cappedDelay);
    
    // Set current time to appropriate point
    const newTime = Math.max(0, maxSeek - cappedDelay);
    v.currentTime = newTime;
    
    // Reset pause counter when deliberately changing position
    // (we've incorporated any existing pause time into the fixed delay)
    setPausedBehindSeconds(0);
  };
  
  // Forward 10 seconds - only works when behind live
  const forward10s = () => {
    const v = videoRef.current;
    if (!v || fixedDelaySeconds === null) return;
    
    // Reduce delay by 10s with a minimum of 0
    const newDelay = Math.max(0, fixedDelaySeconds - FORWARD_SEC);
    
    if (newDelay === 0) {
      // If we've reached live, disable fixed delay mode
      setFixedDelaySeconds(null);
      v.currentTime = maxSeek;
      setIsLive(true);
    } else {
      // Otherwise update the delay
      setFixedDelaySeconds(newDelay);
      const newTime = Math.max(0, maxSeek - newDelay);
      v.currentTime = newTime;
    }
    
    // Reset pause counter (we've incorporated it into the fixed delay)
    setPausedBehindSeconds(0);
  };
  
  // Go to live position
  const goToLive = () => {
    const v = videoRef.current;
    if (!v) return;
    
    // Disable fixed delay
    setFixedDelaySeconds(null);
    
    // Jump to max position
    v.currentTime = maxSeek;
    setIsLive(true);
    
    // Reset pause counter ONLY when explicitly going back to live
    setPausedBehindSeconds(0);
  };
  
  // Format time for display (MM:SS format)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Get correct display for how far behind live we are
  const behindLiveDisplay = () => {
    // When in fixed delay mode
    if (fixedDelaySeconds !== null) {
      // Add paused time when paused
      const totalDelay = fixedDelaySeconds + (!isPlaying ? pausedBehindSeconds : 0);
      return `${totalDelay}s behind`;
    }
    
    // When live
    if (isLive && isPlaying) {
      return "LIVE";
    }
    
    // When paused at live point
    if (isLive && !isPlaying) {
      return `${pausedBehindSeconds}s behind`;
    }
    
    // When just behind (neither fixed delay nor live)
    const videoBehindSeconds = Math.floor(maxSeek - currentTime);
    const totalBehind = videoBehindSeconds + (!isPlaying ? pausedBehindSeconds : 0);
    return `${totalBehind}s behind`;
  };

  return (
    <div className="relative w-full h-full select-none">
      {/* Live indicator */}
      <div className={`absolute top-4 left-4 z-10 flex items-center gap-2 ${isLive && isPlaying ? 'bg-black/50' : 'bg-gray-700/80'} px-3 py-1.5 rounded-full`}>
        <CircleDot className={`h-4 w-4 ${isLive && isPlaying ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
        <span className="text-sm font-medium text-white">
          {behindLiveDisplay()}
        </span>
      </div>

      {/* Video element */}
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted preload="auto">
        <source src={videoSource} type="video/mp4" />
      </video>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <button onClick={togglePlay} className="text-white hover:text-gray-200">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            {/* Volume controls */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white hover:text-gray-200">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={isMuted ? 0 : volume} 
                onChange={onVolumeChange} 
                className="w-20 h-1 accent-red-500" 
              />
            </div>
          </div>
          
          {/* Navigation buttons and live indicator */}
          <div className="flex items-center gap-3">
            {/* Rewind 30s button */}
            <button 
              onClick={rewind30s}
              className={`flex items-center gap-1 text-xs ${
                fixedDelaySeconds !== null ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700/80 hover:bg-gray-600/80'
              } text-white px-2 py-1.5 rounded-full`}
            >
              <Rewind size={14} />
              30s
            </button>

            {/* Forward 10s button (only shown when not live) */}
            {fixedDelaySeconds !== null && (
              <button 
                onClick={forward10s}
                className="flex items-center gap-1 text-xs bg-green-600/90 hover:bg-green-700 text-white px-2 py-1.5 rounded-full"
              >
                <FastForward size={14} />
                10s
              </button>
            )}
            
            {/* Go to Live button (only shown when not live) */}
            {(!isLive || !isPlaying || fixedDelaySeconds !== null) && (
              <button 
                onClick={goToLive}
                className="flex items-center gap-1 text-xs bg-red-500/90 hover:bg-red-600 text-white px-2 py-1.5 rounded-full"
              >
                <ArrowRight size={14} />
                Go Live
              </button>
            )}
            
            {/* Live indicator */}
            <div className="text-white text-sm">
              <span className="flex items-center gap-1">
                <CircleDot className={`h-3 w-3 ${isLive && isPlaying ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                <span className={`font-medium ${isLive && isPlaying ? 'text-red-500' : 'text-gray-400'}`}>
                  LIVE
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;