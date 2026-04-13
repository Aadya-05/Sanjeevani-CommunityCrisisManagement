const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const redisClient = require('../config/redis');

function initSocketService(server) {
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'], credentials: true },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { rows } = await db.query('SELECT id, name, role FROM users WHERE id=$1', [decoded.userId]);
      if (!rows[0]) return next(new Error('User not found'));
      socket.user = rows[0];
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.user.name} [${socket.user.role}]`);

    // Track online users in Redis
    await redisClient.hSet('online_users', socket.user.id, JSON.stringify({
      id: socket.user.id,
      name: socket.user.name,
      role: socket.user.role,
      socketId: socket.id,
      connectedAt: new Date().toISOString(),
    }));

    // Join incident room
    socket.on('join_incident', async (incidentId) => {
      socket.join(`incident:${incidentId}`);
      socket.emit('joined_incident', { incidentId });
      const count = (await io.in(`incident:${incidentId}`).fetchSockets()).length;
      io.to(`incident:${incidentId}`).emit('room_count', { incidentId, count });
    });

    socket.on('leave_incident', (incidentId) => {
      socket.leave(`incident:${incidentId}`);
    });

    // Chat message
    socket.on('send_message', async ({ incidentId, message, messageType = 'text', mediaUrl }) => {
      try {
        const { rows } = await db.query(
          `INSERT INTO incident_messages (incident_id, user_id, message, message_type, media_url)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [incidentId, socket.user.id, message, messageType, mediaUrl]
        );
        const msg = {
          ...rows[0],
          sender: { id: socket.user.id, name: socket.user.name, role: socket.user.role },
        };
        io.to(`incident:${incidentId}`).emit('new_message', msg);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Responder location update (live tracking)
    socket.on('update_location', async ({ incidentId, lat, lng }) => {
      try {
        await db.query(
          `UPDATE incident_responders
           SET current_location = ST_SetSRID(ST_MakePoint($1,$2),4326), updated_at = NOW()
           WHERE incident_id = $3 AND user_id = $4`,
          [lng, lat, incidentId, socket.user.id]
        );
        io.to(`incident:${incidentId}`).emit('responder_location', {
          userId: socket.user.id,
          name: socket.user.name,
          role: socket.user.role,
          lat, lng,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Location update error:', err);
      }
    });

    // SOS broadcast
    socket.on('sos', async ({ lat, lng, address }) => {
      try {
        const { rows } = await db.query(
          `INSERT INTO sos_events (user_id, location, address)
           VALUES ($1, ST_SetSRID(ST_MakePoint($2,$3),4326), $4) RETURNING *`,
          [socket.user.id, lng, lat, address]
        );
        // Broadcast to all police/hospital/admin
        io.emit('sos_alert', {
          ...rows[0],
          user: { id: socket.user.id, name: socket.user.name },
          lat, lng,
        });
        socket.emit('sos_sent', { id: rows[0].id });
      } catch (err) {
        socket.emit('error', { message: 'SOS failed' });
      }
    });

    // Incident status update
    socket.on('update_incident_status', async ({ incidentId, status }) => {
      const allowedRoles = ['police', 'hospital', 'fire_department', 'admin'];
      if (!allowedRoles.includes(socket.user.role)) return;
      try {
        await db.query('UPDATE incidents SET status=$1, updated_at=NOW() WHERE id=$2', [status, incidentId]);
        io.emit('incident_updated', { incidentId, status, updatedBy: socket.user.name });
      } catch (err) {
        socket.emit('error', { message: 'Update failed' });
      }
    });

    socket.on('disconnect', async () => {
      await redisClient.hDel('online_users', socket.user.id);
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
}

module.exports = initSocketService;