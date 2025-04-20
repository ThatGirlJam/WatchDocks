// Type definitions for the application

export interface Alert {
  id: string;
  timestamp: Date;
  imageUrl: string;
  confidence: number;
  location: string;
  status: 'new' | 'reviewing' | 'resolved' | 'false-alarm';
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  streamUrl?: string;
  latitude?: number;   // Add this
  longitude?: number;  // Add this
}

export interface AppState {
  cameras: Camera[];
  activeCamera: string | null;
  alerts: Alert[];
  isConnected: boolean;
  isPredicting: boolean;
  isLoitering: boolean;
}