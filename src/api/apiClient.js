// 공통 axios 인스턴스를 관리합니다.
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
})

// 요청 인터셉터에서 공통 헤더를 정리합니다.
apiClient.interceptors.request.use(
  (config) => {
    // TODO: accessToken 저장 위치를 확정한 뒤 여기에서 토큰을 조회합니다.
    // TODO: Pinia store 또는 storage에서 accessToken을 읽어 Authorization 헤더에 주입합니다.
    // const accessToken = ''
    // if (accessToken) {
    //   config.headers.Authorization = `Bearer ${accessToken}`
    // }

    return config
  },
  (error) => Promise.reject(error),
)

// 응답 인터셉터에서 공통 에러 흐름을 정리합니다.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: 401 응답 시 refresh token 재발급 흐름을 연결합니다.
    // TODO: 재발급 성공 후 실패했던 요청을 재시도하는 구조를 추가합니다.
    // TODO: 403 또는 권한 오류에 대한 공통 분기 처리를 추가합니다.
    // TODO: 공통 에러 메시지 포맷을 정리하고 UI 알림 시스템과 연결합니다.
    return Promise.reject(error)
  },
)

export default apiClient
