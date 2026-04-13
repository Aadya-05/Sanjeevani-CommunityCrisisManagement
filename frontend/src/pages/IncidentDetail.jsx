import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import CrisisChat from '../components/Chat/CrisisChat';
import SeverityBadge from '../components/Incidents/SeverityBadge';
import { INCIDENT_TYPES } from '../utils/constants';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function IncidentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/incidents/${id}`).then(({ data }) => {
      setIncident(data.incident);
      setLoading(false);
    }).catch(() => navigate('/dashboard'));
  }, [id]);

  const handleRespond = async () => {
    try {
      await api.post(`/incidents/${id}/respond`, { eta: 10 });
      toast.success('You are now a responder!');
      api.get(`/incidents/${id}`).then(({ data }) => setIncident(data.incident));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to respond');
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      const { data } = await api.put(`/incidents/${id}`, { status });
      setIncident(data.incident);
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400 animate-pulse">Loading incident...</div>;

  const typeInfo = INCIDENT_TYPES.find((t) => t.value === incident.type);
  const canManage = ['police', 'hospital', 'fire_department', 'admin'].includes(user.role);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white mb-4">
        ← Back
      </button>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Incident Info */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{typeInfo?.icon || '⚠️'}</span>
                <h1 className="text-xl font-bold text-white">{incident.title}</h1>
              </div>
              <SeverityBadge severity={incident.severity} />
            </div>

            {incident.description && (
              <p className="text-gray-300 text-sm mb-3">{incident.description}</p>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['Type', typeInfo?.label || incident.type],
                ['Status', incident.status?.replace('_', ' ')],
                ['Address', incident.address || 'Unknown'],
                ['City', incident.city || '—'],
                ['Reported', formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })],
                ['Reporter', incident.reporter_name || 'Anonymous'],
                ...(incident.casualty_count > 0 ? [['Casualties', incident.casualty_count]] : []),
                ...(incident.injured_count > 0 ? [['Injured', incident.injured_count]] : []),
                ...(incident.requires_blood_type ? [['Blood Needed', incident.requires_blood_type]] : []),
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="text-white capitalize">{val}</p>
                </div>
              ))}
            </div>

            {/* Photos */}
            {incident.photo_urls?.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {incident.photo_urls.map((url, i) => (
                  <img key={i} src={url} alt="evidence"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-600" />
                ))}
              </div>
            )}
          </div>

          {/* Responders */}
          <div className="card">
            <h3 className="font-semibold text-white mb-3">
              Responders ({incident.responders?.length || 0})
            </h3>
            {incident.responders?.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-700 last:border-0">
                <div>
                  <p className="text-sm text-white">{r.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{r.role?.replace('_', ' ')}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === 'on_scene' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                }`}>
                  {r.status?.replace('_', ' ')}
                </span>
              </div>
            ))}

            <div className="flex gap-2 mt-3">
              <button onClick={handleRespond} className="btn-primary text-sm flex-1">
                Join as Responder
              </button>
              {canManage && (
                <select className="input text-sm py-1.5" defaultValue=""
                  onChange={(e) => e.target.value && handleStatusUpdate(e.target.value)}>
                  <option value="">Update Status</option>
                  {['verified','responding','resolved','false_alarm'].map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Crisis Chat */}
        <div>
          <CrisisChat incidentId={id} />
        </div>
      </div>
    </div>
  );
}