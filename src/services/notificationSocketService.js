// 브라우저 기본 WebSocket을 사용하는 알림 실시간 수신 서비스
// Authorization 헤더는 WebSocket에서 지원하지 않으므로 token을 URL query param으로 전달한다.

import { useNotificationStore } from '@/stores/useNotificationStore'

// 재연결 설정
const RECONNECT_DELAY_MS = 4000
const MAX_RECONNECT_COUNT = 5

let socket = null
let reconnectTimer = null
let reconnectCount = 0
let manualClose = false // 의도적 종료 여부

// http/https를 ws/wss로 변환하고 /api 접미사를 제거해 WS 기본 URL을 만든다.
function buildWsBaseUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000'
  return apiBaseUrl
    .replace(/\/api\/?$/, '')        // 끝의 /api 제거
    .replace(/^http:\/\//, 'ws://')  // http → ws
    .replace(/^https:\/\//, 'wss://') // https → wss
}

// accessToken은 기존 apiClient와 동일하게 localStorage에서 읽는다.
function getAccessToken() {
  return localStorage.getItem('accessToken') || ''
}

function connect() {
  const token = getAccessToken()

  // 토큰이 없으면 연결하지 않음
  if (!token) {
    console.warn('[NotificationSocket] accessToken 없음 — 연결 생략')
    return
  }

  // 이미 연결 중이면 중복 연결하지 않음
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    return
  }

  const wsUrl = `${buildWsBaseUrl()}/ws/notifications?token=${encodeURIComponent(token)}`
  manualClose = false

  try {
    socket = new WebSocket(wsUrl)
  } catch (e) {
    console.error('[NotificationSocket] 연결 생성 실패', e)
    scheduleReconnect()
    return
  }

  socket.onopen = () => {
    console.info('[NotificationSocket] 연결됨')
    reconnectCount = 0

    // store에 연결 상태 반영
    const store = useNotificationStore()
    store.setSocketConnected(true)

    // 연결 직후 미읽음 수를 API로 동기화
    store.fetchUnreadCount()
  }

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data)
      const store = useNotificationStore()
      // 신규 알림 이벤트를 store로 전달
      store.handleIncomingNotification(payload)
    } catch (e) {
      console.warn('[NotificationSocket] 메시지 파싱 실패', e)
    }
  }

  socket.onclose = (event) => {
    console.info('[NotificationSocket] 연결 종료', event.code)

    const store = useNotificationStore()
    store.setSocketConnected(false)

    // 의도적 종료가 아니면 재연결 시도
    if (!manualClose) {
      scheduleReconnect()
    }
  }

  socket.onerror = (error) => {
    console.error('[NotificationSocket] 오류', error)
    // onclose가 이어서 호출되므로 재연결은 onclose에서 처리
  }
}

// 재연결 스케줄링 — 최대 MAX_RECONNECT_COUNT회까지만 시도
function scheduleReconnect() {
  if (reconnectCount >= MAX_RECONNECT_COUNT) {
    console.warn('[NotificationSocket] 재연결 한도 초과 — 중단')
    return
  }

  clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(() => {
    reconnectCount += 1
    console.info(`[NotificationSocket] 재연결 시도 ${reconnectCount}/${MAX_RECONNECT_COUNT}`)
    connect()
  }, RECONNECT_DELAY_MS)
}

// 의도적 연결 해제 (로그아웃/레이아웃 unmount 시 호출)
function disconnect() {
  manualClose = true
  clearTimeout(reconnectTimer)
  reconnectCount = 0

  if (socket) {
    socket.close()
    socket = null
  }
}

export default { connect, disconnect }
