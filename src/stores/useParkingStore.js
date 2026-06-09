import { defineStore } from 'pinia'
import parkingApi from '@/api/parkingApi'
import { connectParkingSse } from '@/utils/parkingSseClient'

// 빈 페이지 응답 기본값
const createEmptyPage = () => ({
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
})

// 빈 통계 요약 기본값
const createEmptySummary = () => ({
  todayInCount: 0,
  todayOutCount: 0,
  todayInDiffFromYesterday: 0,
  todayOutDiffFromYesterday: 0,
  unregisteredCount: 0,
  monthlyTotalCount: 0,
  monthlyDailyAverage: 0,
})

// 빈 주차 운영 타입 기본값
const createEmptyParkingSetting = () => ({
  complexId: null,
  parkingTypeCode: '',
  parkingTypeValue: '',
})

// 빈 주차 통계 기본값
const createEmptyParkingStatistics = () => ({
  chartUnit: '',
  labels: [],
  inCount: [],
  outCount: [],
  averageOccupancyRate: 0,
})

// 빈 입주민 주차 현황 기본값
const createEmptyResidentParkingStatus = () => ({
  parkingTypeCode: '',
  parkingTypeValue: '',
  totalSlots: 0,
  currentParkedCount: 0,
  remainingSlots: 0,
  occupancyRate: 0,
  zones: [],
  updatedAt: '',
})

// 빈 관리자 주차 현황 기본값 (유형별 카운트는 SENSOR 단지에서 null로 응답)
const createEmptyAdminParkingStatus = () => ({
  totalSlots: 0,
  currentParkedCount: 0,
  remainingSlots: 0,
  occupancyRate: 0,
  residentCount: null,
  visitorCount: null,
  regularVisitorCount: null,
  unregisteredCount: null,
  areaCount: 0,
  zones: [],
  parkingTypeCode: null,
  parkingTypeValue: null,
  updatedAt: null,
})

export const useParkingStore = defineStore('parking', {
  state: () => ({
    loading: false,
    error: null,
    parkingLogPage: createEmptyPage(),
    parkingLogSummary: createEmptySummary(),
    parkingSetting: createEmptyParkingSetting(),
    parkingStatistics: createEmptyParkingStatistics(),
    residentParkingStatus: createEmptyResidentParkingStatus(),
    adminParkingStatus: createEmptyAdminParkingStatus(),
    parkingZones: [],
    sseConnected: false,
    sseClose: null,
    currentZoneSpots: [],
    currentZoneId: null,
    spotsLoading: false,
  }),

  actions: {
    // 입출차 기록 목록 조회
    async fetchParkingLogs(params) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingLogs(params)
        const page = res ?? createEmptyPage()
        this.parkingLogPage = {
          ...page,
          totalElements: Number(page.totalElements ?? 0),
          totalPages: Number(page.totalPages ?? 0),
        }
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 입출차 통계 요약 조회
    async fetchParkingLogSummary() {
      try {
        const res = await parkingApi.getParkingLogSummary()
        this.parkingLogSummary = res ?? createEmptySummary()
      } catch (e) {
        console.error(e)
        this.error = e
      }
    },

    // 주차 운영 타입 조회
    async fetchParkingSetting() {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingSetting()
        this.parkingSetting = res ?? createEmptyParkingSetting()
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차 운영 타입 변경
    async updateParkingSetting(parkingType) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.updateParkingSetting({ parkingType })
        // 변경 응답에는 updatedAt이 추가로 오지만 화면 표시용으로는 code/value만 사용
        if (res) {
          this.parkingSetting = {
            complexId: res.complexId,
            parkingTypeCode: res.parkingTypeCode,
            parkingTypeValue: res.parkingTypeValue,
          }
        }
        return res
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 주차 통계 조회
    async fetchParkingStatistics(params) {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingStatistics(params)
        this.parkingStatistics = res ?? createEmptyParkingStatistics()
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 입주민 주차 현황 조회
    async fetchResidentParkingStatus() {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getResidentParkingStatus()
        this.residentParkingStatus = res ?? createEmptyResidentParkingStatus()
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 관리자 주차 현황 조회
    async fetchAdminParkingStatus() {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingStatus()
        this.adminParkingStatus = res ?? createEmptyAdminParkingStatus()
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차 구역 목록 조회
    async fetchParkingZones() {
      this.loading = true
      this.error = null
      try {
        const res = await parkingApi.getParkingZones()
        this.parkingZones = Array.isArray(res?.content) ? res.content : []
      } catch (e) {
        console.error(e)
        this.error = e
      } finally {
        this.loading = false
      }
    },

    // 주차 구역 등록
    async createParkingZone(body) {
      this.loading = true
      this.error = null
      try {
        return await parkingApi.createParkingZone(body)
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 주차 구역 수정
    async updateParkingZone(zoneId, body) {
      this.loading = true
      this.error = null
      try {
        return await parkingApi.updateParkingZone(zoneId, body)
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 주차 구역 비활성화
    async deactivateParkingZone(zoneId) {
      this.loading = true
      this.error = null
      try {
        return await parkingApi.deleteParkingZone(zoneId)
      } catch (e) {
        console.error(e)
        this.error = e
        throw e
      } finally {
        this.loading = false
      }
    },

    // 입주민 주차 SSE 구독 시작
    connectSpotSse() {
      if (this.sseClose) return
      const close = connectParkingSse({
        onSpotChanged: (payload) => this.applySpotChanged(payload),
        onZoneCounterChanged: (payload) => this.applyZoneCounterChanged(payload),
        onError: () => {
          this.sseConnected = false
          this.sseClose = null
        },
      })
      this.sseClose = close
      this.sseConnected = true
    },

    // 입주민 주차 SSE 구독 종료
    disconnectSpotSse() {
      if (this.sseClose) {
        this.sseClose()
        this.sseClose = null
      }
      this.sseConnected = false
    },

    // zone 카운터 갱신 공통 로직
    applyZoneCounter(payload) {
      if (!payload || payload.zoneId == null) return
      const zones = this.residentParkingStatus?.zones
      if (!Array.isArray(zones) || zones.length === 0) return

      // Jackson이 Long을 String으로 직렬화하므로 타입 불일치 방지
      const target = zones.find((zone) => String(zone.zoneId) === String(payload.zoneId))
      if (!target) return

      target.currentParkedCount = payload.zoneOccupied
      // totalSlots는 초기 API 값 유지 (SENSOR 타입에서 SSE 이벤트의 zoneTotalSlots이 DB값으로 부정확할 수 있음)
      target.remainingSlots = Math.max((target.totalSlots || 0) - payload.zoneOccupied, 0)

      const totalSlots = zones.reduce((sum, zone) => sum + (zone.totalSlots || 0), 0)
      const currentParkedCount = zones.reduce((sum, zone) => sum + (zone.currentParkedCount || 0), 0)
      const remainingSlots = totalSlots - currentParkedCount
      const occupancyRate = totalSlots > 0
        ? Number(((currentParkedCount / totalSlots) * 100).toFixed(1))
        : 0

      this.residentParkingStatus.totalSlots = totalSlots
      this.residentParkingStatus.currentParkedCount = currentParkedCount
      this.residentParkingStatus.remainingSlots = remainingSlots
      this.residentParkingStatus.occupancyRate = occupancyRate
      this.residentParkingStatus.updatedAt = payload.changedAt
    },

    // spot-changed 이벤트 반영
    applySpotChanged(payload) {
      this.applyZoneCounter(payload)

      // 자리 맵에 표시 중인 자리도 함께 갱신
      if (Array.isArray(this.currentZoneSpots) && this.currentZoneSpots.length > 0) {
        const targetSpot = this.currentZoneSpots.find((spot) => spot.sensorCode === payload.sensorCode)
        if (targetSpot) {
          targetSpot.status = payload.status
          if (payload.isActive !== undefined && payload.isActive !== null) {
            targetSpot.isActive = payload.isActive
          }
        }
      }
    },

    // zone-counter-changed 이벤트 반영
    applyZoneCounterChanged(payload) {
      this.applyZoneCounter(payload)
    },

    // 입주민 zone별 자리 목록 조회
    async fetchZoneSpots(zoneId) {
      this.spotsLoading = true
      this.error = null
      try {
        const res = await parkingApi.getResidentZoneSpots(zoneId)
        this.currentZoneSpots = Array.isArray(res) ? res : []
        this.currentZoneId = zoneId
      } catch (e) {
        console.error(e)
        this.error = e
        this.currentZoneSpots = []
      } finally {
        this.spotsLoading = false
      }
    },

    // 현재 자리 목록 비우기
    clearZoneSpots() {
      this.currentZoneSpots = []
      this.currentZoneId = null
    },
  },
})
