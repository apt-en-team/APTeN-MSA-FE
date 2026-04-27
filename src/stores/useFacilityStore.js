// 시설 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import facilityApi from '@/api/facilityApi'

export const useFacilityStore = defineStore('facility', {
  state: () => ({
    loading: false,
    error: null,
    facilities: [],
    facilityDetail: null,
    facilityTypes: [],
    facilityPolicies: null,
  }),
  getters: {
    hasFacilityDetail: (state) => !!state.facilityDetail,
  },
  actions: {
    // 관리자 시설 목록 조회
    async fetchAdminFacilities(params) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.getAdminFacilities(params)
        this.facilities = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 상세 조회
    async fetchAdminFacilityDetail(id) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.getAdminFacilityDetail(id)
        this.facilityDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 등록
    async createFacility(body) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.createFacility(body)
        this.facilityDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 수정
    async updateFacility(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.updateFacility(id, body)
        this.facilityDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 삭제
    async deleteFacility(id) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.deleteFacility(id)
        this.facilityDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 시설 타입 목록 조회
    async fetchFacilityTypes(params) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.getFacilityTypes(params)
        this.facilityTypes = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 시설 타입 등록
    async createFacilityType(body) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.createFacilityType(body)
        this.facilityTypes = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 시설 타입 수정
    async updateFacilityType(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.updateFacilityType(id, body)
        this.facilityTypes = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 시설 예약 정책 조회
    async fetchFacilityPolicies(params) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.getFacilityPolicies(params)
        this.facilityPolicies = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 시설 예약 정책 설정
    async saveFacilityPolicy(body) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.saveFacilityPolicy(body)
        this.facilityPolicies = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 입주민 시설 목록 조회
    async fetchFacilities(params) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.getFacilities(params)
        this.facilities = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 입주민 시설 상세 조회
    async fetchFacilityDetail(id) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.getFacilityDetail(id)
        this.facilityDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
