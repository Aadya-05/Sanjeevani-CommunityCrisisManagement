import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ROLES } from '../utils/constants';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { location } = useGeolocation();
  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', alertRadius: user.alert_radius_km || 5,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', {
        ...form,
        ...(location && { lat: location.lat, lng: location.lng }),
      });
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const roleInfo = ROLES.find((r) => r.value === user.role);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>

      <div className="card mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-red-700 flex items-center justify-center text-2xl font-bold text-white">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-white text-lg">{user.name}</p>
            <p className="text-sm text-gray-400">{roleInfo?.label || user.role}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>

        {user.organization && (
          <p className="text-sm text-gray-300 border-t border-gray-700 pt-3">
            🏢 {user.organization}
            {user.badge_number && ` · Badge: ${user.badge_number}`}
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-white mb-4">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Full Name</label>
            <input className="input" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Phone</label>
            <input className="input" placeholder="+91 XXXXX XXXXX" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1 block">
              Alert Radius: {form.alertRadius} km
            </label>
            <input type="range" min="1" max="50" value={form.alertRadius}
              className="w-full"
              onChange={(e) => setForm({ ...form, alertRadius: parseInt(e.target.value) })} />
            <p className="text-xs text-gray-500 mt-1">
              You'll receive alerts for incidents within this distance
            </p>
          </div>
          {location && (
            <p className="text-xs text-green-400">
              📍 Location will be updated: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}