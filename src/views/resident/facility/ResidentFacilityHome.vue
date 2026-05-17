<script setup>
import { reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { toList } from '@/utils/apiResponse'
import {
  normalizeFacilityStatus,
  normalizeReservationType,
} from '@/utils/normalize.js'
import imgReadingroom from '@/assets/images/readingroom.png'
import imgGolf from '@/assets/images/golf.png'
import imgPT from '@/assets/images/PT.png'
import imgGroupPT from '@/assets/images/Group PT.png'
import imgPilates from '@/assets/images/pilates.png'
import imgGX from '@/assets/images/GX.png'
import imgSwimmingPool from '@/assets/images/SwimmingPool.png'
import imgSauna from '@/assets/images/Sauna.png'
import imgGuestHouse from '@/assets/images/GuestHouse.png'
import imgLaundryRoom from '@/assets/images/LaundryRoom.png'
import imgCafe from '@/assets/images/Cafe.png'

const route = useRoute()
const router = useRouter()
const facilityStore = useFacilityStore()

const state = reactive({
  list: [],
  loading: false,
  errorMessage: '',
})

const goToReservations = () => {
  router.push(`/resident/${route.params.complexId}/reservations`)
}

const goToDetail = (facilityId) => {
  router.push(`/resident/${route.params.complexId}/facility/${facilityId}`)
}

const formatTime = (t) => (t ? t.slice(0, 5) : '-')

const normFacilityStatus = (f) => normalizeFacilityStatus(f?.status, f?.isActive)

const reservationTypeLabel = (type) => {
  const n = normalizeReservationType(type)
  return { SEAT: '좌석형', COUNT: '정원형', APPROVAL: '승인형' }[n] || type || '-'
}

// 시설명 + 시설 타입명 기반 이미지 매핑
const getNameImage = (name) => {
  if (!name) return null
  const n = name.toLowerCase()
  if (n.includes('독서') || n.includes('reading')) return imgReadingroom
  if (n.includes('골프') || n.includes('golf')) return imgGolf
  if (n.includes('필라테스') || n.includes('pilates')) return imgPilates
  if (n.includes('그룹') || n.includes('group')) return imgGroupPT
  if (n.includes('pt') || n.includes('헬스') || n.includes('health') || n.includes('fitness')) return imgPT
  if (n.includes('수영') || n.includes('swimming') || n.includes('pool')) return imgSwimmingPool
  if (n.includes('사우나') || n.includes('sauna')) return imgSauna
  if (n.includes('게스트') || n.includes('guest')) return imgGuestHouse
  if (n.includes('세탁') || n.includes('laundry')) return imgLaundryRoom
  if (n.includes('카페') || n.includes('cafe') || n.includes('café')) return imgCafe
  if (n.includes('gx') || n.includes('group exercise')) return imgGX
  return null
}

const TYPE_CODE_IMAGE = {
  STUDY_ROOM: imgReadingroom,
  GYM: imgPT,
  GOLF: imgGolf,
  GX: imgGX,
  POOL: imgSwimmingPool,
  SAUNA: imgSauna,
  GUEST_HOUSE: imgGuestHouse,
  LAUNDRY: imgLaundryRoom,
  CAFE: imgCafe,
}

// typeCode 우선, 없으면 시설명/타입명 키워드 기반으로 이미지 결정
const getFacilityImage = (f) => {
  if (f?.typeCode) return TYPE_CODE_IMAGE[String(f.typeCode).toUpperCase()] || null
  return getNameImage(f?.name) || getNameImage(f?.typeName)
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

    <!-- 시설 목록 -->
    <div v-if="state.loading" class="loading-area">
      <p class="loading-text">불러오는 중...</p>
    </div>

    <div v-else-if="state.errorMessage" class="error-area">
      <p class="error-text">{{ state.errorMessage }}</p>
      <button class="btn-retry" type="button" @click="fetchFacilities">다시 시도</button>
    </div>

    <div v-else class="card-list">
      <button
        v-for="f in state.list"
        :key="f.facilityId ?? f.id"
        class="item-card"
        :class="{ 'is-inactive': normFacilityStatus(f) !== 'ACTIVE' }"
        type="button"
        @click="goToDetail(f.facilityId ?? f.id)"
      >
        <!-- 썸네일 -->
        <div class="card-thumb">
          <img
            v-if="getFacilityImage(f)"
            :src="getFacilityImage(f)"
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

      <div v-if="state.list.length === 0" class="empty-area">
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
  padding: 14px;
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
