import { defineStore } from 'pinia'
import voteApi from '@/api/voteApi'

export const useVoteStore = defineStore('vote', {
  state: () => ({
    loading: false,
    error: null,

    // 관리자 — content + summary 포함
    adminVotes: null,   // VotePageResponse { content, summary, page, ... }
    adminVoteDetail: null,
    voteResult: null,

    // 입주민
    votes: [],
    voteDetail: null,
  }),

  actions: {
    // ── 관리자 ──────────────────────────────────────────

    // 관리자 투표 목록 조회 (summary 포함)
    async fetchAdminVotes(params) {
      this.loading = true
      this.error = null
      try {
        const res = await voteApi.getAdminVotes(params)
        this.adminVotes = res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 관리자 투표 상세 조회
    async fetchAdminVoteDetail(voteId) {
      this.loading = true
      this.error = null
      try {
        const res = await voteApi.getAdminVoteDetail(voteId)
        this.adminVoteDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 투표 결과 조회
    async fetchVoteResult(voteId) {
      this.loading = true
      this.error = null
      try {
        const res = await voteApi.getVoteResult(voteId)
        this.voteResult = res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 투표 생성
    async createVote(body) {
      this.loading = true
      this.error = null
      try {
        const res = await voteApi.createVote(body)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 투표 수정
    async updateVote(voteId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await voteApi.updateVote(voteId, body)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 투표 삭제
    async deleteVote(voteId) {
      this.loading = true
      this.error = null
      try {
        const res = await voteApi.deleteVote(voteId)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 투표 종료
    async closeVote(voteId) {
      this.loading = true
      this.error = null
      try {
        const res = await voteApi.closeVote(voteId)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // ── 입주민 ──────────────────────────────────────────

    // 입주민 투표 목록 조회
    async fetchVotes(params) {
      this.loading = true
      this.error = null
      try {
        const res = await voteApi.getVotes(params)
        this.votes = res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 입주민 투표 상세 조회
    async fetchVoteDetail(voteId) {
      this.loading = true
      this.error = null
      try {
        const res = await voteApi.getVoteDetail(voteId)
        this.voteDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 투표 참여
    async submitVote(voteId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await voteApi.submitVote(voteId, body)
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
