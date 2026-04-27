// 단지 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import apartmentComplexApi from '@/api/apartmentComplexApi'

export const useComplexStore = defineStore('complex', {
  state: () => ({
    loading: false,
    error: null,
    complexList: [],
    complexDetail: null,
    complexAdmins: [],
    selectedComplex: null,
    publicComplexes: [],
  }),
  getters: {
    hasSelectedComplex: (state) => !!state.selectedComplex,
  },
  actions: {
    // MASTER 단지 목록 조회
    async fetchMasterComplexes(params) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.getMasterComplexes(params)
        this.complexList = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 상세 조회
    async fetchMasterComplexDetail(code) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.getMasterComplexDetail(code)
        this.complexDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 등록
    async createComplex(body) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.createComplex(body)
        this.complexDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 수정
    async updateComplex(code, body) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.updateComplex(code, body)
        this.complexDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 상태 변경
    async updateComplexStatus(code, body) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.updateComplexStatus(code, body)
        this.complexDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 관리자 목록 조회
    async fetchComplexAdmins(code) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.getComplexAdmins(code)
        this.complexAdmins = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 관리자 지정
    async assignComplexAdmin(code, body) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.assignComplexAdmin(code, body)
        this.complexAdmins = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 관리자 해제
    async unassignComplexAdmin(code, userId) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.unassignComplexAdmin(code, userId)
        this.complexAdmins = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 공개 단지 목록 조회
    async fetchPublicComplexes(params) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.getPublicComplexes(params)
        this.publicComplexes = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 선택 단지 저장
    setSelectedComplex(complex) {
      this.selectedComplex = complex
    },
  },
})
