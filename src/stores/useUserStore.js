// 사용자 정보 store 공통 구조를 정의합니다.
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
    apartmentComplex: null,
    permissions: [],
  }),
  getters: {
    hasProfile: (state) => Boolean(state.profile),
    permissionCount: (state) => state.permissions.length,
  },
  actions: {
    async fetchMyProfile() {
      try {
        // TODO: 내 정보 조회 API 연동을 구현합니다.
      } catch (error) {
        throw error
      }
    },
    clearProfile() {
      this.profile = null
      this.apartmentComplex = null
      this.permissions = []
    },
  },
})
