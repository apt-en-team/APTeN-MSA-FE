import { defineStore } from 'pinia'
import noticeApi from '@/api/noticeApi'

export const useNoticeStore = defineStore('notice', {
  state: () => ({
    loading: false,
    error: null,
    notices: [],
    noticeDetail: null,
  }),

  actions: {
    // 관리자 공지 목록 조회
    async fetchAdminNotices(params) {
      this.loading = true
      this.error = null
      try {
        const res = await noticeApi.getAdminNotices(params)
        this.notices = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 공지 상세 조회
    async fetchAdminNoticeDetail(noticeId) {
      this.loading = true
      this.error = null
      try {
        const res = await noticeApi.getAdminNoticeDetail(noticeId)
        this.noticeDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 공지 작성
    async createNotice(body) {
      this.loading = true
      this.error = null
      try {
        const res = await noticeApi.createNotice(body)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 공지 수정
    async updateNotice(noticeId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await noticeApi.updateNotice(noticeId, body)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 공지 삭제
    async deleteNotice(noticeId) {
      this.loading = true
      this.error = null
      try {
        const res = await noticeApi.deleteNotice(noticeId)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 입주민 공지 목록 조회
    async fetchNotices(params) {
      this.loading = true
      this.error = null
      try {
        const res = await noticeApi.getNotices(params)
        this.notices = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 입주민 공지 상세 조회
    async fetchNoticeDetail(noticeId) {
      this.loading = true
      this.error = null
      try {
        const res = await noticeApi.getNoticeDetail(noticeId)
        this.noticeDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
