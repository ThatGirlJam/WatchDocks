import React, { useRef, useEffect, useState, useCallback } from "react";
import { CircleDot, Play, Pause, Volume2, VolumeX, Rewind, ArrowRight, FastForward, Eye, EyeOff } from "lucide-react";
import { useApp } from '../context/AppContext';
import { useAuth } from '../auth/AuthContext';

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

// New: Interface for tracked objects
interface TrackedObject {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  firstDetectedAt: number; // timestamp
  lastSeenAt: number; // timestamp
  frames: number; // number of consecutive frames detected
  isLoitering: boolean;
}

// Add this at the file level, outside any component
declare global {
  interface Window {
    _trackedObjects?: TrackedObject[];
  }
}

const VideoPlayer: React.FC = () => {
  const { state, dispatch } = useApp();
  const { userRole } = useAuth();
  const activeCamera = state.cameras.find(camera => camera.id === state.activeCamera);
  
  // Check if user has admin privileges
  const isAdmin = userRole === 'admin';
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roiCanvasRef = useRef<HTMLCanvasElement>(null); // New ref for ROI drawing
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
  const DEFAULT_MOTION_SETTINGS: MotionSettings = {
    minFlow: 10,
    maxFlow: 100,
    minAreaPercent: 15,
    threshold: 70,
    showMask: true,
  };

  const [motionSettings, setMotionSettings] = useState<MotionSettings>(() => {
    const savedSettings = localStorage.getItem(`motion_settings_${activeCamera?.id}`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Merge defaults with stored values, so missing fields get defaults
        return { ...DEFAULT_MOTION_SETTINGS, ...parsed };
      } catch {
        // If parsing fails, fall back to defaults
        return DEFAULT_MOTION_SETTINGS;
      }
    }
    return DEFAULT_MOTION_SETTINGS;
  });
  
  const [roi, setRoi] = useState<ROI>(() => {
    const savedRoi = localStorage.getItem(`roi_${activeCamera?.id}`);
    return savedRoi ? JSON.parse(savedRoi) : [];
  });
  
  const [isDrawingRoi, setIsDrawingRoi] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  const [showMotionDetection, setShowMotionDetection] = useState(false); // Default to closed eye
  const [motionMask, setMotionMask] = useState<ImageData | null>(null);
  const [activeMotionAreas, setActiveMotionAreas] = useState<{x: number, y: number, w: number, h: number}[]>([]);

  // New: State for tracked objects and loitering detection
  const [trackedObjects, setTrackedObjects] = useState<TrackedObject[]>([]);
  // Set loitering threshold to 45 seconds
  const [loiteringThreshold] = useState(45000); // 45 seconds for loitering detection
  const [loiteringDetected, setLoiteringDetected] = useState(false);
  // Lower minimum size threshold even further
  const [loiteringMinSize] = useState(50); 
  
  // Debugging flags to better understand the tracking
  const [showAllTrackedObjects, setShowAllTrackedObjects] = useState(false); // Hide tracking
  const [showDebugInfo, setShowDebugInfo] = useState(false); // Hide debug info
  const [persistentTracking, setPersistentTracking] = useState(false); // Normal persistence
  const [showDecayingObjects, setShowDecayingObjects] = useState(false); // Hide fading objects
  
  // Track areas where people spend time - like a heatmap
  const [dwellMap, setDwellMap] = useState<Map<string, number>>(new Map());

  // More UI controls for debugging
  const toggleShowAllTrackedObjects = () => {
    setShowAllTrackedObjects(!showAllTrackedObjects);
  };
  
  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };
  
  const togglePersistentTracking = () => {
    setPersistentTracking(!persistentTracking);
  };

  const toggleShowDecayingObjects = () => {
    setShowDecayingObjects(!showDecayingObjects);
  };

  // Toggle motion detection overlay
  const toggleMotionDetection = () => {
    setShowMotionDetection(!showMotionDetection);
  };
  
  // Start/stop ROI drawing mode
  const toggleRoiDrawingMode = () => {
    if (isDrawingRoi) {
      // When finishing drawing mode, save the ROI
      if (roi.length >= 3) {
        localStorage.setItem(`roi_${activeCamera?.id}`, JSON.stringify(roi));
      }
    } else {
      // When starting drawing mode, clear existing ROI
      setRoi([]);
    }
    setIsDrawingRoi(!isDrawingRoi);
  };
  
  // Fix ROI drawing to scale coordinates correctly
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRoi) return;

    const canvas = roiCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const canvasRect = canvas.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();

    // Calculate scaling factors between video and canvas
    const scaleX = video.videoWidth / videoRect.width;
    const scaleY = video.videoHeight / videoRect.height;

    // Get click coordinates relative to the canvas
    const x = (e.clientX - canvasRect.left) * scaleX;
    const y = (e.clientY - canvasRect.top) * scaleY;

    setRoi((prevRoi) => {
      const newRoi = [...prevRoi, { x, y }];

      // Draw the updated ROI points and lines
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas and add semi-transparent overlay
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw points and connecting lines
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;

        // Draw all points
        newRoi.forEach((point, i) => {
          // Draw point
          ctx.beginPath();
          ctx.arc(point.x / scaleX, point.y / scaleY, 5, 0, Math.PI * 2);
          ctx.fill();

          // Draw connecting line
          if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(newRoi[i - 1].x / scaleX, newRoi[i - 1].y / scaleY);
            ctx.lineTo(point.x / scaleX, point.y / scaleY);
            ctx.stroke();
          }
        });

        // Connect back to first point if we have 3 or more points
        if (newRoi.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(newRoi[newRoi.length - 1].x / scaleX, newRoi[newRoi.length - 1].y / scaleY);
          ctx.lineTo(newRoi[0].x / scaleX, newRoi[0].y / scaleY);
          ctx.stroke();
        }
      }

      return newRoi;
    });
  };
  
  // Save motion settings to local storage
  useEffect(() => {
    localStorage.setItem(`motion_settings_${activeCamera?.id}`, JSON.stringify(motionSettings));
  }, [motionSettings, activeCamera?.id]);
  
  // Initialize ROI canvas when drawing mode changes
  useEffect(() => {
    if (isDrawingRoi && roiCanvasRef.current && videoRef.current) {
      const canvas = roiCanvasRef.current;
      const video = videoRef.current;
      
      // Match canvas size to video element size
      const videoRect = video.getBoundingClientRect();
      canvas.width = videoRect.width;
      canvas.height = videoRect.height;
      
      // Draw semi-transparent overlay
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isDrawingRoi]);
  
  // Load camera-specific ROI when camera changes
  useEffect(() => {
    if (!activeCamera?.id) return;
    
    // Load the ROI for the current camera
    const savedRoi = localStorage.getItem(`roi_${activeCamera.id}`);
    if (savedRoi) {
      try {
        const parsedRoi = JSON.parse(savedRoi);
        setRoi(parsedRoi);
        console.log(`Loaded ROI for camera ${activeCamera.id} with ${parsedRoi.length} points`);
      } catch (e) {
        console.error("Error loading ROI from localStorage:", e);
        setRoi([]);
      }
    } else {
      // No ROI for this camera
      setRoi([]);
    }
  }, [activeCamera?.id]);

  // Initialize motion detection
  useEffect(() => {
    // Only run if we have valid references
    if (!videoRef.current || !canvasRef.current) return;
    
    let lastProcessTime = 0;
    const PROCESS_INTERVAL = 50; // More frequent processing (was 100ms)
    let lastCleanupTime = 0;
    const CLEANUP_INTERVAL = 2000; // Clean up inactive objects every 2 seconds now
    
    // Initialize or reset dwell map when camera changes
    setDwellMap(new Map());
    
    const detectMotion = (time: number) => {
      const currentTime = performance.now();
      
      // Handle object cleanup less frequently
      if (currentTime - lastCleanupTime > CLEANUP_INTERVAL) {
        // More persistent tracking - keep objects for 20 seconds instead of 10
        setTrackedObjects(prevObjects => 
          prevObjects.filter(obj => currentTime - obj.lastSeenAt < (persistentTracking ? 20000 : 10000))
        );
        lastCleanupTime = currentTime;
      }
      
      if (currentTime - lastProcessTime > PROCESS_INTERVAL) {
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
          
          // Update motion detected state - only when motion detection is enabled
          if (showMotionDetection) {
            setMotionDetected(motionPercentage > motionSettings.minAreaPercent);
          }
          
          // After detecting motion areas, track objects across frames with improved tracking
          if (motionAreas.length > 0) {
            setTrackedObjects(prevObjects => {
              // Create a copy of existing objects
              const updatedObjects = [...prevObjects];
              let loiteringFound = false;

              // First, update the dwell map
              const cellSize = 20; // 20x20 pixel grid for dwell tracking
              const newDwellMap = new Map(dwellMap);
              
              // Add motion areas to dwell map
              motionAreas.forEach(area => {
                // Only track larger areas
                if (area.w * area.h < loiteringMinSize) return;
                
                // Center point
                const centerX = Math.floor((area.x + area.w / 2) / cellSize);
                const centerY = Math.floor((area.y + area.h / 2) / cellSize);
                const cellKey = `${centerX},${centerY}`;
                
                // Increment dwell time for this cell
                newDwellMap.set(cellKey, (newDwellMap.get(cellKey) || 0) + 1);
              });
              setDwellMap(newDwellMap);
              
              // Match detected areas with existing tracked objects
              motionAreas.forEach(area => {
                // Skip excessively small motion areas - even more permissive
                if (area.w * area.h < loiteringMinSize) return;
                
                // Area center point
                const centerX = area.x + area.w / 2;
                const centerY = area.y + area.h / 2;
                
                // Find if this area matches any existing tracked object
                let matched = false;
                let bestMatch = null;
                let bestDistance = Infinity;
                
                // First pass: find the best matching object based on distance and size similarity
                for (const obj of updatedObjects) {
                  const objCenterX = obj.x + obj.w / 2;
                  const objCenterY = obj.y + obj.h / 2;
                  
                  // Distance between centers
                  const distance = Math.sqrt(
                    Math.pow(centerX - objCenterX, 2) + Math.pow(centerY - objCenterY, 2)
                  );
                  
                  // Size similarity (0 = identical, higher = more different)
                  const sizeDiff = Math.abs(area.w * area.h - obj.w * obj.h) / Math.max(1, obj.w * obj.h);
                  
                  // Much more lenient matching - distance matters more than size
                  const matchScore = distance * 2 + (sizeDiff * 20); 
                  
                  // VERY permissive matching with large max distance
                  // Allow matching if distance is less than 2.5x the average dimension
                  const maxDistance = ((area.w + area.h + obj.w + obj.h) / 4) * 2.5;
                  
                  if (distance < maxDistance && matchScore < bestDistance) {
                    bestMatch = obj;
                    bestDistance = matchScore;
                  }
                }
                
                // If we found a match, update it
                if (bestMatch) {
                  // Update with more aggressive exponential moving average for tracking
                  const alpha = 0.5; // 0.5 = balanced between old and new position
                  bestMatch.x = alpha * area.x + (1 - alpha) * bestMatch.x;
                  bestMatch.y = alpha * area.y + (1 - alpha) * bestMatch.y;
                  bestMatch.w = alpha * area.w + (1 - alpha) * bestMatch.w;
                  bestMatch.h = alpha * area.h + (1 - alpha) * bestMatch.h;
                  bestMatch.lastSeenAt = currentTime;
                  bestMatch.frames++;
                  
                  // Check if it's loitering with lower frame threshold
                  if (bestMatch.frames > 5 && currentTime - bestMatch.firstDetectedAt > loiteringThreshold) {
                    bestMatch.isLoitering = true;
                    loiteringFound = true;
                  }
                  
                  matched = true;
                }
                
                // If no match found, create new tracked object
                if (!matched) {
                  const newObj: TrackedObject = {
                    id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    x: area.x,
                    y: area.y,
                    w: area.w,
                    h: area.h,
                    firstDetectedAt: currentTime,
                    lastSeenAt: currentTime,
                    frames: 1,
                    isLoitering: false
                  };
                  
                  updatedObjects.push(newObj);
                }
              });
              
              // Update loitering state
              setLoiteringDetected(loiteringFound);
              // Add this to propagate to app context
              if (loiteringFound !== state.isLoitering) {
                dispatch({ type: 'SET_LOITERING_STATUS', payload: loiteringFound });
              }
              
              // Make tracked objects available globally for the capture function
              window._trackedObjects = updatedObjects;
              
              return updatedObjects;
            });
          }
          
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
            
            // Draw dwell map if debug is enabled
            if (showDebugInfo) {
              const cellSize = 20;
              ctx.globalAlpha = 0.3;
              dwellMap.forEach((count, key) => {
                const [x, y] = key.split(',').map(Number);
                const hue = Math.min(120, count * 5); // Red (0) to Green (120) based on count
                const saturation = 100;
                const lightness = 50;
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
              });
              ctx.globalAlpha = 1;
            }
            
            // Draw bounding boxes around motion areas
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            for (const area of motionAreas) {
              ctx.strokeRect(area.x, area.y, area.w, area.h);
            }
            
            // Draw ALL tracked objects with improved visualization
            if (showAllTrackedObjects) {
              trackedObjects.forEach(obj => {
                const trackingTime = Math.round((currentTime - obj.firstDetectedAt) / 1000);
                // Calculate decay - how old is this detection (0-1 where 1 is fresh, 0 is about to disappear)
                const timeSinceLastSeen = currentTime - obj.lastSeenAt;
                const maxDecayTime = persistentTracking ? 20000 : 10000; // How long before object is fully decayed
                const decayFactor = Math.max(0, 1 - timeSinceLastSeen / maxDecayTime);
                
                // Skip objects with very few frames (likely noise)
                if (obj.frames <= 2) return;
                
                // Skip decaying objects if the toggle is off
                if (!showDecayingObjects && decayFactor < 0.7) return;
                
                // Draw tracking path as a tracer
                if (showDebugInfo && obj.frames > 5) {
                  const centerX = obj.x + obj.w / 2;
                  const centerY = obj.y + obj.h / 2;
                  const tracerSize = 4;
                  
                  // Fade the tracer based on decay
                  ctx.fillStyle = obj.isLoitering ? 
                    `rgba(255, 165, 0, ${decayFactor * 0.8})` : 
                    `rgba(0, 255, 255, ${decayFactor * 0.8})`;
                  ctx.fillRect(centerX - tracerSize/2, centerY - tracerSize/2, tracerSize, tracerSize);
                }
                
                if (obj.isLoitering) {
                  // Loitering objects get distinctive highlight with decay effect
                  const colorIntensity = Math.floor(decayFactor * 255);
                  ctx.strokeStyle = (Date.now() % 1000) < 500 ? 
                    `rgba(255, ${colorIntensity}, 0, ${decayFactor})` : 
                    `rgba(255, 0, 0, ${decayFactor})`;
                  ctx.lineWidth = 4 * decayFactor; // Thinner line as it decays
                } else {
                  // Normal tracking - brightness based on track time AND decay
                  const alpha = Math.min(0.8, 0.3 + (obj.frames / 100)) * decayFactor;
                  ctx.strokeStyle = `rgba(0, 180, 255, ${alpha})`;
                  ctx.lineWidth = 2 * decayFactor; // Thinner line as it decays
                }
                
                // Only draw box if not too decayed
                if (decayFactor > 0.2) {
                  ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
                }
                
                // Add timer above object with improved visibility
                if (decayFactor > 0.4) { // Only show labels for less decayed objects
                  // Background gets more transparent as it decays
                  ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * decayFactor})`;
                  ctx.fillRect(obj.x, obj.y - 25, 95, 20);
                  
                  ctx.fillStyle = obj.isLoitering ? 
                    `rgba(255, 165, 0, ${decayFactor})` : 
                    `rgba(0, 255, 255, ${decayFactor})`;
                  ctx.font = 'bold 12px Arial';
                  
                  // Show tracking time and frame count
                  ctx.fillText(`${trackingTime}s (${obj.frames}f)`, obj.x + 5, obj.y - 10);
                  
                  // Add loitering warning if applicable
                  if (obj.isLoitering && decayFactor > 0.6) { // Only show warning for fresh loitering
                    ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * decayFactor})`;
                    ctx.fillRect(obj.x, obj.y - 50, 95, 20);
                    ctx.fillStyle = (Date.now() % 1000) < 500 ? 
                      `rgba(255, 0, 0, ${decayFactor})` : 
                      `rgba(255, 165, 0, ${decayFactor})`;
                    ctx.fillText('⚠️ LOITERING', obj.x + 5, obj.y - 35);
                  }
                }
              });
            }
            
            // Display motion percentage with enhanced info
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // More opaque background
            ctx.fillRect(10, 10, 220, 30);
            ctx.fillStyle = motionDetected ? 'red' : 'white';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`Motion: ${motionPercentage.toFixed(1)}%`, 20, 30);
            
            // Add object counting and detailed stats
            if (showDebugInfo) {
              // Total tracked objects
              const activeObjects = trackedObjects.filter(obj => obj.frames > 3).length;
              const loiteringObjects = trackedObjects.filter(obj => obj.isLoitering).length;
              
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(10, 45, 220, 70);
              
              ctx.fillStyle = 'white';
              ctx.font = '14px Arial';
              ctx.fillText(`Tracked: ${activeObjects} objects`, 20, 65);
              ctx.fillText(`Threshold: ${loiteringThreshold/1000}s`, 20, 85);
              
              if (loiteringObjects > 0) {
                ctx.fillStyle = 'orange';
                ctx.fillText(`⚠️ Loitering: ${loiteringObjects}`, 20, 105);
              } else {
                ctx.fillStyle = 'lightgreen';
                ctx.fillText(`No Loitering Detected`, 20, 105);
              }
            }
            
            // More visible loitering alert
            if (loiteringDetected) {
              // Flashing effect
              if ((Date.now() % 1000) < 500) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
              } else {
                ctx.fillStyle = 'rgba(255, 140, 0, 0.7)';
              }
              
              ctx.fillRect(canvas.width - 230, 10, 220, 40);
              
              ctx.fillStyle = 'white';
              ctx.font = 'bold 18px Arial';
              ctx.fillText(`⚠️ LOITERING ALERT!`, canvas.width - 220, 35);
            }
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
  }, [roi, motionSettings, showMotionDetection, activeCamera?.id, loiteringThreshold, loiteringMinSize, showAllTrackedObjects, showDebugInfo, persistentTracking, dwellMap, showDecayingObjects]); 
  
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
      
      {/* Loitering alert indicator */}
      {showMotionDetection && loiteringDetected && (
        <div className="absolute top-16 right-4 z-10 flex items-center gap-2 bg-orange-500/80 px-3 py-1.5 rounded-full">
          <CircleDot className="h-4 w-4 text-white animate-pulse" />
          <span className="text-sm font-medium text-white">Loitering Detected</span>
        </div>
      )}

      {/* Video element */}
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted preload="auto">
        <source src={videoSource} type="video/mp4" />
      </video>
      
      {/* Motion detection canvas overlay - Show based on mask setting, not eye toggle */}
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
        style={{ display: motionSettings.showMask ? 'block' : 'none' }}
      />
      
      {/* ROI drawing canvas - Increased z-index to be above controls when in drawing mode */}
      {isDrawingRoi && (
        <div className="absolute top-0 left-0 w-full h-full z-50">
          <canvas
            ref={roiCanvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair"
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

      {/* Controls - Lower z-index than the ROI canvas when in drawing mode */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-40">
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
            {isAdmin && (
              <button
                onClick={toggleRoiDrawingMode}
                className={`text-xs px-2 py-1 rounded ${isDrawingRoi ? 'bg-red-500' : 'bg-gray-600'} text-white`}
              >
                {isDrawingRoi ? "Cancel" : "Set ROI"}
              </button>
            )}
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
        
        {/* Advanced debug controls */}
        {showMotionDetection && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/70 p-2 rounded">
            <div className="col-span-1 md:col-span-3 flex flex-wrap gap-2">
              <button 
                onClick={toggleShowAllTrackedObjects} 
                className={`text-xs px-2 py-1 rounded ${showAllTrackedObjects ? 'bg-blue-500' : 'bg-gray-500'}`}
              >
                {showAllTrackedObjects ? 'Hide Tracking' : 'Show Tracking'}
              </button>
              
              <button 
                onClick={toggleDebugInfo} 
                className={`text-xs px-2 py-1 rounded ${showDebugInfo ? 'bg-blue-500' : 'bg-gray-500'}`}
              >
                {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
              
              <button 
                onClick={togglePersistentTracking} 
                className={`text-xs px-2 py-1 rounded ${persistentTracking ? 'bg-green-500' : 'bg-gray-500'}`}
              >
                {persistentTracking ? 'High Persistence' : 'Normal Persistence'}
              </button>
              
              <button 
                onClick={toggleShowDecayingObjects} 
                className={`text-xs px-2 py-1 rounded ${showDecayingObjects ? 'bg-purple-500' : 'bg-gray-500'}`}
              >
                {showDecayingObjects ? 'Show Fading Objects' : 'Hide Fading Objects'}
              </button>
            </div>
            
            {/* Motion detection settings sliders */}
            <div className="col-span-1 md:col-span-3 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-white text-xs flex justify-between">
                    <span>Threshold: {motionSettings.threshold}</span>
                    <span className="text-gray-400">(Higher = less sensitive)</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={motionSettings.threshold}
                    onChange={(e) => setMotionSettings({
                      ...motionSettings,
                      threshold: Number(e.target.value)
                    })}
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <label className="text-white text-xs flex justify-between">
                    <span>Min Area %: {motionSettings.minAreaPercent}</span>
                    <span className="text-gray-400">(Higher = requires more motion)</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={motionSettings.minAreaPercent}
                    onChange={(e) => setMotionSettings({
                      ...motionSettings,
                      minAreaPercent: Number(e.target.value)
                    })}
                    className="w-full accent-green-500"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="text-white text-xs flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={motionSettings.showMask}
                      onChange={(e) => setMotionSettings({
                        ...motionSettings,
                        showMask: e.target.checked
                      })}
                      className="accent-red-500"
                    />
                    Show detection mask
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const captureCurrentFrame = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.querySelector('video');
    if (!video) {
      reject(new Error('Video element not found'));
      return;
    }

    try {
      // Create a canvas at the video's dimensions
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current frame to the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 image data
      // Remove the data:image/png;base64, prefix
      const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      resolve(imageData);
    } catch (err) {
      reject(err);
    }
  });
};

// Add this new function below the existing captureCurrentFrame function

export const captureHighlightedFrame = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.querySelector('video');
    
    if (!video) {
      reject(new Error('Video element not found'));
      return;
    }

    try {
      // Create a new canvas for the combined output
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = video.videoWidth;
      outputCanvas.height = video.videoHeight;
      
      const ctx = outputCanvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      
      // First draw the video frame
      ctx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
      
      // Get the tracked objects that are loitering
      const loiteringObjects = window._trackedObjects?.filter(obj => obj.isLoitering) || [];
      
      // Only draw loitering objects (orange frames), not blue tracking frames
      if (loiteringObjects.length > 0) {
        // Draw each loitering object with orange/red highlight
        loiteringObjects.forEach(obj => {
          // Use flashing effect like in the main visualization
          const isFlashing = (Date.now() % 1000) < 500;
          ctx.strokeStyle = isFlashing ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 165, 0, 0.8)';
          ctx.lineWidth = 4;
          ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
          
          // Add loitering warning label
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(obj.x, obj.y - 25, 95, 20);
          ctx.fillStyle = isFlashing ? 'rgba(255, 0, 0, 1)' : 'rgba(255, 165, 0, 1)';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('⚠️ LOITERING', obj.x + 5, obj.y - 10);
        });
        
        // Add "LOITERING DETECTED" text for emphasis
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fillRect(outputCanvas.width - 230, 10, 220, 40);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`⚠️ LOITERING DETECTED`, outputCanvas.width - 220, 35);
      }
      
      // Convert to base64 image data
      const imageData = outputCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      resolve(imageData);
    } catch (err) {
      reject(err);
    }
  });
};

export default VideoPlayer;