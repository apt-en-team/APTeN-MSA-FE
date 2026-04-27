// 관리비 상태 store를 관리합니다.
import { defineStore } from 'pinia'

export const useBillStore = defineStore('bill', {
  state: () => ({
    items: [],
    selectedBill: null,
  }),
  getters: {
    billCount: (state) => state.items.length,
  },
  actions: {
    // 관리비 목록 조회 구조를 정의합니다.
    async fetchBills(params) {
      try {
        void params
        // TODO: 최신 관리비 API 모듈 연결 예정
      } catch (error) {
        throw error
      }
    },
  },
})
