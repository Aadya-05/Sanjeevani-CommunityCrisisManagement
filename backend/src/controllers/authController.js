const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { sendEmail } = require('../services/notificationService');

const generateTokens = (userId) => ({
  accessToken: jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
});

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, organization, badgeNumber } = req.body;
    const existing = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows[0]) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role, organization, badge_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, email, role`,
      [name, email, phone, hash, role || 'civilian', organization, badgeNumber]
    );

    const { accessToken, refreshToken } = generateTokens(rows[0].id);
    await sendEmail(email, 'Welcome to Sanjeevani', `<h2>Welcome ${name}!</h2><p>Your community crisis account is active.</p>`);

    res.status(201).json({ user: rows[0], accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows[0]) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(rows[0].id);
    const { password_hash, ...user } = rows[0];
    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.userId);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, alertRadius, notificationToken, lat, lng } = req.body;
    let locationUpdate = '';
    const params = [name, phone, alertRadius, notificationToken, req.user.id];

    if (lat && lng) {
      locationUpdate = `, location = ST_SetSRID(ST_MakePoint($6,$7),4326)`;
      params.push(lng, lat);
    }

    const { rows } = await db.query(
      `UPDATE users SET name=$1, phone=$2, alert_radius_km=$3,
       notification_token=$4, updated_at=NOW() ${locationUpdate}
       WHERE id=$5 RETURNING id, name, email, role, phone, alert_radius_km`,
      params
    );
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};