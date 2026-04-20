const admin = require("firebase-admin");
const path = require("path");

if (!admin.apps.length) {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      // Handle potential double-stringification or escaped newlines
      serviceAccount = typeof raw === 'string' ? JSON.parse(raw.replace(/\\n/g, '\n')) : raw;
      
      // If after parsing it's still a string, parse it again (Vercel can sometimes double-quote)
      if (typeof serviceAccount === 'string') {
        serviceAccount = JSON.parse(serviceAccount);
      }
    } catch (e) {
      console.error("CRITICAL: Error parsing FIREBASE_SERVICE_ACCOUNT env var:", e.message);
    }
  } else {
    try {
      serviceAccount = require("./serviceAccountKey.json");
    } catch (e) {
      console.error("Firebase Service Account key missing locally and in environment.");
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

module.exports = admin;
