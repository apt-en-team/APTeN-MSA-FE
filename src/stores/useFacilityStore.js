// 시설 상태 store를 관리합니다.
import { defineStore } from 'pinia'

export const useFacilityStore = defineStore('facility', {
  state: () => ({
    items: [],
    selectedFacility: null,
  }),
  getters: {
    facilityCount: (state) => state.items.length,
  },
  actions: {
    // 시설 목록 조회 구조를 정의합니다.
    async fetchFacilities(params) {
      try {
        void params
        // TODO: 최신 시설 API 모듈 연결 예정
      } catch (error) {
        throw error
      }
    },
  },
})
