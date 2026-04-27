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
    publicComplexList: [],
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
        // MASTER 단지 목록은 페이지 객체나 배열 그대로 보관합니다.
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
        // 상세 데이터는 API에서 이미 unwrap된 값을 그대로 저장합니다.
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
        // 등록 후 반환값이 있으면 상세 상태에 반영합니다.
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
        // 수정 후 반환값이 있으면 상세 상태에 반영합니다.
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
        // 상태 변경 후 반환값이 있으면 상세 상태에 반영합니다.
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
        // 공개 단지 목록은 향후 화면 호환을 위해 두 상태에 함께 저장합니다.
        this.publicComplexList = Array.isArray(res) ? res : res?.content || []
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
      // 선택 단지는 관리자 화면 진입에 필요한 핵심 정보만 저장합니다.
      const selected = {
        code: complex?.code,
        name: complex?.name || complex?.complexName,
        status: complex?.status,
        address: complex?.address,
      }

      this.selectedComplex = selected
      localStorage.setItem('selectedComplex', JSON.stringify(selected))
    },

    // 선택 단지 복원
    restoreSelectedComplex() {
      // 새로고침 후에도 MASTER가 선택 단지를 유지할 수 있게 복원합니다.
      const saved = localStorage.getItem('selectedComplex')

      if (!saved) {
        return
      }

      try {
        this.selectedComplex = JSON.parse(saved)
      } catch (e) {
        console.error(e)
        localStorage.removeItem('selectedComplex')
      }
    },

    // 선택 단지 초기화
    clearSelectedComplex() {
      // 로그아웃 또는 단지 전환 시 선택 상태를 초기화합니다.
      this.selectedComplex = null
      localStorage.removeItem('selectedComplex')
    },
  },
})
