/* eslint-disable no-undef */
// Service Worker para notificaciones push en segundo plano (Web / Móvil)
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

// Configuración básica para el Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyAaz1Cs5IT4B-Zd_FqVM1T6RJdML_oUGJQ",
  authDomain: "sanambrosiodb.firebaseapp.com",
  projectId: "sanambrosiodb",
  storageBucket: "sanambrosiodb.firebasestorage.app",
  messagingSenderId: "1042850158595",
  appId: "1:1042850158595:web:e707b40583006747a35636"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Notificación push recibida en segundo plano: ", payload);
  
  const notificationTitle = payload.notification?.title || "San Ambrosio de Milán";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes una nueva notificación en el portal escolar.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
