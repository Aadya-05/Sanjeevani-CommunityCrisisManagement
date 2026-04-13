import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { INCIDENT_TYPES } from '../../utils/constants';

const SEVERITY_MAP_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#7c3aed' };

export default function LiveMap({ incidents = [], responders = [], userLocation, onIncidentClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['marker', 'visualization'],
    });

    loader.load().then(async () => {
      const { Map } = await window.google.maps.importLibrary('maps');
      mapInstanceRef.current = new Map(mapRef.current, {
        center: userLocation || { lat: 20.5937, lng: 78.9629 },
        zoom: userLocation ? 13 : 5,
        mapId: 'SANJEEVANI_MAP',
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b0' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e3d59' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        ],
        disableDefaultUI: false,
        zoomControl: true,
      });
      setMapLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    incidents.forEach((incident) => {
      const typeInfo = INCIDENT_TYPES.find((t) => t.value === incident.type);
      const color = SEVERITY_MAP_COLORS[incident.severity] || '#6b7280';

      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(incident.lat), lng: parseFloat(incident.lng) },
        map: mapInstanceRef.current,
        title: incident.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: incident.severity === 'critical' ? 14 : incident.severity === 'high' ? 11 : 8,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color:#111;min-width:180px;padding:4px">
            <strong>${typeInfo?.icon || '⚠️'} ${incident.title}</strong>
            <p style="margin:4px 0;font-size:12px">${incident.type.replace(/_/g,' ')} · ${incident.severity}</p>
            <p style="font-size:11px;color:#555">${incident.address || ''}</p>
            <p style="font-size:11px;color:#e11d48;font-weight:bold">Status: ${incident.status}</p>
          </div>`,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        onIncidentClick?.(incident);
      });

      markersRef.current.push(marker);
    });

    // User location marker
    if (userLocation) {
      const userMarker = new window.google.maps.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
        zIndex: 1000,
      });
      markersRef.current.push(userMarker);
    }
  }, [incidents, mapLoaded, userLocation]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400 animate-pulse">Loading map...</div>
        </div>
      )}
    </div>
  );
}