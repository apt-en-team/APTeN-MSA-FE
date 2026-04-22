// TODO: 차량 상태 store 구조를 정의합니다.
import { defineStore } from 'pinia'

export const useVehicleStore = defineStore('vehicle', {
  state: () => ({
    items: [],
    selectedItem: null,
  }),
  getters: {
    // TODO: 차량 관련 getter를 추가합니다.
  },
  actions: {
    // TODO: 차량 관련 action을 추가합니다.
  },
})
