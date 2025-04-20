import React, { useRef, useEffect, useState } from "react";
import { CircleDot, Play, Pause, Volume2, VolumeX } from "lucide-react";

/**
 * VideoPlayer simulates a true livestream without scrubbing capability.
 * Users can only watch the "live" feed without time navigation.
 */
const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Metadata
  const [duration, setDuration] = useState(0);
  const [maxSeek, setMaxSeek] = useState(0);

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);

  // Fixed 15-minute window (in seconds)
  const HISTORY_SEC = 15 * 60;

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
      // Track current time and maximum position
      if (t > maxSeek) {
        setMaxSeek(t);
      }
      setCurrentTime(t);
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
  }, [maxSeek]);

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

  return (
    <div className="relative w-full h-full select-none">
      {/* Live indicator */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
        <CircleDot className="h-4 w-4 text-red-500 animate-pulse" />
        <span className="text-sm font-medium text-white">LIVE</span>
      </div>

      {/* Video element */}
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted preload="auto">
        <source src="/videos/livestream_converted.mp4" type="video/mp4" />
      </video>

      {/* Simplified Controls - no scrubbing */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-gray-200">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
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
          
          {/* Live indicator in controls */}
          <div className="text-white text-sm">
            <span className="flex items-center gap-1">
              <CircleDot className="h-3 w-3 text-red-500 animate-pulse" />
              <span className="font-bold text-red-500">LIVE</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;