/* global firebase */

importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js')

function readFirebaseConfig() {
  const params = new URL(self.location.href).searchParams
  return {
    apiKey: params.get('apiKey'),
    authDomain: params.get('authDomain'),
    projectId: params.get('projectId'),
    storageBucket: params.get('storageBucket'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
  }
}

const firebaseConfig = readFirebaseConfig()

if (firebaseConfig.apiKey && firebaseConfig.messagingSenderId && firebaseConfig.appId) {
  // public 파일은 Vite env 치환이 안 되므로 등록 URL query로 전달된 공개 Firebase 설정을 사용한다
  firebase.initializeApp(firebaseConfig)

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] background message received', payload)

    const data = payload.data || {}
    const title = payload.notification?.title || data.title || 'APTeN 알림'
    const options = {
      body: payload.notification?.body || data.content || data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: {
        linkPath: data.linkPath || '/',
        notificationId: data.notificationId || '',
      },
    }

    // 앱이 닫혀 있거나 백그라운드일 때 브라우저 알림을 표시한다
    console.log('[FCM SW] showNotification', title, options)
    self.registration.showNotification(title, options)
  })
} else {
  console.warn('[FCM SW] Firebase config missing', firebaseConfig)
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const linkPath = event.notification?.data?.linkPath || '/'
  const targetUrl = new URL(linkPath, self.location.origin).href
  console.log('[FCM SW] notification click', targetUrl)

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const visibleClient = clientList.find((client) => 'focus' in client)
      if (visibleClient) {
        visibleClient.navigate(targetUrl)
        return visibleClient.focus()
      }
      return clients.openWindow(targetUrl)
    })
  )
})
