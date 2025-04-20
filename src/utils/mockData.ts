import { Camera, Alert } from "../types";
import theft1 from "../assets/images/theft-1.png";
import theft2 from "../assets/images/theft-2.png";
import theft1analysis from "../assets/images/theft-1-analysis.png";
import theft3 from "../assets/images/theft-3.png";

// Generate mock cameras
const generateMockCameras = (): Camera[] => [
  {
    id: "cam1",
    name: "Front Entrance",
    location: "Building A",
    status: "online",
    streamUrl: "https://example.com/stream/1",
    latitude: 38.542944, // Converted from 38°32'34.6"N
    longitude: -121.758889, // Converted from 121°45'32.0"W
  },
  {
    id: "cam2",
    name: "Bike Rack North",
    location: "Main Campus",
    status: "online",
    streamUrl: "https://example.com/stream/2",
    latitude: 38.539333, // Converted from 38°32'21.6"N
    longitude: -121.758889, // Converted from 121°45'32.0"W
  },
];

// Helper to generate a unique ID
const generateRandomId = (): string =>
  `alert-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

const mockAlertsDemo: Alert[] = [
  {
    id: generateRandomId(),
    timestamp: new Date(),
    imageUrl: theft1,
    confidence: 0.6 + Math.random() * 0.35, // Random between 0.6 and 0.95
    location: "Front Entrance",
    status: "new" as const,
  },
  {
    id: generateRandomId(),
    timestamp: new Date(),
    imageUrl: theft1analysis,
    confidence: 0.9, // Random between 0.6 and 0.95
    location: "Front Entrance",
    status: "new" as const,
  },
  {
    id: generateRandomId(),
    timestamp: new Date(),
    imageUrl: theft2,
    confidence: 0.6 + Math.random() * 0.35, // Random between 0.6 and 0.95
    location: "Front Entrance",
    status: "new" as const,
  },
  {
    id: generateRandomId(),
    timestamp: new Date(),
    imageUrl: theft3,
    confidence: 0.31, // Random between 0.6 and 0.95
    location: "Bike Rack North",
    status: "new" as const,
  },
];

// Export both mock data generators
export const generateMockData = () => ({
  mockCameras: generateMockCameras(),
  mockAlerts: mockAlertsDemo,
});
