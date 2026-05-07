import { defineStore } from 'pinia'
import authApi from '@/api/authApi'
import { useComplexStore } from '@/stores/useComplexStore'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    loading: false,
    error: null, // 에러 메시지 문자열 저장
    accessToken: null,
    refreshToken: null,
    userId: null,
    userUid: null,
    name: null,
    role: 'USER',
    status: null,
    building: null, // 입주민 동
    unit: null,     // 입주민 호
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },

  actions: {
    // 로그인
    // 성공 시 역할에 따라 페이지 이동
    async login(body) {
      this.loading = true
      this.error = null
      try {
        const res = await authApi.login(body)
        this.setAuth(res)

        // 로그인 전환 시 이전 단지 컨텍스트가 섞이지 않도록 초기화한다.
        const complexStore = useComplexStore()
        complexStore.clearMyComplex()
        if (this.role !== 'MASTER') {
          complexStore.clearSelectedComplex()
        }

        if (this.role === 'MASTER') {
          window.location.href = '/admin/master'
        } else if (this.role === 'MANAGER' || this.role === 'ADMIN') {
          window.location.href = '/admin/dashboard'
        } else if (this.role === 'USER' && this.status === 'PENDING') {
          window.location.href = '/resident/pending'
        } else if (this.role === 'USER') {
          window.location.href = '/resident/home'
        }
      } catch (e) {
        // 서버 에러 응답에서 메시지 추출
        // 백엔드 ErrorCode 기반 메시지 우선 사용
        const serverMessage = e.response?.data?.resultMessage
        this.error = serverMessage || '로그인 중 오류가 발생했습니다.'
      } finally {
        this.loading = false
      }
    },

    // 로그아웃
    // AT 블랙리스트 등록 후 인증 정보 초기화
    async logout() {
      this.loading = true
      this.error = null
      try {
        await authApi.logout()
        const complexStore = useComplexStore()
        complexStore.clearSelectedComplex()
        complexStore.clearMyComplex()
        this.clearAuth()
      } catch (e) {
        const serverMessage = e.response?.data?.resultMessage
        this.error = serverMessage || '로그아웃 중 오류가 발생했습니다.'
      } finally {
        this.loading = false
      }
    },

    // 인증 정보 저장
    // 로그인/소셜 로그인 성공 시 호출
    // localStorage에도 저장해서 새로고침 시 복원 가능하게 함
    setAuth(data) {
      const userInfo = data?.userInfo || data?.user || data || {}

      this.accessToken  = data?.accessToken  || data?.tokens?.accessToken  || null
      this.refreshToken = data?.refreshToken || data?.tokens?.refreshToken || null
      this.userId   = userInfo?.userId   || data?.userId   || null
      this.userUid  = userInfo?.userUid  || data?.userUid  || null
      this.name     = userInfo?.name     || data?.name     || null
      this.role     = userInfo?.role     || data?.role     || 'USER'
      this.status   = userInfo?.status   || data?.status   || null
      this.building = userInfo?.building || data?.building || null // 입주민 동
      this.unit     = userInfo?.unit     || data?.unit     || null // 입주민 호

      if (this.accessToken) {
        localStorage.setItem('accessToken', this.accessToken)
      }
      if (this.refreshToken) {
        localStorage.setItem('refreshToken', this.refreshToken)
      }

      localStorage.setItem('userInfo', JSON.stringify({
        userId:   this.userId,
        userUid:  this.userUid,
        name:     this.name,
        role:     this.role,
        status:   this.status,
        building: this.building, // 입주민 동
        unit:     this.unit,     // 입주민 호
      }))
    },

    // 인증 정보 초기화
    // 로그아웃 또는 토큰 만료 시 호출
    clearAuth() {
      this.accessToken  = null
      this.refreshToken = null
      this.userId   = null
      this.userUid  = null
      this.name     = null
      this.role     = 'USER'
      this.status   = null
      this.building = null // 입주민 동
      this.unit     = null // 입주민 호
      this.error    = null

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('role')
      localStorage.removeItem('status')
    },

    // 새로고침 시 localStorage에서 인증 정보 복원
    // RT가 유효한 동안 자동 로그인 유지 (RT 만료 14일)
    restoreAuth() {
      this.loading = true
      this.error = null
      try {
        const accessToken  = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')
        const userInfo     = JSON.parse(localStorage.getItem('userInfo') || '{}')

        this.accessToken  = accessToken  || null
        this.refreshToken = refreshToken || null
        this.userId   = userInfo?.userId   || null
        this.userUid  = userInfo?.userUid  || null
        this.name     = userInfo?.name     || null
        this.role     = userInfo?.role     || null
        this.status   = userInfo?.status   || null
        this.building = userInfo?.building || null // 입주민 동
        this.unit     = userInfo?.unit     || null // 입주민 호
      } catch (e) {
        // localStorage 파싱 실패 시 초기화
        this.clearAuth()
      } finally {
        this.loading = false
      }
    },

    // 라우터 가드에서 호출하는 초기화 함수
    initializeAuth() {
      this.restoreAuth()
    },
  },
})
