// 입주민 주차 현황 SSE 클라이언트 모듈이다.
// @microsoft/fetch-event-source 기반으로 spot-changed, zone-counter-changed 이벤트를 구독한다.
// 인증 헤더 주입과 재연결 제어를 한곳에서 캡슐화한다.
import { fetchEventSource } from '@microsoft/fetch-event-source'

const SSE_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000'
const SSE_PATH = '/api/parking/spots/sse'

// 재연결을 막아야 하는 치명적 에러 표시용 클래스
class FatalSseError extends Error {}

// 인증 헤더 묶음 생성
function buildAuthHeaders() {
  const accessToken = localStorage.getItem('accessToken')
  let role = null
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    role = userInfo?.role || null
  } catch (e) {
    role = null
  }

  const headers = {}
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (role) headers['X-User-Role'] = String(role)
  return headers
}

// 입주민 주차 SSE 연결
// handlers.onSpotChanged(payload)로 spot-changed 이벤트 전달
// handlers.onZoneCounterChanged(payload)로 zone-counter-changed 이벤트 전달
// handlers.onError(err)로 치명적 연결 실패 알림
// 반환값은 연결 종료 함수
export function connectParkingSse(handlers = {}) {
  const controller = new AbortController()
  const onSpotChanged =
    typeof handlers.onSpotChanged === 'function' ? handlers.onSpotChanged : null
  const onZoneCounterChanged =
    typeof handlers.onZoneCounterChanged === 'function' ? handlers.onZoneCounterChanged : null
  const onError =
    typeof handlers.onError === 'function' ? handlers.onError : null

  fetchEventSource(`${SSE_BASE_URL}${SSE_PATH}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
    signal: controller.signal,
    openWhenHidden: false,

    // 연결 오픈 시 status 검증
    async onopen(response) {
      if (response.ok && response.status === 200) {
        return
      }
      throw new FatalSseError(`SSE 연결 실패: status=${response.status}`)
    },

    // 이벤트 수신 처리, event name 기준 분기
    onmessage(event) {
      if (!event.data) return
      try {
        const payload = JSON.parse(event.data)
        if (event.event === 'spot-changed') {
          if (onSpotChanged) onSpotChanged(payload)
        } else if (event.event === 'zone-counter-changed') {
          if (onZoneCounterChanged) onZoneCounterChanged(payload)
        }
      } catch (e) {
        console.error('[parkingSse] payload 파싱 실패', e)
      }
    },

    // 에러 처리: 치명적이면 중단, 일시적이면 자동 재연결
    onerror(err) {
      if (err instanceof FatalSseError) {
        throw err
      }
      console.warn('[parkingSse] 일시 에러, 자동 재연결 시도', err)
    },
  }).catch((err) => {
    console.error('[parkingSse] 연결 중단', err)
    if (onError) onError(err)
  })

  // 연결 종료 처리
  return function closeParkingSse() {
    controller.abort()
  }
}

export default { connectParkingSse }
