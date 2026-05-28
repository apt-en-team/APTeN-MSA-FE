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
    expectedResidents: [],
    matchRequests: [],
    myHousehold: null,
    householdHistory: [],
    householdTypes: [],
    buildingLineTypes: [],
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
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 세대 일괄 등록
    async createHouseholdsBulk(body) {
      return await householdApi.createHouseholdsBulk(body)
    },

    // 관리자 세대 전체 목록 조회 (store 상태 미변경)
    async fetchHouseholdsAll(params) {
      const res = await householdApi.getAdminHouseholds(params)
      return Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : [])
    },

    // 관리자 세대 삭제
    async deleteHousehold(householdId) {
      return await householdApi.deleteHousehold(householdId)
    },

    // 관리자 입주민 명부 등록
    async createExpectedResident(body) {
      return await householdApi.createExpectedResident(body)
    },

    async fetchExpectedResidents(params) {
      const res = await householdApi.getExpectedResidents(params)
      this.expectedResidents = Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : [])
      return res
    },

    async updateExpectedResident(expectedResidentId, body) {
      return await householdApi.updateExpectedResident(expectedResidentId, body)
    },

    async disableExpectedResident(expectedResidentId) {
      const res = await householdApi.disableExpectedResident(expectedResidentId)
      const removeDisabledResident = (resident) => String(resident.expectedResidentId) !== String(expectedResidentId)
      if (Array.isArray(this.expectedResidents)) {
        this.expectedResidents = this.expectedResidents.filter(removeDisabledResident)
      } else if (Array.isArray(this.expectedResidents?.content)) {
        this.expectedResidents = {
          ...this.expectedResidents,
          content: this.expectedResidents.content.filter(removeDisabledResident),
        }
      }
      return res
    },

    // 동 드롭다운용 전체 세대에서 고유 동 목록 조회
    async fetchBuildingOptions() {
      const res = await householdApi.getAdminHouseholds({ page: 0, size: 9999 })
      const list = Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : [])
      return [...new Set(list.map((h) => h.building).filter(Boolean))].sort()
    },

    // 동호수로 기존 세대 단건 조회
    async findHouseholdByAddress(building, unit) {
      const res = await householdApi.getAdminHouseholds({ building, unit, page: 0, size: 1 })
      const list = Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : [])
      return list.find((h) => String(h.building) === String(building) && String(h.unit) === String(unit)) ?? null
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
        throw e
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
        throw e
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
        throw e
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

    // 평형 목록 조회
    async fetchHouseholdTypes() {
      const res = await householdApi.getHouseholdTypes()
      this.householdTypes = Array.isArray(res) ? res : []
    },

    // 평형 등록
    async createHouseholdType(body) {
      return await householdApi.createHouseholdType(body)
    },

    // 평형 수정
    async updateHouseholdType(typeId, body) {
      return await householdApi.updateHouseholdType(typeId, body)
    },

    // 평형 삭제
    async deleteHouseholdType(typeId) {
      return await householdApi.deleteHouseholdType(typeId)
    },

    // 동 라인 평형 목록 조회
    async fetchBuildingLineTypes(params) {
      const res = await householdApi.getBuildingLineTypes(params)
      this.buildingLineTypes = Array.isArray(res) ? res : []
    },

    async resolveBuildingLineType(params) {
      return await householdApi.resolveBuildingLineType(params)
    },

    // 동 라인 평형 등록
    async createBuildingLineType(body) {
      return await householdApi.createBuildingLineType(body)
    },

    // 동 라인 평형 수정
    async updateBuildingLineType(lineTypeId, body) {
      return await householdApi.updateBuildingLineType(lineTypeId, body)
    },

    // 동 라인 평형 삭제
    async deleteBuildingLineType(lineTypeId) {
      return await householdApi.deleteBuildingLineType(lineTypeId)
    },
  },
})
