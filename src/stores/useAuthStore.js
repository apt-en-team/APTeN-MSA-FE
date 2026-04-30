// 인증 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import authApi from '@/api/authApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    loading: false,
    error: null,
    accessToken: null,
    refreshToken: null,
    userId: null,
    userUid: null,
    name: null,
    role: 'USER',
    status: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },
  actions: {
    // 로그인
    async login(body) {
      this.loading = true
      this.error = null
      try {
        const res = await authApi.login(body)
        this.setAuth(res)

        if (this.role === 'MASTER') {
          window.location.href = '/admin/master/complexes'
        } else if (this.role === 'ADMIN') {
          window.location.href = '/admin/dashboard'
        } else if (this.role === 'USER' && this.status === 'PENDING') {
          window.location.href = '/resident/pending'
        } else if (this.role === 'USER') {
          window.location.href = '/resident/home'
        }
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 로그아웃
    async logout() {
      this.loading = true
      this.error = null
      try {
        await authApi.logout()
        this.clearAuth()
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 인증정보 저장
    setAuth(data) {
      const userInfo = data?.userInfo || data?.user || data || {}

      this.accessToken = data?.accessToken || data?.tokens?.accessToken || null
      this.refreshToken = data?.refreshToken || data?.tokens?.refreshToken || null
      this.userId = userInfo?.userId || data?.userId || null
      this.userUid = userInfo?.userUid || data?.userUid || null
      this.name = userInfo?.name || data?.name || null
      this.role = userInfo?.role || data?.role || 'USER'
      this.status = userInfo?.status || data?.status || null

      if (this.accessToken) {
        localStorage.setItem('accessToken', this.accessToken)
      }

      if (this.refreshToken) {
        localStorage.setItem('refreshToken', this.refreshToken)
      }

      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          userId: this.userId,
          userUid: this.userUid,
          name: this.name,
          role: this.role,
          status: this.status,
        }),
      )
    },

    // 개발 중 화면 확인용 임시 MASTER 인증 정보를 저장합니다.
    setDevMasterAuth() {
      // 개발 중 화면 확인용 임시 처리이며 로그인 구현 후 제거합니다.
      this.setAuth({
        accessToken: 'dev-master-access-token',
        refreshToken: 'dev-master-refresh-token',
        userInfo: {
          userId: 1,
          userUid: 'dev-master',
          name: '마스터 관리자',
          role: 'MASTER',
          status: 'ACTIVE',
        },
      })
    },

    // 인증정보 초기화
    clearAuth() {
      this.accessToken = null
      this.refreshToken = null
      this.userId = null
      this.userUid = null
      this.name = null
      this.role = 'USER'
      this.status = null
      this.error = null

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('role')
      localStorage.removeItem('status')
    },

    // 새로고침 시 복원
    restoreAuth() {
      this.loading = true
      this.error = null
      try {
        const accessToken = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')

        this.accessToken = accessToken || null
        this.refreshToken = refreshToken || null
        this.userId = userInfo?.userId || null
        this.userUid = userInfo?.userUid || null
        this.name = userInfo?.name || null
        this.role = userInfo?.role || 'USER'
        this.status = userInfo?.status || null
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 기존 라우터 호환용 초기화 함수
    initializeAuth() {
      this.restoreAuth()
    },
  },
})
