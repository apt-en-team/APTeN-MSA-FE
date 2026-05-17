<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReservationStore } from '@/stores/useReservationStore.js'
import { toList } from '@/utils/apiResponse'
import { normalizeReservationStatus } from '@/utils/normalize.js'

const route = useRoute()
const router = useRouter()
const reservationStore = useReservationStore()

const state = reactive({
  list: [],
  activeFilterTab: 'all', // 'all' | 'confirmed' | 'past'
  loading: false,
  errorMessage: '',
})

const goToFacility = () => {
  router.push(`/resident/${route.params.complexId}/facility`)
}

const goToDetail = (reservationId) => {
  router.push(`/resident/${route.params.complexId}/reservations/${reservationId}`)
}

const filteredList = computed(() => {
  if (state.activeFilterTab === 'confirmed') {
    return state.list.filter((r) => normalizeReservationStatus(r.status) === 'CONFIRMED')
  }
  if (state.activeFilterTab === 'past') {
    const n = normalizeReservationStatus
    return state.list.filter((r) => n(r.status) === 'COMPLETED' || n(r.status) === 'CANCELLED')
  }
  return state.list
})

const statusLabel = (s) =>
  ({ CONFIRMED: '예약완료', COMPLETED: '이용완료', CANCELLED: '취소됨' }[normalizeReservationStatus(s)] || s || '-')

const statusClass = (s) =>
  ({ CONFIRMED: 'is-confirmed', COMPLETED: 'is-completed', CANCELLED: 'is-cancelled' }[normalizeReservationStatus(s)] || '')

const formatDate = (d) => (d ? d.slice(0, 10).replace(/-/g, '.') : '-')
const formatTime = (t) => (t ? t.slice(0, 5) : '-')

const fetchReservations = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const res = await reservationStore.fetchMyReservations()
    state.list = toList(res)
  } catch (e) {
    state.errorMessage =
      e?.response?.data?.resultMessage || '예약 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

onMounted(() => {
  fetchReservations()
})
</script>

<template>
  <div class="reservation-home">
    <!-- 메인 탭: 예약하기 / 내 예약 -->
    <div class="main-tabs">
      <button class="main-tab" type="button" @click="goToFacility">예약하기</button>
      <button class="main-tab is-active" type="button">내 예약</button>
    </div>

    <!-- 필터 탭: 전체 / 예약완료 / 지난예약 -->
    <div class="filter-tabs">
      <button
        :class="['filter-tab', state.activeFilterTab === 'all' && 'is-active']"
        type="button"
        @click="state.activeFilterTab = 'all'"
      >
        전체
      </button>
      <button
        :class="['filter-tab', state.activeFilterTab === 'confirmed' && 'is-active']"
        type="button"
        @click="state.activeFilterTab = 'confirmed'"
      >
        예약완료
      </button>
      <button
        :class="['filter-tab', state.activeFilterTab === 'past' && 'is-active']"
        type="button"
        @click="state.activeFilterTab = 'past'"
      >
        지난예약
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="state.loading" class="loading-area">
      <p class="loading-text">불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="state.errorMessage" class="error-area">
      <p class="error-text">{{ state.errorMessage }}</p>
      <button class="btn-retry" type="button" @click="fetchReservations">다시 시도</button>
    </div>

    <!-- 목록 -->
    <div v-else class="reservation-list">
      <button
        v-for="r in filteredList"
        :key="r.reservationId ?? r.id"
        class="reservation-card"
        type="button"
        @click="goToDetail(r.reservationId ?? r.id)"
      >
        <div class="card-top">
          <span class="card-facility-name">{{ r.facilityName || '-' }}</span>
          <span :class="['status-badge', statusClass(r.status)]">{{ statusLabel(r.status) }}</span>
        </div>
        <div class="card-info">
          <span class="card-date">{{ formatDate(r.reservationDate) }}</span>
          <span class="card-sep">·</span>
          <span class="card-time">
            {{ formatTime(r.startTime) }} ~ {{ formatTime(r.endTime) }}
          </span>
        </div>
        <div v-if="r.seatNo" class="card-seat">좌석 {{ r.seatNo }}</div>
      </button>

      <div v-if="filteredList.length === 0" class="empty-area">
        <p>예약 내역이 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reservation-home {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 16px;
}

/* 메인 탭 */
.main-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}

.main-tab {
  height: 40px;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: #718096;
  transition: background 0.15s, color 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}

.main-tab.is-active {
  background: #4973e5;
  color: #ffffff;
}

/* 필터 탭 */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-tab {
  padding: 7px 16px;
  border: 1.5px solid #d1d9e6;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: #ffffff;
  color: #718096;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}

.filter-tab.is-active {
  border-color: #4973e5;
  background: #eef3fb;
  color: #4973e5;
}

/* 예약 목록 */
.reservation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reservation-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #ffffff;
  border-radius: 16px;
  border: none;
  box-shadow: 0 2px 10px rgba(73, 115, 229, 0.07);
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: 'Noto Sans KR', sans-serif;
  transition: box-shadow 0.15s;
}

.reservation-card:active {
  box-shadow: 0 1px 4px rgba(73, 115, 229, 0.1);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-facility-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
}

.status-badge.is-confirmed {
  background: #eef3fb;
  color: #4973e5;
}

.status-badge.is-completed {
  background: #e6f4ec;
  color: #2e7d52;
}

.status-badge.is-cancelled {
  background: #fff5f5;
  color: #e53e3e;
}

.card-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-date {
  font-size: 13px;
  font-weight: 600;
  color: #4973e5;
}

.card-sep {
  font-size: 13px;
  color: #cbd5e1;
}

.card-time {
  font-size: 13px;
  color: #718096;
}

.card-seat {
  font-size: 12px;
  color: #94a3b8;
}

/* 상태 */
.loading-area,
.error-area,
.empty-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 12px;
}

.loading-text,
.empty-area p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.error-text {
  font-size: 14px;
  color: #e53e3e;
  margin: 0;
  text-align: center;
}

.btn-retry {
  padding: 8px 20px;
  background: #4973e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
</style>
