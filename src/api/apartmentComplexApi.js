import apiClient from './apiClient'

// MASTER 단지 등록
export const createComplex = async (body) => {
  const res = await apiClient.post('/api/admin/master/apartment-complexes', body)
  return res.data
}

// MASTER 단지 목록 조회
export const getMasterComplexes = async (params) => {
  const res = await apiClient.get('/api/admin/master/apartment-complexes', { params })
  return res.data
}

// MASTER 단지 상세 조회
export const getMasterComplexDetail = async (code) => {
  const res = await apiClient.get(`/api/admin/master/apartment-complexes/${code}`)
  return res.data
}

// MASTER 단지 수정
export const updateComplex = async (code, body) => {
  const res = await apiClient.patch(`/api/admin/master/apartment-complexes/${code}`, body)
  return res.data
}

// MASTER 단지 상태 변경
export const updateComplexStatus = async (code, body) => {
  const res = await apiClient.patch(`/api/admin/master/apartment-complexes/${code}/status`, body)
  return res.data
}

// MASTER 관리자 단지 소속 지정
export const assignComplexAdmin = async (code, body) => {
  const res = await apiClient.post(`/api/admin/master/apartment-complexes/${code}/admins`, body)
  return res.data
}

// MASTER 관리자 단지 소속 목록 조회
export const getComplexAdmins = async (code) => {
  const res = await apiClient.get(`/api/admin/master/apartment-complexes/${code}/admins`)
  return res.data
}

// MASTER 관리자 단지 소속 해제
export const unassignComplexAdmin = async (code, userId) => {
  const res = await apiClient.delete(`/api/admin/master/apartment-complexes/${code}/admins/${userId}`)
  return res.data
}

// 공개 단지 목록 조회
export const getPublicComplexes = async (params) => {
  const res = await apiClient.get('/api/apartment-complexes', { params })
  return res.data
}

export default {
  createComplex,
  getMasterComplexes,
  getMasterComplexDetail,
  updateComplex,
  updateComplexStatus,
  assignComplexAdmin,
  getComplexAdmins,
  unassignComplexAdmin,
  getPublicComplexes,
}
