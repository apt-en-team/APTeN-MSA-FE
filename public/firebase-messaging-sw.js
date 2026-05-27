/* global firebase */

// 새 버전의 SW가 installing되면 기존 waiting 없이 바로 activate한다.
// 이 설정이 없으면 이전 SW가 계속 active로 남아 있어 push가 구버전 SW에 전달된다.
self.addEventListener('install', () => {
  console.log('[FCM SW] install — skipWaiting 실행')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[FCM SW] activate — clients.claim 실행')
  event.waitUntil(clients.claim())
})

// [진단] SW 스크립트 자체가 로드되는지 확인
console.log('[FCM SW] 스크립트 로드됨. scope=', self.registration?.scope, 'location=', self.location.href.substring(0, 100))

importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js')

// [진단] Firebase SDK가 importScripts 이후 정상 로드됐는지 확인
console.log('[FCM SW] Firebase SDK 로드됨. firebase=', typeof firebase !== 'undefined' ? 'O' : 'X')

// [진단] raw push event — Firebase 초기화 여부와 무관하게 push가 SW에 도달하는지 확인
// Firebase compat SDK가 push 이벤트를 가로채더라도 이 리스너도 함께 실행된다
self.addEventListener('push', (event) => {
  const hasData = event.data != null
  console.log('[FCM SW] *** raw push event 수신 ***. hasData=', hasData)
  if (hasData) {
    try {
      console.log('[FCM SW] raw push data (text)=', event.data.text().substring(0, 200))
    } catch (_) {}
  }
})

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

// [진단] config 키 존재 여부 요약 — 값이 비어있으면 Firebase init이 안 됨
const configSummary = Object.entries(firebaseConfig)
  .map(([k, v]) => `${k}=${v ? 'O' : 'X'}`)
  .join(', ')
console.log('[FCM SW] firebaseConfig 키 존재 여부:', configSummary)
if (firebaseConfig.projectId) {
  console.log('[FCM SW] projectId=', firebaseConfig.projectId, 'messagingSenderId=', firebaseConfig.messagingSenderId)
}

if (firebaseConfig.apiKey && firebaseConfig.messagingSenderId && firebaseConfig.appId) {
  try {
    // public 파일은 Vite env 치환이 안 되므로 등록 URL query로 전달된 공개 Firebase 설정을 사용한다
    firebase.initializeApp(firebaseConfig)
    console.log('[FCM SW] Firebase 앱 초기화 완료. projectId=', firebaseConfig.projectId)

    const messaging = firebase.messaging()
    console.log('[FCM SW] messaging 인스턴스 생성 완료')

    messaging.onBackgroundMessage((payload) => {
      console.log('[FCM SW] background message received', payload)

      const data = payload.data || {}
      // BE는 data payload에 실제 값을 담아 보내므로 data를 우선하고 notification을 후순위로 둔다
      const title = data.title || payload.notification?.title || 'APTeN 알림'
      const options = {
        body: data.content || data.body || payload.notification?.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: {
          linkPath: data.linkPath || '/',
          notificationId: data.notificationId || '',
        },
      }

      console.log('[FCM SW] showNotification', title, options)
      self.registration.showNotification(title, options)
    })
    console.log('[FCM SW] onBackgroundMessage 등록 완료')
  } catch (e) {
    console.error('[FCM SW] Firebase 초기화/messaging 오류', e)
  }
} else {
  console.warn('[FCM SW] Firebase config 누락 — onBackgroundMessage 미등록. configSummary=', configSummary)
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
