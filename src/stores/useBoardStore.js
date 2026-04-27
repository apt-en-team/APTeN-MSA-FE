// 게시판 상태 store를 관리합니다.
import { defineStore } from 'pinia'

export const useBoardStore = defineStore('board', {
  state: () => ({
    notices: [],
    votes: [],
    selectedItem: null,
  }),
  getters: {
    noticeCount: (state) => state.notices.length,
  },
  actions: {
    // 공지 목록 조회 구조를 정의합니다.
    async fetchNotices(params) {
      try {
        void params
        // TODO: 최신 게시판 API 모듈 연결 예정
      } catch (error) {
        throw error
      }
    },
  },
})
