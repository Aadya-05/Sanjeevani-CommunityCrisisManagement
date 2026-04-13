import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CrisisMap from './pages/CrisisMap';
import IncidentDetail from './pages/IncidentDetail';
import BloodDonors from './pages/BloodDonors';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';

const Protected = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute top-24 -right-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/map" element={<Protected><CrisisMap /></Protected>} />
        <Route path="/incidents/:id" element={<Protected><IncidentDetail /></Protected>} />
        <Route path="/donors" element={<Protected><BloodDonors /></Protected>} />
        <Route path="/admin" element={<Protected><AdminPanel /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
      </Routes>
    </div>
  );
}