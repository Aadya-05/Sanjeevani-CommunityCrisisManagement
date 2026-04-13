import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSocket } from '../contexts/SocketContext';
import LiveMap from '../components/Map/LiveMap';
import IncidentCard from '../components/Incidents/IncidentCard';
import { INCIDENT_TYPES } from '../utils/constants';

export default function CrisisMap() {
  const { location } = useGeolocation();
  const { liveIncidents } = useSocket();
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ type: '', severity: '' });

  useEffect(() => {
    const params = new URLSearchParams({ ...(location && { lat: location.lat, lng: location.lng, radius: 50 }), ...filters });
    api.get(`/incidents?${params}`).then(({ data }) => setIncidents(data.incidents));
  }, [location, filters]);

  useEffect(() => {
    if (liveIncidents.length) {
      setIncidents((prev) => {
        const ids = new Set(prev.map((i) => i.id));
        return [...liveIncidents.filter((i) => !ids.has(i.id)), ...prev];
      });
    }
  }, [liveIncidents]);

  const filtered = incidents.filter((i) => {
    if (filters.type && i.type !== filters.type) return false;
    if (filters.severity && i.severity !== filters.severity) return false;
    return true;
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col px-2 pb-2">
      {/* Filter bar */}
      <div className="card rounded-b-none border-b-0 px-4 py-2 flex gap-3 items-center">
        <select className="input text-sm py-1.5 w-48" value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          {INCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
        </select>
        <select className="input text-sm py-1.5 w-36" value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
          <option value="">All Severities</option>
          {['low','medium','high','critical'].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} incidents</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative card rounded-r-none">
          <LiveMap
            incidents={filtered}
            userLocation={location}
            onIncidentClick={setSelected}
          />
        </div>

        {/* Side panel */}
        <div className="w-80 card rounded-l-none border-l border-slate-700 overflow-y-auto">
          {selected ? (
            <div className="p-4">
              <button onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-white mb-3">
                ← Back to list
              </button>
              <IncidentCard incident={selected} />
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-slate-100 text-sm">Active Incidents</h3>
              {filtered.filter(i=>i.status!=='resolved').slice(0,30).map((i) => (
                <div key={i.id} onClick={() => setSelected(i)} className="cursor-pointer">
                  <IncidentCard incident={i} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}