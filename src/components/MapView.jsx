import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import HeatmapLayer from './HeatmapLayer';

export const TILE_LAYERS = {
  standard: {
    label: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  cycling: {
    label: 'Cycling',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://www.cyclosm.org">CyclOSM</a>',
    maxZoom: 20,
  },
  hiking: {
    label: 'Hiking / Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
    maxZoom: 19,
  },
};

export default function MapView({ mapType, points }) {
  const tile = TILE_LAYERS[mapType] || TILE_LAYERS.standard;

  // leaflet.heat expects [lat, lng, intensity]
  const heatPoints = useMemo(
    () => points.map(([lat, lng]) => [lat, lng, 0.6]),
    [points]
  );

  return (
    <div className="flex-1 h-full relative">
      <MapContainer
        center={[20, 10]}
        zoom={3}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <TileLayer
          key={mapType}
          url={tile.url}
          attribution={tile.attribution}
          maxZoom={tile.maxZoom}
        />
        {heatPoints.length > 0 && <HeatmapLayer points={heatPoints} />}
      </MapContainer>

      {/* Point count badge */}
      {heatPoints.length > 0 && (
        <div className="absolute bottom-8 right-4 z-[1000] bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          {heatPoints.length.toLocaleString()} GPS points
        </div>
      )}
    </div>
  );
}
