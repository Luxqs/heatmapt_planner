import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import HeatmapLayer from './HeatmapLayer';

export const TILE_LAYERS = {
  dark: {
    label: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  },
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

const GLOBAL_SPORTS = {
  all:    'all',
  run:    'run',
  ride:   'ride',
  water:  'water',
  winter: 'winter',
};

export default function MapView({ mapType, points, heatmapView, globalSport }) {
  const tile = TILE_LAYERS[mapType] || TILE_LAYERS.dark;

  const showPersonal = heatmapView !== 'global';
  const showGlobal = heatmapView !== 'personal';

  // leaflet.heat expects [lat, lng, intensity]
  const heatPoints = useMemo(
    () => points.map(([lat, lng]) => [lat, lng, 0.6]),
    [points]
  );

  const sport = GLOBAL_SPORTS[globalSport] || 'all';
  const globalTileUrl = `https://heatmap-external-{s}.strava.com/tiles/${sport}/hot/{z}/{x}/{y}.png`;

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
        {showGlobal && (
          <TileLayer
            key={`global-${sport}`}
            url={globalTileUrl}
            subdomains={['a', 'b', 'c']}
            attribution='Global heatmap &copy; <a href="https://www.strava.com">Strava</a>'
            maxZoom={16}
            opacity={0.8}
          />
        )}
        {showPersonal && heatPoints.length > 0 && <HeatmapLayer points={heatPoints} />}
      </MapContainer>

      {/* Badges */}
      <div className="absolute bottom-8 right-4 z-[1000] flex flex-col items-end gap-1.5 pointer-events-none">
        {showGlobal && (
          <div className="bg-orange-600/80 text-white text-xs px-3 py-1.5 rounded-full">
            Global: {globalSport}
          </div>
        )}
        {showPersonal && heatPoints.length > 0 && (
          <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
            {heatPoints.length.toLocaleString()} GPS points
          </div>
        )}
      </div>
    </div>
  );
}
