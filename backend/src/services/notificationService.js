const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const db = require('../config/db');

let firebaseEnabled = false;
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      firebaseEnabled = true;
    } else {
      console.warn('Firebase credentials missing; push notifications disabled.');
    }
  } catch (err) {
    console.warn(`Firebase disabled due to invalid credentials: ${err.message}`);
  }
} else {
  firebaseEnabled = true;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (err) {
    console.warn(`Twilio disabled due to invalid credentials: ${err.message}`);
  }
} else {
  console.warn('Twilio credentials missing/placeholder; SMS notifications disabled.');
}

async function sendPushNotification(tokens, payload) {
  if (!tokens.length || !firebaseEnabled) return;
  try {
    const message = {
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: { incidentId: payload.incidentId || '', type: payload.type || 'alert' },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Push sent: ${response.successCount} success, ${response.failureCount} failed`);
  } catch (err) {
    console.error('Push notification error:', err.message);
  }
}

async function sendSMS(phone, message) {
  if (!twilioClient) return;
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (err) {
    console.error('SMS error:', err.message);
  }
}

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Sanjeevani Alert" <${process.env.SMTP_USER}>`,
      to, subject, html,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

async function notifyNearbyUsers(incident, usersInRadius) {
  const tokens = usersInRadius.map((u) => u.notification_token).filter(Boolean);
  const severityEmoji = { low: '🟡', medium: '🟠', high: '🔴', critical: '🚨' };
  const emoji = severityEmoji[incident.severity] || '⚠️';

  const payload = {
    title: `${emoji} ${incident.severity.toUpperCase()} Alert: ${incident.title}`,
    body: `${incident.type.replace('_', ' ')} reported near you. Tap to view details.`,
    incidentId: incident.id,
    type: 'incident_alert',
  };

  await sendPushNotification(tokens, payload);

  // Log notifications to DB
  const values = usersInRadius.map((u) => `('${u.id}','${incident.id}','${payload.title}','${payload.body}','incident_alert')`).join(',');
  if (values) {
    await db.query(
      `INSERT INTO notifications (user_id, incident_id, title, body, type) VALUES ${values}`
    );
  }
}

module.exports = { sendPushNotification, sendSMS, sendEmail, notifyNearbyUsers };