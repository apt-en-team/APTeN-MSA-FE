import { defineStore } from 'pinia'
import parkingApi from '@/api/parkingApi'

// 빈 페이지 응답 기본값
const createEmptyPage = () => ({
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
})

// 빈 통계 요약 기본값
const createEmptySummary = () => ({
  todayInCount: 0,
  todayOutCount: 0,
  todayInDiffFromYesterday: 0,
  todayOutDiffFromYesterday: 0,
  unregisteredCount: 0,
  monthlyTotalCount: 0,
  monthlyDailyAverage: 0,
})

// 빈 주차 운영 타입 기본값
const createEmptyParkingSetting = () => ({
  complexId: null,
  parkingTypeCode: '',
  parkingTypeValue: '',
})

// 빈 주차 통계 기본값
const createEmptyParkingStatistics = () => ({
  chartUnit: '',
  labels: [],
  inCount: [],
  outCount: [],
  averageOccupancyRate: 0,
})

export const useParkingStore = defineStore('parking', {
  state: () => ({
    loading: false,
    error: null,
    parkingLogPage: createEmptyPage(),
    parkingLogSummary: createEmptySummary(),
    parkingSetting: createEmptyParkingSetting(),
    parkingStatistics: createEmptyParkingStatistics(),
  }),

  actions: {
    // 입출차 기록 목록 조회
    async fetchParkingLogs(params) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingLogs(params)
        this.parkingLogPage = res ?? createEmptyPage()
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 입출차 통계 요약 조회
    async fetchParkingLogSummary() {
      try {
        const res = await parkingApi.getParkingLogSummary()
        this.parkingLogSummary = res ?? createEmptySummary()
      } catch (e) {
        console.error(e)
        this.error = e
      }
    },

    // 주차 운영 타입 조회
    async fetchParkingSetting() {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingSetting()
        this.parkingSetting = res ?? createEmptyParkingSetting()
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차 운영 타입 변경
    async updateParkingSetting(parkingType) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.updateParkingSetting({ parkingType })
        // 변경 응답에는 updatedAt이 추가로 오지만 화면 표시용으로는 code/value만 사용
        if (res) {
          this.parkingSetting = {
            complexId: res.complexId,
            parkingTypeCode: res.parkingTypeCode,
            parkingTypeValue: res.parkingTypeValue,
          }
        }
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
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
        this.parkingStatistics = res ?? createEmptyParkingStatistics()
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
