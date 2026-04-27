// 알림 관련 API를 관리합니다.
import apiClient from './apiClient'

export default {
  // 알림 목록 조회
  getNotifications(params) {
    return apiClient.get('/api/notifications', { params })
  },
  // 미읽음 알림 수 조회
  getUnreadCount() {
    return apiClient.get('/api/notifications/unread-count')
  },
  // 알림 읽음 처리
  readNotification(notificationUid) {
    return apiClient.patch(`/api/notifications/${notificationUid}/read`)
  },
  // 전체 알림 읽음 처리
  readAllNotifications() {
    return apiClient.patch('/api/notifications/read-all')
  },
  // FCM 토큰 등록
  registerFcmToken(body) {
    return apiClient.post('/api/notifications/fcm-token', body)
  },
  // FCM 토큰 해제
  deleteFcmToken(body) {
    return apiClient.delete('/api/notifications/fcm-token', { data: body })
  },
  // FCM 토큰 갱신
  updateFcmToken(body) {
    return apiClient.patch('/api/notifications/fcm-token', body)
  },
}
