// 세대 상태 store를 관리합니다.
import { defineStore } from 'pinia'

export const useHouseholdStore = defineStore('household', {
  state: () => ({
    items: [],
    selectedHousehold: null,
  }),
  getters: {
    householdCount: (state) => state.items.length,
  },
  actions: {
    // 세대 목록 조회 구조를 정의합니다.
    async fetchHouseholds(params) {
      try {
        void params
        // TODO: 최신 세대 API 모듈 연결 예정
      } catch (error) {
        throw error
      }
    },
  },
})
