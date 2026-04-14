import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon } from "leaflet";

// Add Leaflet CSS
const LeafletCSS = () => (
  <style>
    {`
      @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
      .leaflet-container {
        height: 100%;
        width: 100%;
        border-radius: 0.75rem;
      }
      .custom-marker {
        /* Styles are now applied inline to support dynamic creation */
      }
    `}
  </style>
);

const createMarkerIcon = (isSelected, isRecommended) => {
  const strokeColor = isSelected ? '#3b82f6' : (isRecommended ? '#059669' : '#6B7280');
  const fillColor = isSelected ? '#bfdbfe' : (isRecommended ? '#d1fae5' : '#e5e7eb');
  const scale = isSelected ? '1.3' : '1';
  
  const iconMarkup = `
    <div style="transform: scale(${scale}); transition: transform 0.2s ease-out; transform-origin: bottom;">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `;

  return divIcon({
    html: iconMarkup,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

const MapUpdater = ({ center }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo([center.latitude, center.longitude], 15);
    }
  }, [center, map]);
  return null;
};

export default function DonationMap({ userLocation, centers, selectedCenter, onCenterSelect }) {
  const defaultPosition = userLocation 
    ? [userLocation.latitude, userLocation.longitude] 
    : [40.758, -73.9855];

  return (
    <>
      <LeafletCSS />
      <MapContainer center={defaultPosition} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {centers.map((center, index) => {
          const isSelected = selectedCenter?.name === center.name;
          const isRecommended = center.needed_food_types?.includes('all') || center.accepts_prepared_food;
          return (
            <Marker
              key={center.name + index}
              position={[center.latitude, center.longitude]}
              icon={createMarkerIcon(isSelected, isRecommended)}
              eventHandlers={{
                click: () => onCenterSelect(center),
              }}
            >
              <Popup>
                <div>
                  <h4 className="font-semibold">{center.name}</h4>
                  <p className="text-sm text-gray-600">{center.type?.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{center.address}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]}
            icon={divIcon({
              html: `
                <div style="background: #3B82F6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
              `,
              className: 'user-location-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          />
        )}
        <MapUpdater center={selectedCenter} />
      </MapContainer>
    </>
  );
}