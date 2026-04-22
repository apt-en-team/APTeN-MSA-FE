// 게시판 관련 API 함수를 관리합니다.
import apiClient from './apiClient'

export default {
  getNoticeList: (params) => apiClient.get('/boards/notices', { params }),
  getNoticeDetail: (noticeId) => apiClient.get(`/boards/notices/${noticeId}`),
  getBoardList: (params) => apiClient.get('/boards', { params }),
  getBoardDetail: (boardId) => apiClient.get(`/boards/${boardId}`),
  createBoard: (data) => apiClient.post('/boards', data),
  updateBoard: (boardId, data) => apiClient.patch(`/boards/${boardId}`, data),
  deleteBoard: (boardId) => apiClient.delete(`/boards/${boardId}`),
  getMyBoards: (params) => apiClient.get('/boards/me', { params }),
  getVoteList: (params) => apiClient.get('/votes', { params }),
  getVoteDetail: (voteId) => apiClient.get(`/votes/${voteId}`),
  submitVote: (voteId, data) => apiClient.post(`/votes/${voteId}/submit`, data),
  getComments: (boardId, params) => apiClient.get(`/boards/${boardId}/comments`, { params }),
  createComment: (boardId, data) => apiClient.post(`/boards/${boardId}/comments`, data),
  updateComment: (commentId, data) => apiClient.patch(`/comments/${commentId}`, data),
  deleteComment: (commentId) => apiClient.delete(`/comments/${commentId}`),
}
