import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import SeverityBadge from './SeverityBadge';
import { INCIDENT_TYPES } from '../../utils/constants';

export default function IncidentCard({ incident }) {
  const typeInfo = INCIDENT_TYPES.find((t) => t.value === incident.type);

  return (
    <Link to={`/incidents/${incident.id}`}
      className="card hover:border-red-400/50 hover:bg-slate-800/70 transition-all block group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">{typeInfo?.icon || '⚠️'}</span>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
              {incident.title}
            </p>
            <p className="text-xs text-slate-400 truncate">{incident.address || incident.city}</p>
          </div>
        </div>
        <SeverityBadge severity={incident.severity} />
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
        <span className="capitalize">{incident.status?.replace('_', ' ')}</span>
        <span>·</span>
        <span>{formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}</span>
        {incident.distance_km && (
          <>
            <span>·</span>
            <span>{parseFloat(incident.distance_km).toFixed(1)} km away</span>
          </>
        )}
      </div>
    </Link>
  );
}