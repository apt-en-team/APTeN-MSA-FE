// 공통 axios 인스턴스. 모든 API 요청은 이 인스턴스만 사용한다.
import axios from 'axios'

const apiBaseURL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000/api').replace(/\/$/, '')

const SELECTED_COMPLEX_STORAGE_KEY = 'apt_selected_complex'
const LEGACY_SELECTED_COMPLEX_STORAGE_KEY = 'selectedComplex'

const apiClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
})

function clearStoredAuth() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('role')
  localStorage.removeItem('status')
}

function getStoredUserInfo() {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || '{}')
  } catch (error) {
    console.error(error)
    return {}
  }
}

function getStoredSelectedComplex() {
  try {
    const raw =
      sessionStorage.getItem(SELECTED_COMPLEX_STORAGE_KEY) ||
      sessionStorage.getItem(LEGACY_SELECTED_COMPLEX_STORAGE_KEY) ||
      localStorage.getItem(SELECTED_COMPLEX_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_SELECTED_COMPLEX_STORAGE_KEY)

    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error(error)
    return null
  }
}

// 요청 인터셉터: accessToken을 Authorization 헤더에 자동 첨부
function ensureHeaders(config) {
  config.headers = config.headers || {}
  return config.headers
}

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken')
    const userInfo = getStoredUserInfo()
    const selectedComplex = getStoredSelectedComplex()
    const requestUrl = String(config.url || '')

    if (accessToken) {
      ensureHeaders(config).Authorization = `Bearer ${accessToken}`
    }

    // 로그인 사용자 권한 헤더 주입
    const userUid = userInfo?.userUid || userInfo?.userId
    if (userUid) {
      const headers = ensureHeaders(config)
      headers['X-User-Uid'] = String(userUid)
      headers['X-User-Id'] = String(userUid)
    }

    if (userInfo?.role) {
      ensureHeaders(config)['X-User-Role'] = String(userInfo.role)
    }

    if (userInfo?.complexId) {
      ensureHeaders(config)['X-Complex-Id'] = String(userInfo.complexId)
    }

    // MASTER가 공통 관리자 API를 호출할 때만 선택 단지 ID 헤더 추가.
    // master 전용 API(/api/admin/master/*)는 단지 무관하므로 제외.
    // develop과 household 브랜치의 URL 형태를 모두 허용한다.
    const isCommonAdminApi =
      (requestUrl.startsWith('/api/admin/') && !requestUrl.startsWith('/api/admin/master/')) ||
      (requestUrl.startsWith('/admin/') && !requestUrl.startsWith('/admin/master/'))
    const isBoardPath =
      requestUrl.startsWith('/boards/') ||
      requestUrl.startsWith('/notices/') ||
      requestUrl.startsWith('/admin/boards/') ||
      requestUrl.startsWith('/admin/notices/') ||
      requestUrl.startsWith('/api/admin/boards/') ||
      requestUrl.startsWith('/api/admin/notices/')

    if (userInfo?.role === 'MASTER' && selectedComplex?.complexId && (isCommonAdminApi || isBoardPath)) {
      ensureHeaders(config)['X-Selected-Complex-Id'] = String(selectedComplex.complexId)
    }

    return config

  },
  (error) => Promise.reject(error),
)

// 응답 인터셉터: 401이면 refresh, 403이면 forbidden 페이지로
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && originalRequest && !originalRequest._retry) {
      // 로그인 API의 401은 비밀번호 오류이므로 인터셉터에서 처리하지 않는다.
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error)
      }

      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        clearStoredAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        // refresh는 apiClient 대신 raw axios로 호출.
        // apiClient를 쓰면 이 응답 인터셉터에 재진입해 무한루프가 날 수 있다.
        const refreshResponse = await axios.post(
          `${apiBaseURL}/auth/token/refresh`,
          { refreshToken },
        )

        // 백엔드 ResultResponse 래퍼 구조 대응.
        // 응답 형태: { success, code, message, data: { accessToken, refreshToken } }
        const tokenData = refreshResponse.data?.data
        const nextAccessToken = tokenData?.accessToken
        const nextRefreshToken = tokenData?.refreshToken

        if (nextAccessToken) localStorage.setItem('accessToken', nextAccessToken)
        if (nextRefreshToken) localStorage.setItem('refreshToken', nextRefreshToken)

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`

        return apiClient(originalRequest)
      } catch (refreshError) {
        clearStoredAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }


    const resultCode = error.response?.data?.code ?? ''

    if (status === 403) {
  const isBusinessError = resultCode && /^[A-Z]+_\d+_\d+$/.test(resultCode)
  if (!isBusinessError) {
    window.location.href = '/forbidden'
  } else if (resultCode === 'BRD_403_05') {
    // 승인 대기 알림은 각 컴포넌트에서 처리하도록 그냥 reject
  }
}

    return Promise.reject(error)
  },
)

export default apiClient
