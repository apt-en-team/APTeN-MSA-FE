// 차량 상태 store 공통 구조를 정의합니다.
import { defineStore } from 'pinia'
import vehicleApi from '@/api/vehicle'

export const useVehicleStore = defineStore('vehicle', {
  state: () => ({
    items: [],
    selectedItem: null,
    visitorItems: [],
    regularVisitorItems: [],
  }),
  getters: {
    vehicleCount: (state) => state.items.length,
    hasSelectedVehicle: (state) => Boolean(state.selectedItem),
  },
  actions: {
    async fetchVehicles(params) {
      try {
        // TODO: 차량 목록 API 연동을 구현합니다.
        await vehicleApi.getMyVehicles(params)
      } catch (error) {
        throw error
      }
    },
    async createVehicle(data) {
      try {
        // TODO: 차량 등록 API 연동을 구현합니다.
        await vehicleApi.createVehicle(data)
      } catch (error) {
        throw error
      }
    },
    async updateVehicle(vehicleId, data) {
      try {
        // TODO: 차량 수정 API 연동을 구현합니다.
        await vehicleApi.updateVehicle(vehicleId, data)
      } catch (error) {
        throw error
      }
    },
    async deleteVehicle(vehicleId) {
      try {
        // TODO: 차량 삭제 API 연동을 구현합니다.
        await vehicleApi.deleteVehicle(vehicleId)
      } catch (error) {
        throw error
      }
    },
    async fetchVisitorVehicles(params) {
      try {
        // TODO: 방문 차량 목록 API 연동을 구현합니다.
        await vehicleApi.getVisitorVehicles(params)
      } catch (error) {
        throw error
      }
    },
    async fetchRegularVisitorVehicles(params) {
      try {
        // TODO: 정기 방문 차량 목록 API 연동을 구현합니다.
        await vehicleApi.getRegularVisitorVehicles(params)
      } catch (error) {
        throw error
      }
    },
  },
})
