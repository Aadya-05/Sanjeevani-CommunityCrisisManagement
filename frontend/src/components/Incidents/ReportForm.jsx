import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { INCIDENT_TYPES, BLOOD_TYPES } from '../../utils/constants';
import { useGeolocation } from '../../hooks/useGeolocation';
import toast from 'react-hot-toast';

export default function ReportForm({ onClose }) {
  const { location } = useGeolocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', type: 'accident', severity: 'medium',
    address: '', city: '', lat: '', lng: '',
    casualtyCount: 0, injuredCount: 0, requiresBloodType: '',
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      const lat = form.lat || location?.lat;
      const lng = form.lng || location?.lng;
      if (!lat || !lng) { toast.error('Location required'); setLoading(false); return; }

      Object.entries({ ...form, lat, lng }).forEach(([k, v]) => fd.append(k, v));
      photos.forEach((p) => fd.append('photos', p));

      const { data } = await api.post('/incidents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Incident reported successfully!');
      onClose?.();
      navigate(`/incidents/${data.incident.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-gray-300 mb-1 block">Incident Title *</label>
        <input className="input" placeholder="Brief description of the incident"
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-300 mb-1 block">Type *</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-300 mb-1 block">Severity *</label>
          <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            {['low','medium','high','critical'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-300 mb-1 block">Description</label>
        <textarea className="input h-20 resize-none" placeholder="Describe what is happening..."
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-300 mb-1 block">Address</label>
          <input className="input" placeholder="Street address"
            value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-300 mb-1 block">City</label>
          <input className="input" placeholder="City"
            value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-300 mb-1 block">Casualties</label>
          <input type="number" className="input" min="0"
            value={form.casualtyCount} onChange={(e) => setForm({ ...form, casualtyCount: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-gray-300 mb-1 block">Injured</label>
          <input type="number" className="input" min="0"
            value={form.injuredCount} onChange={(e) => setForm({ ...form, injuredCount: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-300 mb-1 block">Requires Blood Type</label>
        <select className="input" value={form.requiresBloodType}
          onChange={(e) => setForm({ ...form, requiresBloodType: e.target.value })}>
          <option value="">Not required</option>
          {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-300 mb-1 block">Photos (max 5)</label>
        <input type="file" accept="image/*,video/*" multiple
          className="input py-1.5 text-sm"
          onChange={(e) => setPhotos(Array.from(e.target.files).slice(0, 5))} />
      </div>

      {location && (
        <p className="text-xs text-green-400">
          📍 Location detected: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Reporting...' : '🚨 Report Incident'}
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        )}
      </div>
    </form>
  );
}