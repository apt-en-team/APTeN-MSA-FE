// 알림 상태 store 공통 구조를 정의합니다.
import { defineStore } from 'pinia'
import notificationApi from '@/api/notification'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    items: [],
    unreadCount: 0,
    selectedItem: null,
  }),
  getters: {
    hasUnread: (state) => state.unreadCount > 0,
    itemCount: (state) => state.items.length,
  },
  actions: {
    async fetchNotifications(params) {
      try {
        // TODO: 알림 목록 API 연동을 구현합니다.
        await notificationApi.getNotifications(params)
      } catch (error) {
        throw error
      }
    },
    async fetchUnreadCount() {
      try {
        // TODO: 읽지 않은 알림 수 API 연동을 구현합니다.
        await notificationApi.getUnreadCount()
      } catch (error) {
        throw error
      }
    },
    async readNotification(notificationId) {
      try {
        // TODO: 단건 읽음 처리 API 연동을 구현합니다.
        await notificationApi.readNotification(notificationId)
      } catch (error) {
        throw error
      }
    },
    async readAllNotifications() {
      try {
        // TODO: 전체 읽음 처리 API 연동을 구현합니다.
        await notificationApi.readAllNotifications()
      } catch (error) {
        throw error
      }
    },
  },
})
