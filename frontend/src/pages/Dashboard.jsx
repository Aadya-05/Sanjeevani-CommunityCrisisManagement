import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useGeolocation } from '../hooks/useGeolocation';
import IncidentCard from '../components/Incidents/IncidentCard';
import ReportForm from '../components/Incidents/ReportForm';
import SOSButton from '../components/SOS/SOSButton';
import { AlertTriangle, Users, Activity, Droplets, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { liveIncidents } = useSocket();
  const { location } = useGeolocation();
  const [incidents, setIncidents] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = location ? `?lat=${location.lat}&lng=${location.lng}&radius=20` : '';
    api.get(`/incidents${params}`).then(({ data }) => {
      setIncidents(data.incidents);
      setLoading(false);
    });
  }, [location]);

  // Merge live incidents
  useEffect(() => {
    if (liveIncidents.length) {
      setIncidents((prev) => {
        const ids = new Set(prev.map((i) => i.id));
        const newOnes = liveIncidents.filter((i) => !ids.has(i.id));
        return [...newOnes, ...prev];
      });
    }
  }, [liveIncidents]);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const criticalCount = activeIncidents.filter((i) => i.severity === 'critical').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="section-title">
            Welcome, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="subtle-text mt-1 capitalize">
            {user.role.replace('_', ' ')} · {location ? 'Location active' : 'Enable location for nearby alerts'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SOSButton />
          <button onClick={() => setShowReport(true)} className="btn-primary">
            + Report Incident
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Incidents', value: activeIncidents.length, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Critical', value: criticalCount, icon: Activity, color: 'text-purple-400' },
          { label: 'Responding', value: activeIncidents.filter(i=>i.status==='responding').length, icon: Users, color: 'text-blue-400' },
          { label: 'Resolved Today', value: incidents.filter(i=>i.status==='resolved').length, icon: Droplets, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 hover:border-slate-500 transition-colors">
            <Icon size={24} className={color} />
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Incident list */}
      <div className="grid gap-3">
        <h2 className="text-lg font-semibold text-slate-100">
          {location ? 'Incidents Near You' : 'Recent Incidents'}
        </h2>
        {loading ? (
          <div className="text-slate-400 animate-pulse py-8 text-center">Loading incidents...</div>
        ) : activeIncidents.length === 0 ? (
          <div className="card text-center text-slate-400 py-12">
            <p className="text-4xl mb-3">✅</p>
            <p>No active incidents in your area</p>
          </div>
        ) : (
          activeIncidents.slice(0, 20).map((i) => <IncidentCard key={i.id} incident={i} />)
        )}
      </div>

      {/* Report modal */}
      {showReport && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Report Emergency</h2>
                <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <ReportForm onClose={() => setShowReport(false)} />
          </div>
        </div>
      )}
    </div>
  );
}