<script setup>
import { reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGxStore } from '@/stores/useGxStore.js'
import { toList } from '@/utils/apiResponse'
import { normalizeGxProgramStatus } from '@/utils/normalize.js'
import imgGX from '@/assets/images/GX.png'
import imgYoga from '@/assets/images/Yoga.png'
import imgPilates from '@/assets/images/pilates.png'
import imgGroupPT from '@/assets/images/Group PT.png'
import imgPT from '@/assets/images/PT.png'

const route = useRoute()
const router = useRouter()
const gxStore = useGxStore()

const state = reactive({
  list: [],
  loading: false,
  errorMessage: '',
})

const goBack = () => {
  router.push(`/resident/${route.params.complexId}/facility/${route.params.facilityId}`)
}

const goToDetail = (programId) => {
  router.push(`/resident/${route.params.complexId}/facility/gx-programs/${programId}`)
}

const formatDate = (d) => (d ? String(d).replace(/-/g, '.') : '-')
const formatTime = (t) => (t ? String(t).slice(0, 5) : '-')

const formatFee = (fee) => {
  if (fee == null) return '-'
  const n = Number(fee)
  if (n === 0) return '무료'
  return n.toLocaleString('ko-KR') + '원'
}

const statusLabel = (status) => {
  const n = normalizeGxProgramStatus(status)
  return (
    { RECRUITING: '모집 중', CLOSED: '마감', CANCELLED: '취소', ACTIVE: '진행 중' }[n] ||
    status ||
    '-'
  )
}

const statusClass = (status) => {
  const n = normalizeGxProgramStatus(status)
  return (
    {
      RECRUITING: 'badge-recruiting',
      CLOSED: 'badge-closed',
      CANCELLED: 'badge-cancelled',
      ACTIVE: 'badge-active',
    }[n] || 'badge-closed'
  )
}

const getGxImage = (name) => {
  if (!name) return imgGX
  const n = name.toLowerCase()
  if (n.includes('요가') || n.includes('yoga')) return imgYoga
  if (n.includes('필라테스') || n.includes('pilates')) return imgPilates
  if (n.includes('그룹') || n.includes('group')) return imgGroupPT
  if (n.includes('pt') || n.includes('헬스') || n.includes('health') || n.includes('fitness'))
    return imgPT
  return imgGX
}

const fetchPrograms = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const res = await gxStore.fetchGxPrograms({ size: 50 })
    state.list = toList(res)
  } catch (e) {
    state.errorMessage =
      e?.response?.data?.resultMessage || 'GX 프로그램 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

onMounted(() => {
  fetchPrograms()
})
</script>

<template>
  <div class="gx-program-list">
    <!-- 뒤로가기 -->
    <button class="back-btn" type="button" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>시설 상세</span>
    </button>

    <h2 class="page-title">GX 프로그램</h2>

    <!-- 로딩 -->
    <div v-if="state.loading" class="loading-area">
      <p class="loading-text">불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="state.errorMessage" class="error-area">
      <p class="error-text">{{ state.errorMessage }}</p>
      <button class="btn-retry" type="button" @click="fetchPrograms">다시 시도</button>
    </div>

    <!-- 프로그램 목록 -->
    <div v-else class="card-list">
      <button
        v-for="p in state.list"
        :key="p.programId"
        class="item-card"
        type="button"
        @click="goToDetail(p.programId)"
      >
        <!-- 썸네일 -->
        <div class="card-thumb">
          <img :src="getGxImage(p.name)" :alt="p.name" class="card-thumb-img" />
        </div>

        <!-- 정보 -->
        <div class="card-info">
          <div class="card-info-top">
            <span class="card-name">{{ p.name }}</span>
            <span :class="['status-badge', statusClass(p.status)]">{{ statusLabel(p.status) }}</span>
          </div>
          <div class="card-period">
            {{ formatDate(p.startDate) }} ~ {{ formatDate(p.endDate) }}
          </div>
          <div class="card-time">
            {{ formatTime(p.startTime) }} ~ {{ formatTime(p.endTime) }}
          </div>
          <div class="card-tags">
            <span class="tag">{{ formatFee(p.baseFee) }}</span>
            <span v-if="p.maxCount" class="tag">정원 {{ p.maxCount }}명</span>
            <span v-if="p.confirmedCount != null" class="tag tag-count">
              신청 {{ p.confirmedCount }}명
            </span>
          </div>
        </div>

        <!-- 화살표 -->
        <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div v-if="state.list.length === 0" class="empty-area">
        <p>운영 중인 GX 프로그램이 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gx-program-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 12px 16px 32px;
}

/* 뒤로가기 */
.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #4973e5;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-family: 'Noto Sans KR', sans-serif;
  margin-bottom: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 20px;
}

/* 카드 목록 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

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

/* 정보 영역 */
.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
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

.card-period,
.card-time {
  font-size: 12px;
  color: #94a3b8;
}

.card-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.tag {
  padding: 2px 7px;
  background: #f1f5f9;
  border-radius: 5px;
  font-size: 11px;
  color: #718096;
  font-weight: 600;
}

.tag-count {
  background: #eef3fb;
  color: #4973e5;
}

/* 상태 뱃지 */
.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  white-space: nowrap;
}

.badge-recruiting {
  background: #e6f4ec;
  color: #2e7d52;
}

.badge-active {
  background: #eef3fb;
  color: #4973e5;
}

.badge-closed {
  background: #f1f5f9;
  color: #94a3b8;
}

.badge-cancelled {
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
