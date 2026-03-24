const TYPE_MAP = {
  running: 'Run',
  run: 'Run',
  cycling: 'Ride',
  biking: 'Ride',
  bike: 'Ride',
  ride: 'Ride',
  hiking: 'Hike',
  hike: 'Hike',
  walking: 'Walk',
  walk: 'Walk',
  swimming: 'Swim',
  swim: 'Swim',
  'cross-country skiing': 'NordicSki',
  'nordic skiing': 'NordicSki',
  'alpine skiing': 'AlpineSki',
  skiing: 'AlpineSki',
  snowboarding: 'Snowboard',
};

function detectType(raw = '') {
  const lower = raw.toLowerCase().trim();
  for (const [key, val] of Object.entries(TYPE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 'Other';
}

export function parseGpx(content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/xml');

  // Activity name
  const nameEl = doc.querySelector('trk > name, metadata > name, name');
  const name = nameEl?.textContent?.trim() || 'Unknown Activity';

  // Activity type — check multiple possible locations
  const typeEl = doc.querySelector('trk > type, type');
  const activityType = detectType(typeEl?.textContent || '');

  // Track points (trkpt) — main GPS data
  const trkpts = doc.querySelectorAll('trkpt');
  const points = [];

  trkpts.forEach(pt => {
    const lat = parseFloat(pt.getAttribute('lat'));
    const lon = parseFloat(pt.getAttribute('lon'));
    if (!isNaN(lat) && !isNaN(lon)) points.push([lat, lon]);
  });

  // Fallback: route points
  if (points.length === 0) {
    doc.querySelectorAll('rtept').forEach(pt => {
      const lat = parseFloat(pt.getAttribute('lat'));
      const lon = parseFloat(pt.getAttribute('lon'));
      if (!isNaN(lat) && !isNaN(lon)) points.push([lat, lon]);
    });
  }

  return { name, activityType, points };
}

export async function readGpxFiles(files) {
  const results = [];
  for (const file of files) {
    try {
      const text = await file.text();
      const parsed = parseGpx(text);
      if (parsed.points.length > 0) {
        results.push({
          ...parsed,
          source: 'garmin',
          date: file.lastModified ? new Date(file.lastModified).toISOString() : null,
        });
      }
    } catch (e) {
      console.warn(`Failed to parse ${file.name}:`, e);
    }
  }
  return results;
}
