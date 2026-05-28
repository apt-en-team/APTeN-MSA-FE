import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 관리자 투표 생성
export const createVote = async (body) => {
  const res = await apiClient.post('/admin/votes', body)
  return unwrapApiData(res)
}

// 입주민 투표 참여
export const submitVote = async (voteId, body) => {
  const res = await apiClient.post(`/votes/${voteId}/participations`, body)
  return unwrapApiData(res)
}

// 관리자 투표 결과 조회
export const getVoteResult = async (voteId) => {
  const res = await apiClient.get(`/admin/votes/${voteId}/results`)
  return unwrapApiData(res)
}

// 입주민 투표 목록 조회
export const getVotes = async (params) => {
  const res = await apiClient.get('/votes', { params })
  return unwrapApiData(res)
}

// 입주민 투표 상세 조회
export const getVoteDetail = async (voteId) => {
  const res = await apiClient.get(`/votes/${voteId}`)
  return unwrapApiData(res)
}

// 관리자 투표 목록 조회
export const getAdminVotes = async (params) => {
  const res = await apiClient.get('/admin/votes', { params })
  return unwrapApiData(res)
}

// 관리자 투표 상세 조회
export const getAdminVoteDetail = async (voteId) => {
  const res = await apiClient.get(`/admin/votes/${voteId}`)
  return unwrapApiData(res)
}

// 관리자 투표 수정
export const updateVote = async (voteId, body) => {
  const res = await apiClient.patch(`/admin/votes/${voteId}`, body)
  return unwrapApiData(res)
}

// 관리자 투표 삭제
export const deleteVote = async (voteId) => {
  const res = await apiClient.delete(`/admin/votes/${voteId}`)
  return unwrapApiData(res)
}

// 관리자 투표 종료 처리
export const closeVote = async (voteId) => {
  const res = await apiClient.patch(`/admin/votes/${voteId}/close`)
  return unwrapApiData(res)
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
