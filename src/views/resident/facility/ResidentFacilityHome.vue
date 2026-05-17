<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { toList } from '@/utils/apiResponse'

const route = useRoute()
const router = useRouter()
const facilityStore = useFacilityStore()

const state = reactive({
  list: [],
  activeSubTab: 'facility', // 'facility' | 'gx'
  loading: false,
  errorMessage: '',
})

const goToReservations = () => {
  router.push(`/resident/${route.params.complexId}/reservations`)
}

const goToDetail = (facilityId) => {
  router.push(`/resident/${route.params.complexId}/facility/${facilityId}`)
}

const isGx = (f) =>
  f.typeCode === 'GX' || (f.typeName && f.typeName.includes('GX'))

const filteredList = computed(() => {
  if (state.activeSubTab === 'gx') return state.list.filter(isGx)
  return state.list.filter((f) => !isGx(f))
})

const formatTime = (t) => (t ? t.slice(0, 5) : '-')

const reservationTypeLabel = (type) =>
  ({ SEAT: '좌석형', COUNT: '정원형', APPROVAL: '승인형' }[type] || type || '-')

const fetchFacilities = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const res = await facilityStore.fetchFacilities()
    state.list = toList(res)
  } catch (e) {
    state.errorMessage =
      e?.response?.data?.resultMessage || '시설 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

onMounted(() => {
  fetchFacilities()
})
</script>

<template>
  <div class="facility-home">
    <!-- 메인 탭: 예약하기 / 내 예약 -->
    <div class="main-tabs">
      <button class="main-tab is-active" type="button">예약하기</button>
      <button class="main-tab" type="button" @click="goToReservations">내 예약</button>
    </div>

    <!-- 서브 탭: 편의 시설 / GX 강습 -->
    <div class="sub-tabs">
      <button
        :class="['sub-tab', state.activeSubTab === 'facility' && 'is-active']"
        type="button"
        @click="state.activeSubTab = 'facility'"
      >
        편의 시설
      </button>
      <button
        :class="['sub-tab', state.activeSubTab === 'gx' && 'is-active']"
        type="button"
        @click="state.activeSubTab = 'gx'"
      >
        GX 강습
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="state.loading" class="loading-area">
      <p class="loading-text">불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="state.errorMessage" class="error-area">
      <p class="error-text">{{ state.errorMessage }}</p>
      <button class="btn-retry" type="button" @click="fetchFacilities">다시 시도</button>
    </div>

    <!-- 목록 -->
    <div v-else class="facility-list">
      <button
        v-for="f in filteredList"
        :key="f.facilityId ?? f.id"
        class="facility-card"
        :class="{ 'is-inactive': !f.isActive }"
        type="button"
        @click="goToDetail(f.facilityId ?? f.id)"
      >
        <div class="card-left">
          <div class="card-type-badge">{{ f.typeName || '-' }}</div>
          <div class="card-name">{{ f.name }}</div>
          <div class="card-hours">
            {{ formatTime(f.openTime) }} ~ {{ formatTime(f.closeTime) }}
            <span class="card-reserve-type">{{ reservationTypeLabel(f.reservationType) }}</span>
          </div>
        </div>
        <div class="card-right">
          <span :class="['status-badge', f.isActive ? 'is-active' : 'is-inactive']">
            {{ f.isActive ? '운영 중' : '중단' }}
          </span>
          <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </button>

      <div v-if="filteredList.length === 0" class="empty-area">
        <p>이용 가능한 시설이 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.facility-home {
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

/* 서브 탭 */
.sub-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.sub-tab {
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

.sub-tab.is-active {
  border-color: #4973e5;
  background: #eef3fb;
  color: #4973e5;
}

/* 시설 목록 */
.facility-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.facility-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.facility-card:active {
  box-shadow: 0 1px 4px rgba(73, 115, 229, 0.1);
}

.facility-card.is-inactive {
  opacity: 0.65;
  background: #f8f9fa;
}

.card-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.card-type-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #eef3fb;
  color: #4973e5;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  width: fit-content;
}

.card-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-hours {
  font-size: 12px;
  color: #718096;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-reserve-type {
  padding: 1px 6px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 11px;
  color: #94a3b8;
}

.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 12px;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.status-badge.is-active {
  background: #e6f4ec;
  color: #2e7d52;
}

.status-badge.is-inactive {
  background: #f1f5f9;
  color: #94a3b8;
}

.arrow-icon {
  color: #cbd5e1;
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
