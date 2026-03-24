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

    layerRef.current = L.heatLayer(points, {
      radius: 15,
      blur: 20,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.1: '#0d47a1',
        0.3: '#1565c0',
        0.5: '#fbc02d',
        0.7: '#e65100',
        1.0: '#b71c1c',
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
