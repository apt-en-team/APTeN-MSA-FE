// 챗봇 상태 store를 관리합니다.
import { defineStore } from 'pinia'

export const useChatbotStore = defineStore('chatbot', {
  state: () => ({
    faqs: [],
    history: [],
  }),
  getters: {
    faqCount: (state) => state.faqs.length,
  },
  actions: {
    // FAQ 목록 조회 구조를 정의합니다.
    async fetchFaqs(params) {
      try {
        void params
        // TODO: 최신 챗봇 API 모듈 연결 예정
      } catch (error) {
        throw error
      }
    },
  },
})
