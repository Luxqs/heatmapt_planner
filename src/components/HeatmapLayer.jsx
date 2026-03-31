import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// leaflet.heat is a UMD plugin — it calls factory(require('leaflet'))
// which attaches L.heatLayer to the imported L object.
import 'leaflet.heat';

export default function HeatmapLayer({ points, options = {} }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    // Remove previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!points || points.length === 0) return;

    if (!L.heatLayer) {
      console.error('leaflet.heat plugin is missing; L.heatLayer not available.');
      return;
    }

    layerRef.current = L.heatLayer(points, {
      radius: 12,
      blur: 18,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.2: '#fc4c02',
        0.5: '#ff8c00',
        0.8: '#ffd700',
        1.0: '#ffffff',
      },
      ...options,
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points, options]);

  return null;
}
