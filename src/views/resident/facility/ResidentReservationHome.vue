<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReservationStore } from '@/stores/useReservationStore.js'
import { useGxStore } from '@/stores/useGxStore.js'
import { toList } from '@/utils/apiResponse'
import { normalizeReservationStatus, normalizeGxReservationStatus } from '@/utils/normalize.js'

const route = useRoute()
const router = useRouter()
const reservationStore = useReservationStore()
const gxStore = useGxStore()

const state = reactive({
  facilityList: [],
  gxList: [],
  activeFilterTab: 'all', // 'all' | 'confirmed' | 'past'
  loading: false,
  errorMessage: '',
})

const goToFacility = () => {
  router.push(`/resident/${route.params.complexId}/facility`)
}

const goToFacilityDetail = (reservationId) => {
  router.push(`/resident/${route.params.complexId}/reservations/${reservationId}`)
}

const goToGxDetail = (programId) => {
  router.push(`/resident/${route.params.complexId}/facility/gx-programs/${programId}`)
}

const today = new Date().toISOString().slice(0, 10)

// 일반 예약 필터
const facilityStatusNorm = (r) => normalizeReservationStatus(r.status)
const isFacilityPast = (r) => {
  const s = facilityStatusNorm(r)
  return s === 'COMPLETED' || s === 'CANCELLED'
}
const isFacilityConfirmed = (r) => facilityStatusNorm(r) === 'CONFIRMED'

// GX 예약 필터
const gxStatusNorm = (r) => normalizeGxReservationStatus(r.status)
const isGxPast = (r) => {
  const s = gxStatusNorm(r)
  if (s === 'CANCELLED' || s === 'REJECTED') return true
  // 프로그램 종료일이 오늘보다 이전이면 지난 예약
  return r.endDate && String(r.endDate).slice(0, 10) < today
}
const isGxActive = (r) => {
  const s = gxStatusNorm(r)
  return s === 'CONFIRMED' || s === 'WAITING'
}

const combinedList = computed(() => {
  const facility = state.facilityList.map((r) => ({ ...r, _type: 'facility' }))
  const gx = state.gxList.map((r) => ({ ...r, _type: 'gx' }))
  return [...facility, ...gx]
})

const filteredList = computed(() => {
  const list = combinedList.value
  if (state.activeFilterTab === 'confirmed') {
    return list.filter((r) =>
      r._type === 'facility' ? isFacilityConfirmed(r) : isGxActive(r),
    )
  }
  if (state.activeFilterTab === 'past') {
    return list.filter((r) =>
      r._type === 'facility' ? isFacilityPast(r) : isGxPast(r),
    )
  }
  return list
})

// 일반 예약 상태
const facilityStatusLabel = (s) =>
  ({ CONFIRMED: '예약완료', COMPLETED: '이용완료', CANCELLED: '취소됨' }[normalizeReservationStatus(s)] || s || '-')
const facilityStatusClass = (s) =>
  ({ CONFIRMED: 'is-confirmed', COMPLETED: 'is-completed', CANCELLED: 'is-cancelled' }[normalizeReservationStatus(s)] || '')

// GX 예약 상태
const gxStatusLabel = (s) =>
  ({ CONFIRMED: '신청완료', WAITING: '대기 중', CANCELLED: '취소됨', REJECTED: '거절됨' }[normalizeGxReservationStatus(s)] || s || '-')
const gxStatusClass = (s) =>
  ({ CONFIRMED: 'is-confirmed', WAITING: 'is-waiting', CANCELLED: 'is-cancelled', REJECTED: 'is-cancelled' }[normalizeGxReservationStatus(s)] || '')

const formatDate = (d) => (d ? String(d).slice(0, 10).replace(/-/g, '.') : '-')
const formatTime = (t) => (t ? String(t).slice(0, 5) : '-')

const DAY_LABEL = { MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목', FRIDAY: '금', SATURDAY: '토', SUNDAY: '일' }
const formatDays = (days) => {
  if (!days) return ''
  const arr = Array.isArray(days)
    ? days
    : String(days).split(',').map((s) => s.trim()).filter(Boolean)
  return arr.map((d) => DAY_LABEL[d] || d).join(', ')
}

const onCardClick = (item) => {
  if (item._type === 'gx') {
    goToGxDetail(item.programId)
  } else {
    goToFacilityDetail(item.reservationId ?? item.id)
  }
}

const fetchAll = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const [facilityRes, gxRes] = await Promise.allSettled([
      reservationStore.fetchMyReservations(),
      gxStore.fetchMyGxReservations(),
    ])
    state.facilityList = facilityRes.status === 'fulfilled' ? toList(facilityRes.value) : []
    state.gxList = gxRes.status === 'fulfilled' ? (Array.isArray(gxRes.value) ? gxRes.value : toList(gxRes.value)) : []
    if (facilityRes.status === 'rejected' && gxRes.status === 'rejected') {
      state.errorMessage = '예약 목록을 불러오지 못했습니다.'
    }
  } finally {
    state.loading = false
  }
}

onMounted(() => {
  fetchAll()
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
      <button class="btn-retry" type="button" @click="fetchAll">다시 시도</button>
    </div>

    <!-- 목록 -->
    <div v-else class="reservation-list">
      <!-- 일반 시설 예약 카드 -->
      <template v-for="r in filteredList" :key="r._type === 'gx' ? `gx-${r.gxReservationId}` : (r.reservationId ?? r.id)">
        <!-- GX 예약 카드 -->
        <button
          v-if="r._type === 'gx'"
          class="reservation-card"
          type="button"
          @click="onCardClick(r)"
        >
          <div class="card-top">
            <div class="card-name-row">
              <span class="gx-type-badge">GX</span>
              <span class="card-facility-name">{{ r.programName || '-' }}</span>
            </div>
            <span :class="['status-badge', gxStatusClass(r.status)]">{{ gxStatusLabel(r.status) }}</span>
          </div>
          <div class="card-info">
            <span class="card-date">{{ formatDate(r.startDate) }} ~ {{ formatDate(r.endDate) }}</span>
          </div>
          <div class="card-info">
            <span class="card-time">{{ formatTime(r.startTime) }} ~ {{ formatTime(r.endTime) }}</span>
            <template v-if="r.daysOfWeek">
              <span class="card-sep">·</span>
              <span class="card-time">{{ formatDays(r.daysOfWeek) }}</span>
            </template>
          </div>
          <div v-if="r.status === 'WAITING' && r.waitNo" class="card-seat">대기 {{ r.waitNo }}번</div>
        </button>

        <!-- 일반 시설 예약 카드 -->
        <button
          v-else
          class="reservation-card"
          type="button"
          @click="onCardClick(r)"
        >
          <div class="card-top">
            <span class="card-facility-name">{{ r.facilityName || '-' }}</span>
            <span :class="['status-badge', facilityStatusClass(r.status)]">{{ facilityStatusLabel(r.status) }}</span>
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
      </template>

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
  gap: 8px;
}

.card-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

/* GX 타입 뱃지 */
.gx-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  background: #4973e5;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 5px;
  flex-shrink: 0;
  letter-spacing: 0.03em;
}

.card-facility-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
  flex-shrink: 0;
}

.status-badge.is-confirmed {
  background: #eef3fb;
  color: #4973e5;
}

.status-badge.is-waiting {
  background: #fef9ec;
  color: #c08b2d;
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
