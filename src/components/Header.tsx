import React, { useState } from 'react';
import { Bell, Settings, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SettingsModal from './SettingsModal';
import NotificationsModal from './NotificationsModal';

const Header: React.FC = () => {
  const { state } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const newAlertsCount = state.alerts.filter(alert => alert.status === 'new').length;

  return (
    <>
      <header className="bg-gray-900 text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-xl font-bold">BikeGuard</h1>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center mr-4">
              <div className={`w-3 h-3 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <span className="text-sm text-gray-300">
                {state.isConnected ? 'System Online' : 'Connection Lost'}
              </span>
            </div>

            <div className="relative">
              <button 
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="h-5 w-5" />
                {newAlertsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newAlertsCount}
                  </span>
                )}
              </button>
            </div>

            <button 
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <NotificationsModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
};

export default Header;