// TODO: 공통 axios 인스턴스 구조를 정의합니다.
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
})

// TODO: 요청 인터셉터를 추가합니다.
// TODO: 응답 인터셉터를 추가합니다.

export default apiClient
