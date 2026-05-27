// FCM 푸시 알림 서비스 (1차 준비 구현)
// VITE_FCM_ENABLED=true 환경(HTTPS)에서만 실제 동작한다.
// 현재 HTTP 환경에서는 권한 요청/토큰 발급을 시도하지 않는다.

import notificationApi from '@/api/notificationApi'

// FCM 사용 가능 여부 — env 값과 브라우저 지원 여부를 함께 확인
export function isFcmEnabled() {
  const envEnabled = import.meta.env.VITE_FCM_ENABLED === 'true'
  const browserSupported = 'Notification' in window && 'serviceWorker' in navigator
  return envEnabled && browserSupported
}

// Firebase 앱 초기화 (HTTPS 활성화 후 사용)
let firebaseApp = null
let messaging = null

async function initFirebase() {
  if (!isFcmEnabled()) return null
  if (messaging) return messaging

  // Firebase env 값이 없으면 초기화 생략
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  if (!apiKey) {
    console.warn('[FCM] Firebase 환경값 없음 — 초기화 생략')
    return null
  }

  try {
    const { initializeApp } = await import('firebase/app')
    const { getMessaging } = await import('firebase/messaging')

    firebaseApp = initializeApp({
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    })

    messaging = getMessaging(firebaseApp)
    return messaging
  } catch (e) {
    console.error('[FCM] Firebase 초기화 실패', e)
    return null
  }
}

// 브라우저 알림 권한 요청 (HTTPS 환경에서만 동작)
export async function requestPermission() {
  if (!isFcmEnabled()) {
    return { granted: false, reason: 'disabled' }
  }

  try {
    const permission = await Notification.requestPermission()
    return { granted: permission === 'granted', reason: permission }
  } catch (e) {
    console.error('[FCM] 권한 요청 실패', e)
    return { granted: false, reason: 'error' }
  }
}

// FCM 토큰 발급 후 서버에 등록 (HTTPS 환경에서만 동작)
export async function registerToken() {
  if (!isFcmEnabled()) {
    throw new Error('FCM 비활성 환경')
  }

  const msg = await initFirebase()
  if (!msg) throw new Error('Firebase 초기화 실패')

  const { getToken } = await import('firebase/messaging')
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

  const token = await getToken(msg, { vapidKey })
  if (!token) throw new Error('FCM 토큰 발급 실패')

  // 서버에 토큰 등록
  await notificationApi.registerFcmToken({ token })
  return token
}

// FCM 토큰 해제
export async function deregisterToken(token) {
  if (!token) return
  await notificationApi.deleteFcmToken({ token })
}

// FCM 토큰 갱신
export async function refreshToken(oldToken, newToken) {
  await notificationApi.updateFcmToken({ oldToken, newToken })
}

export default {
  isFcmEnabled,
  requestPermission,
  registerToken,
  deregisterToken,
  refreshToken,
}
