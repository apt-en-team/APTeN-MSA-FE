// TODO: 인증 상태 store 구조를 정의합니다.
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    refreshToken: null,
    role: null,
  }),
  getters: {
    // TODO: 인증 관련 getter를 추가합니다.
  },
  actions: {
    // TODO: 인증 관련 action을 추가합니다.
  },
})
