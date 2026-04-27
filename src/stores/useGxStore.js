// GX 프로그램 상태 store를 관리합니다.
import { defineStore } from 'pinia'

export const useGxStore = defineStore('gx', {
  state: () => ({
    programs: [],
    selectedProgram: null,
  }),
  getters: {
    programCount: (state) => state.programs.length,
  },
  actions: {
    // GX 프로그램 목록 조회 구조를 정의합니다.
    async fetchPrograms(params) {
      try {
        void params
        // TODO: 최신 GX API 모듈 연결 예정
      } catch (error) {
        throw error
      }
    },
  },
})
