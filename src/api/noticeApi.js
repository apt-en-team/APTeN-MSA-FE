import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 관리자 공지 작성
export const createNotice = async (body) => {
  const res = await apiClient.post('/admin/notices', body)
  return unwrapApiData(res)
}

// 입주민 공지 목록 조회
export const getNotices = async (params) => {
  const res = await apiClient.get('/notices', { params })
  return unwrapApiData(res)
}

// 입주민 공지 상세 조회
export const getNoticeDetail = async (noticeId) => {
  const res = await apiClient.get(`/notices/${noticeId}`)
  return unwrapApiData(res)
}

// 관리자 공지 수정
export const updateNotice = async (noticeId, body) => {
  const res = await apiClient.patch(`/admin/notices/${noticeId}`, body)
  return unwrapApiData(res)
}

// 관리자 공지 삭제
export const deleteNotice = async (noticeId) => {
  const res = await apiClient.delete(`/admin/notices/${noticeId}`)
  return unwrapApiData(res)
}

// 관리자 공지 목록 조회
export const getAdminNotices = async (params) => {
  const res = await apiClient.get('/admin/notices', { params })
  return unwrapApiData(res)
}

// 관리자 공지 상세 조회
export const getAdminNoticeDetail = async (noticeId) => {
  const res = await apiClient.get(`/admin/notices/${noticeId}`)
  return unwrapApiData(res)
}

export default {
  createNotice,
  getNotices,
  getNoticeDetail,
  updateNotice,
  deleteNotice,
  getAdminNotices,
  getAdminNoticeDetail,
}
