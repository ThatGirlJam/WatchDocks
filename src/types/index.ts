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
  latitude?: number;
  longitude?: number;
}

// Interface for theft reports
export interface TheftReport {
  id: string;
  type: 'witnessed' | 'stolen';
  timestamp: Date;
  location: string;
  bikeDescription: string;
  contactInfo: string;
  incidentDetails: string;
  photoUrl: string | null;
  status: 'new' | 'reviewing' | 'resolved' | 'false-alarm';
}

export interface AppState {
  cameras: Camera[];
  activeCamera: string | null;
  alerts: Alert[];
  theftReports: TheftReport[];
  isConnected: boolean;
  isPredicting: boolean;
  isLoitering: boolean;
}