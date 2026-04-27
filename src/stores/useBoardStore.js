// 게시판 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import boardApi from '@/api/boardApi'

export const useBoardStore = defineStore('board', {
  state: () => ({
    loading: false,
    error: null,
    posts: [],
    postDetail: null,
    comments: [],
    myPosts: [],
    myComments: [],
    popularPosts: [],
    boardStatistics: null,
  }),
  getters: {
    hasPostDetail: (state) => !!state.postDetail,
  },
  actions: {
    // 게시글 목록 조회
    async fetchPosts(params) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.getPosts(params)
        this.posts = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 게시글 상세 조회
    async fetchPostDetail(id) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.getPostDetail(id)
        this.postDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 게시글 작성
    async createPost(body) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.createPost(body)
        this.postDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 게시글 수정
    async updatePost(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.updatePost(id, body)
        this.postDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 게시글 삭제
    async deletePost(id) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.deletePost(id)
        this.postDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 댓글 목록 조회
    async fetchComments(postId) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.getComments(postId)
        this.comments = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 댓글 작성
    async createComment(postId, body) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.createComment(postId, body)
        this.comments = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 댓글 수정
    async updateComment(id, body) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.updateComment(id, body)
        this.comments = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 댓글 삭제
    async deleteComment(id) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.deleteComment(id)
        this.comments = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 게시글 좋아요 토글
    async togglePostLike(postId) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.togglePostLike(postId)
        this.postDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 내 게시글 목록 조회
    async fetchMyPosts(params) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.getMyPosts(params)
        this.myPosts = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 내 댓글 목록 조회
    async fetchMyComments(params) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.getMyComments(params)
        this.myComments = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 인기글 조회
    async fetchPopularPosts(params) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.getPopularPosts(params)
        this.popularPosts = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 게시글 강제 삭제
    async deleteAdminPost(id) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.deleteAdminPost(id)
        this.postDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 댓글 강제 삭제
    async deleteAdminComment(id) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.deleteAdminComment(id)
        this.comments = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 게시판 통계 조회
    async fetchBoardStatistics(params) {
      this.loading = true
      this.error = null
      try {
        const res = await boardApi.getBoardStatistics(params)
        this.boardStatistics = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
