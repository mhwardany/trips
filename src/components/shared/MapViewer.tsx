'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon paths in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// Component to dynamically change map view when center changes
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
}

interface MapViewerProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export default function MapViewer({ locations, center, zoom = 13, height = "300px" }: MapViewerProps) {
  // Auto-calculate center if not provided and locations exist
  const mapCenter = center || (locations.length > 0 ? [locations[0].lat, locations[0].lng] as [number, number] : [30.0444, 31.2357] as [number, number]);

  return (
    <div style={{ height, width: '100%', borderRadius: '16px', overflow: 'hidden' }} className="border border-white/10 z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <ChangeView center={mapCenter} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={icon}>
            <Popup>
              <div className="font-bold text-sm text-black">{loc.name}</div>
              {loc.category && <div className="text-xs text-gray-600 mt-1">{loc.category}</div>}
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-xs mt-2 inline-block font-medium hover:underline"
              >
                Directions ↗
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
