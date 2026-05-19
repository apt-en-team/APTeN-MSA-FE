import { defineStore } from 'pinia'
import sensorApi from '@/api/sensorApi'

export const useSensorStore = defineStore('sensor', {
  state: () => ({
    list: [],
    current: null,
    loading: false,
    error: null,
    bulkResult: null,
  }),

  actions: {
    // 주차 센서 목록 조회
    async fetchSensorList(zoneId) {
      this.loading = true
      this.error = null
      try {
        const res = await sensorApi.getSensorList(zoneId)
        this.list = Array.isArray(res) ? res : []
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차 센서 단건 조회
    async fetchSensor(sensorId) {
      this.loading = true
      this.error = null
      try {
        const res = await sensorApi.getSensor(sensorId)
        this.current = res ?? null
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차 센서 단건 등록
    async createSensor(payload) {
      this.loading = true
      this.error = null
      try {
        return await sensorApi.createSensor(payload)
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 주차 센서 일괄 등록
    async createSensorsBulk(payload) {
      this.loading = true
      this.error = null
      try {
        const res = await sensorApi.createSensorsBulk(payload)
        this.bulkResult = res ?? null
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 주차 센서 수정
    async updateSensor(sensorId, payload) {
      this.loading = true
      this.error = null
      try {
        return await sensorApi.updateSensor(sensorId, payload)
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 주차 센서 소프트 삭제
    async deleteSensor(sensorId) {
      this.loading = true
      this.error = null
      try {
        return await sensorApi.deleteSensor(sensorId)
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
