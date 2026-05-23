// 시설 상태를 관리하는 store입니다.
import { acceptHMRUpdate, defineStore } from 'pinia'
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
    // 시설 좌석 목록 상태
    facilitySeats: [],
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

        // 시설 타입 응답 정규화
        this.facilityTypes = rawTypes.map((type) => ({
          typeId: type.typeId ?? type.facilityTypeId ?? type.id,
          typeCode: type.typeCode,
          typeName: type.typeName ?? type.name,
          description: type.description ?? '',
          isActive: type.isActive,
        }))

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
        throw e
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
        throw e
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
        throw e
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

    // 시설 반복 차단 시간 일괄 등록
    async createFacilityBlockTimeBatch(facilityId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.createFacilityBlockTimeBatch(facilityId, body)
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 시설 반복 차단 일괄 비활성화
    async deactivateFacilityBlockTimeBatch(facilityId, batchId) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.deactivateFacilityBlockTimeBatch(facilityId, batchId)
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 시설 차단 시간 단건 비활성화
    async deactivateFacilityBlockTime(facilityId, blockTimeId) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.deactivateFacilityBlockTime(facilityId, blockTimeId)
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 시설 차단 시간 단건 수정
    async updateFacilityBlockTime(facilityId, blockTimeId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.updateFacilityBlockTime(facilityId, blockTimeId, body)
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 정기 휴무 규칙 등록
    async createClosureRule(facilityId, body) {
      this.loading = true
      this.error = null
      try {
        return await facilityApi.createClosureRule(facilityId, body)
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 정기 휴무 규칙 목록 조회
    async fetchClosureRules(facilityId) {
      this.loading = true
      this.error = null
      try {
        return await facilityApi.getClosureRules(facilityId)
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 정기 휴무 규칙 수정
    async updateClosureRule(facilityId, ruleId, body) {
      this.loading = true
      this.error = null
      try {
        return await facilityApi.updateClosureRule(facilityId, ruleId, body)
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 정기 휴무 규칙 비활성화
    async deactivateClosureRule(facilityId, ruleId) {
      this.loading = true
      this.error = null
      try {
        return await facilityApi.deactivateClosureRule(facilityId, ruleId)
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 좌석 목록 조회
    async fetchFacilitySeats(facilityId) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.getFacilitySeats(facilityId)
        this.facilitySeats = toList(res)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 좌석 등록
    async createFacilitySeat(facilityId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.createFacilitySeat(facilityId, body)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 좌석 일괄 등록
    async bulkCreateFacilitySeats(facilityId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.bulkCreateFacilitySeats(facilityId, body)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 시설 좌석 수정
    async updateFacilitySeat(seatId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.updateFacilitySeat(seatId, body)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
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
        return res
      } catch (e) {
        this.error = e
        throw e
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
        return res
      } catch (e) {
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 입주민 좌석 상태 조회
    async fetchResidentSeatStatus(facilityId, params) {
      this.loading = true
      this.error = null
      try {
        const res = await facilityApi.getResidentSeatStatus(facilityId, params)
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

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFacilityStore, import.meta.hot))
}
