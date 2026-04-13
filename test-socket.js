const { io } = require('./frontend/node_modules/socket.io-client');

const API_BASE = 'http://localhost/api';
const SOCKET_URL = 'http://localhost';

async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Login failed for ${email}: ${response.status}`);
  }
  const data = await response.json();
  return data.accessToken;
}

async function createIncident(token) {
  const payload = {
    title: `Socket test ${Date.now()}`,
    type: 'fire',
    severity: 'high',
    lat: 12.9716,
    lng: 77.5946,
    address: 'MG Road',
    city: 'Bangalore',
  };
  const response = await fetch(`${API_BASE}/incidents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Incident create failed: ${response.status}`);
  }
}

async function run() {
  const civilianToken = await login('civilian@test.com', 'Test@1234');
  const adminToken = await login('admin@test.com', 'Test@1234');

  let received = false;
  const civilianSocket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token: civilianToken },
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 10000);
    civilianSocket.on('connect', () => {
      clearTimeout(timeout);
      console.log('Socket connected as civilian');
      resolve();
    });
    civilianSocket.on('connect_error', reject);
  });

  await new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('new_incident event not received')), 12000);
    civilianSocket.on('new_incident', () => {
      received = true;
      clearTimeout(timeout);
      console.log('new_incident received');
      resolve();
    });

    try {
      await createIncident(adminToken);
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });

  civilianSocket.close();

  if (!received) {
    throw new Error('FAIL');
  }

  console.log('PASS');
}

run().catch((err) => {
  console.error('Socket test failed:', err.message);
  process.exit(1);
});
