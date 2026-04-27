// 단지 상태 store를 관리합니다.
import { defineStore } from 'pinia'
import apartmentComplexApi from '@/api/apartmentComplexApi'

export const useComplexStore = defineStore('complex', {
  state: () => ({
    items: [],
    selectedComplex: null,
    complexAdmins: [],
  }),
  getters: {
    complexCount: (state) => state.items.length,
  },
  actions: {
    // MASTER 단지 목록 조회
    async fetchMasterComplexes(params) {
      return apartmentComplexApi.getMasterComplexes(params)
    },
    // MASTER 단지 상세 조회
    async fetchMasterComplexDetail(code) {
      return apartmentComplexApi.getMasterComplexDetail(code)
    },
    // MASTER 단지 등록
    async createComplex(body) {
      return apartmentComplexApi.createComplex(body)
    },
    // MASTER 단지 수정
    async updateComplex(code, body) {
      return apartmentComplexApi.updateComplex(code, body)
    },
    // MASTER 단지 상태 변경
    async updateComplexStatus(code, body) {
      return apartmentComplexApi.updateComplexStatus(code, body)
    },
    // MASTER 단지 관리자 목록 조회
    async fetchComplexAdmins(code) {
      return apartmentComplexApi.getComplexAdmins(code)
    },
    // MASTER 단지 관리자 지정
    async assignComplexAdmin(code, body) {
      return apartmentComplexApi.assignComplexAdmin(code, body)
    },
    // MASTER 단지 관리자 해제
    async unassignComplexAdmin(code, userId) {
      return apartmentComplexApi.unassignComplexAdmin(code, userId)
    },
    // 공개 단지 목록 조회
    async fetchPublicComplexes(params) {
      return apartmentComplexApi.getPublicComplexes(params)
    },
    // 현재 선택 단지 저장
    setSelectedComplex(complex) {
      this.selectedComplex = complex
    },
  },
})
