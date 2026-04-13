import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [liveIncidents, setLiveIncidents] = useState([]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    socketRef.current = io('/', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => { setConnected(true); console.log('Socket connected'); });
    socket.on('disconnect', () => setConnected(false));

    socket.on('new_incident', (incident) => {
      setLiveIncidents((prev) => [incident, ...prev]);
      const typeLabel = incident.type.replace(/_/g, ' ');
      toast.custom((t) => (
        <div className={`bg-red-900 border border-red-500 rounded-xl p-3 shadow-xl max-w-sm ${t.visible ? 'animate-enter' : ''}`}>
          <p className="font-bold text-red-200">🚨 New {incident.severity} Alert</p>
          <p className="text-sm text-white">{incident.title}</p>
          <p className="text-xs text-red-300">{typeLabel} · {incident.address}</p>
        </div>
      ), { duration: 6000 });
    });

    socket.on('sos_alert', (sos) => {
      setSosAlerts((prev) => [sos, ...prev]);
      if (['police', 'hospital', 'admin'].includes(user.role)) {
        toast.error(`🆘 SOS from ${sos.user.name} — ${sos.address || 'Location updating...'}`, { duration: 10000 });
      }
    });

    socket.on('incident_updated', ({ incidentId, status }) => {
      setLiveIncidents((prev) =>
        prev.map((i) => (i.id === incidentId ? { ...i, status } : i))
      );
    });

    return () => { socket.disconnect(); };
  }, [user]);

  const joinIncident = (incidentId) => socketRef.current?.emit('join_incident', incidentId);
  const leaveIncident = (incidentId) => socketRef.current?.emit('leave_incident', incidentId);
  const sendMessage = (incidentId, message, type = 'text') =>
    socketRef.current?.emit('send_message', { incidentId, message, messageType: type });
  const updateLocation = (incidentId, lat, lng) =>
    socketRef.current?.emit('update_location', { incidentId, lat, lng });
  const sendSOS = (lat, lng, address) =>
    socketRef.current?.emit('sos', { lat, lng, address });

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current, connected, liveIncidents, sosAlerts,
      joinIncident, leaveIncident, sendMessage, updateLocation, sendSOS,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);