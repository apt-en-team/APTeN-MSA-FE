// 예약 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import reservationApi from '@/api/reservationApi'

export const useReservationStore = defineStore('reservation', {
  state: () => ({
    loading: false,
    error: null,
    availableTimes: [],
    myReservations: [],
    reservationDetail: null,
    adminReservations: [],
    seatHold: null,
  }),
  getters: {
    hasReservationDetail: (state) => !!state.reservationDetail,
  },
  actions: {
    // 예약 가능 시간 조회
    async fetchAvailableTimes(params) {
      this.loading = true
      this.error = null
      try {
        const res = await reservationApi.getAvailableTimes(params)
        this.availableTimes = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 좌석 임시 선점
    async holdSeat(body) {
      this.loading = true
      this.error = null
      try {
        const res = await reservationApi.holdSeat(body)
        this.seatHold = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 예약 생성
    async createReservation(body) {
      this.loading = true
      this.error = null
      try {
        const res = await reservationApi.createReservation(body)
        this.reservationDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 내 예약 목록 조회
    async fetchMyReservations(params) {
      this.loading = true
      this.error = null
      try {
        const res = await reservationApi.getMyReservations(params)
        this.myReservations = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 내 예약 상세 조회
    async fetchMyReservationDetail(id) {
      this.loading = true
      this.error = null
      try {
        const res = await reservationApi.getMyReservationDetail(id)
        this.reservationDetail = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 예약 취소
    async cancelMyReservation(id) {
      this.loading = true
      this.error = null
      try {
        const res = await reservationApi.cancelMyReservation(id)
        this.reservationDetail = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 예약 목록 조회
    async fetchAdminReservations(params) {
      this.loading = true
      this.error = null
      try {
        const res = await reservationApi.getAdminReservations(params)
        this.adminReservations = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 예약 상세 조회
    async fetchAdminReservationDetail(id) {
      this.loading = true
      this.error = null
      try {
        const res = await reservationApi.getAdminReservationDetail(id)
        this.reservationDetail = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 예약 강제 취소
    async cancelAdminReservation(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await reservationApi.cancelAdminReservation(id, body)
        this.reservationDetail = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
