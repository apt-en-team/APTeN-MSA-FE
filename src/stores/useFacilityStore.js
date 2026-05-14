// 시설 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import facilityApi from '@/api/facilityApi'
import { toList } from '@/utils/apiResponse'

export const useFacilityStore = defineStore('facility', {
  state: () => ({
    // 공통 로딩 상태
    loading: false,
    // 공통 에러 상태
    error: null,
    // 시설 목록 상태
    facilities: [],
    // 선택 시설 상세 상태
    facilityDetail: null,
    // 시설 타입 목록 상태
    facilityTypes: [],
    // 시설 정책 상태
    facilityPolicies: null,
    // 시설 차단 시간 상태
    facilityBlockTimes: [],
  }),
  getters: {
    hasFacilityDetail: (state) => !!state.facilityDetail,
  },
  actions: {
    // 관리자 시설 목록 조회
    async fetchAdminFacilities(params) {
      // 목록 로딩 시작
      this.loading = true
      this.error = null
      try {
        // 목록 API 호출
        const res = await facilityApi.getAdminFacilities(params)
        this.facilities = res
        return res
      } catch (e) {
        // 목록 에러 저장
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 상세 조회
    async fetchAdminFacilityDetail(id) {
      // 상세 로딩 시작
      this.loading = true
      this.error = null
      try {
        // 상세 API 호출
        const res = await facilityApi.getAdminFacilityDetail(id)
        this.facilityDetail = res
        return res
      } catch (e) {
        // 상세 에러 저장
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 등록
    async createFacility(body) {
      // 등록 요청 시작
      this.loading = true
      this.error = null
      try {
        // 등록 API 호출
        const res = await facilityApi.createFacility(body)
        this.facilityDetail = res
        return res
      } catch (e) {
        // 등록 에러 저장
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 수정
    async updateFacility(id, body) {
      // 수정 요청 시작
      this.loading = true
      this.error = null
      try {
        // 수정 API 호출
        const res = await facilityApi.updateFacility(id, body)
        this.facilityDetail = res
        return res
      } catch (e) {
        // 수정 에러 저장
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 삭제
    async deleteFacility(id) {
      // 삭제 요청 시작
      this.loading = true
      this.error = null
      try {
        // 삭제 API 호출
        const res = await facilityApi.deleteFacility(id)
        this.facilityDetail = res
        return res
      } catch (e) {
        // 삭제 에러 저장
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 활성/비활성 상태 변경
    async updateFacilityActive(id, body) {
      // 활성 상태 변경 시작
      this.loading = true
      this.error = null
      try {
        // 활성 상태 변경 API 호출
        const res = await facilityApi.updateFacilityActive(id, body)
        this.facilityDetail = res
        return res
      } catch (e) {
        // 활성 상태 변경 에러 저장
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 시설 타입 목록 조회
    async fetchFacilityTypes(params) {
      // 타입 목록 로딩 시작
      this.loading = true
      this.error = null
      try {
        // 타입 목록 API 호출
        const res = await facilityApi.getFacilityTypes(params)
        const rawTypes = Array.isArray(res?.data?.content) ? res.data.content : toList(res)

        console.log('시설 타입 원본:', rawTypes)

        // 시설 타입 응답 정규화
        this.facilityTypes = rawTypes.map((type) => ({
          typeId: type.typeId ?? type.facilityTypeId ?? type.id,
          typeCode: type.typeCode,
          typeName: type.typeName ?? type.name,
          description: type.description ?? '',
          isActive: type.isActive,
        }))

        console.log('정규화된 시설 타입:', this.facilityTypes)

        return this.facilityTypes
      } catch (e) {
        // 타입 목록 에러 저장
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 시설 타입 등록
    async createFacilityType(body) {
      // 타입 등록 요청
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.createFacilityType(body)
        this.facilityTypes = res
      } catch (e) {
        // 타입 등록 에러 저장
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 시설 타입 수정
    async updateFacilityType(id, body) {
      // 타입 수정 요청
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.updateFacilityType(id, body)
        this.facilityTypes = res
      } catch (e) {
        // 타입 수정 에러 저장
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 시설 예약 정책 조회
    async fetchFacilityPolicies(params) {
      // 정책 조회 요청
      this.loading = true
      this.error = null
      try {
        // 정책 조회 API 호출
        const res = await facilityApi.getFacilityPolicies(params)
        this.facilityPolicies = res
        return res
      } catch (e) {
        // 정책 조회 에러 저장
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 시설 예약 정책 설정
    async saveFacilityPolicy(body) {
      // 정책 저장 요청
      this.loading = true
      this.error = null
      try {
        // 정책 저장 API 호출
        const res = await facilityApi.saveFacilityPolicy(body)
        this.facilityPolicies = res
        return res
      } catch (e) {
        // 정책 저장 에러 저장
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 시설 차단 시간 목록 조회
    async fetchFacilityBlockTimes(facilityId, params) {
      // 차단 시간 조회 요청
      this.loading = true
      this.error = null
      try {
        // 차단 시간 조회 API 호출
        const res = await facilityApi.getFacilityBlockTimes(facilityId, params)
        this.facilityBlockTimes = toList(res)
        return res
      } catch (e) {
        // 차단 시간 조회 에러 저장
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 시설 차단 시간 등록
    async createFacilityBlockTime(facilityId, body) {
      // 차단 시간 등록 요청
      this.loading = true
      this.error = null
      try {
        // 차단 시간 등록 API 호출
        const res = await facilityApi.createFacilityBlockTime(facilityId, body)
        return res
      } catch (e) {
        // 차단 시간 등록 에러 저장
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 입주민 시설 목록 조회
    async fetchFacilities(params) {
      // 입주민 목록 조회 요청
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.getFacilities(params)
        this.facilities = res
      } catch (e) {
        // 입주민 목록 에러 저장
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 입주민 시설 상세 조회
    async fetchFacilityDetail(id) {
      // 입주민 상세 조회 요청
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.getFacilityDetail(id)
        this.facilityDetail = res
      } catch (e) {
        // 입주민 상세 에러 저장
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
