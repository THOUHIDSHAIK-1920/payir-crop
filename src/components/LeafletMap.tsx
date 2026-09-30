import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Field } from '../types/database';

// Fix leaflet marker icon path issue in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom green pin icon for healthy crops
const cropIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ChangeViewProps {
  center: [number, number];
  zoom: number;
}

const ChangeView: React.FC<ChangeViewProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface LeafletMapProps {
  selectedField: Field;
  status: 'healthy' | 'alert';
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ selectedField, status }) => {
  const lat = selectedField.latitude || 10.7870;
  const lng = selectedField.longitude || 79.1378;
  const centerPosition: [number, number] = [lat, lng];

  return (
    <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative">
      <MapContainer
        center={centerPosition}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <ChangeView center={centerPosition} zoom={13} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={centerPosition} icon={cropIcon}>
          <Popup>
            <div className="p-1 text-slate-900 font-sans">
              <h4 className="font-bold text-sm text-emerald-800">{selectedField.field_name}</h4>
              <p className="text-xs text-slate-600 mt-1 font-medium">{selectedField.location}</p>
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500">Crop: {selectedField.crop_type}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  status === 'healthy'? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {status === 'healthy'? 'HEALTHY' : 'ALERT'}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-semibold text-emerald-400 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        GPS: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
      </div>
    </div>
  );
};
