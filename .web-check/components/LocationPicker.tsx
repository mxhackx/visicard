"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icon issue in Next.js/React
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationPickerProps {
  value: string;
  onChange: (url: string) => void;
}

function LocationMarker({ position, onMapClick }: { position: L.LatLng | null; onMapClick: (p: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  // 1. Plus besoin de useState ni de useEffect ! (Évite l'erreur de setState synchrone)
  // On dérive l'état de la position "à la volée" depuis la valeur de l'URL fournie par le parent.
  let position: L.LatLng | null = null;
  
  if (value && value.includes("maps.google.com") && value.includes("?q=")) {
    try {
      const coordsStr = value.split("?q=")[1];
      const [lat, lng] = coordsStr.split(",");
      if (lat && lng) {
        position = new L.LatLng(parseFloat(lat), parseFloat(lng));
      }
    } catch {
      // 2. Utilisation de 'catch' sans variable pour éviter l'erreur "err is defined but never used"
    }
  }

  const handleMapClick = (pos: L.LatLng) => {
    onChange(`https://maps.google.com/?q=${pos.lat},${pos.lng}`);
  };

  return (
    <div style={{ height: "300px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1.5px solid #E5E9EF", zIndex: 0, position: "relative" }}>
      <MapContainer center={position || [48.8566, 2.3522]} zoom={position ? 15 : 12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onMapClick={handleMapClick} />
      </MapContainer>
      
      {!position && (
        <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", zIndex: 1000, background: "var(--orange)", color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", boxShadow: "0 4px 12px rgba(239, 106, 34, 0.4)", pointerEvents: "none" }}>
          Cliquez sur la carte pour placer votre restaurant
        </div>
      )}
    </div>
  );
}
