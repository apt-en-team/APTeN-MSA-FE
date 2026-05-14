import { defineStore } from 'pinia'
import parkingApi from '@/api/parkingApi'

// 빈 페이지 응답 기본값을 만든다.
const createEmptyPage = () => ({
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
})

export const useParkingStore = defineStore('parking', {
  state: () => ({
    loading: false,
    error: null,
    parkingLogPage: createEmptyPage(),
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
  },
})
