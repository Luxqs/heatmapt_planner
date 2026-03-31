import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import HeatmapLayer from './HeatmapLayer';
import { GLOBAL_SPORT_BY_ID } from '../constants/heatmap';

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


export default function MapView({ mapType, points, heatmapView, globalSport }) {
  const tile = TILE_LAYERS[mapType] || TILE_LAYERS.dark;
  const [globalHeatmapError, setGlobalHeatmapError] = useState(false);
  const [tileVariantIdx, setTileVariantIdx] = useState(0);

  const showPersonal = heatmapView !== 'global';
  const showGlobal = heatmapView !== 'personal';

  // leaflet.heat expects [lat, lng, intensity]
  const heatPoints = useMemo(() => {
    if (!Array.isArray(points)) return [];
    return points
      .filter(p => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .map(([lat, lng]) => [lat, lng, 0.6]);
  }, [points]);

  const sport = GLOBAL_SPORT_BY_ID[globalSport]?.id || 'all';
  const sportLabel = GLOBAL_SPORT_BY_ID[sport]?.label || 'All Sports';
  const globalTileCandidates = [
    `https://heatmap-external-{s}.strava.com/tiles-auth/${sport}/hot/{z}/{x}/{y}.png?px=256`,
    `https://heatmap-external-{s}.strava.com/tiles/${sport}/hot/{z}/{x}/{y}.png?px=256`,
  ];
  const globalTileUrl = globalTileCandidates[tileVariantIdx] || globalTileCandidates[0];

  // Do not set crossOrigin=anonymous here: Strava's tiles-auth endpoint needs
  // browser cookies when user is signed in to strava.com.
  const globalTileOptions = {
    subdomains: ['a', 'b', 'c'],
    maxZoom: 16,
    opacity: 0.8,
    attribution: 'Global heatmap &copy; <a href="https://www.strava.com">Strava</a>',
    tileSize: 256,
    detectRetina: true,
    noWrap: false,
  };
  useEffect(() => {
    setTileVariantIdx(0);
    setGlobalHeatmapError(false);
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
            {...globalTileOptions}
            eventHandlers={{
              tileerror: () => {
                setTileVariantIdx((prev) => {
                  if (prev < globalTileCandidates.length - 1) {
                    setGlobalHeatmapError(false);
                    return prev + 1;
                  }
                  setGlobalHeatmapError(true);
                  return prev;
                });
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
            Global: {sportLabel}
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
