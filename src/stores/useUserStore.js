// TODO: 사용자 정보 store 구조를 정의합니다.
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
  }),
  getters: {
    // TODO: 사용자 정보 getter를 추가합니다.
  },
  actions: {
    // TODO: 사용자 정보 action을 추가합니다.
  },
})
