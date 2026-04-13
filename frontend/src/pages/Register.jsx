import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role: 'civilian', organization: '', badgeNumber: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const needsOrg = ['police', 'hospital', 'fire_department', 'ngo'].includes(form.role);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-6xl">🏥</span>
          <h1 className="text-3xl font-bold text-white mt-3">Join Sanjeevani</h1>
          <p className="text-slate-400 mt-1">Register to protect your community</p>
        </div>

        <div className="card border-red-500/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Full Name *</label>
              <input className="input" placeholder="Your full name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Email *</label>
                <input type="email" className="input" placeholder="email@example.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Phone</label>
                <input className="input" placeholder="+91 XXXXX XXXXX"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Role *</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {needsOrg && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Organization</label>
                  <input className="input" placeholder="Department / Hospital name"
                    value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Badge / ID Number</label>
                  <input className="input" placeholder="Official ID"
                    value={form.badgeNumber} onChange={(e) => setForm({ ...form, badgeNumber: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Password *</label>
              <input type="password" className="input" placeholder="Min 8 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-4">
            Already registered?{' '}
            <Link to="/login" className="text-red-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}