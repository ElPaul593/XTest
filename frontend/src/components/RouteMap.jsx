import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';

const libraries = ['geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '420px',
  borderRadius: '18px',
  overflow: 'hidden'
};

const defaultCenter = {
  lat: -1.831239,
  lng: -78.183406
};

function decodePolyline(encodedPolyline) {
  if (!encodedPolyline || !window.google?.maps?.geometry?.encoding) {
    return [];
  }

  try {
    return window.google.maps.geometry.encoding.decodePath(encodedPolyline).map((point) => ({
      lat: point.lat(),
      lng: point.lng()
    }));
  } catch (error) {
    console.warn('No se pudo decodificar la polyline:', error.message);
    return [];
  }
}

function haversineDistance(pointA, pointB) {
  const radius = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLat = toRadians(pointB.lat - pointA.lat);
  const deltaLng = toRadians(pointB.lng - pointA.lng);
  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolatePoint(path, progress) {
  if (!path.length) {
    return null;
  }

  if (path.length === 1 || progress <= 0) {
    return path[0];
  }

  if (progress >= 1) {
    return path[path.length - 1];
  }

  const segmentDistances = [];
  let totalDistance = 0;

  for (let index = 0; index < path.length - 1; index += 1) {
    const segmentDistance = haversineDistance(path[index], path[index + 1]);
    segmentDistances.push(segmentDistance);
    totalDistance += segmentDistance;
  }

  if (totalDistance === 0) {
    return path[0];
  }

  const targetDistance = totalDistance * progress;
  let accumulated = 0;

  for (let index = 0; index < segmentDistances.length; index += 1) {
    const segmentDistance = segmentDistances[index];
    const nextAccumulated = accumulated + segmentDistance;

    if (targetDistance <= nextAccumulated) {
      const segmentProgress = segmentDistance === 0 ? 0 : (targetDistance - accumulated) / segmentDistance;
      return {
        lat: path[index].lat + (path[index + 1].lat - path[index].lat) * segmentProgress,
        lng: path[index].lng + (path[index + 1].lng - path[index].lng) * segmentProgress
      };
    }

    accumulated = nextAccumulated;
  }

  return path[path.length - 1];
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildBusIcon() {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect x="11" y="7" width="26" height="30" rx="7" fill="#0f172a"/>
      <rect x="14" y="11" width="20" height="11" rx="2.5" fill="#dbeafe"/>
      <rect x="14" y="24" width="20" height="7" rx="2" fill="#93c5fd"/>
      <circle cx="17" cy="38" r="4" fill="#111827"/>
      <circle cx="31" cy="38" r="4" fill="#111827"/>
      <rect x="8" y="14" width="3" height="9" rx="1.5" fill="#2563eb"/>
      <rect x="37" y="14" width="3" height="9" rx="1.5" fill="#2563eb"/>
    </svg>
  `);

  return {
    url: `data:image/svg+xml;charset=UTF-8,${svg}`,
    scaledSize: new window.google.maps.Size(36, 36),
    anchor: new window.google.maps.Point(18, 18)
  };
}

export default function RouteMap({
  origen,
  destino,
  polyline,
  fechaSalida,
  fechaLlegadaEstimada
}) {
  const mapRef = useRef(null);
  const [decodedPath, setDecodedPath] = useState([]);
  const [busPosition, setBusPosition] = useState(null);
  const [mapFallback, setMapFallback] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries
  });

  useEffect(() => {
    if (!isLoaded || !polyline) {
      setDecodedPath([]);
      setMapFallback(!polyline);
      return;
    }

    const points = decodePolyline(polyline);
    setDecodedPath(points);
    setMapFallback(points.length === 0);
  }, [isLoaded, polyline]);

  useEffect(() => {
    const salida = parseDate(fechaSalida);
    const llegada = parseDate(fechaLlegadaEstimada);

    if (!salida || !llegada || decodedPath.length < 2) {
      setBusPosition(null);
      return;
    }

    const totalDuration = llegada.getTime() - salida.getTime();
    if (totalDuration <= 0) {
      setBusPosition(null);
      return;
    }

    const refreshBusPosition = () => {
      const now = Date.now();
      if (now < salida.getTime() || now > llegada.getTime()) {
        setBusPosition(null);
        return;
      }

      const progress = (now - salida.getTime()) / totalDuration;
      setBusPosition(interpolatePoint(decodedPath, progress));
    };

    refreshBusPosition();
    const intervalId = window.setInterval(refreshBusPosition, 30000);

    return () => window.clearInterval(intervalId);
  }, [decodedPath, fechaSalida, fechaLlegadaEstimada]);

  useEffect(() => {
    if (!mapRef.current || decodedPath.length === 0 || !window.google?.maps) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    decodedPath.forEach((point) => bounds.extend(point));
    mapRef.current.fitBounds(bounds, 80);
  }, [decodedPath, isLoaded]);

  if (loadError || !apiKey) {
    return (
      <div className="route-map-fallback">
        No se pudo cargar Google Maps. Verifica la key restringida por dominio.
      </div>
    );
  }

  if (mapFallback) {
    return (
      <div className="route-map-fallback">
        No hay datos de mapa disponibles para esta ruta.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="route-map-fallback">Cargando mapa...</div>;
  }

  const originMarker = decodedPath[0];
  const destinationMarker = decodedPath[decodedPath.length - 1];

  return (
    <div className="route-map-shell">
      <div className="route-map-summary">
        <div>
          <strong>{origen}</strong>
          <span>Origen</span>
        </div>
        <div className="route-map-arrow">→</div>
        <div>
          <strong>{destino}</strong>
          <span>Destino</span>
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={originMarker || defaultCenter}
        zoom={8}
        options={{
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: true
        }}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        <Polyline
          path={decodedPath}
          options={{
            strokeColor: '#0f172a',
            strokeOpacity: 0.85,
            strokeWeight: 4,
            geodesic: true
          }}
        />

        {originMarker && (
          <Marker
            position={originMarker}
            label={{ text: 'A', color: '#ffffff', fontWeight: '700' }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8
            }}
          />
        )}

        {destinationMarker && (
          <Marker
            position={destinationMarker}
            label={{ text: 'B', color: '#ffffff', fontWeight: '700' }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 8
            }}
          />
        )}

        {busPosition && (
          <Marker
            position={busPosition}
            title="Bus en movimiento"
            icon={buildBusIcon()}
            zIndex={999}
          />
        )}
      </GoogleMap>
    </div>
  );
}