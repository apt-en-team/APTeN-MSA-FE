// 공통 axios 인스턴스를 관리합니다.
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''
let isRefreshing = false

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
})

function getStoredAuth() {
  return {
    accessToken: localStorage.getItem('accessToken') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    role: localStorage.getItem('role') || 'GUEST',
    status: localStorage.getItem('status') || '',
  }
}

async function syncAuthStore(payload = {}) {
  const { useAuthStore } = await import('@/stores/useAuthStore')
  const authStore = useAuthStore()
  authStore.setAuth(payload)
}

async function clearAuthAndRedirect() {
  try {
    const { useAuthStore } = await import('@/stores/useAuthStore')
    const authStore = useAuthStore()
    authStore.clearAuth()
  } finally {
    window.location.href = '/login'
  }
}

// 요청 interceptor에서 accessToken을 Authorization 헤더에 넣습니다.
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = getStoredAuth()

    if (accessToken) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${accessToken}`
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

    if (status === 401 && !originalRequest?._retry && !isRefreshing) {
      const { refreshToken, role, status: userStatus } = getStoredAuth()

      if (!refreshToken) {
        await clearAuthAndRedirect()
        return Promise.reject(error)
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(`${baseURL}/api/auth/token/refresh`, {
          refreshToken,
        })

        const nextAccessToken = response.data?.accessToken || ''
        const nextRefreshToken = response.data?.refreshToken || refreshToken

        localStorage.setItem('accessToken', nextAccessToken)
        localStorage.setItem('refreshToken', nextRefreshToken)
        localStorage.setItem('role', role)
        localStorage.setItem('status', userStatus)

        await syncAuthStore({
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
          role,
          status: userStatus,
        })

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`

        return apiClient(originalRequest)
      } catch (refreshError) {
        await clearAuthAndRedirect()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (status === 403) {
      window.location.href = '/forbidden'
    }

    return Promise.reject(error)
  },
)

export default apiClient
