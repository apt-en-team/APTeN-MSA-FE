// 차량 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import vehicleApi from '@/api/vehicleApi'
import { toList } from '@/utils/apiResponse'

export const useVehicleStore = defineStore('vehicle', {
  state: () => ({
    loading: false,
    error: null,
    myVehicles: [],
    vehicleDetail: null,
    adminVehicles: [],
    adminVehicleStats: null,
    vehicleLocations: null,
    vehiclePolicies: null,
  }),
  getters: {
    hasVehicleDetail: (state) => !!state.vehicleDetail,
  },
  actions: {
    // 내 세대 차량 목록 조회
    async fetchMyVehicles() {
      this.loading = true
      this.error = null
      try {
        // 응답이 페이지 형태라 content 배열만 추출해 보관
        const res = await vehicleApi.getMyVehicles()
        this.myVehicles = toList(res)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
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
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
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
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
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
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
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
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 차량번호 중복 확인
    async checkLicensePlate(params) {
      this.loading = true
      this.error = null
      try {
        // 중복 확인 결과는 호출 측에서 사용하도록 그대로 반환
        const res = await vehicleApi.checkLicensePlate(params)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
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

    // 관리자 차량 상태별 통계 조회
    async fetchAdminVehicleStats() {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.getAdminVehicleStats()
        this.adminVehicleStats = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 차량 화면 동/호 옵션 조회
    async fetchVehicleLocations() {
      this.loading = true
      this.error = null
      try {
        const res = await vehicleApi.getVehicleLocations()
        this.vehicleLocations = res
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
