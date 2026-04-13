const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const [incidents, users, sos, donors] = await Promise.all([
      db.query(`SELECT status, COUNT(*) FROM incidents GROUP BY status`),
      db.query(`SELECT role, COUNT(*) FROM users GROUP BY role`),
      db.query(`SELECT status, COUNT(*) FROM sos_events GROUP BY status`),
      db.query(`SELECT COUNT(*) FROM blood_donors WHERE is_available=true`),
    ]);

    const todayIncidents = await db.query(
      `SELECT type, COUNT(*) FROM incidents WHERE created_at > NOW() - INTERVAL '24h' GROUP BY type`
    );

    res.json({
      incidentStats: incidents.rows,
      userStats: users.rows,
      sosStats: sos.rows,
      activeDonors: parseInt(donors.rows[0].count),
      todayIncidents: todayIncidents.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `UPDATE incidents SET status='verified', verified_by=$1, updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [req.user.id, id]
    );
    req.app.get('io')?.emit('incident_verified', { id, verifiedBy: req.user.name });
    res.json({ incident: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    let query = `SELECT id, name, email, role, phone, organization, is_verified, is_active, created_at FROM users WHERE 1=1`;
    const params = [];
    if (role) { query += ` AND role=$${params.length+1}`; params.push(role); }
    query += ` ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, (page-1)*limit);
    const { rows } = await db.query(query, params);
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isVerified } = req.body;
    const { rows } = await db.query(
      `UPDATE users SET is_active=COALESCE($1,is_active), is_verified=COALESCE($2,is_verified)
       WHERE id=$3 RETURNING id, name, email, role, is_active, is_verified`,
      [isActive, isVerified, id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};