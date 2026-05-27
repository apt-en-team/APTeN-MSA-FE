// FCM 푸시 알림 서비스 (1차 준비 구현)
// VITE_FCM_ENABLED=true 환경(HTTPS)에서만 실제 동작한다.
// 현재 HTTP 환경에서는 권한 요청/토큰 발급을 시도하지 않는다.

import notificationApi from '@/api/notificationApi'
import { useNotificationStore } from '@/stores/useNotificationStore'

const FCM_TOKEN_STORAGE_KEY = 'apten_fcm_token'
const FCM_SW_PATH = '/firebase-messaging-sw.js'
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope'

function tokenPrefix(token) {
  if (!token) return '(없음)'
  return token.substring(0, 25) + '...'
}

// FCM 사용 가능 여부 — env 값과 브라우저 지원 여부를 함께 확인
export function isFcmEnabled() {
  const envEnabled = import.meta.env.VITE_FCM_ENABLED === 'true'
  const browserSupported = 'Notification' in window && 'serviceWorker' in navigator
  return envEnabled && browserSupported
}

// Firebase 앱 초기화 (HTTPS 활성화 후 사용)
let firebaseApp = null
let messaging = null
let serviceWorkerRegistration = null
let foregroundListenerStarted = false

function isSecureRuntime() {
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

function buildFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}

function hasFirebaseConfig(config) {
  return Boolean(config.apiKey && config.messagingSenderId && config.appId)
}

function buildServiceWorkerUrl(config) {
  const params = new URLSearchParams()
  Object.entries(config).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  return `${FCM_SW_PATH}?${params.toString()}`
}

async function initFirebase() {
  if (!isFcmEnabled() || !isSecureRuntime()) return null
  if (messaging) return messaging

  const config = buildFirebaseConfig()
  if (!hasFirebaseConfig(config)) {
    console.warn('[FCM] Firebase 환경값 없음 — 초기화 생략')
    return null
  }

  try {
    const { initializeApp } = await import('firebase/app')
    const { getMessaging } = await import('firebase/messaging')

    firebaseApp = initializeApp(config)

    messaging = getMessaging(firebaseApp)
    return messaging
  } catch (e) {
    console.error('[FCM] Firebase 초기화 실패', e)
    return null
  }
}

async function registerServiceWorker() {
  if (!isFcmEnabled() || !isSecureRuntime()) return null
  if (serviceWorkerRegistration) return serviceWorkerRegistration

  const config = buildFirebaseConfig()
  if (!hasFirebaseConfig(config)) return null

  try {
    // public service worker는 env를 직접 못 읽으므로 공개 Firebase 설정을 query로 넘긴다
    serviceWorkerRegistration = await navigator.serviceWorker.register(buildServiceWorkerUrl(config), {
      // VitePWA의 루트 service worker와 scope가 겹치지 않게 FCM 전용 scope를 사용한다
      scope: FCM_SW_SCOPE,
    })
    // 기존 등록이 남아 있을 수 있어 최신 firebase-messaging-sw.js를 한번 더 확인한다
    await serviceWorkerRegistration.update()
    console.log('[FCM] service worker registered', {
      scope: serviceWorkerRegistration.scope,
      scriptURL: serviceWorkerRegistration.active?.scriptURL || serviceWorkerRegistration.installing?.scriptURL,
      state: serviceWorkerRegistration.active?.state,
    })
    return serviceWorkerRegistration
  } catch (e) {
    console.error('[FCM] service worker 등록 실패', e)
    return null
  }
}

function getBrowserType() {
  const ua = navigator.userAgent || ''
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari'
  if (ua.includes('Firefox/')) return 'Firefox'
  return 'Unknown'
}

function buildTokenPayload(token) {
  return {
    token,
    deviceType: 'WEB',
    browserType: getBrowserType(),
    appVersion: import.meta.env.VITE_APP_VERSION || import.meta.env.VITE_APP_BUILD_VERSION || 'web',
  }
}

function isFcmTokenNotFoundError(error) {
  const status = error?.response?.status
  const code = error?.response?.data?.code || error?.response?.data?.errorCode
  return status === 404 || code === 'FCM_TOKEN_NOT_FOUND'
}

function toNotificationPayload(payload) {
  return {
    notificationId: Number(payload.data?.notificationId) || undefined,
    title: payload.notification?.title || payload.data?.title || '',
    content: payload.notification?.body || payload.data?.content || '',
    linkPath: payload.data?.linkPath || null,
    type: payload.data?.type || null,
    createdAt: payload.data?.createdAt || new Date().toISOString(),
  }
}

async function startForegroundListener(msg) {
  if (foregroundListenerStarted) return

  const { onMessage } = await import('firebase/messaging')
  onMessage(msg, (payload) => {
    console.log('[FCM] foreground message received', payload)

    const store = useNotificationStore()
    // 앱이 켜져 있을 때는 native 알림보다 기존 배지/드롭다운 상태를 먼저 동기화한다
    store.handleIncomingNotification(toNotificationPayload(payload))
    store.fetchUnreadCount()
  })

  foregroundListenerStarted = true
  console.log('[FCM] foreground listener registered')
}

export async function startForegroundMessageListener() {
  if (!isFcmEnabled() || !isSecureRuntime()) {
    console.debug('[FCM] foreground listener 생략 — FCM 비활성 또는 비보안 환경')
    return false
  }
  if (foregroundListenerStarted) return true

  const localToken = getRegisteredToken()
  if (!localToken) return false
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false

  console.log('[FCM] foreground listener 시작 - 로컬 토큰 prefix=', tokenPrefix(localToken))

  const msg = await initFirebase()
  if (!msg) return false

  await startForegroundListener(msg)
  return true
}

// 브라우저 알림 권한 요청 (HTTPS 환경에서만 동작)
export async function requestPermission() {
  if (!isFcmEnabled() || !isSecureRuntime()) {
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
  if (!isFcmEnabled() || !isSecureRuntime()) {
    throw new Error('FCM 비활성 환경')
  }

  localStorage.removeItem(FCM_TOKEN_STORAGE_KEY)

  const msg = await initFirebase()
  if (!msg) throw new Error('Firebase 초기화 실패')

  const swRegistration = await registerServiceWorker()
  if (!swRegistration) throw new Error('FCM service worker 등록 실패')

  const { getToken } = await import('firebase/messaging')
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

  // [진단] getToken 직전 — Firebase config와 SW 상태 확인
  const diagConfig = buildFirebaseConfig()
  console.log('[FCM] getToken 직전 config. projectId=', diagConfig.projectId,
    'messagingSenderId=', diagConfig.messagingSenderId,
    'appId prefix=', diagConfig.appId ? diagConfig.appId.substring(0, 20) + '...' : '(없음)')
  console.log('[FCM] vapidKey prefix=', vapidKey ? vapidKey.substring(0, 15) + '...' : '(없음)')
  console.log('[FCM] SW scope=', swRegistration.scope)
  console.log('[FCM] SW scriptURL=', swRegistration.active?.scriptURL?.substring(0, 80) || swRegistration.installing?.scriptURL?.substring(0, 80) || '(없음)')
  console.log('[FCM] SW state=', swRegistration.active?.state || 'no active worker')

  const token = await getToken(msg, { vapidKey, serviceWorkerRegistration: swRegistration })
  if (!token) throw new Error('FCM 토큰 발급 실패')
  console.log('[FCM] 토큰 발급 완료 prefix=', tokenPrefix(token))

  try {
    // 서버 등록까지 성공해야 푸시 토글을 ON으로 볼 수 있으므로 저장은 가장 마지막에 한다
    console.log('[FCM] 서버 등록 요청 prefix=', tokenPrefix(token))
    await notificationApi.registerFcmToken(buildTokenPayload(token))
    localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
    console.log('[FCM] localStorage 저장 완료 prefix=', tokenPrefix(token))
    await startForegroundMessageListener()
    return token
  } catch (e) {
    // 서버 등록 실패 시 권한이 granted여도 실제 수신 준비가 끝난 상태가 아니므로 OFF로 되돌린다
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY)
    throw e
  }
}

// FCM 토큰 해제
export async function deregisterToken(token) {
  const targetToken = token || localStorage.getItem(FCM_TOKEN_STORAGE_KEY)
  if (!targetToken) {
    // 저장된 토큰이 없으면 서버에서 비활성화할 대상도 없으므로 로컬 상태만 OFF로 정리한다
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY)
    return
  }

  try {
    const msg = await initFirebase()
    if (msg) {
      const { deleteToken } = await import('firebase/messaging')
      await deleteToken(msg)
    }
  } catch (e) {
    console.warn('[FCM] 브라우저 토큰 삭제 실패 — 서버 토큰 해제는 계속 진행', e)
  }

  try {
    await notificationApi.deleteFcmToken({ token: targetToken })
  } catch (e) {
    if (!isFcmTokenNotFoundError(e)) throw e
    // 서버에 토큰 row가 없으면 로컬 토큰이 오래된 상태이므로 삭제 성공처럼 정리한다
    console.warn('[FCM] 서버에 등록된 토큰 없음 — 로컬 토큰만 정리', e)
  } finally {
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY)
  }
}

// FCM 토큰 갱신
export async function refreshToken(oldToken, newToken) {
  await notificationApi.updateFcmToken({
    oldToken,
    newToken,
    deviceType: 'WEB',
    browserType: getBrowserType(),
    appVersion: import.meta.env.VITE_APP_VERSION || import.meta.env.VITE_APP_BUILD_VERSION || 'web',
  })
  localStorage.setItem(FCM_TOKEN_STORAGE_KEY, newToken)
}

export function getRegisteredToken() {
  return localStorage.getItem(FCM_TOKEN_STORAGE_KEY)
}

export function hasRegisteredToken() {
  return Boolean(localStorage.getItem(FCM_TOKEN_STORAGE_KEY))
}

export default {
  isFcmEnabled,
  requestPermission,
  registerToken,
  deregisterToken,
  refreshToken,
  getRegisteredToken,
  hasRegisteredToken,
  startForegroundMessageListener,
}

