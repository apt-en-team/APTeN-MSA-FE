import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 게시글 작성
export const createPost = async (body) => {
  const res = await apiClient.post('/boards/posts', body)
  return unwrapApiData(res)
}

// 게시글 목록 조회
export const getPosts = async (params) => {
  const res = await apiClient.get('/boards/posts', { params })
  return unwrapApiData(res)
}

// 게시글 상세 조회
export const getPostDetail = async (postId) => {
  const res = await apiClient.get(`/boards/posts/${postId}`)
  return unwrapApiData(res)
}

// 게시글 수정
export const updatePost = async (postId, body) => {
  const res = await apiClient.patch(`/boards/posts/${postId}`, body)
  return unwrapApiData(res)
}

// 게시글 삭제
export const deletePost = async (postId) => {
  const res = await apiClient.delete(`/boards/posts/${postId}`)
  return unwrapApiData(res)
}

// 댓글 작성
export const createComment = async (postId, body) => {
  const res = await apiClient.post(`/boards/posts/${postId}/comments`, body)
  return unwrapApiData(res)
}

// 댓글 수정
export const updateComment = async (commentId, body) => {
  const res = await apiClient.patch(`/boards/comments/${commentId}`, body)
  return unwrapApiData(res)
}

// 댓글 삭제
export const deleteComment = async (commentId) => {
  const res = await apiClient.delete(`/boards/comments/${commentId}`)
  return unwrapApiData(res)
}

// 게시글 좋아요 토글
export const togglePostLike = async (postId) => {
  const res = await apiClient.post(`/boards/posts/${postId}/likes/toggle`)
  return unwrapApiData(res)
}

// 첨부파일 업로드
export const uploadBoardFile = async (formData) => {
  const res = await apiClient.post('/boards/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return unwrapApiData(res)
}

// 내 게시글 목록 조회
export const getMyPosts = async (params) => {
  const res = await apiClient.get('/boards/my-posts', { params })
  return unwrapApiData(res)
}

// 내 댓글 목록 조회
export const getMyComments = async (params) => {
  const res = await apiClient.get('/boards/my-comments', { params })
  return unwrapApiData(res)
}

// 인기글 조회
export const getPopularPosts = async (params) => {
  const res = await apiClient.get('/boards/posts/popular', { params })
  return unwrapApiData(res)
}

// 관리자 게시글 강제 삭제
export const deleteAdminPost = async (postId) => {
  const res = await apiClient.delete(`/admin/boards/posts/${postId}`)
  return unwrapApiData(res)
}

// 관리자 게시글 상세 조회
export const getAdminPostDetail = async (postId) => {
  const res = await apiClient.get(`/api/admin/boards/posts/${postId}`)
  return unwrapApiData(res)
}

// 관리자 댓글 강제 삭제
export const deleteAdminComment = async (commentId) => {
  const res = await apiClient.delete(`/admin/boards/comments/${commentId}`)
  return unwrapApiData(res)
}

// 게시판 통계 조회
export const getBoardStatistics = async (params) => {
  const res = await apiClient.get('/api/admin/boards/statistics', { params })
  return unwrapApiData(res)
}

// 댓글 목록 조회
export const getComments = async (postId, params) => {
  const res = await apiClient.get(`/boards/posts/${postId}/comments`, { params })
  return unwrapApiData(res)
}

export default {
  createPost,
  getPosts,
  getPostDetail,
  updatePost,
  deletePost,
  createComment,
  updateComment,
  deleteComment,
  togglePostLike,
  uploadBoardFile,
  getMyPosts,
  getMyComments,
  getPopularPosts,
  deleteAdminPost,
  getAdminPostDetail,
  deleteAdminComment,
  getBoardStatistics,
  getComments,
}
