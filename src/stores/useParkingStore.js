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

export const useParkingStore = defineStore('parking', {
  state: () => ({
    loading: false,
    error: null,
    parkingLogPage: createEmptyPage(),
    parkingLogSummary: createEmptySummary(),
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
  },
})
