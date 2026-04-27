import apiClient from './apiClient'

// 관리자 투표 생성
export const createVote = async (body) => {
  const res = await apiClient.post('/api/admin/votes', body)
  return res.data
}

// 입주민 투표 참여
export const submitVote = async (voteId, body) => {
  const res = await apiClient.post(`/api/votes/${voteId}/participations`, body)
  return res.data
}

// 관리자 투표 결과 조회
export const getVoteResult = async (voteId) => {
  const res = await apiClient.get(`/api/admin/votes/${voteId}/results`)
  return res.data
}

// 입주민 투표 목록 조회
export const getVotes = async (params) => {
  const res = await apiClient.get('/api/votes', { params })
  return res.data
}

// 입주민 투표 상세 조회
export const getVoteDetail = async (voteId) => {
  const res = await apiClient.get(`/api/votes/${voteId}`)
  return res.data
}

// 관리자 투표 목록 조회
export const getAdminVotes = async (params) => {
  const res = await apiClient.get('/api/admin/votes', { params })
  return res.data
}

// 관리자 투표 상세 조회
export const getAdminVoteDetail = async (voteId) => {
  const res = await apiClient.get(`/api/admin/votes/${voteId}`)
  return res.data
}

// 관리자 투표 수정
export const updateVote = async (voteId, body) => {
  const res = await apiClient.patch(`/api/admin/votes/${voteId}`, body)
  return res.data
}

// 관리자 투표 삭제
export const deleteVote = async (voteId) => {
  const res = await apiClient.delete(`/api/admin/votes/${voteId}`)
  return res.data
}

// 관리자 투표 종료 처리
export const closeVote = async (voteId) => {
  const res = await apiClient.patch(`/api/admin/votes/${voteId}/close`)
  return res.data
}

export default {
  createVote,
  submitVote,
  getVoteResult,
  getVotes,
  getVoteDetail,
  getAdminVotes,
  getAdminVoteDetail,
  updateVote,
  deleteVote,
  closeVote,
}
