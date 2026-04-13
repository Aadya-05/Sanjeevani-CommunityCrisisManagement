import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { BLOOD_TYPES } from '../utils/constants';
import toast from 'react-hot-toast';
import { Droplets, Phone, MapPin } from 'lucide-react';

export default function BloodDonors() {
  const { user } = useAuth();
  const { location } = useGeolocation();
  const [donors, setDonors] = useState([]);
  const [bloodType, setBloodType] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [form, setForm] = useState({ bloodType: 'O+', city: '' });

  const search = async () => {
    if (!location) { toast.error('Location required'); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ lat: location.lat, lng: location.lng, radius: 30, ...(bloodType && { bloodType }) });
      const { data } = await api.get(`/donors/search?${params}`);
      setDonors(data.donors);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!location) { toast.error('Location required to register'); return; }
    try {
      await api.post('/donors/register', { ...form, lat: location.lat, lng: location.lng });
      toast.success('Registered as blood donor!');
      setRegistered(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Droplets className="text-red-400" size={28} /> Blood Donor Registry
      </h1>

      {/* Search */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Find Nearby Donors</h2>
        <div className="flex gap-3">
          <select className="input" value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
            <option value="">Any Blood Type</option>
            {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <button onClick={search} className="btn-primary">
            {loading ? 'Searching...' : 'Search (30km radius)'}
          </button>
        </div>
      </div>

      {/* Results */}
      {donors.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {donors.map((d) => (
            <div key={d.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{d.name}</h3>
                <span className="text-xl font-black text-red-400">{d.blood_type}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} />
                <span>{d.city} · {parseFloat(d.distance_km).toFixed(1)} km away</span>
              </div>
              <a href={`tel:${d.phone}`} className="flex items-center gap-2 text-sm text-blue-400 hover:underline mt-1">
                <Phone size={14} /> {d.phone}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Register as donor */}
      {!registered && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Register as Blood Donor</h2>
          <form onSubmit={handleRegister} className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Blood Type *</label>
              <select className="input" value={form.bloodType}
                onChange={(e) => setForm({ ...form, bloodType: e.target.value })}>
                {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">City *</label>
              <input className="input" placeholder="Your city" value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">Register</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}