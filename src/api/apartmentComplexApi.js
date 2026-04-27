// 단지 관련 API를 관리합니다.
import apiClient from './apiClient'

export default {
  // MASTER 단지 등록
  createComplex(body) {
    return apiClient.post('/api/admin/master/apartment-complexes', body)
  },
  // MASTER 단지 목록 조회
  getMasterComplexes(params) {
    return apiClient.get('/api/admin/master/apartment-complexes', { params })
  },
  // MASTER 단지 상세 조회
  getMasterComplexDetail(code) {
    return apiClient.get(`/api/admin/master/apartment-complexes/${code}`)
  },
  // MASTER 단지 수정
  updateComplex(code, body) {
    return apiClient.patch(`/api/admin/master/apartment-complexes/${code}`, body)
  },
  // MASTER 단지 상태 변경
  updateComplexStatus(code, body) {
    return apiClient.patch(`/api/admin/master/apartment-complexes/${code}/status`, body)
  },
  // MASTER 관리자 단지 소속 지정
  assignComplexAdmin(code, body) {
    return apiClient.post(`/api/admin/master/apartment-complexes/${code}/admins`, body)
  },
  // MASTER 관리자 단지 소속 목록 조회
  getComplexAdmins(code) {
    return apiClient.get(`/api/admin/master/apartment-complexes/${code}/admins`)
  },
  // MASTER 관리자 단지 소속 해제
  unassignComplexAdmin(code, userId) {
    return apiClient.delete(`/api/admin/master/apartment-complexes/${code}/admins/${userId}`)
  },
  // 공개 단지 목록 조회
  getPublicComplexes(params) {
    return apiClient.get('/api/apartment-complexes', { params })
  },
}
