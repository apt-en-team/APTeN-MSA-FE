// 알림 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import notificationApi from '@/api/notificationApi'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    loading: false,
    error: null,
    notifications: [],
    unreadCount: 0,
  }),
  getters: {
    hasUnread: (state) => state.unreadCount > 0,
  },
  actions: {
    // 알림 목록 조회
    async fetchNotifications(params) {
      this.loading = true
      this.error = null
      try {
        const res = await notificationApi.getNotifications(params)
        this.notifications = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 미읽음 알림 수 조회
    async fetchUnreadCount() {
      this.loading = true
      this.error = null
      try {
        const res = await notificationApi.getUnreadCount()
        this.unreadCount = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 알림 읽음 처리
    async readNotification(notificationUid) {
      this.loading = true
      this.error = null
      try {
        const res = await notificationApi.readNotification(notificationUid)
        this.unreadCount = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 전체 알림 읽음 처리
    async readAllNotifications() {
      this.loading = true
      this.error = null
      try {
        const res = await notificationApi.readAllNotifications()
        this.unreadCount = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // FCM 토큰 등록
    async registerFcmToken(body) {
      this.loading = true
      this.error = null
      try {
        const res = await notificationApi.registerFcmToken(body)
        this.notifications = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // FCM 토큰 해제
    async deleteFcmToken(body) {
      this.loading = true
      this.error = null
      try {
        const res = await notificationApi.deleteFcmToken(body)
        this.notifications = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // FCM 토큰 갱신
    async updateFcmToken(body) {
      this.loading = true
      this.error = null
      try {
        const res = await notificationApi.updateFcmToken(body)
        this.notifications = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
