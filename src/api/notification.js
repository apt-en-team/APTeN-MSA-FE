// 알림 관련 API 함수를 관리합니다.
import apiClient from './apiClient'

export default {
  getNotifications: (params) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  readNotification: (notificationId) => apiClient.patch(`/notifications/${notificationId}/read`),
  readAllNotifications: () => apiClient.patch('/notifications/read-all'),
  registerFcmToken: (data) => apiClient.post('/notifications/fcm-tokens', data),
  deleteFcmToken: (tokenId) => apiClient.delete(`/notifications/fcm-tokens/${tokenId}`),
  updateFcmToken: (tokenId, data) => apiClient.patch(`/notifications/fcm-tokens/${tokenId}`, data),
}
