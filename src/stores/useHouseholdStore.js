// 세대 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import householdApi from '@/api/householdApi'

export const useHouseholdStore = defineStore('household', {
  state: () => ({
    loading: false,
    error: null,
    households: [],
    householdDetail: null,
    householdMembers: [],
    matchRequests: [],
    myHousehold: null,
    householdHistory: [],
  }),
  getters: {
    hasHouseholdDetail: (state) => !!state.householdDetail,
  },
  actions: {
    // 관리자 세대 목록 조회
    async fetchAdminHouseholds(params) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.getAdminHouseholds(params)
        this.households = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 세대 상세 조회
    async fetchAdminHouseholdDetail(id) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.getAdminHouseholdDetail(id)
        this.householdDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 세대 등록
    async createHousehold(body) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.createHousehold(body)
        this.householdDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 세대 정보 수정
    async updateHousehold(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.updateHousehold(id, body)
        this.householdDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 세대 상태 변경
    async updateHouseholdStatus(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.updateHouseholdStatus(id, body)
        this.householdDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 입주/퇴거 이력 조회
    async fetchHouseholdHistory(id) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.getHouseholdHistory(id)
        this.householdHistory = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 세대원 목록 조회
    async fetchHouseholdMembers(id) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.getHouseholdMembers(id)
        this.householdMembers = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 세대원 등록
    async createHouseholdMember(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.createHouseholdMember(id, body)
        this.householdMembers = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 세대원 수정
    async updateHouseholdMember(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.updateHouseholdMember(id, body)
        this.householdMembers = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 세대원 삭제
    async deleteHouseholdMember(id) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.deleteHouseholdMember(id)
        this.householdMembers = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 세대주 권한 변경
    async changeHouseholdHead(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.changeHouseholdHead(id, body)
        this.householdDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 수동 승인 대상 조회
    async fetchMatchRequests(params) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.getHouseholdMatchRequests(params)
        this.matchRequests = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 수동 승인 처리
    async approveMatchRequest(id) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.approveHouseholdMatchRequest(id)
        this.matchRequests = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 수동 거절 처리
    async rejectMatchRequest(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.rejectHouseholdMatchRequest(id, body)
        this.matchRequests = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 내 세대 정보 조회
    async fetchMyHousehold() {
      this.loading = true
      this.error = null
      try {
        const res = await householdApi.getMyHousehold()
        this.myHousehold = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
