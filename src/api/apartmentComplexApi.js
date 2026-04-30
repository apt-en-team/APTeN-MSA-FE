import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// MASTER 단지 등록
export const createComplex = async (body) => {
  // 단지 등록 시 최초 관리자 정보는 백엔드가 Auth Service 내부 호출로 함께 처리합니다.
  const res = await apiClient.post('/api/admin/master/apartment-complexes', body)
  return unwrapApiData(res)
}

// MASTER 단지 목록 조회
export const getMasterComplexes = async (params) => {
  const res = await apiClient.get('/api/admin/master/apartment-complexes', { params })
  return unwrapApiData(res)
}

// MASTER 단지 상세 조회
export const getMasterComplexDetail = async (code) => {
  const res = await apiClient.get(`/api/admin/master/apartment-complexes/${code}`)
  return unwrapApiData(res)
}

// MASTER 단지 수정
export const updateComplex = async (code, body) => {
  const res = await apiClient.patch(`/api/admin/master/apartment-complexes/${code}`, body)
  return unwrapApiData(res)
}

// MASTER 단지 상태 변경
export const updateComplexStatus = async (code, body) => {
  const res = await apiClient.patch(`/api/admin/master/apartment-complexes/${code}/status`, body)
  return unwrapApiData(res)
}

// 주소 검색
export const searchAddress = async (params) => {
  // 프론트는 VWorld를 직접 호출하지 않고 백엔드 주소 검색 API만 호출합니다.
  const res = await apiClient.get('/api/admin/master/address/search', { params })
  return unwrapApiData(res)
}

// MASTER 관리자 계정 생성 및 단지 소속 등록
export const createComplexAdmin = async (code, body) => {
  // 관리자 계정 생성은 단지 API를 호출하면 백엔드가 Auth Service 내부 호출로 처리합니다.
  const res = await apiClient.post(`/api/admin/master/apartment-complexes/${code}/admins`, body)
  return unwrapApiData(res)
}

// MASTER 관리자 단지 소속 목록 조회
export const getComplexAdmins = async (code) => {
  const res = await apiClient.get(`/api/admin/master/apartment-complexes/${code}/admins`)
  return unwrapApiData(res)
}

// MASTER 관리자 권한 수정
export const updateComplexAdmin = async (code, userId, body) => {
  const res = await apiClient.patch(`/api/admin/master/apartment-complexes/${code}/admins/${userId}`, body)
  return unwrapApiData(res)
}

// MASTER 관리자 삭제
export const deleteComplexAdmin = async (code, userId) => {
  // 관리자 삭제는 백엔드에서 소속 해제와 계정 소프트 삭제를 함께 처리합니다.
  const res = await apiClient.delete(`/api/admin/master/apartment-complexes/${code}/admins/${userId}`)
  return unwrapApiData(res)
}

// 공개 단지 목록 조회
export const getPublicComplexes = async (params) => {
  const res = await apiClient.get('/api/apartment-complexes', { params })
  return unwrapApiData(res)
}

// MASTER 단지 선택
export const selectMasterComplex = async (code) => {
  const res = await apiClient.get(`/api/admin/master/apartment-complexes/${code}/select`)
  return unwrapApiData(res)
}

// 기존 함수명과의 호환을 유지합니다.
export const assignComplexAdmin = createComplexAdmin

// 기존 함수명과의 호환을 유지합니다.
export const unassignComplexAdmin = deleteComplexAdmin

export default {
  createComplex,
  getMasterComplexes,
  getMasterComplexDetail,
  updateComplex,
  updateComplexStatus,
  searchAddress,
  createComplexAdmin,
  updateComplexAdmin,
  deleteComplexAdmin,
  assignComplexAdmin,
  getComplexAdmins,
  unassignComplexAdmin,
  getPublicComplexes,
  selectMasterComplex,
}
