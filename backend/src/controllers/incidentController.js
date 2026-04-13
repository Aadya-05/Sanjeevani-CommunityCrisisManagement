const db = require('../config/db');
const geoService = require('../services/geoService');
const notificationService = require('../services/notificationService');

exports.createIncident = async (req, res) => {
  try {
    const {
      title, description, type, severity, lat, lng,
      address, city, casualtyCount, injuredCount, requiresBloodType,
    } = req.body;

    const photoUrls = req.files ? req.files.map((f) => f.path) : [];

    const { rows } = await db.query(
      `INSERT INTO incidents
       (title, description, type, severity, location, address, city,
        reported_by, photo_urls, casualty_count, injured_count, requires_blood_type)
       VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326),$7,$8,$9,$10,$11,$12,$13)
       RETURNING *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng`,
      [title, description, type, severity, lng, lat, address, city,
       req.user.id, photoUrls, casualtyCount || 0, injuredCount || 0, requiresBloodType]
    );

    const incident = rows[0];

    // Notify nearby users asynchronously
    geoService.getUsersInRadius(lat, lng, 10).then((users) => {
      notificationService.notifyNearbyUsers(incident, users);
    });

    // Emit via socket (injected via req.app)
    req.app.get('io')?.emit('new_incident', incident);

    res.status(201).json({ incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    const { lat, lng, radius = 20, type, severity, status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    if (lat && lng) {
      const incidents = await geoService.getNearbyIncidents(
        parseFloat(lat), parseFloat(lng), parseFloat(radius), { type, severity }
      );
      return res.json({ incidents, total: incidents.length });
    }

    let query = `
      SELECT i.*, u.name AS reporter_name,
        ST_Y(i.location::geometry) AS lat, ST_X(i.location::geometry) AS lng
      FROM incidents i LEFT JOIN users u ON i.reported_by = u.id
      WHERE 1=1
    `;
    const params = [];
    if (type) { query += ` AND i.type=$${params.length+1}`; params.push(type); }
    if (severity) { query += ` AND i.severity=$${params.length+1}`; params.push(severity); }
    if (status) { query += ` AND i.status=$${params.length+1}`; params.push(status); }
    query += ` ORDER BY i.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    const count = await db.query('SELECT COUNT(*) FROM incidents');
    res.json({ incidents: rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT i.*, u.name AS reporter_name, u.role AS reporter_role,
        ST_Y(i.location::geometry) AS lat, ST_X(i.location::geometry) AS lng,
        (SELECT json_agg(json_build_object(
          'id', ir.id, 'userId', ir.user_id, 'name', ru.name,
          'role', ru.role, 'status', ir.status, 'eta', ir.eta_minutes
        )) FROM incident_responders ir JOIN users ru ON ir.user_id=ru.id
        WHERE ir.incident_id=i.id) AS responders
       FROM incidents i LEFT JOIN users u ON i.reported_by=u.id
       WHERE i.id=$1`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Incident not found' });
    res.json({ incident: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, severity, description, casualtyCount, injuredCount } = req.body;

    const { rows } = await db.query(
      `UPDATE incidents SET status=COALESCE($1,status), severity=COALESCE($2,severity),
       description=COALESCE($3,description), casualty_count=COALESCE($4,casualty_count),
       injured_count=COALESCE($5,injured_count), verified_by=$6, updated_at=NOW()
       WHERE id=$7
       RETURNING *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng`,
      [status, severity, description, casualtyCount, injuredCount, req.user.id, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    req.app.get('io')?.emit('incident_updated', rows[0]);
    res.json({ incident: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncidentMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT m.*, u.name AS sender_name, u.role AS sender_role, u.avatar_url
       FROM incident_messages m JOIN users u ON m.user_id=u.id
       WHERE m.incident_id=$1 ORDER BY m.created_at ASC`,
      [id]
    );
    res.json({ messages: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.joinAsResponder = async (req, res) => {
  try {
    const { id } = req.params;
    const { eta, lat, lng } = req.body;
    const { rows } = await db.query(
      `INSERT INTO incident_responders (incident_id, user_id, role, eta_minutes, current_location)
       VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326))
       ON CONFLICT (incident_id, user_id) DO UPDATE SET status='en_route', updated_at=NOW()
       RETURNING *`,
      [id, req.user.id, req.user.role, eta, lng || 0, lat || 0]
    );
    req.app.get('io')?.to(`incident:${id}`).emit('responder_joined', {
      userId: req.user.id, name: req.user.name, role: req.user.role,
    });
    res.json({ responder: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};