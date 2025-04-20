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

// // Generate mock alerts
// const generateMockAlerts = (): Alert[] => [
//   {
//     id: "alert1",
//     timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
//     imageUrl:
//       "https://images.pexels.com/photos/5767583/pexels-photo-5767583.jpeg",
//     confidence: 0.86,
//     location: "Front Entrance",
//     status: "new",
//   },
//   {
//     id: "alert2",
//     timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
//     imageUrl:
//       "https://images.pexels.com/photos/593172/pexels-photo-593172.jpeg",
//     confidence: 0.92,
//     location: "Bike Rack North",
//     status: "reviewing",
//   },
//   {
//     id: "alert3",
//     timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
//     imageUrl:
//       "https://images.pexels.com/photos/1149601/pexels-photo-1149601.jpeg",
//     confidence: 0.78,
//     location: "Back Alley",
//     status: "resolved",
//   },
//   {
//     id: "alert4",
//     timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
//     imageUrl:
//       "https://images.pexels.com/photos/16776590/pexels-photo-16776590/free-photo-of-close-up-of-a-bicycle-chain.jpeg",
//     confidence: 0.65,
//     location: "Parking Lot East",
//     status: "false-alarm",
//   },
// ];

// Function to simulate a new alert
export const generateRandomAlert = (cameras: Camera[]): Alert | null => {
  // Only create alerts for online cameras
  const onlineCameras = cameras.filter((camera) => camera.status === "online");
  if (onlineCameras.length === 0) return null;

  const camera =
    onlineCameras[Math.floor(Math.random() * onlineCameras.length)];

  const bikeImages = [theft1, theft2, theft1analysis];

  return {
    id: `alert-${Date.now()}`,
    timestamp: new Date(),
    imageUrl: bikeImages[Math.floor(Math.random() * bikeImages.length)],
    confidence: 0.6 + Math.random() * 0.35, // Random between 0.6 and 0.95
    location: camera.name,
    status: "new",
  };
};

// Helper to generate a unique ID
const generateRandomId = (): string =>
  `alert-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

const mockAlertsDemo = [
  {
    id: generateRandomId(),
    timestamp: new Date(),
    imageUrl: theft1,
    confidence: 0.6 + Math.random() * 0.35, // Random between 0.6 and 0.95
    location: "Front Entrance",
    status: "new",
  },
  {
    id: generateRandomId(),
    timestamp: new Date(),
    imageUrl: theft1analysis,
    confidence: 0.9, // Random between 0.6 and 0.95
    location: "Front Entrance",
    status: "new",
  },
  {
    id: generateRandomId(),
    timestamp: new Date(),
    imageUrl: theft2,
    confidence: 0.6 + Math.random() * 0.35, // Random between 0.6 and 0.95
    location: "Front Entrance",
    status: "new",
  },
  {
    id: generateRandomId(),
    timestamp: new Date(),
    imageUrl: theft3,
    confidence: 0.31, // Random between 0.6 and 0.95
    location: "Bike Rack North",
    status: "new",
  },
];

// Export both mock data generators
export const generateMockData = () => ({
  mockCameras: generateMockCameras(),
  mockAlerts: mockAlertsDemo,
});
