import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import toast from 'react-hot-toast';

export default function SOSButton() {
  const [pressed, setPressed] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const { sendSOS } = useSocket();
  const { location } = useGeolocation();

  const handlePress = () => {
    if (pressed) return;
    let count = 3;
    setCountdown(count);
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timer);
        setCountdown(null);
        setPressed(true);
        if (location) {
          sendSOS(location.lat, location.lng, 'Location detected');
          toast.error('🆘 SOS SENT — Help is on the way!', { duration: 8000 });
        } else {
          toast.error('Could not get your location. Tap again once GPS is ready.');
        }
        setTimeout(() => setPressed(false), 30000);
      }
    }, 1000);
  };

  return (
    <button
      onClick={handlePress}
      disabled={pressed}
      className={`relative w-24 h-24 rounded-full font-bold text-white text-lg shadow-2xl transition-all
        ${pressed ? 'bg-gray-600 scale-95' : 'bg-red-600 hover:bg-red-700 active:scale-95'}
        ${countdown ? 'ring-4 ring-yellow-400' : ''}`}
    >
      {countdown ? (
        <span className="text-3xl font-black">{countdown}</span>
      ) : pressed ? (
        <span className="text-xs">SENT ✓</span>
      ) : (
        <span>SOS</span>
      )}
    </button>
  );
}