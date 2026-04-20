const admin = require("firebase-admin");
const path = require("path");

if (!admin.apps.length) {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env var:", e);
      // Fallback or crash
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
