import React, { useRef, useEffect, useState, useCallback } from "react";
import { CircleDot, Play, Pause, Volume2, VolumeX, Rewind, ArrowRight, FastForward, Eye, EyeOff } from "lucide-react";
import { useApp } from '../context/AppContext';

// Motion detection settings
interface MotionSettings {
  minFlow: number;
  maxFlow: number;
  minAreaPercent: number;
  threshold: number;
  showMask: boolean;
}

// ROI coordinates type
type Point = { x: number, y: number };
type ROI = Point[];

const VideoPlayer: React.FC = () => {
  const { state } = useApp();
  const activeCamera = state.cameras.find(camera => camera.id === state.activeCamera);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const behindCounterRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);

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

  // Motion detection states
  const [motionSettings, setMotionSettings] = useState<MotionSettings>(() => {
    const savedSettings = localStorage.getItem(`motion_settings_${activeCamera?.id}`);
    return savedSettings ? JSON.parse(savedSettings) : {
      minFlow: 10,
      maxFlow: 100,
      minAreaPercent: 2,
      threshold: 30,
      showMask: true
    };
  });
  
  const [roi, setRoi] = useState<ROI>(() => {
    const savedRoi = localStorage.getItem(`roi_${activeCamera?.id}`);
    return savedRoi ? JSON.parse(savedRoi) : [];
  });
  
  const [isDrawingRoi, setIsDrawingRoi] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  const [showMotionDetection, setShowMotionDetection] = useState(true);
  const [motionMask, setMotionMask] = useState<ImageData | null>(null);
  const [activeMotionAreas, setActiveMotionAreas] = useState<{x: number, y: number, w: number, h: number}[]>([]);

  // Toggle motion detection overlay
  const toggleMotionDetection = () => {
    setShowMotionDetection(!showMotionDetection);
  };
  
  // Start/stop ROI drawing mode
  const toggleRoiDrawingMode = () => {
    setIsDrawingRoi(!isDrawingRoi);
    if (!isDrawingRoi) {
      setRoi([]);
    } else {
      // Save ROI to local storage when finished drawing
      localStorage.setItem(`roi_${activeCamera?.id}`, JSON.stringify(roi));
    }
  };
  
  // Handle canvas click for ROI points
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRoi) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setRoi(prevRoi => {
      const newRoi = [...prevRoi, { x, y }];
      return newRoi;
    });
  };
  
  // Save motion settings to local storage
  useEffect(() => {
    localStorage.setItem(`motion_settings_${activeCamera?.id}`, JSON.stringify(motionSettings));
  }, [motionSettings, activeCamera?.id]);
  
  // Initialize motion detection
  useEffect(() => {
    if (!showMotionDetection || !videoRef.current || !canvasRef.current) return;
    
    let lastProcessTime = 0;
    const PROCESS_INTERVAL = 100; // Process every 100ms for performance
    
    const detectMotion = (time: number) => {
      if (time - lastProcessTime > PROCESS_INTERVAL) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas || video.paused || video.ended) {
          animationFrameRef.current = requestAnimationFrame(detectMotion);
          return;
        }
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          animationFrameRef.current = requestAnimationFrame(detectMotion);
          return;
        }
        
        // Match canvas dimensions to video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        
        // Draw current frame to canvas (but don't display it)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get current frame data
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const currentData = currentFrame.data;
        
        // If we have a previous frame, compare them
        if (previousFrameRef.current) {
          const prevData = previousFrameRef.current.data;
          const diffMask = ctx.createImageData(canvas.width, canvas.height);
          const diffData = diffMask.data;
          
          // Clear the canvas before drawing the mask
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Simple frame differencing
          let motionPixels = 0;
          let totalPixels = 0;
          const motionAreas: {x: number, y: number, w: number, h: number}[] = [];
          
          // Create motion map
          const motionMap = new Uint8Array(canvas.width * canvas.height);
          
          // Only check within ROI if defined
          const checkInRoi = (x: number, y: number): boolean => {
            if (roi.length < 3) return true; // No ROI defined
            
            let inside = false;
            for (let i = 0, j = roi.length - 1; i < roi.length; j = i++) {
              if (((roi[i].y > y) !== (roi[j].y > y)) &&
                  (x < (roi[j].x - roi[i].x) * (y - roi[i].y) / (roi[j].y - roi[i].y) + roi[i].x)) {
                inside = !inside;
              }
            }
            return inside;
          };
          
          // Process pixels
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4;
              
              // Only process pixels within ROI
              if (!checkInRoi(x, y)) continue;
              
              // Count pixels in ROI
              totalPixels++;
              
              // Calculate difference between frames
              const rDiff = Math.abs(currentData[idx] - prevData[idx]);
              const gDiff = Math.abs(currentData[idx + 1] - prevData[idx + 1]);
              const bDiff = Math.abs(currentData[idx + 2] - prevData[idx + 2]);
              
              const diff = (rDiff + gDiff + bDiff) / 3;
              
              // Apply threshold
              if (diff > motionSettings.threshold) {
                motionPixels++;
                motionMap[y * canvas.width + x] = 255;
                
                // Set pixel in diff mask to red with 50% opacity
                diffData[idx] = 255;     // r
                diffData[idx + 1] = 0;   // g
                diffData[idx + 2] = 0;   // b
                diffData[idx + 3] = 100; // alpha
              } else {
                diffData[idx] = 0;       // r
                diffData[idx + 1] = 0;   // g
                diffData[idx + 2] = 0;   // b
                diffData[idx + 3] = 0;   // alpha (transparent)
              }
            }
          }
          
          // Find contours (simplified by finding connected regions)
          const visited = new Set<number>();
          
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = y * canvas.width + x;
              
              // Skip if not motion or already visited
              if (motionMap[idx] !== 255 || visited.has(idx)) continue;
              
              // Start a new motion area
              let minX = x, maxX = x, minY = y, maxY = y;
              const queue: [number, number][] = [[x, y]];
              visited.add(idx);
              
              // Simple BFS to find connected region
              while (queue.length > 0) {
                const [cx, cy] = queue.shift()!;
                
                // Update bounding box
                minX = Math.min(minX, cx);
                maxX = Math.max(maxX, cx);
                minY = Math.min(minY, cy);
                maxY = Math.max(maxY, cy);
                
                // Check neighbors
                const neighbors = [
                  [cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]
                ];
                
                for (const [nx, ny] of neighbors) {
                  if (nx < 0 || ny < 0 || nx >= canvas.width || ny >= canvas.height)
                    continue;
                    
                  const nidx = ny * canvas.width + nx;
                  if (motionMap[nidx] === 255 && !visited.has(nidx)) {
                    queue.push([nx, ny]);
                    visited.add(nidx);
                  }
                }
              }
              
              // Add motion area if big enough
              const area = (maxX - minX) * (maxY - minY);
              if (area > 100) {
                motionAreas.push({
                  x: minX,
                  y: minY,
                  w: maxX - minX,
                  h: maxY - minY
                });
              }
            }
          }
          
          // Store the motion mask
          setMotionMask(diffMask);
          setActiveMotionAreas(motionAreas);
          
          // Calculate motion percentage
          const motionPercentage = totalPixels > 0 ? (motionPixels / totalPixels) * 100 : 0;
          
          // Update motion detected state
          setMotionDetected(motionPercentage > motionSettings.minAreaPercent);
          
          // Draw the mask if enabled
          if (motionSettings.showMask) {
            ctx.putImageData(diffMask, 0, 0);
            
            // Draw ROI polygon
            if (roi.length >= 3) {
              ctx.beginPath();
              ctx.moveTo(roi[0].x, roi[0].y);
              for (let i = 1; i < roi.length; i++) {
                ctx.lineTo(roi[i].x, roi[i].y);
              }
              ctx.closePath();
              ctx.strokeStyle = motionDetected ? 'rgba(255,0,0,0.8)' : 'rgba(0,255,0,0.8)';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            
            // Draw bounding boxes around motion areas
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            for (const area of motionAreas) {
              ctx.strokeRect(area.x, area.y, area.w, area.h);
            }
            
            // Display motion percentage
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(10, 10, 200, 30);
            ctx.fillStyle = motionDetected ? 'red' : 'white';
            ctx.font = '16px Arial';
            ctx.fillText(`Motion: ${motionPercentage.toFixed(1)}%`, 20, 30);
          } else {
            // Clear canvas if mask display is disabled
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
        
        // Store current frame for next comparison
        previousFrameRef.current = currentFrame;
        lastProcessTime = time;
      }
      
      animationFrameRef.current = requestAnimationFrame(detectMotion);
    };
    
    // Start detection loop
    animationFrameRef.current = requestAnimationFrame(detectMotion);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [showMotionDetection, roi, motionSettings, activeCamera?.id]);
  
  return (
    <div className="relative w-full h-full select-none">
      {/* Live indicator */}
      <div className={`absolute top-4 left-4 z-10 flex items-center gap-2 ${isLive && isPlaying ? 'bg-black/50' : 'bg-gray-700/80'} px-3 py-1.5 rounded-full`}>
        <CircleDot className={`h-4 w-4 ${isLive && isPlaying ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
        <span className="text-sm font-medium text-white">
          {behindLiveDisplay()}
        </span>
      </div>
      
      {/* Motion detection indicator */}
      {showMotionDetection && motionDetected && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-red-500/80 px-3 py-1.5 rounded-full">
          <CircleDot className="h-4 w-4 text-white animate-pulse" />
          <span className="text-sm font-medium text-white">Motion Detected</span>
        </div>
      )}

      {/* Video element */}
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted preload="auto">
        <source src={videoSource} type="video/mp4" />
      </video>
      
      {/* Motion detection canvas overlay */}
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
        style={{ display: showMotionDetection ? 'block' : 'none' }}
      />
      
      {/* ROI drawing canvas */}
      {isDrawingRoi && (
        <div className="absolute top-0 left-0 w-full h-full">
          <canvas
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          />
          <div className="absolute top-16 left-4 bg-black/70 p-2 rounded text-white text-sm">
            Click to add points to ROI polygon. Click "Finish" when done.
          </div>
          <button
            onClick={toggleRoiDrawingMode}
            className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded"
          >
            Finish ROI
          </button>
        </div>
      )}

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
            
            {/* Motion detection toggle */}
            <button
              onClick={toggleMotionDetection}
              className="text-white hover:text-gray-200"
              title={showMotionDetection ? "Turn off motion detection" : "Turn on motion detection"}
            >
              {showMotionDetection ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            
            {/* ROI setting button */}
            <button
              onClick={toggleRoiDrawingMode}
              className={`text-xs px-2 py-1 rounded ${isDrawingRoi ? 'bg-red-500' : 'bg-gray-600'} text-white`}
            >
              {isDrawingRoi ? "Cancel" : "Set ROI"}
            </button>
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
        
        {/* Motion detection settings (optional) */}
        {showMotionDetection && (
          <div className="mt-2 grid grid-cols-2 gap-2 bg-black/60 p-2 rounded">
            <div>
              <label className="text-white text-xs">Threshold:</label>
              <input
                type="range"
                min="10"
                max="100"
                value={motionSettings.threshold}
                onChange={(e) => setMotionSettings({
                  ...motionSettings,
                  threshold: Number(e.target.value)
                })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-white text-xs">Min Area %:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={motionSettings.minAreaPercent}
                onChange={(e) => setMotionSettings({
                  ...motionSettings,
                  minAreaPercent: Number(e.target.value)
                })}
                className="w-full"
              />
            </div>
            <div className="col-span-2">
              <label className="text-white text-xs flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={motionSettings.showMask}
                  onChange={(e) => setMotionSettings({
                    ...motionSettings,
                    showMask: e.target.checked
                  })}
                />
                Show detection mask
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;