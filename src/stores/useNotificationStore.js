// TODO: 알림 상태 store 구조를 정의합니다.
import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    items: [],
  }),
  getters: {
    // TODO: 알림 관련 getter를 추가합니다.
  },
  actions: {
    // TODO: 알림 관련 action을 추가합니다.
  },
})
