import apiClient from './apiClient'
import { unwrapApiData } from '@/utils/apiResponse'

// 알림 목록 조회 (페이지 응답)
export const getNotifications = async (params) => {
  const res = await apiClient.get('/notifications', { params })
  return unwrapApiData(res)
}

// 미읽음 알림 수 조회
export const getUnreadCount = async () => {
  const res = await apiClient.get('/notifications/unread-count')
  return unwrapApiData(res)
}

// 개별 알림 읽음 처리 — notificationId Long 기준
export const readNotification = async (notificationId) => {
  const res = await apiClient.patch(`/notifications/${notificationId}/read`)
  return unwrapApiData(res)
}

// 전체 알림 읽음 처리
export const readAllNotifications = async () => {
  const res = await apiClient.patch('/notifications/read-all')
  return unwrapApiData(res)
}

// 알림 설정 조회
export const getNotificationSettings = async () => {
  const res = await apiClient.get('/notifications/settings')
  return unwrapApiData(res)
}

// 알림 설정 저장
export const updateNotificationSettings = async (payload) => {
  const res = await apiClient.patch('/notifications/settings', payload)
  return unwrapApiData(res)
}

// FCM 토큰 등록 (/fcm-tokens 복수형)
export const registerFcmToken = async (payload) => {
  const res = await apiClient.post('/notifications/fcm-tokens', payload)
  return unwrapApiData(res)
}

// FCM 토큰 비활성화
export const deleteFcmToken = async (payload) => {
  const res = await apiClient.delete('/notifications/fcm-tokens', { data: payload })
  return unwrapApiData(res)
}

// FCM 토큰 갱신
export const updateFcmToken = async (payload) => {
  const res = await apiClient.patch('/notifications/fcm-tokens', payload)
  return unwrapApiData(res)
}

export default {
  getNotifications,
  getUnreadCount,
  readNotification,
  readAllNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  registerFcmToken,
  deleteFcmToken,
  updateFcmToken,
}
