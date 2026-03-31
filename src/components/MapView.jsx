import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [globalHeatmapError, setGlobalHeatmapError] = useState(false);
  const [tileVariantIdx, setTileVariantIdx] = useState(0);
  const switchedVariantRef = useRef(false);

  const showPersonal = heatmapView !== 'global';
  const showGlobal = heatmapView !== 'personal';

  // leaflet.heat expects [lat, lng, intensity]
  const heatPoints = useMemo(
    () => points.map(([lat, lng]) => [lat, lng, 0.6]),
    [points]
  );

  const sport = GLOBAL_SPORTS[globalSport] || 'all';
  const globalTileCandidates = [
    `https://heatmap-external-{s}.strava.com/tiles-auth/${sport}/hot/{z}/{x}/{y}.png?px=256`,
    `https://heatmap-external-{s}.strava.com/tiles/${sport}/hot/{z}/{x}/{y}.png?px=256`,
  ];
  const globalTileUrl = globalTileCandidates[tileVariantIdx] || globalTileCandidates[0];

  useEffect(() => {
    setTileVariantIdx(0);
    setGlobalHeatmapError(false);
    switchedVariantRef.current = false;
  }, [sport, heatmapView]);

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
            key={`global-${sport}-${tileVariantIdx}`}
            url={globalTileUrl}
            subdomains={['a', 'b', 'c']}
            attribution='Global heatmap &copy; <a href="https://www.strava.com">Strava</a>'
            maxZoom={16}
            opacity={0.8}
            eventHandlers={{
              loading: () => {
                setGlobalHeatmapError(false);
                switchedVariantRef.current = false;
              },
              tileerror: () => {
                if (!switchedVariantRef.current && tileVariantIdx < globalTileCandidates.length - 1) {
                  switchedVariantRef.current = true;
                  setTileVariantIdx(tileVariantIdx + 1);
                  return;
                }
                setGlobalHeatmapError(true);
              },
            }}
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
        {showGlobal && globalHeatmapError && (
          <div className="max-w-[22rem] bg-red-900/90 text-white text-xs px-3 py-2 rounded-lg pointer-events-auto">
            Unable to load Strava global heatmap tiles. Sign into strava.com, allow third-party cookies, open
            strava.com/heatmap once, then refresh this page.
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
