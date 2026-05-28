import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// MASTER 단지 등록
export const createComplex = async (body) => {
  // 단지 등록 시 최초 관리자 정보는 백엔드가 Auth Service 내부 호출로 함께 처리합니다.
  const res = await apiClient.post('/admin/master/apartment-complexes', body)
  return unwrapApiData(res)
}

// MASTER 단지 목록 조회
export const getMasterComplexes = async (params) => {
  const res = await apiClient.get('/admin/master/apartment-complexes', { params })
  return unwrapApiData(res)
}

// MASTER 단지 상세 조회
export const getMasterComplexDetail = async (code) => {
  const res = await apiClient.get(`/admin/master/apartment-complexes/${code}`)
  return unwrapApiData(res)
}

// MASTER 단지 수정
export const updateComplex = async (code, body) => {
  const res = await apiClient.patch(`/admin/master/apartment-complexes/${code}`, body)
  return unwrapApiData(res)
}

// MASTER 단지 상태 변경
export const updateComplexStatus = async (code, body) => {
  const res = await apiClient.patch(`/admin/master/apartment-complexes/${code}/status`, body)
  return unwrapApiData(res)
}

// 주소 검색
export const searchAddress = async (params) => {
  // 프론트는 VWorld를 직접 호출하지 않고 백엔드 주소 검색 API만 호출합니다.
  const res = await apiClient.get('/admin/master/apartment-complexes/address/search', {
    params,
  })

  return unwrapApiData(res)
}

// MASTER 관리자 계정 생성 및 단지 소속 등록
export const createComplexAdmin = async (code, body) => {
  // 관리자 계정 생성은 단지 API를 호출하면 백엔드가 Auth Service 내부 호출로 처리합니다.
  const res = await apiClient.post(`/admin/master/apartment-complexes/${code}/admins`, body)
  return unwrapApiData(res)
}

// 일반 관리자 내 단지 정보 조회
export const getMyApartmentComplex = async () => {
  const res = await apiClient.get('/admin/apartment-complex/me')
  return unwrapApiData(res)
}

// 일반 관리자 내 단지 관리자 목록 조회
export const getMyComplexAdmins = async () => {
  const res = await apiClient.get('/admin/apartment-complex/admins')
  return unwrapApiData(res)
}

// 일반 관리자 내 단지 관리자 생성
export const createAdminForMyComplex = async (body) => {
  const res = await apiClient.post('/admin/apartment-complex/admins', body)
  return unwrapApiData(res)
}

// 일반 관리자 내 단지 관리자 수정
export const updateAdminForMyComplex = async (userId, body) => {
  const res = await apiClient.patch(`/admin/apartment-complex/admins/${userId}`, body)
  return unwrapApiData(res)
}

// 일반 관리자 내 단지 관리자 삭제
export const deleteAdminFromMyComplex = async (userId) => {
  const res = await apiClient.delete(`/admin/apartment-complex/admins/${userId}`)
  return unwrapApiData(res)
}

// 공개 단지 목록 조회
export const getPublicComplexes = async (params) => {
  const res = await apiClient.get('/apartment-complexes', { params })
  return unwrapApiData(res)
}

// 입주민 내 단지 정보 조회
export const getResidentMyComplex = async () => {
  const res = await apiClient.get('/resident/apartment-complex/me')
  return unwrapApiData(res)
}

// MASTER 단지 선택
export const selectMasterComplex = async (code) => {
  const res = await apiClient.get(`/admin/master/apartment-complexes/${code}/select`)
  return unwrapApiData(res)
}

// 기존 함수명과의 호환을 유지합니다.
export const assignComplexAdmin = createComplexAdmin

export default {
  createComplex,
  getMasterComplexes,
  getMasterComplexDetail,
  updateComplex,
  updateComplexStatus,
  searchAddress,
  createComplexAdmin,
  getMyApartmentComplex,
  getMyComplexAdmins,
  createAdminForMyComplex,
  updateAdminForMyComplex,
  deleteAdminFromMyComplex,
  assignComplexAdmin,
  getPublicComplexes,
  getResidentMyComplex,
  selectMasterComplex,
}
