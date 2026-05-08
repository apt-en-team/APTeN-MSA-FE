// 공통 axios 인스턴스를 생성합니다.
import axios from 'axios'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000'
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

// 요청 interceptor에서 accessToken을 Authorization 헤더에 추가합니다.
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken')
    const userInfo = getStoredUserInfo()
    const selectedComplex = getStoredSelectedComplex()
    const requestUrl = String(config.url || '')

    if (accessToken) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    // MASTER가 공통 관리자 API를 호출할 때만 선택 단지 ID header를 추가합니다.
    if (
      userInfo?.role === 'MASTER' &&
      selectedComplex?.complexId &&
      requestUrl.startsWith('/api/admin/') &&
      !requestUrl.startsWith('/api/admin/master/')
    ) {
      config.headers = config.headers || {}
      config.headers['X-Selected-Complex-Id'] = String(selectedComplex.complexId)
    }

    return config
  },
  (error) => Promise.reject(error),
)

// 응답 interceptor에서 refresh와 권한 오류를 공통 처리합니다.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && originalRequest && !originalRequest._retry) {

      // 로그인 API 자체의 401은 인터셉터에서 처리하지 않는다
      if (originalRequest.url?.includes('/api/auth/login')) {
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
        const refreshResponse = await axios.post(`${apiBaseURL}/api/auth/token/refresh`, {
          refreshToken,
        })

        const nextAccessToken = refreshResponse.data?.accessToken
        const nextRefreshToken = refreshResponse.data?.refreshToken

        if (nextAccessToken) {
          localStorage.setItem('accessToken', nextAccessToken)
        }

        if (nextRefreshToken) {
          localStorage.setItem('refreshToken', nextRefreshToken)
        }

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`

        return apiClient(originalRequest)
      } catch (refreshError) {
        clearStoredAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    if (status === 403) {
      window.location.href = '/forbidden'
    }

    return Promise.reject(error)
  },
)

export default apiClient
