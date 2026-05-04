// 단지 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import apartmentComplexApi from '@/api/apartmentComplexApi'

const SELECTED_COMPLEX_STORAGE_KEY = 'apt_selected_complex'
const LEGACY_SELECTED_COMPLEX_STORAGE_KEY = 'selectedComplex'

// 페이지 형태의 기본 목록 상태를 생성합니다.
const createEmptyMasterComplexPage = () => ({
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
})

// 단지 목록 응답을 항상 페이지 형태로 정리합니다.
const normalizeMasterComplexPage = (data, fallbackSize = 10) => {
  if (Array.isArray(data)) {
    return {
      content: data,
      page: 0,
      size: data.length || fallbackSize,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
      hasNext: false,
    }
  }

  if (Array.isArray(data?.content)) {
    return {
      content: data.content,
      page: data.page ?? 0,
      size: data.size ?? fallbackSize,
      totalElements: data.totalElements ?? data.content.length,
      totalPages: data.totalPages ?? 0,
      hasNext: data.hasNext ?? false,
    }
  }

  return createEmptyMasterComplexPage()
}

// 선택 단지 정보는 레이아웃에서 바로 쓸 수 있는 형태로 정리합니다.
const normalizeSelectedComplex = (complex) => ({
  complexId: complex?.complexId ?? null,
  code: complex?.code ?? null,
  name: complex?.name ?? complex?.complexName ?? null,
  status: complex?.status ?? null,
  address: complex?.address ?? null,
})

export const useComplexStore = defineStore('complex', {
  state: () => ({
    masterComplexPage: createEmptyMasterComplexPage(),
    loading: false,
    error: null,
    complexList: createEmptyMasterComplexPage(),
    complexDetail: null,
    complexAdmins: [],
    selectedComplex: null,
    publicComplexList: [],
    publicComplexes: [],
    addressSearchResults: [],
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
        // 단지 목록을 페이지 객체 형태로 정리해 화면과 페이지네이션에서 공통 사용합니다.
        const normalizedPage = normalizeMasterComplexPage(res, params?.size ?? 10)

        this.masterComplexPage = normalizedPage
        // 기존 화면 호환을 위해 기존 상태 이름도 함께 유지합니다.
        this.complexList = normalizedPage
        return normalizedPage
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
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
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 등록
    async createMasterComplex(payload) {
      this.loading = true
      this.error = null
      try {
        // 단지 등록 시 최초 관리자 정보도 함께 전달합니다.
        const res = await apartmentComplexApi.createComplex(payload)
        this.complexDetail = res
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 수정
    async updateMasterComplex(code, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.updateComplex(code, payload)
        this.complexDetail = res
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 상태 변경
    async updateMasterComplexStatus(code, status) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.updateComplexStatus(code, { status })
        this.complexDetail = res
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 주소 검색
    async searchComplexAddress(keyword) {
      this.loading = true
      this.error = null
      try {
        // 프론트는 VWorld를 직접 호출하지 않고 백엔드 주소 검색 API만 호출합니다.
        const res = await apartmentComplexApi.searchAddress({
          keyword,
        })
        // 주소 검색 결과를 화면에서 사용하기 쉬운 형태로 정리합니다.
        this.addressSearchResults = Array.isArray(res) ? res : []
        return this.addressSearchResults
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
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
        this.complexAdmins = Array.isArray(res) ? res : []
        return this.complexAdmins
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 관리자 생성
    async createAdminForComplex(code, payload) {
      this.loading = true
      this.error = null
      try {
        // 관리자 생성은 백엔드에서 Auth 내부 호출 처리 후 단지 소속을 등록합니다.
        const res = await apartmentComplexApi.createComplexAdmin(code, payload)
        await this.fetchComplexAdmins(code)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 관리자 수정
    async updateAdminForComplex(code, userId, payload) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.updateComplexAdmin(code, userId, payload)
        await this.fetchComplexAdmins(code)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 관리자 삭제
    async deleteAdminFromComplex(code, userId) {
      this.loading = true
      this.error = null
      try {
        // 관리자 삭제는 백엔드에서 소속 해제와 계정 소프트 삭제를 함께 처리합니다.
        const res = await apartmentComplexApi.deleteComplexAdmin(code, userId)
        await this.fetchComplexAdmins(code)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
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
        this.publicComplexList = Array.isArray(res) ? res : []
        // 기존 화면 호환을 위해 alias 상태도 함께 유지합니다.
        this.publicComplexes = this.publicComplexList
        return this.publicComplexList
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // MASTER 단지 선택
    async selectComplexForMaster(code) {
      this.loading = true
      this.error = null
      try {
        const res = await apartmentComplexApi.selectMasterComplex(code)
        this.setSelectedComplex(res)
        return this.selectedComplex
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 선택 단지 저장
    setSelectedComplex(complex) {
      // 선택한 단지를 새로고침 후에도 유지하기 위해 localStorage에 저장합니다.
      const selected = normalizeSelectedComplex(complex)

      this.selectedComplex = selected
      localStorage.setItem(SELECTED_COMPLEX_STORAGE_KEY, JSON.stringify(selected))
      // 기존 레이아웃과의 호환을 위해 기존 키도 함께 유지합니다.
      localStorage.setItem(LEGACY_SELECTED_COMPLEX_STORAGE_KEY, JSON.stringify(selected))
      return selected
    },

    // 선택 단지 복원
    restoreSelectedComplex() {
      // 선택 단지 복구는 신규 키를 우선하고, 기존 키도 fallback으로 허용합니다.
      const saved =
        localStorage.getItem(SELECTED_COMPLEX_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_SELECTED_COMPLEX_STORAGE_KEY)

      if (!saved) {
        return null
      }

      try {
        this.selectedComplex = normalizeSelectedComplex(JSON.parse(saved))
        return this.selectedComplex
      } catch (e) {
        console.error(e)
        localStorage.removeItem(SELECTED_COMPLEX_STORAGE_KEY)
        localStorage.removeItem(LEGACY_SELECTED_COMPLEX_STORAGE_KEY)
        this.selectedComplex = null
        return null
      }
    },

    // 선택 단지 초기화
    clearSelectedComplex() {
      // 로그아웃 또는 단지 전환 시 선택 상태를 초기화합니다.
      this.selectedComplex = null
      localStorage.removeItem(SELECTED_COMPLEX_STORAGE_KEY)
      localStorage.removeItem(LEGACY_SELECTED_COMPLEX_STORAGE_KEY)
    },

    // 기존 createComplex 함수명과 호환을 유지합니다.
    createComplex(payload) {
      return this.createMasterComplex(payload)
    },

    // 기존 updateComplex 함수명과 호환을 유지합니다.
    updateComplex(code, payload) {
      return this.updateMasterComplex(code, payload)
    },

    // 기존 updateComplexStatus 함수명과 호환을 유지합니다.
    updateComplexStatus(code, payload) {
      return this.updateMasterComplexStatus(code, payload?.status)
    },

    // 기존 assignComplexAdmin 함수명과 호환을 유지합니다.
    assignComplexAdmin(code, payload) {
      return this.createAdminForComplex(code, payload)
    },

    // 기존 unassignComplexAdmin 함수명과 호환을 유지합니다.
    unassignComplexAdmin(code, userId) {
      return this.deleteAdminFromComplex(code, userId)
    },
  },
})
