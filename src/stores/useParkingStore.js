// 주차 정책 상태 store를 관리합니다.
import { defineStore } from 'pinia'
import vehicleApi from '@/api/vehicleApi'

export const useParkingStore = defineStore('parking', {
  state: () => ({
    policies: null,
  }),
  getters: {
    hasPolicies: (state) => Boolean(state.policies),
  },
  actions: {
    // 차량 정책을 조회합니다.
    async fetchVehiclePolicies() {
      return vehicleApi.getVehiclePolicies()
    },
    // 차량 정책을 저장합니다.
    async saveVehiclePolicies(body) {
      return vehicleApi.saveVehiclePolicies(body)
    },
  },
})
