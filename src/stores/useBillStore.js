// 관리비 상태를 관리하는 store입니다.
import { defineStore } from 'pinia'
import billApi from '@/api/billApi'

export const useBillStore = defineStore('bill', {
  state: () => ({
    loading: false,
    error: null,
    bills: [],
    billDetail: null,
    basicBillPolicy: null,
  }),
  getters: {
    hasBillDetail: (state) => !!state.billDetail,
  },
  actions: {
    // 관리자 관리비 목록 조회
    async fetchAdminBills(params) {
      this.loading = true
      this.error = null
      try {
        const res = await billApi.getAdminHouseholdBills(params)
        this.bills = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 관리비 상세 조회
    async fetchAdminBillDetail(id) {
      this.loading = true
      this.error = null
      try {
        const res = await billApi.getAdminHouseholdBillDetail(id)
        this.billDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 월별 비용 확정
    async confirmBill(id) {
      this.loading = true
      this.error = null
      try {
        const res = await billApi.confirmHouseholdBill(id)
        this.billDetail = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 내 관리비 목록 조회
    async fetchMyBills(params) {
      this.loading = true
      this.error = null
      try {
        const res = await billApi.getMyHouseholdBills(params)
        this.bills = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 기본 관리비 정책 설정
    async saveBasicBillPolicy(body) {
      this.loading = true
      this.error = null
      try {
        const res = await billApi.saveBasicBillPolicy(body)
        this.basicBillPolicy = res
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
  },
})
