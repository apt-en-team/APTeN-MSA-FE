import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 주차 센서 단건 등록
export const createSensor = async (payload) => {
  const res = await apiClient.post('/admin/parking/sensors', payload)
  return unwrapApiData(res)
}

// 주차 센서 일괄 등록
export const createSensorsBulk = async (payload) => {
  const res = await apiClient.post('/admin/parking/sensors/bulk', payload)
  return unwrapApiData(res)
}

// 주차 센서 목록 조회
export const getSensorList = async (zoneId) => {
  const res = await apiClient.get('/admin/parking/sensors', { params: { zoneId } })
  return unwrapApiData(res)
}

// 주차 센서 단건 조회
export const getSensor = async (sensorId) => {
  const res = await apiClient.get(`/admin/parking/sensors/${sensorId}`)
  return unwrapApiData(res)
}

// 주차 센서 수정
export const updateSensor = async (sensorId, payload) => {
  const res = await apiClient.patch(`/admin/parking/sensors/${sensorId}`, payload)
  return unwrapApiData(res)
}

// 주차 센서 소프트 삭제
export const deleteSensor = async (sensorId) => {
  const res = await apiClient.delete(`/admin/parking/sensors/${sensorId}`)
  return unwrapApiData(res)
}

export default {
  createSensor,
  createSensorsBulk,
  getSensorList,
  getSensor,
  updateSensor,
  deleteSensor,
}
