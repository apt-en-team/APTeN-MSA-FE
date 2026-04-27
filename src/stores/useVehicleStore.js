// 사용자 차량 상태 store를 관리합니다.
import { defineStore } from 'pinia'
import vehicleApi from '@/api/vehicleApi'

export const useVehicleStore = defineStore('vehicle', {
  state: () => ({
    items: [],
    selectedItem: null,
  }),
  getters: {
    vehicleCount: (state) => state.items.length,
    hasSelectedVehicle: (state) => Boolean(state.selectedItem),
  },
  actions: {
    // 내 차량 목록을 조회합니다.
    async fetchVehicles() {
      try {
        return await vehicleApi.getMyVehicles()
      } catch (error) {
        throw error
      }
    },
    // 내 차량 등록을 요청합니다.
    async createVehicle(data) {
      try {
        return await vehicleApi.createVehicle(data)
      } catch (error) {
        throw error
      }
    },
    // 내 차량 상세를 조회합니다.
    async fetchVehicleDetail(vehicleId) {
      try {
        return await vehicleApi.getMyVehicleDetail(vehicleId)
      } catch (error) {
        throw error
      }
    },
    // 내 차량 수정을 요청합니다.
    async updateVehicle(vehicleId, data) {
      try {
        return await vehicleApi.updateVehicle(vehicleId, data)
      } catch (error) {
        throw error
      }
    },
    // 내 차량 삭제를 요청합니다.
    async deleteVehicle(vehicleId) {
      try {
        return await vehicleApi.deleteVehicle(vehicleId)
      } catch (error) {
        throw error
      }
    },
    // 차량번호 중복 여부를 조회합니다.
    async checkLicensePlate(params) {
      try {
        return await vehicleApi.checkLicensePlate(params)
      } catch (error) {
        throw error
      }
    },
    // 관리자 차량 목록을 조회합니다.
    async fetchAdminVehicles(params) {
      try {
        return await vehicleApi.getAdminVehicles(params)
      } catch (error) {
        throw error
      }
    },
  },
})
