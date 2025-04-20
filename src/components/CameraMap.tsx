import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Camera } from "../types";

interface CameraMapProps {
  camera: Camera | undefined;
}

// This internal component handles map recenter when coordinates change
const MapUpdater = ({ camera }: { camera: Camera }) => {
  const map = useMap();
  
  useEffect(() => {
    if (camera?.latitude && camera?.longitude) {
      map.setView([camera.latitude, camera.longitude], map.getZoom());
    }
  }, [camera, map]);

  return null;
};

const CameraMap: React.FC<CameraMapProps> = ({ camera }) => {
  if (!camera?.latitude || !camera?.longitude) {
    return <div className="text-gray-400 text-sm">No location data for this camera.</div>;
  }

  return (
    <MapContainer
      center={[camera.latitude, camera.longitude]}
      zoom={18}
      style={{ height: "200px", width: "100%", borderRadius: "8px" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[camera.latitude, camera.longitude]}>
        <Popup>
          {camera.name} <br /> {camera.location}
        </Popup>
      </Marker>
      <MapUpdater camera={camera} />
    </MapContainer>
  );
};

export default CameraMap;