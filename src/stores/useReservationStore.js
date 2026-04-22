// 예약 상태 store 공통 구조를 정의합니다.
import { defineStore } from 'pinia'
import reservationApi from '@/api/reservation'

export const useReservationStore = defineStore('reservation', {
  state: () => ({
    items: [],
    selectedItem: null,
    availableTimes: [],
    seats: [],
    gxPrograms: [],
  }),
  getters: {
    reservationCount: (state) => state.items.length,
    hasSelectedReservation: (state) => Boolean(state.selectedItem),
  },
  actions: {
    async fetchReservations(params) {
      try {
        // TODO: 예약 목록 API 연동을 구현합니다.
        await reservationApi.getMyReservations(params)
      } catch (error) {
        throw error
      }
    },
    async fetchReservationDetail(reservationId) {
      try {
        // TODO: 예약 상세 API 연동을 구현합니다.
        await reservationApi.getReservationDetail(reservationId)
      } catch (error) {
        throw error
      }
    },
    async fetchAvailableTimes(facilityId, params) {
      try {
        // TODO: 예약 가능 시간 API 연동을 구현합니다.
        await reservationApi.getAvailableTimes(facilityId, params)
      } catch (error) {
        throw error
      }
    },
    async fetchSeats(facilityId, params) {
      try {
        // TODO: 좌석 조회 API 연동을 구현합니다.
        await reservationApi.getSeats(facilityId, params)
      } catch (error) {
        throw error
      }
    },
    async createReservation(data) {
      try {
        // TODO: 예약 생성 API 연동을 구현합니다.
        await reservationApi.createReservation(data)
      } catch (error) {
        throw error
      }
    },
    async cancelReservation(reservationId, data) {
      try {
        // TODO: 예약 취소 API 연동을 구현합니다.
        await reservationApi.cancelReservation(reservationId, data)
      } catch (error) {
        throw error
      }
    },
  },
})
