import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';

const ROLE_COLORS = {
  police: 'text-blue-400', hospital: 'text-green-400',
  fire_department: 'text-orange-400', admin: 'text-purple-400',
  civilian: 'text-gray-300', volunteer: 'text-yellow-400',
};

export default function CrisisChat({ incidentId }) {
  const { user } = useAuth();
  const { socket, joinIncident, sendMessage } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    joinIncident(incidentId);
    api.get(`/incidents/${incidentId}/messages`).then(({ data }) => setMessages(data.messages));

    socket?.on('new_message', (msg) => {
      if (msg.incident_id === incidentId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => { socket?.off('new_message'); };
  }, [incidentId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(incidentId, input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-96 bg-gray-900 rounded-xl border border-gray-700">
      <div className="px-4 py-3 border-b border-gray-700">
        <p className="font-medium text-sm text-gray-200">Crisis Communication Channel</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.user_id === user.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-xl px-3 py-2 ${isMe ? 'bg-red-800' : 'bg-gray-700'}`}>
                {!isMe && (
                  <p className={`text-xs font-medium mb-0.5 ${ROLE_COLORS[msg.sender_role] || 'text-gray-400'}`}>
                    {msg.sender_name} · {msg.sender_role?.replace('_', ' ')}
                  </p>
                )}
                <p className="text-sm text-white">{msg.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-gray-700 flex gap-2">
        <input className="input text-sm flex-1" placeholder="Type a message..."
          value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" className="btn-primary px-3">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}