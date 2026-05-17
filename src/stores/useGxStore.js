// GX 상태를 관리하는 store입니다.
import { acceptHMRUpdate, defineStore } from 'pinia'
import gxApi from '@/api/gxApi'

export const useGxStore = defineStore('gx', {
  state: () => ({
    loading: false,
    error: null,
    gxPrograms: [],
    gxProgramDetail: null,
    gxReservation: null,
    gxStatus: null,
    gxWaitingStatus: null,
  }),
  getters: {
    hasGxProgramDetail: (state) => !!state.gxProgramDetail,
  },
  actions: {
    // 관리자 GX 프로그램 목록 조회
    async fetchAdminGxPrograms(params) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.getAdminGxPrograms(params)
        this.gxPrograms = res
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 GX 프로그램 상세 조회
    async fetchAdminGxProgramDetail(id) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.getAdminGxProgramDetail(id)
        this.gxProgramDetail = res
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 GX 프로그램 등록
    async createGxProgram(body) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.createGxProgram(body)
        this.gxProgramDetail = res
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 GX 프로그램 수정
    async updateGxProgram(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.updateGxProgram(id, body)
        this.gxProgramDetail = res
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 GX 프로그램 취소
    async cancelGxProgram(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.cancelGxProgram(id, body)
        this.gxProgramDetail = res
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 내 GX 예약 목록 조회
    async fetchMyGxReservations() {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.getMyGxReservations()
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 입주민 GX 프로그램 목록 조회
    async fetchGxPrograms(params) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.getGxPrograms(params)
        this.gxPrograms = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 입주민 GX 프로그램 상세 조회
    async fetchGxProgramDetail(id) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.getGxProgramDetail(id)
        this.gxProgramDetail = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // GX 예약 신청
    async createGxReservation(body) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.createGxReservation(body)
        this.gxReservation = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // GX 대기 순번 조회
    async fetchGxWaitingStatus(id) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.getGxWaitingStatus(id)
        this.gxWaitingStatus = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // GX 예약 취소
    async cancelGxReservation(id) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.cancelGxReservation(id)
        this.gxReservation = res
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 GX 단건 승인
    async approveGxReservation(id) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.approveGxReservation(id)
        this.gxProgramDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 GX 단건 거절
    async rejectGxReservation(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.rejectGxReservation(id, body)
        this.gxProgramDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 GX 일괄 승인
    async bulkApproveGxProgram(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.bulkApproveGxProgram(id, body)
        this.gxProgramDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 GX 최소 인원 검증
    async checkGxMinimum(id) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.checkGxMinimum(id)
        this.gxStatus = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 GX 현황 조회
    async fetchGxProgramStatus(id) {
      this.loading = true
      this.error = null
      try {
        const res = await gxApi.getGxProgramStatus(id)
        this.gxStatus = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGxStore, import.meta.hot))
}
