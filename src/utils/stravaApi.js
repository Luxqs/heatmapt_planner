const CLIENT_ID = '216041';
const CLIENT_SECRET = '303fa9439bc94bb7382e81009a5d4058fcccbd0b';
const AUTH_URL = 'https://www.strava.com/oauth/authorize';
const TOKEN_URL = 'https://www.strava.com/oauth/token';
const API_BASE = 'https://www.strava.com/api/v3';

export function getAuthUrl() {
  const redirectUri = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'activity:read_all',
  });
  return `${AUTH_URL}?${params}`;
}

export async function exchangeToken(code) {
  const redirectUri = window.location.origin + window.location.pathname;
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Token exchange failed');
  }
  return res.json();
}

export async function refreshAccessToken(refresh_token) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}

export function saveToken(tokenData) {
  localStorage.setItem('strava_token', JSON.stringify({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: tokenData.expires_at,
    athlete: tokenData.athlete,
  }));
}

export function loadToken() {
  const data = localStorage.getItem('strava_token');
  return data ? JSON.parse(data) : null;
}

export function clearToken() {
  localStorage.removeItem('strava_token');
  localStorage.removeItem('strava_activities');
  localStorage.removeItem('strava_activities_ts');
}

export async function getValidToken() {
  const tokenData = loadToken();
  if (!tokenData) return null;

  // Refresh if expires within 5 minutes
  if (Date.now() / 1000 > tokenData.expires_at - 300) {
    try {
      const fresh = await refreshAccessToken(tokenData.refresh_token);
      saveToken(fresh);
      return fresh.access_token;
    } catch {
      clearToken();
      return null;
    }
  }
  return tokenData.access_token;
}

export async function fetchAllActivities(accessToken, onProgress) {
  const all = [];
  const MAX_PAGES = 10;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(
      `${API_BASE}/athlete/activities?per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) throw new Error('Failed to fetch activities');
    const batch = await res.json();
    if (batch.length === 0) break;
    all.push(...batch);
    onProgress?.(Math.min(Math.round((page / MAX_PAGES) * 100), 95));
    if (batch.length < 100) break;
  }

  return all;
}

// Decode Google Encoded Polyline → [[lat, lng], ...]
export function decodePolyline(encoded) {
  if (!encoded) return [];
  const points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let shift = 0, result = 0, b;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;

    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}
