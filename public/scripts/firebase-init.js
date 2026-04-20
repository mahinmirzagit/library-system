// Firebase Web App Configuration
// Uses the Firebase Compat SDK loaded via CDN (firebase-app-compat.js + firebase-auth-compat.js)

const firebaseConfig = {
  apiKey: "AIzaSyDSzwqiDQ6kBPdFcE9ymVcovoW7u-g7eOg",
  authDomain: "librohub-71d0e.firebaseapp.com",
  projectId: "librohub-71d0e",
  storageBucket: "librohub-71d0e.firebasestorage.app",
  messagingSenderId: "885018815034",
  appId: "1:885018815034:web:11a3995dbfa0b1be0b6303",
};

firebase.initializeApp(firebaseConfig);

// Expose auth globally so app.js can use it
window._firebaseAuth = firebase.auth();
