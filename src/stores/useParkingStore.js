// 주차 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import parkingApi from '@/api/parkingApi'

export const useParkingStore = defineStore('parking', {
  state: () => ({
    loading: false,
    error: null,
    parkingLogs: [],
    parkingStatus: null,
    parkingFloors: [],
    parkingStatistics: null,
  }),
  getters: {
    hasParkingStatus: (state) => !!state.parkingStatus,
  },
  actions: {
    // 입출차 기록 목록 조회
    async fetchParkingLogs(params) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingLogs(params)
        this.parkingLogs = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차 현황 조회
    async fetchParkingStatus() {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingStatus()
        this.parkingStatus = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차층 목록 조회
    async fetchParkingFloors(params) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingFloors(params)
        this.parkingFloors = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차층 등록
    async createParkingFloor(body) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.createParkingFloor(body)
        this.parkingFloors = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차층 수정
    async updateParkingFloor(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.updateParkingFloor(id, body)
        this.parkingFloors = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차 통계 조회
    async fetchParkingStatistics(params) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingStatistics(params)
        this.parkingStatistics = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 입출차 등록
    async createParkingLog(body) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.createParkingLog(body)
        this.parkingLogs = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
