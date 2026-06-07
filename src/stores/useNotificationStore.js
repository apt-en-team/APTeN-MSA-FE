import { defineStore } from 'pinia'
import notificationApi from '@/api/notificationApi'
import { toList, isPageResponse } from '@/utils/apiResponse'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    // 알림 목록
    notifications: [],
    unreadCount: 0,

    // 페이지네이션
    page: 1,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,

    // 알림 수신 설정
    settings: [],

    // UI 상태
    loading: false,
    error: null,
    dropdownOpen: false,
    toasts: [],

    // WebSocket 연결 상태
    socketConnected: false,
  }),

  getters: {
    hasUnread: (state) => state.unreadCount > 0,
    unreadBadgeLabel: (state) => {
      if (state.unreadCount <= 0) return ''
      return state.unreadCount > 99 ? '99+' : String(state.unreadCount)
    },
  },

  actions: {
    // 알림 목록 조회 (페이지 응답 처리)
    async fetchNotifications(params = {}) {
      this.loading = true
      this.error = null
      try {
        const res = await notificationApi.getNotifications({
          page: this.page - 1, // 백엔드는 0-based
          size: this.size,
          ...params,
        })

        if (isPageResponse(res)) {
          // 페이지 응답 구조: { content, totalElements, totalPages, number, ... }
          this.notifications = toList(res)
          this.totalElements = res.totalElements ?? 0
          this.totalPages = res.totalPages ?? 1
          this.hasNext = res.last === false
        } else {
          // 배열로 내려올 경우 대비
          this.notifications = toList(res)
        }
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 미읽음 알림 수 조회
    async fetchUnreadCount() {
      try {
        const res = await notificationApi.getUnreadCount()
        // 숫자 또는 { count: N } 형태 모두 대응
        this.unreadCount = typeof res === 'number' ? res : (res?.count ?? res?.unreadCount ?? 0)
      } catch (e) {
        console.error(e)
      }
    },

    // 개별 알림 읽음 처리 — notificationId Long 기준
    async markAsRead(notificationId) {
      try {
        await notificationApi.readNotification(notificationId)

        // 로컬 목록에서 해당 항목 읽음 상태 갱신
        const target = this.notifications.find((n) => n.notificationId === notificationId)
        if (target) {
          target.isRead = true
        }

        // 미읽음 수는 서버 기준으로 재조회
        await this.fetchUnreadCount()
      } catch (e) {
        console.error(e)
        throw e // 화면에서 에러 안내할 수 있도록 re-throw
      }
    },

    // 전체 알림 읽음 처리
    async markAllAsRead() {
      try {
        await notificationApi.readAllNotifications()

        // 로컬 목록 전체 읽음 처리
        this.notifications.forEach((n) => { n.isRead = true })
        this.unreadCount = 0
      } catch (e) {
        console.error(e)
        throw e
      }
    },

    // 알림 수신 설정 조회
    async fetchSettings() {
      this.loading = true
      this.error = null
      try {
        const res = await notificationApi.getNotificationSettings()
        // 배열 또는 객체 모두 대응
        this.settings = Array.isArray(res) ? res : (res?.categories ?? res?.settings ?? [])
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 알림 수신 설정 저장
    async updateSettings(payload) {
      this.loading = true
      this.error = null
      try {
        // GET 응답에는 화면 표시용 code/value가 섞여 있으므로 PATCH에는 category/enabled만 보낸다
        const sourceSettings = Array.isArray(payload)
          ? payload
          : (payload?.settings ?? payload?.categories ?? this.settings)
        const requestPayload = {
          settings: sourceSettings.map((item) => ({
            category: item.category,
            enabled: Boolean(item.enabled),
          })),
        }

        const res = await notificationApi.updateNotificationSettings(requestPayload)
        if (res) {
          this.settings = Array.isArray(res) ? res : (res?.categories ?? res?.settings ?? this.settings)
        }
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // WebSocket으로 신규 알림 수신 시 호출
    // payload 예시: { notificationId, title, content, linkPath, unreadCount, type }
    handleIncomingNotification(payload) {
      if (!payload) return

      // unreadCount를 서버 payload 기준으로 갱신
      if (typeof payload.unreadCount === 'number') {
        this.unreadCount = payload.unreadCount
      } else {
        // payload에 unreadCount가 없으면 +1 증가 (안전 증가)
        this.unreadCount = Math.max(0, this.unreadCount) + 1
      }

      // 드롭다운/목록 상단에 신규 알림 추가 (최신순 유지)
      if (payload.notificationId) {
        const exists = this.notifications.some((n) => n.notificationId === payload.notificationId)
        if (!exists) {
          this.notifications.unshift({
            notificationId: payload.notificationId,
            title: payload.title ?? '',
            content: payload.content ?? '',
            linkPath: payload.linkPath ?? null,
            type: payload.type ?? null,
            isRead: false,
            createdAt: payload.createdAt ?? new Date().toISOString(),
          })
        }
      }

      // 토스트 큐에 추가 (최대 3개 유지)
      const toast = {
        id: payload.notificationId ?? Date.now(),
        title: payload.title ?? '',
        content: payload.content ?? '',
        linkPath: payload.linkPath ?? null,
      }
      this.toasts = [toast, ...this.toasts].slice(0, 3)
    },

    removeToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },

    // 페이지 변경 시 목록 초기화 후 재조회
    resetNotifications() {
      this.notifications = []
      this.page = 1
      this.totalElements = 0
      this.totalPages = 0
      this.hasNext = false
    },

    // 드롭다운 열기/닫기
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen
    },

    closeDropdown() {
      this.dropdownOpen = false
    },

    // WebSocket 연결 상태 갱신
    setSocketConnected(val) {
      this.socketConnected = val
    },
  },
})
