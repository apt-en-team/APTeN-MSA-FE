// 공통 axios 인스턴스를 생성합니다.
import axios from 'axios'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || ''

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

// 요청 interceptor에서 accessToken을 Authorization 헤더에 추가합니다.
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken')

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

    if (status === 401 && originalRequest && !originalRequest._retry) {
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
