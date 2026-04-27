// 챗봇 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import chatbotApi from '@/api/chatbotApi'

export const useChatbotStore = defineStore('chatbot', {
  state: () => ({
    loading: false,
    error: null,
    messages: [],
    faqs: [],
    history: [],
    suggestions: [],
  }),
  getters: {
    hasMessages: (state) => state.messages.length > 0,
  },
  actions: {
    // 챗봇 질의
    async queryChatbot(body) {
      this.loading = true
      this.error = null
      try {
        const res = await chatbotApi.queryChatbot(body)
        this.messages = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 챗봇 FAQ 조회
    async fetchFaqs(params) {
      this.loading = true
      this.error = null
      try {
        const res = await chatbotApi.getChatbotFaqs(params)
        this.faqs = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 챗봇 추천 질문 조회
    async fetchSuggestions(params) {
      this.loading = true
      this.error = null
      try {
        const res = await chatbotApi.getChatbotSuggestions(params)
        this.suggestions = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 챗봇 문의 이력 조회
    async fetchHistory(params) {
      this.loading = true
      this.error = null
      try {
        const res = await chatbotApi.getChatbotHistory(params)
        this.history = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 FAQ 등록
    async createFaq(body) {
      this.loading = true
      this.error = null
      try {
        const res = await chatbotApi.createAdminFaq(body)
        this.faqs = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 FAQ 수정
    async updateFaq(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await chatbotApi.updateAdminFaq(id, body)
        this.faqs = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 FAQ 삭제
    async deleteFaq(id) {
      this.loading = true
      this.error = null
      try {
        const res = await chatbotApi.deleteAdminFaq(id)
        this.faqs = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
