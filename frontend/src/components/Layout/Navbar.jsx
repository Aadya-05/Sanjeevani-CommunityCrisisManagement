import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { MapPin, AlertTriangle, Droplets, LayoutDashboard, User, LogOut, Wifi, WifiOff } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const loc = useLocation();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/map', label: 'Live Map', icon: MapPin },
    { to: '/donors', label: 'Blood Donors', icon: Droplets },
    ...((['admin','police','hospital'].includes(user?.role)) ? [{ to: '/admin', label: 'Control Center', icon: AlertTriangle }] : []),
  ];

  return (
    <nav className="bg-slate-950/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <span className="font-bold text-red-300 text-lg hidden sm:block">Sanjeevani</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-slate-900/70 border border-slate-700 rounded-2xl p-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors ${
                loc.pathname === to ? 'bg-red-600 text-white shadow-lg shadow-red-950/40' : 'text-slate-300 hover:bg-slate-700'
              }`}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {connected ? <Wifi size={16} className="text-emerald-400" /> : <WifiOff size={16} className="text-red-400" />}
          <Link to="/profile" className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm">
            <User size={16} />
            <span className="hidden sm:block">{user?.name?.split(' ')[0]}</span>
          </Link>
          <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}