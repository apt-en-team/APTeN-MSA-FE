// 인증 상태 store를 관리합니다.
import { defineStore } from 'pinia'
import authApi from '@/api/authApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    refreshToken: null,
    role: 'GUEST',
    status: null,
    isAuthenticated: false,
  }),
  getters: {
    hasAccessToken: (state) => Boolean(state.accessToken),
    currentRole: (state) => state.role,
  },
  actions: {
    // 인증 정보를 store와 localStorage에 저장합니다.
    setAuth(payload = {}) {
      this.accessToken = payload.accessToken || null
      this.refreshToken = payload.refreshToken || null
      this.role = payload.role || 'GUEST'
      this.status = payload.status || null
      this.isAuthenticated = Boolean(payload.accessToken)

      if (payload.accessToken) localStorage.setItem('accessToken', payload.accessToken)
      if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken)
      localStorage.setItem('role', this.role)
      localStorage.setItem('status', this.status || '')
    },

    // 저장된 인증 정보를 초기화합니다.
    clearAuth() {
      this.accessToken = null
      this.refreshToken = null
      this.role = 'GUEST'
      this.status = null
      this.isAuthenticated = false

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('role')
      localStorage.removeItem('status')
    },

    // 새로고침 시 localStorage의 인증 정보를 복원합니다.
    initializeAuth() {
      this.accessToken = localStorage.getItem('accessToken')
      this.refreshToken = localStorage.getItem('refreshToken')
      this.role = localStorage.getItem('role') || 'GUEST'
      this.status = localStorage.getItem('status') || null
      this.isAuthenticated = Boolean(this.accessToken)
    },

    // 로그인 API를 호출합니다.
    async login(body) {
      try {
        return await authApi.login(body)
      } catch (error) {
        throw error
      }
    },

    // 로그아웃 API를 호출하고 인증 정보를 초기화합니다.
    async logout() {
      try {
        await authApi.logout()
      } catch (error) {
        throw error
      } finally {
        this.clearAuth()
      }
    },

    // 재발급 API를 호출합니다.
    async refreshAuth() {
      try {
        return await authApi.refreshToken({
          refreshToken: this.refreshToken,
        })
      } catch (error) {
        throw error
      }
    },

    // 비밀번호 변경 API를 호출합니다.
    async changePassword(body) {
      try {
        return await authApi.changePassword(body)
      } catch (error) {
        throw error
      }
    },

    // 회원 탈퇴 API를 호출합니다.
    async deleteMyAccount(body) {
      try {
        return await authApi.deleteMyAccount(body)
      } catch (error) {
        throw error
      }
    },
  },
})
