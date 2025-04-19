import React from 'react';
import { useApp } from '../context/AppContext';
import { Camera } from '../types';

const CameraSelector: React.FC = () => {
  const { state, dispatch } = useApp();

  const handleCameraChange = (cameraId: string) => {
    dispatch({ type: 'SET_ACTIVE_CAMERA', payload: cameraId });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Camera Feeds</h2>
      <div className="space-y-2">
        {state.cameras.map((camera: Camera) => (
          <div
            key={camera.id}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
              camera.id === state.activeCamera
                ? 'bg-blue-100 dark:bg-blue-900/30'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/30'
            }`}
            onClick={() => handleCameraChange(camera.id)}
          >
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full mr-3 ${
                  camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{camera.name}</p>
                <p className="text-xs text-gray-500">{camera.location}</p>
              </div>
            </div>
            {camera.id === state.activeCamera && (
              <div className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                Active
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CameraSelector;