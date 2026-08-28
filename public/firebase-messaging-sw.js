/* eslint-disable no-undef */
// Service Worker para notificaciones push en segundo plano (Web / Móvil)
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

// Extraer configuración desde query params para no exponer credenciales fijas en el código
const urlParams = new URLSearchParams(location.search);
const apiKey = urlParams.get("apiKey");
const authDomain = urlParams.get("authDomain");
const projectId = urlParams.get("projectId");
const storageBucket = urlParams.get("storageBucket");
const messagingSenderId = urlParams.get("messagingSenderId");
const appId = urlParams.get("appId");

if (apiKey && projectId) {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Notificación push recibida en segundo plano: ", payload);
    
    const notificationTitle = payload.notification?.title || "San Ambrosio de Milán";
    const notificationOptions = {
      body: payload.notification?.body || "Tienes una nueva notificación en el portal escolar.",
      icon: "/SAM.svg",
      badge: "/SAM.svg",
      data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}
