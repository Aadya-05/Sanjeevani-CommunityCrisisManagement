require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const users = [
  { name: 'Test Civilian', email: 'civilian@test.com', phone: '9999990001', role: 'civilian' },
  { name: 'Test Police', email: 'police@test.com', phone: '9999990002', role: 'police', badge_number: 'KAR001' },
  { name: 'Test Hospital', email: 'hospital@test.com', phone: '9999990003', role: 'hospital', organization: 'City General Hospital' },
  { name: 'Test Donor', email: 'donor@test.com', phone: '9999990004', role: 'blood_donor' },
  { name: 'Test Admin', email: 'admin@test.com', phone: '9999990005', role: 'admin' },
];

const incidentData = [
  { title: 'Apartment Fire', type: 'fire', severity: 'high', lat: 12.9716, lng: 77.5946, city: 'Bangalore' },
  { title: 'Road Accident', type: 'accident', severity: 'medium', lat: 12.9352, lng: 77.6245, city: 'Bangalore' },
  { title: 'Water Crisis Alert', type: 'water_crisis', severity: 'low', lat: 12.9141, lng: 77.6100, city: 'Bangalore' },
  { title: 'Medical Emergency', type: 'medical_emergency', severity: 'critical', lat: 12.9801, lng: 77.6408, city: 'Bangalore' },
  { title: 'Gas Leak Report', type: 'gas_leak', severity: 'high', lat: 13.0213, lng: 77.5964, city: 'Bangalore' },
  { title: 'Local Flooding', type: 'flood', severity: 'medium', lat: 12.8423, lng: 77.5010, city: 'Bangalore' },
  { title: 'Power Outage', type: 'power_outage', severity: 'low', lat: 12.8977, lng: 77.5421, city: 'Bangalore' },
  { title: 'Road Hazard', type: 'road_hazard', severity: 'medium', lat: 12.9604, lng: 77.4708, city: 'Bangalore' },
  { title: 'Building Collapse Risk', type: 'building_collapse', severity: 'high', lat: 13.0578, lng: 77.6724, city: 'Bangalore' },
  { title: 'Crowd Stampede Risk', type: 'stampede', severity: 'critical', lat: 12.8802, lng: 77.6997, city: 'Bangalore' },
];

async function main() {
  const passwordHash = await bcrypt.hash('Test@1234', 12);
  const userIdByEmail = {};

  for (const user of users) {
    const { rows } = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role, organization, badge_number, is_verified, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,true)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role,
         organization = EXCLUDED.organization,
         badge_number = EXCLUDED.badge_number,
         updated_at = NOW()
       RETURNING id, email`,
      [
        user.name,
        user.email,
        user.phone,
        passwordHash,
        user.role,
        user.organization || null,
        user.badge_number || null,
      ]
    );
    userIdByEmail[user.email] = rows[0].id;
  }

  const reporterId = userIdByEmail['admin@test.com'];
  await db.query(`DELETE FROM incidents WHERE title LIKE 'Seed:%'`);

  for (const item of incidentData) {
    await db.query(
      `INSERT INTO incidents (title, description, type, severity, status, location, address, city, reported_by)
       VALUES ($1,$2,$3,$4,'reported',ST_SetSRID(ST_MakePoint($5,$6),4326),$7,$8,$9)`,
      [
        `Seed: ${item.title}`,
        `Auto-seeded incident for ${item.type}`,
        item.type,
        item.severity,
        item.lng,
        item.lat,
        `${item.city} central zone`,
        item.city,
        reporterId,
      ]
    );
  }

  const donorUserId = userIdByEmail['donor@test.com'];
  await db.query(
    `INSERT INTO blood_donors (user_id, blood_type, is_available, city, phone, location)
     VALUES ($1,'O+',true,'Bangalore','9999990004',ST_SetSRID(ST_MakePoint(77.5946,12.9716),4326))
     ON CONFLICT (user_id) DO UPDATE SET
       blood_type = EXCLUDED.blood_type,
       is_available = EXCLUDED.is_available,
       city = EXCLUDED.city,
       phone = EXCLUDED.phone,
       location = EXCLUDED.location,
       updated_at = NOW()`,
    [donorUserId]
  );

  await db.query(
    `INSERT INTO notifications (user_id, title, body, type)
     VALUES
       ($1, 'System Check', 'Platform notifications are active.', 'system'),
       ($1, 'Critical Alert Test', 'This is a seeded critical alert.', 'incident'),
       ($1, 'Donor Network', 'Nearby O+ donor available in Bangalore.', 'donor')`,
    [reporterId]
  );

  console.log('Seed complete: users, incidents, donor, notifications');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const client = await db.getClient();
      client.release();
    } catch (_) {}
    process.exit();
  });
