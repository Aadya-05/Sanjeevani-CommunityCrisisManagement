import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Users, AlertTriangle, Activity } from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [tab, setTab] = useState('stats');

  useEffect(() => {
    if (!['admin','police','hospital'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    api.get('/admin/stats').then(({ data }) => setStats(data));
    api.get('/admin/users').then(({ data }) => setUsers(data.users));
    api.get('/incidents?status=reported&limit=20').then(({ data }) => setIncidents(data.incidents));
  }, []);

  const verifyIncident = async (id) => {
    try {
      await api.put(`/admin/incidents/${id}/verify`);
      toast.success('Incident verified');
      setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, status: 'verified' } : i));
    } catch (err) {
      toast.error('Failed to verify');
    }
  };

  const toggleUser = async (id, isActive) => {
    try {
      await api.put(`/admin/users/${id}`, { isActive: !isActive });
      toast.success('User updated');
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: !isActive } : u));
    } catch (err) {
      toast.error('Failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
        <Shield className="text-red-400" size={28} /> Control Center
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[['stats','Dashboard'], ['incidents','Pending Incidents'], ['users','Users']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===v ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.incidentStats?.map(({ status, count }) => (
            <div key={status} className="card">
              <p className="text-3xl font-black text-white">{count}</p>
              <p className="text-sm text-gray-400 capitalize">{status?.replace('_',' ')} incidents</p>
            </div>
          ))}
          <div className="card">
            <p className="text-3xl font-black text-green-400">{stats.activeDonors}</p>
            <p className="text-sm text-gray-400">Active blood donors</p>
          </div>
        </div>
      )}

      {tab === 'incidents' && (
        <div className="space-y-3">
          {incidents.filter(i=>i.status==='reported').map((i) => (
            <div key={i.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{i.title}</p>
                <p className="text-sm text-gray-400">{i.type.replace('_',' ')} · {i.severity} · {i.address}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/incidents/${i.id}`)}
                  className="btn-secondary text-sm py-1">View</button>
                <button onClick={() => verifyIncident(i.id)}
                  className="btn-primary text-sm py-1">Verify</button>
              </div>
            </div>
          ))}
          {incidents.filter(i=>i.status==='reported').length === 0 && (
            <p className="text-gray-400 text-center py-8">No pending incidents to verify</p>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{u.name}</p>
                <p className="text-xs text-gray-400">{u.email} · {u.role} · {u.organization || '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_verified ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                  {u.is_verified ? 'Verified' : 'Unverified'}
                </span>
                <button onClick={() => toggleUser(u.id, u.is_active)}
                  className={`text-xs px-3 py-1 rounded-lg ${u.is_active ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-green-900 text-green-300 hover:bg-green-800'}`}>
                  {u.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}