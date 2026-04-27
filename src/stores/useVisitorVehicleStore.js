// 방문 차량 상태 store를 관리합니다.
import { defineStore } from 'pinia'

export const useVisitorVehicleStore = defineStore('visitorVehicle', {
  state: () => ({
    items: [],
    selectedItem: null,
  }),
  getters: {
    visitorVehicleCount: (state) => state.items.length,
  },
  actions: {
    // 방문 차량 목록 조회 구조를 정의합니다.
    async fetchVisitorVehicles(params) {
      try {
        void params
        // TODO: 최신 방문 차량 API 모듈 연결 예정
      } catch (error) {
        throw error
      }
    },
    // 방문 차량 등록 구조를 정의합니다.
    async createVisitorVehicle(body) {
      try {
        void body
        // TODO: 최신 방문 차량 API 모듈 연결 예정
      } catch (error) {
        throw error
      }
    },
  },
})
