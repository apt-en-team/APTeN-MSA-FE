// 방문 차량 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import visitorVehicleApi from '@/api/visitorVehicleApi'

export const useVisitorVehicleStore = defineStore('visitorVehicle', {
  state: () => ({
    loading: false,
    error: null,
    visitorVehicles: [],
    regularVisitorVehicles: [],
    adminVisitorVehicles: [],
    visitorPolicy: null,
  }),
  getters: {
    hasVisitorVehicles: (state) => state.visitorVehicles.length > 0,
  },
  actions: {
    // 방문차량 목록 조회
    async fetchVisitorVehicles(params) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.getVisitorVehicles(params)
        this.visitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 방문차량 등록
    async createVisitorVehicle(body) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.createVisitorVehicle(body)
        this.visitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 방문차량 수정
    async updateVisitorVehicle(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.updateVisitorVehicle(id, body)
        this.visitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 방문차량 취소
    async cancelVisitorVehicle(id) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.cancelVisitorVehicle(id)
        this.visitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 방문차량 삭제
    async deleteVisitorVehicle(id) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.deleteVisitorVehicle(id)
        this.visitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 고정 방문차량 등록
    async createRegularVisitorVehicle(body) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.createRegularVisitorVehicle(body)
        this.regularVisitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 고정 방문차량 목록 조회
    async fetchRegularVisitorVehicles(params) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.getRegularVisitorVehicles(params)
        this.regularVisitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 고정 방문차량 삭제
    async deleteRegularVisitorVehicle(id) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.deleteRegularVisitorVehicle(id)
        this.regularVisitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 고정 방문차량 수정
    async updateRegularVisitorVehicle(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.updateRegularVisitorVehicle(id, body)
        this.regularVisitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 방문 예정 차량 조회
    async fetchAdminVisitorVehicles(params) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.getAdminVisitorVehicles(params)
        this.adminVisitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 방문차량 등록
    async createAdminVisitorVehicle(body) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.createAdminVisitorVehicle(body)
        this.adminVisitorVehicles = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 방문차량 정책 조회
    async fetchVisitorPolicy() {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.getVisitorPolicy()
        this.visitorPolicy = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 방문차량 정책 설정
    async saveVisitorPolicy(body) {
      this.loading = true
      this.error = null
      try {
        const res = await visitorVehicleApi.saveVisitorPolicy(body)
        this.visitorPolicy = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
