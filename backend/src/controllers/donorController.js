const db = require('../config/db');
const geoService = require('../services/geoService');

exports.registerDonor = async (req, res) => {
  try {
    const { bloodType, city, lat, lng } = req.body;
    const { rows } = await db.query(
      `INSERT INTO blood_donors (user_id, blood_type, city, location, phone)
       VALUES ($1,$2,$3,ST_SetSRID(ST_MakePoint($4,$5),4326),
         (SELECT phone FROM users WHERE id=$1))
       ON CONFLICT (user_id) DO UPDATE
         SET blood_type=$2, city=$3, location=ST_SetSRID(ST_MakePoint($4,$5),4326), updated_at=NOW()
       RETURNING *`,
      [req.user.id, bloodType, city, lng, lat]
    );
    res.json({ donor: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.findDonors = async (req, res) => {
  try {
    const { lat, lng, radius = 20, bloodType } = req.query;
    const donors = await geoService.getDonorsInRadius(
      parseFloat(lat), parseFloat(lng), parseFloat(radius), bloodType
    );
    res.json({ donors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE blood_donors SET is_available = NOT is_available, updated_at=NOW()
       WHERE user_id=$1 RETURNING *`,
      [req.user.id]
    );
    res.json({ donor: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};