import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  BarChart4
} from 'lucide-react';

const SystemStatus: React.FC = () => {
  const { state } = useApp();
  const [cpuUsage, setCpuUsage] = useState(30 + Math.random() * 20);
  const [memoryUsage, setMemoryUsage] = useState(40 + Math.random() * 30);
  const [predictionLatency, setPredictionLatency] = useState(50 + Math.random() * 50);
  
  // Stats summaries
  const totalAlerts = state.alerts.length;
  const newAlerts = state.alerts.filter(a => a.status === 'new').length;
  const reviewingAlerts = state.alerts.filter(a => a.status === 'reviewing').length;
  const resolvedAlerts = state.alerts.filter(a => a.status === 'resolved').length;
  
  // Simulate fluctuating system metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const newValue = prev + (Math.random() * 10 - 5);
        return Math.min(Math.max(newValue, 20), 80);
      });
      
      setMemoryUsage(prev => {
        const newValue = prev + (Math.random() * 8 - 4);
        return Math.min(Math.max(newValue, 30), 85);
      });
      
      setPredictionLatency(prev => {
        const newValue = prev + (Math.random() * 20 - 10);
        return Math.min(Math.max(newValue, 40), 150);
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Status
        </h2>
        <button className="text-blue-500 text-sm flex items-center gap-1 hover:text-blue-600 transition-colors">
          <span>Details</span>
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Alerts</span>
            <BarChart4 className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalAlerts}</span>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1 items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-xs">{newAlerts} new</span>
            </div>
            <div className="flex gap-1 items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="text-xs">{reviewingAlerts} reviewing</span>
            </div>
            <div className="flex gap-1 items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-xs">{resolvedAlerts} resolved</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">CPU Usage</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(cpuUsage)}%</span>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                cpuUsage > 70 ? 'bg-red-500' : cpuUsage > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${cpuUsage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Memory</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(memoryUsage)}%</span>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                memoryUsage > 75 ? 'bg-red-500' : memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${memoryUsage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Prediction Latency</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(predictionLatency)}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">ms</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                predictionLatency > 100 ? 'bg-red-500' : predictionLatency > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${(predictionLatency / 150) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="px-4 pb-4">
        <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-3">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Detection System Status</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Model Loaded</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Camera Feeds</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
              <div className={`w-3 h-3 rounded-full ${state.isPredicting ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-sm">Prediction Engine {state.isPredicting ? 'Active' : 'Idle'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Alert System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;