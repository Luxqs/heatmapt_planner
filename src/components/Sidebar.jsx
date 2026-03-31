import { useRef } from 'react';
import { getAuthUrl } from '../utils/stravaApi';
import { readGpxFiles } from '../utils/gpxParser';
import { TILE_LAYERS } from './MapView';

const ACTIVITY_TYPES = [
  { id: 'All', label: 'All' },
  { id: 'Run', label: 'Run' },
  { id: 'Ride', label: 'Ride' },
  { id: 'VirtualRide', label: 'Virtual Ride' },
  { id: 'Hike', label: 'Hike' },
  { id: 'Walk', label: 'Walk' },
  { id: 'Swim', label: 'Swim' },
  { id: 'NordicSki', label: 'Nordic Ski' },
  { id: 'AlpineSki', label: 'Alpine Ski' },
  { id: 'Snowboard', label: 'Snowboard' },
  { id: 'Other', label: 'Other' },
];

const STRAVA_ICON = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
  </svg>
);

const GLOBAL_SPORTS = [
  { id: 'all',    label: 'All Sports' },
  { id: 'run',    label: 'Run' },
  { id: 'ride',   label: 'Ride' },
  { id: 'water',  label: 'Water' },
  { id: 'winter', label: 'Winter' },
];

const HEATMAP_VIEWS = [
  { id: 'personal', label: 'Personal' },
  { id: 'global',   label: 'Global' },
  { id: 'both',     label: 'Both' },
];

export default function Sidebar({
  source, setSource,
  mapType, setMapType,
  activityType, setActivityType,
  stravaAuth,
  onFetchStrava,
  onDisconnect,
  loading,
  loadingProgress,
  error,
  activityCount,
  pointCount,
  onGarminUpload,
  garminCount,
  heatmapView, setHeatmapView,
  globalSport, setGlobalSport,
}) {
  const fileInputRef = useRef(null);

  const handleDrop = async (e) => {
    e.preventDefault();
    const gpxFiles = [...e.dataTransfer.files].filter(f => f.name.endsWith('.gpx'));
    if (gpxFiles.length === 0) return;
    const parsed = await readGpxFiles(gpxFiles);
    onGarminUpload(parsed);
  };

  const handleFileChange = async (e) => {
    const parsed = await readGpxFiles([...e.target.files]);
    onGarminUpload(parsed);
    e.target.value = '';
  };

  return (
    <div
      className="w-72 min-w-[18rem] h-full bg-gray-950 border-r border-gray-800
                 flex flex-col text-white overflow-y-auto"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800">
        <h1 className="text-lg font-bold tracking-tight text-orange-500">
          Activity Heatmap
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Strava &amp; Garmin GPS visualiser</p>
      </div>

      {/* Heatmap view */}
      <div className="px-5 py-4 border-b border-gray-800">
        <label className="section-label">Heatmap View</label>
        <div className="flex gap-1.5 mt-2">
          {HEATMAP_VIEWS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setHeatmapView(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                heatmapView === id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Global sport filter */}
        {heatmapView !== 'personal' && (
          <div className="mt-3 space-y-2">
            <label className="section-label">Global Sport</label>
            <div className="flex flex-wrap gap-1.5">
              {GLOBAL_SPORTS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setGlobalSport(id)}
                  className={`py-1 px-2.5 rounded-full text-xs font-medium transition-colors ${
                    globalSport === id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 leading-snug">
              Worldwide Strava data. You must be signed into strava.com in this browser and allow third-party cookies
              for heatmap tiles to load.
            </p>
          </div>
        )}
      </div>

      {/* Personal data controls (hidden in Global-only mode) */}
      {heatmapView !== 'global' && (
        <>
          {/* Source toggle */}
          <div className="px-5 py-4 border-b border-gray-800">
            <label className="section-label">Data Source</label>
            <div className="flex gap-2 mt-2">
              {['strava', 'garmin'].map(s => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    source === s
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {s === 'strava' ? 'Strava' : 'Garmin'}
                </button>
              ))}
            </div>
          </div>

          {/* Strava section */}
          {source === 'strava' && (
            <div className="px-5 py-4 border-b border-gray-800 space-y-3">
              <label className="section-label">Strava Connection</label>

              {!stravaAuth ? (
                <a
                  href={getAuthUrl()}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4
                             bg-orange-500 hover:bg-orange-600 text-white rounded-lg
                             text-sm font-semibold transition-colors"
                >
                  {STRAVA_ICON}
                  Connect with Strava
                </a>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                    <span className="text-green-400 font-medium">
                      {stravaAuth.athlete
                        ? `${stravaAuth.athlete.firstname} ${stravaAuth.athlete.lastname}`
                        : 'Connected'}
                    </span>
                  </div>

                  <button
                    onClick={onFetchStrava}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600
                               disabled:opacity-50 disabled:cursor-not-allowed
                               text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    {loading ? `Loading… ${loadingProgress}%` : 'Fetch Activities'}
                  </button>

                  {loading && (
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                  )}

                  <button
                    onClick={onDisconnect}
                    className="w-full py-1.5 bg-gray-800 hover:bg-gray-700
                               text-gray-400 rounded-lg text-xs transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              )}
            </div>
          )}

          {/* Garmin section */}
          {source === 'garmin' && (
            <div className="px-5 py-4 border-b border-gray-800 space-y-3">
              <label className="section-label">Garmin GPX Upload</label>

              <div
                className="border-2 border-dashed border-gray-700 rounded-xl p-5
                           text-center cursor-pointer hover:border-orange-500 transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gpx"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <svg
                  className="w-9 h-9 mx-auto mb-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011
                       9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-gray-400 font-medium">Drop GPX files here</p>
                <p className="text-xs text-gray-600 mt-1">or click to browse</p>
              </div>

              {garminCount > 0 && (
                <p className="text-xs text-green-400 text-center">
                  {garminCount} activit{garminCount === 1 ? 'y' : 'ies'} loaded
                </p>
              )}

              <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-400">How to export from Garmin:</p>
                <p>1. Open Garmin Connect → Activities</p>
                <p>2. Select an activity → ··· → Export to GPX</p>
                <p>3. Drop the file(s) above</p>
              </div>
            </div>
          )}

          {/* Activity type filter */}
          <div className="px-5 py-4 border-b border-gray-800">
            <label className="section-label">Activity Type</label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ACTIVITY_TYPES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActivityType(id)}
                  className={`py-1 px-2.5 rounded-full text-xs font-medium transition-colors ${
                    activityType === id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Map style */}
      <div className="px-5 py-4 border-b border-gray-800">
        <label className="section-label">Map Style</label>
        <div className="space-y-1.5 mt-2">
          {Object.entries(TILE_LAYERS).map(([id, { label }]) => (
            <button
              key={id}
              onClick={() => setMapType(id)}
              className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                mapType === id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats + error */}
      <div className="px-5 py-4 mt-auto space-y-3">
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-orange-500">{activityCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Activities</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-orange-500">
              {pointCount > 999 ? `${(pointCount / 1000).toFixed(1)}k` : pointCount}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">GPS Points</div>
          </div>
        </div>
      </div>
    </div>
  );
}
