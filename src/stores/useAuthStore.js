// 인증 상태 store 공통 구조를 정의합니다.
import { defineStore } from 'pinia'
import authApi from '@/api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    refreshToken: null,
    role: null,
    isAuthenticated: false,
  }),
  getters: {
    hasAccessToken: (state) => Boolean(state.accessToken),
    currentRole: (state) => state.role,
  },
  actions: {
    setTokens(tokens = {}) {
      this.accessToken = tokens.accessToken || null
      this.refreshToken = tokens.refreshToken || null
      this.role = tokens.role || null
      this.isAuthenticated = Boolean(tokens.accessToken)
      // TODO: storage 저장 위치를 확정한 뒤 토큰 저장 로직을 연결합니다.
    },
    clearTokens() {
      this.accessToken = null
      this.refreshToken = null
      this.role = null
      this.isAuthenticated = false
      // TODO: storage 초기화 로직을 연결합니다.
    },
    async logout() {
      try {
        // TODO: 로그아웃 API 연동 시점을 확정합니다.
        await authApi.logout()
      } catch (error) {
        // TODO: 공통 에러 처리 정책을 연결합니다.
        throw error
      } finally {
        this.clearTokens()
      }
    },
    async refreshAuth() {
      try {
        // TODO: refresh token 재발급 API 연동을 구현합니다.
        await authApi.refreshToken({
          refreshToken: this.refreshToken,
        })
      } catch (error) {
        // TODO: 재발급 실패 시 인증 초기화 정책을 연결합니다.
        throw error
      }
    },
    async login() {
      try {
        // TODO: 로그인 API 연동을 구현합니다.
      } catch (error) {
        throw error
      }
    },
  },
})
