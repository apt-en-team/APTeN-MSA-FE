// 알림 상태 store를 관리합니다.
import { defineStore } from 'pinia'
import notificationApi from '@/api/notificationApi'

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
    // 알림 목록을 조회합니다.
    async fetchNotifications(params) {
      try {
        return await notificationApi.getNotifications(params)
      } catch (error) {
        throw error
      }
    },
    // 미읽음 알림 수를 조회합니다.
    async fetchUnreadCount() {
      try {
        return await notificationApi.getUnreadCount()
      } catch (error) {
        throw error
      }
    },
    // 알림 단건 읽음 처리를 호출합니다.
    async readNotification(notificationId) {
      try {
        return await notificationApi.readNotification(notificationId)
      } catch (error) {
        throw error
      }
    },
    // 알림 전체 읽음 처리를 호출합니다.
    async readAllNotifications() {
      try {
        return await notificationApi.readAllNotifications()
      } catch (error) {
        throw error
      }
    },
  },
})
