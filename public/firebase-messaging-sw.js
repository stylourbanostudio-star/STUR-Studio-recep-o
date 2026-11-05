importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCrPh1ZgPJgC234C_OLTu4oG1IIEJBAxSU",
  authDomain: "gen-lang-client-0080589661.firebaseapp.com",
  projectId: "gen-lang-client-0080589661",
  storageBucket: "gen-lang-client-0080589661.firebasestorage.app",
  messagingSenderId: "62232973716",
  appId: "1:62232973716:web:b058cc272bbe19d0a5ff81"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Add fetch handler for PWA installability
self.addEventListener('fetch', (event) => {
  // Can be empty, but must exist
});
