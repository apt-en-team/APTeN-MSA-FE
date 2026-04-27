// 차량 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import vehicleApi from '@/api/vehicleApi'

export const useVehicleStore = defineStore('vehicle', {
  state: () => ({
    loading: false,
    error: null,
    myVehicles: [],
    vehicleDetail: null,
    adminVehicles: [],
    vehiclePolicies: null,
  }),
  getters: {
    hasVehicleDetail: (state) => !!state.vehicleDetail,
  },
  actions: {
    // 내 차량 목록 조회
    async fetchMyVehicles() {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.getMyVehicles()
        this.myVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 내 차량 상세 조회
    async fetchMyVehicleDetail(vehicleId) {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.getMyVehicleDetail(vehicleId)
        this.vehicleDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 내 차량 등록 신청
    async createVehicle(body) {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.createVehicle(body)
        this.vehicleDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 내 차량 수정
    async updateVehicle(vehicleId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.updateVehicle(vehicleId, body)
        this.vehicleDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 내 차량 삭제
    async deleteVehicle(vehicleId) {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.deleteVehicle(vehicleId)
        this.vehicleDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 차량번호 중복 확인
    async checkLicensePlate(params) {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.checkLicensePlate(params)
        this.vehicleDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 차량 목록 조회
    async fetchAdminVehicles(params) {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.getAdminVehicles(params)
        this.adminVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 차량 상세 조회
    async fetchAdminVehicleDetail(vehicleId) {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.getAdminVehicleDetail(vehicleId)
        this.vehicleDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 차량 승인
    async approveVehicle(vehicleId) {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.approveVehicle(vehicleId)
        this.vehicleDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 차량 거절
    async rejectVehicle(vehicleId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.rejectVehicle(vehicleId, body)
        this.vehicleDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 차량 정책 조회
    async fetchVehiclePolicies() {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.getVehiclePolicies()
        this.vehiclePolicies = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 차량 정책 설정
    async saveVehiclePolicies(body) {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.saveVehiclePolicies(body)
        this.vehiclePolicies = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
