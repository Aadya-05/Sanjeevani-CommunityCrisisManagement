const db = require('../config/db');

// Find users within radius (km) of a lat/lng point
async function getUsersInRadius(lat, lng, radiusKm) {
  const { rows } = await db.query(
    `SELECT id, notification_token, email, phone, role
     FROM users
     WHERE ST_DWithin(
       location::geography,
       ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
       $3
     ) AND is_active = true AND notification_token IS NOT NULL`,
    [lng, lat, radiusKm * 1000]
  );
  return rows;
}

// Find blood donors by blood type within radius
async function getDonorsInRadius(lat, lng, radiusKm, bloodType) {
  let query = `
    SELECT bd.*, u.name, u.phone, u.email,
      ST_Distance(bd.location::geography,
        ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) / 1000 AS distance_km
    FROM blood_donors bd
    JOIN users u ON bd.user_id = u.id
    WHERE bd.is_available = true
    AND ST_DWithin(bd.location::geography,
      ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)
  `;
  const params = [lng, lat, radiusKm * 1000];
  if (bloodType) {
    query += ` AND bd.blood_type = $4`;
    params.push(bloodType);
  }
  query += ` ORDER BY distance_km ASC LIMIT 20`;
  const { rows } = await db.query(query, params);
  return rows;
}

// Get nearby incidents
async function getNearbyIncidents(lat, lng, radiusKm, filters = {}) {
  let query = `
    SELECT i.*,
      u.name AS reporter_name, u.role AS reporter_role,
      ST_Distance(i.location::geography,
        ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) / 1000 AS distance_km,
      ST_Y(i.location::geometry) AS lat,
      ST_X(i.location::geometry) AS lng
    FROM incidents i
    LEFT JOIN users u ON i.reported_by = u.id
    WHERE ST_DWithin(i.location::geography,
      ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)
    AND i.status != 'resolved'
  `;
  const params = [lng, lat, radiusKm * 1000];

  if (filters.type) {
    query += ` AND i.type = $${params.length + 1}`;
    params.push(filters.type);
  }
  if (filters.severity) {
    query += ` AND i.severity = $${params.length + 1}`;
    params.push(filters.severity);
  }
  query += ` ORDER BY distance_km ASC, i.created_at DESC`;
  const { rows } = await db.query(query, params);
  return rows;
}

module.exports = { getUsersInRadius, getDonorsInRadius, getNearbyIncidents };