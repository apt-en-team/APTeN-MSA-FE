import apiClient from './apiClient'

// 알림 목록 조회
export const getNotifications = async (params) => {
  const res = await apiClient.get('/api/notifications', { params })
  return res.data
}

// 미읽음 알림 수 조회
export const getUnreadCount = async () => {
  const res = await apiClient.get('/api/notifications/unread-count')
  return res.data
}

// 알림 읽음 처리
export const readNotification = async (notificationUid) => {
  const res = await apiClient.patch(`/api/notifications/${notificationUid}/read`)
  return res.data
}

// 전체 알림 읽음 처리
export const readAllNotifications = async () => {
  const res = await apiClient.patch('/api/notifications/read-all')
  return res.data
}

// FCM 토큰 등록
export const registerFcmToken = async (body) => {
  const res = await apiClient.post('/api/notifications/fcm-token', body)
  return res.data
}

// FCM 토큰 해제
export const deleteFcmToken = async (body) => {
  const res = await apiClient.delete('/api/notifications/fcm-token', { data: body })
  return res.data
}

// FCM 토큰 갱신
export const updateFcmToken = async (body) => {
  const res = await apiClient.patch('/api/notifications/fcm-token', body)
  return res.data
}

export default {
  getNotifications,
  getUnreadCount,
  readNotification,
  readAllNotifications,
  registerFcmToken,
  deleteFcmToken,
  updateFcmToken,
}
