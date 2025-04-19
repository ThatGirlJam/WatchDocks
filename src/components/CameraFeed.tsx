import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateRandomAlert } from '../utils/mockData';

const CameraFeed: React.FC = () => {
  const { state, dispatch } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [predictionActive, setPredictionActive] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [detecting, setDetecting] = useState(false);
  
  const activeCamera = state.cameras.find(
    camera => camera.id === state.activeCamera
  );

  // Mock video feed using canvas animation
  useEffect(() => {
    if (!canvasRef.current || !activeCamera || activeCamera.status !== 'online') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let frameCount = 0;
    
    // Simple animation to simulate video feed
    const drawFrame = () => {
      frameCount++;
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      
      // Draw something that changes over time
      const time = Date.now() / 1000;
      
      // Draw some "people" moving around
      for (let i = 0; i < 5; i++) {
        const x = width * (0.3 + 0.4 * Math.sin(time * 0.2 + i));
        const y = height * (0.3 + 0.4 * Math.cos(time * 0.1 + i * 2));
        
        ctx.fillStyle = i === 0 && predictionActive ? '#f87171' : '#9ca3af';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw "body"
        ctx.strokeStyle = i === 0 && predictionActive ? '#f87171' : '#9ca3af';
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x, y + 30);
        ctx.stroke();
        
        // Draw "arms"
        ctx.beginPath();
        ctx.moveTo(x - 15, y + 20);
        ctx.lineTo(x + 15, y + 20);
        ctx.stroke();
        
        // Draw "legs"
        ctx.beginPath();
        ctx.moveTo(x, y + 30);
        ctx.lineTo(x - 10, y + 50);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y + 30);
        ctx.lineTo(x + 10, y + 50);
        ctx.stroke();
      }
      
      // Draw a "bike rack" with bikes
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(width * 0.1, height * 0.8, width * 0.8, 5);
      
      // Draw bikes
      for (let i = 0; i < 3; i++) {
        const bikeX = width * (0.2 + i * 0.3);
        const bikeY = height * 0.8;
        
        // Draw bike frame
        ctx.strokeStyle = ['#3b82f6', '#10b981', '#f59e0b'][i];
        ctx.lineWidth = 3;
        
        // Frame
        ctx.beginPath();
        ctx.moveTo(bikeX, bikeY);
        ctx.lineTo(bikeX + 20, bikeY - 20);
        ctx.lineTo(bikeX - 20, bikeY - 20);
        ctx.closePath();
        ctx.stroke();
        
        // Wheels
        ctx.beginPath();
        ctx.arc(bikeX - 25, bikeY, 15, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(bikeX + 25, bikeY, 15, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Add timestamp
      ctx.fillStyle = '#f3f4f6';
      ctx.font = '12px monospace';
      const timestamp = new Date().toLocaleTimeString();
      ctx.fillText(`${activeCamera.name} - ${timestamp}`, 10, 20);
      
      // Add detection box if predicting
      if (predictionActive) {
        // Calculate position of "person" interacting with bike
        const x = width * (0.3 + 0.4 * Math.sin(time * 0.2));
        const y = height * (0.3 + 0.4 * Math.cos(time * 0.1));
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 30, y - 20, 60, 80);
        
        // Add confidence text
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`Detection: ${Math.round(confidenceScore * 100)}%`, x - 30, y - 30);
      }
      
      frameId = requestAnimationFrame(drawFrame);
    };
    
    drawFrame();
    
    // Randomly trigger theft detection events
    const detectionInterval = setInterval(() => {
      // 10% chance of triggering a detection event
      const shouldDetect = Math.random() < 0.1;
      
      if (shouldDetect && !detecting) {
        setDetecting(true);
        setPredictionActive(true);
        
        // Random confidence score between 60% and 95%
        const newConfidence = 0.6 + Math.random() * 0.35;
        setConfidenceScore(newConfidence);
        dispatch({ type: 'SET_PREDICTION_STATUS', payload: true });
        
        // Generate an alert after a short delay
        setTimeout(() => {
          const newAlert = generateRandomAlert(state.cameras);
          if (newAlert) {
            dispatch({ type: 'ADD_ALERT', payload: newAlert });
          }
          
          // Reset detection state after alert is generated
          setTimeout(() => {
            setPredictionActive(false);
            setDetecting(false);
            dispatch({ type: 'SET_PREDICTION_STATUS', payload: false });
          }, 2000);
        }, 3000);
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(detectionInterval);
    };
  }, [activeCamera, predictionActive, state.cameras, dispatch, detecting]);

  if (!activeCamera) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg">
        <div className="text-center">
          <Camera className="w-16 h-16 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-400">No camera selected</p>
        </div>
      </div>
    );
  }

  if (activeCamera.status === 'offline') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg">
        <div className="text-center">
          <Camera className="w-16 h-16 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-400">Camera offline</p>
          <p className="text-sm text-gray-500">{activeCamera.name} - {activeCamera.location}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-white">LIVE</span>
        </div>
        {predictionActive && (
          <div className="flex items-center gap-2 ml-4 bg-red-500/20 px-2 py-1 rounded">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-500 font-bold">DETECTING</span>
          </div>
        )}
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-cover"
        width={640}
        height={360}
      />
    </div>
  );
};

export default CameraFeed;