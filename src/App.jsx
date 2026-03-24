import { useState, useEffect, useCallback, useMemo } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import {
  exchangeToken,
  saveToken,
  loadToken,
  clearToken,
  getValidToken,
  fetchAllActivities,
  decodePolyline,
} from './utils/stravaApi';

const KNOWN_TYPES = ['Run', 'Ride', 'VirtualRide', 'Hike', 'Walk', 'Swim', 'NordicSki', 'AlpineSki', 'Snowboard'];
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default function App() {
  const [source, setSource] = useState('strava');
  const [mapType, setMapType] = useState('standard');
  const [activityType, setActivityType] = useState('All');

  const [stravaAuth, setStravaAuth] = useState(null);
  const [stravaActivities, setStravaActivities] = useState([]);
  const [garminActivities, setGarminActivities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);

  // ── Strava OAuth callback ──────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');

    if (errorParam) {
      setError('Strava authorisation denied.');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (code) {
      window.history.replaceState({}, '', window.location.pathname);
      exchangeToken(code)
        .then(tokenData => {
          saveToken(tokenData);
          setStravaAuth(tokenData);
        })
        .catch(err => setError('Strava auth failed: ' + err.message));
      return;
    }

    // Restore existing session
    const saved = loadToken();
    if (saved) setStravaAuth(saved);
  }, []);

  // ── Restore cached activities ──────────────────────────────────────────────
  useEffect(() => {
    const cached = localStorage.getItem('strava_activities');
    const ts = Number(localStorage.getItem('strava_activities_ts') || 0);
    if (cached && Date.now() - ts < CACHE_TTL) {
      setStravaActivities(JSON.parse(cached));
    }
  }, []);

  // ── Fetch Strava activities ────────────────────────────────────────────────
  const fetchStravaActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);

    try {
      const token = await getValidToken();
      if (!token) {
        setError('Session expired — please reconnect Strava.');
        setStravaAuth(null);
        return;
      }

      const raw = await fetchAllActivities(token, setLoadingProgress);

      const processed = raw
        .filter(a => a.map?.summary_polyline)
        .map(a => ({
          type: a.type,
          name: a.name,
          date: a.start_date,
          points: decodePolyline(a.map.summary_polyline),
        }))
        .filter(a => a.points.length > 0);

      setStravaActivities(processed);
      localStorage.setItem('strava_activities', JSON.stringify(processed));
      localStorage.setItem('strava_activities_ts', String(Date.now()));
      setLoadingProgress(100);
    } catch (err) {
      setError('Failed to fetch activities: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    clearToken();
    setStravaAuth(null);
    setStravaActivities([]);
  }, []);

  // ── Derive heatmap points ──────────────────────────────────────────────────
  const filteredPoints = useMemo(() => {
    const pool = source === 'strava' ? stravaActivities : garminActivities;
    return pool
      .filter(a => {
        if (activityType === 'All') return true;
        if (activityType === 'Other') return !KNOWN_TYPES.includes(a.type) && a.activityType !== 'Other'
          ? false
          : a.activityType === 'Other' || !KNOWN_TYPES.includes(a.type || a.activityType);
        return (a.type || a.activityType) === activityType;
      })
      .flatMap(a => a.points);
  }, [source, activityType, stravaActivities, garminActivities]);

  const activeCount = source === 'strava' ? stravaActivities.length : garminActivities.length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950">
      <Sidebar
        source={source}
        setSource={setSource}
        mapType={mapType}
        setMapType={setMapType}
        activityType={activityType}
        setActivityType={setActivityType}
        stravaAuth={stravaAuth}
        onFetchStrava={fetchStravaActivities}
        onDisconnect={handleDisconnect}
        loading={loading}
        loadingProgress={loadingProgress}
        error={error}
        activityCount={activeCount}
        pointCount={filteredPoints.length}
        onGarminUpload={activities => setGarminActivities(prev => [...prev, ...activities])}
        garminCount={garminActivities.length}
      />
      <MapView mapType={mapType} points={filteredPoints} />
    </div>
  );
}
