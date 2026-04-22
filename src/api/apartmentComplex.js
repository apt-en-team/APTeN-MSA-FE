// 아파트 단지 관련 API 함수를 관리합니다.
import apiClient from './apiClient'

export default {
  getApartmentComplexList: (params) => apiClient.get('/apartment-complexes', { params }),
  getAdminComplexList: (params) => apiClient.get('/admin/apartment-complexes', { params }),
  getAdminComplexDetail: (complexId) => apiClient.get(`/admin/apartment-complexes/${complexId}`),
  createApartmentComplex: (data) => apiClient.post('/admin/apartment-complexes', data),
  updateApartmentComplex: (complexId, data) =>
    apiClient.patch(`/admin/apartment-complexes/${complexId}`, data),
}
