<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { useGxStore } from '@/stores/useGxStore.js'
import { toList } from '@/utils/apiResponse'
import {
  normalizeFacilityStatus,
  normalizeReservationType,
  normalizeGxProgramStatus,
} from '@/utils/normalize.js'
import imgReadingroom from '@/assets/images/readingroom.png'
import imgGolf from '@/assets/images/golf.png'
import imgPT from '@/assets/images/PT.png'
import imgGroupPT from '@/assets/images/Group PT.png'
import imgPilates from '@/assets/images/pilates.png'

const route = useRoute()
const router = useRouter()
const facilityStore = useFacilityStore()
const gxStore = useGxStore()

const state = reactive({
  list: [],
  activeSubTab: 'facility', // 'facility' | 'gx'
  loading: false,
  errorMessage: '',

  gxList: [],
  gxLoaded: false,
  gxLoading: false,
  gxError: '',
})

const goToReservations = () => {
  router.push(`/resident/${route.params.complexId}/reservations`)
}

const goToDetail = (facilityId) => {
  router.push(`/resident/${route.params.complexId}/facility/${facilityId}`)
}

const goToGxDetail = (programId) => {
  router.push(`/resident/${route.params.complexId}/facility/gx-programs/${programId}`)
}

const isGx = (f) =>
  f.typeCode === 'GX' || (f.typeName && f.typeName.includes('GX'))

const filteredList = computed(() => state.list.filter((f) => !isGx(f)))

const formatTime = (t) => (t ? t.slice(0, 5) : '-')
const formatDate = (d) => (d ? d.slice(0, 10).replace(/-/g, '.') : '-')
const formatFee = (fee) => {
  if (fee == null) return '-'
  if (fee === 0) return '무료'
  return `${Number(fee).toLocaleString('ko-KR')}원`
}

const normFacilityStatus = (f) => normalizeFacilityStatus(f?.status, f?.isActive)

const reservationTypeLabel = (type) => {
  const n = normalizeReservationType(type)
  return { SEAT: '좌석형', COUNT: '정원형', APPROVAL: '승인형' }[n] || type || '-'
}

const DAY_LABEL = {
  MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수',
  THURSDAY: '목', FRIDAY: '금', SATURDAY: '토', SUNDAY: '일',
}
const formatDays = (days) => {
  if (!days) return '-'
  if (Array.isArray(days)) return days.map((d) => DAY_LABEL[d] || d).join('·')
  return String(days)
}

const gxDays = (p) => p.dayOfWeeks || p.daysOfWeek || null

const gxStatusLabel = (s) => {
  const n = normalizeGxProgramStatus(s)
  return { RECRUITING: '모집 중', CLOSED: '마감', CANCELLED: '취소됨', ACTIVE: '진행 중' }[n] || s || ''
}

const gxStatusClass = (s) => {
  const n = normalizeGxProgramStatus(s)
  return { RECRUITING: 'is-open', CLOSED: 'is-closed', CANCELLED: 'is-cancelled', ACTIVE: 'is-active' }[n] || ''
}

// 이름 키워드 기반 이미지 매핑
const getNameImage = (name) => {
  if (!name) return null
  const n = name.toLowerCase()
  if (n.includes('독서') || n.includes('reading')) return imgReadingroom
  if (n.includes('골프') || n.includes('golf')) return imgGolf
  if (n.includes('필라테스') || n.includes('pilates')) return imgPilates
  if (n.includes('그룹') || n.includes('group')) return imgGroupPT
  if (n.includes('pt') || n.includes('헬스') || n.includes('health') || n.includes('fitness')) return imgPT
  return null
}

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

const fetchGxPrograms = async () => {
  state.gxLoading = true
  state.gxError = ''
  try {
    const res = await gxStore.fetchGxPrograms()
    state.gxList = toList(res)
    state.gxLoaded = true
  } catch (e) {
    state.gxError =
      e?.response?.data?.resultMessage || 'GX 프로그램 목록을 불러오지 못했습니다.'
  } finally {
    state.gxLoading = false
  }
}

const onSubTabChange = (tab) => {
  state.activeSubTab = tab
  if (tab === 'gx' && !state.gxLoaded) {
    fetchGxPrograms()
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
        @click="onSubTabChange('facility')"
      >
        편의 시설
      </button>
      <button
        :class="['sub-tab', state.activeSubTab === 'gx' && 'is-active']"
        type="button"
        @click="onSubTabChange('gx')"
      >
        GX 강습
      </button>
    </div>

    <!-- 편의 시설 탭 -->
    <template v-if="state.activeSubTab === 'facility'">
      <div v-if="state.loading" class="loading-area">
        <p class="loading-text">불러오는 중...</p>
      </div>

      <div v-else-if="state.errorMessage" class="error-area">
        <p class="error-text">{{ state.errorMessage }}</p>
        <button class="btn-retry" type="button" @click="fetchFacilities">다시 시도</button>
      </div>

      <div v-else class="card-list">
        <button
          v-for="f in filteredList"
          :key="f.facilityId ?? f.id"
          class="item-card"
          :class="{ 'is-inactive': normFacilityStatus(f) !== 'ACTIVE' }"
          type="button"
          @click="goToDetail(f.facilityId ?? f.id)"
        >
          <!-- 썸네일 -->
          <div class="card-thumb">
            <img
              v-if="getNameImage(f.name)"
              :src="getNameImage(f.name)"
              :alt="f.name"
              class="card-thumb-img"
            />
            <div v-else class="card-thumb-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
          </div>

          <!-- 정보 -->
          <div class="card-info">
            <div class="card-info-top">
              <span class="card-name">{{ f.name }}</span>
              <span :class="['status-badge', normFacilityStatus(f) === 'ACTIVE' ? 'is-active' : 'is-inactive']">
                {{ normFacilityStatus(f) === 'ACTIVE' ? '운영 중' : '중단' }}
              </span>
            </div>
            <div class="card-hours">
              {{ formatTime(f.openTime) }} ~ {{ formatTime(f.closeTime) }}
            </div>
            <div class="card-tags">
              <span class="tag">{{ reservationTypeLabel(f.reservationType) }}</span>
              <span v-if="f.capacity" class="tag">정원 {{ f.capacity }}명</span>
              <span v-if="f.totalSeats" class="tag">좌석 {{ f.totalSeats }}개</span>
            </div>
          </div>

          <!-- 화살표 -->
          <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div v-if="filteredList.length === 0" class="empty-area">
          <p>이용 가능한 시설이 없습니다.</p>
        </div>
      </div>
    </template>

    <!-- GX 강습 탭 -->
    <template v-if="state.activeSubTab === 'gx'">
      <div v-if="state.gxLoading" class="loading-area">
        <p class="loading-text">불러오는 중...</p>
      </div>

      <div v-else-if="state.gxError" class="error-area">
        <p class="error-text">{{ state.gxError }}</p>
        <button class="btn-retry" type="button" @click="fetchGxPrograms">다시 시도</button>
      </div>

      <div v-else class="card-list">
        <button
          v-for="p in state.gxList"
          :key="p.programId"
          class="item-card"
          type="button"
          @click="goToGxDetail(p.programId)"
        >
          <!-- 썸네일 -->
          <div class="card-thumb">
            <img
              v-if="getNameImage(p.programName || p.name)"
              :src="getNameImage(p.programName || p.name)"
              :alt="p.programName || p.name"
              class="card-thumb-img"
            />
            <div v-else class="card-thumb-placeholder gx-placeholder">
              <span>GX</span>
            </div>
          </div>

          <!-- 정보 -->
          <div class="card-info">
            <div class="card-info-top">
              <span class="card-name">{{ p.programName || p.name }}</span>
              <span :class="['gx-status-badge', gxStatusClass(p.status)]">
                {{ gxStatusLabel(p.status) }}
              </span>
            </div>
            <div class="card-hours">
              {{ formatDate(p.startDate) }} ~ {{ formatDate(p.endDate) }}
            </div>
            <div class="card-tags">
              <span v-if="gxDays(p)" class="tag">{{ formatDays(gxDays(p)) }}</span>
              <span class="tag">{{ formatTime(p.startTime) }}~{{ formatTime(p.endTime) }}</span>
              <span v-if="p.maxCount != null" class="tag">
                {{ p.currentCount ?? p.confirmedCount ?? 0 }}/{{ p.maxCount }}명
              </span>
              <span v-else-if="p.baseFee != null" class="tag fee-tag">{{ formatFee(p.baseFee) }}</span>
            </div>
          </div>

          <!-- 화살표 -->
          <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div v-if="state.gxList.length === 0" class="empty-area">
          <p>등록된 GX 프로그램이 없습니다.</p>
        </div>
      </div>
    </template>
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

/* 카드 목록 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 공통 카드 */
.item-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 14px 14px 14px;
  background: #ffffff;
  border-radius: 16px;
  border: none;
  box-shadow: 0 2px 10px rgba(73, 115, 229, 0.07);
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: 'Noto Sans KR', sans-serif;
  transition: box-shadow 0.15s, transform 0.1s;
}

.item-card:active {
  box-shadow: 0 1px 4px rgba(73, 115, 229, 0.1);
  transform: scale(0.99);
}

.item-card.is-inactive {
  opacity: 0.6;
}

/* 썸네일 */
.card-thumb {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #eef3fb;
}

.card-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4973e5;
  opacity: 0.45;
}

.card-thumb-placeholder.gx-placeholder {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

/* 정보 영역 */
.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-info-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.card-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a202c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.card-hours {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 1px;
}

.card-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 3px;
}

.tag {
  padding: 2px 7px;
  background: #f1f5f9;
  border-radius: 5px;
  font-size: 11px;
  color: #718096;
  font-weight: 600;
}

.fee-tag {
  background: #eef3fb;
  color: #4973e5;
}

/* 시설 상태 뱃지 */
.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  white-space: nowrap;
}

.status-badge.is-active {
  background: #e6f4ec;
  color: #2e7d52;
}

.status-badge.is-inactive {
  background: #f1f5f9;
  color: #94a3b8;
}

/* GX 상태 뱃지 */
.gx-status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  white-space: nowrap;
}

.gx-status-badge.is-open {
  background: #e6f4ec;
  color: #2e7d52;
}

.gx-status-badge.is-active {
  background: #eef3fb;
  color: #4973e5;
}

.gx-status-badge.is-closed {
  background: #f1f5f9;
  color: #94a3b8;
}

.gx-status-badge.is-cancelled {
  background: #fff5f5;
  color: #e53e3e;
}

/* 화살표 */
.arrow-icon {
  color: #cbd5e1;
  flex-shrink: 0;
}

/* 공통 상태 */
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
