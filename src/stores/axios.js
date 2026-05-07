import axios from 'axios'

// Axios 기본 설정
// withCredentials: true → 쿠키(AT/RT)를 자동으로 포함해서 요청
const api = axios.create({
    baseURL: '/api',
    withCredentials: true
})

// 401 에러(AT 만료) 시 자동으로 RT로 재발급 시도
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // AT 만료(401) + 아직 재시도 안 했으면 + 로그인 요청이 아닐 때만
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
            originalRequest._retry = true

            try {
                // RT로 AT 재발급 요청
                await axios.post('/api/auth/refresh', null, { withCredentials: true })
                // 재발급 성공 → 원래 요청 다시 실행
                return api(originalRequest)
            } catch (refreshError) {
                // RT도 만료 → 로그인 페이지로 이동
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api
