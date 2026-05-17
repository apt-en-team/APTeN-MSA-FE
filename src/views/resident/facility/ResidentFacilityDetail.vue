<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import { normalizeFacilityStatus, normalizeReservationType } from '@/utils/normalize.js'

const route = useRoute()
const router = useRouter()
const facilityStore = useFacilityStore()

const state = reactive({
  detail: null,
  loading: false,
  errorMessage: '',
})

const approvalModal = reactive({ show: false })

const goBack = () => {
  router.push(`/resident/${route.params.complexId}/facility`)
}

const formatTime = (t) => (t ? t.slice(0, 5) : '-')

const facilityStatus = computed(() =>
  normalizeFacilityStatus(state.detail?.status, state.detail?.isActive),
)
const normalizedResType = computed(() =>
  normalizeReservationType(state.detail?.reservationType),
)
const isGxType = computed(() => {
  const d = state.detail
  if (!d) return false
  // 상세 응답에 typeCode/typeName이 없으므로 시설명으로 판단한다.
  // getNameImage()의 GX 감지 기준과 동일하게 유지한다.
  const n = (d.name || '').toLowerCase()
  return n.includes('gx') || n.includes('group exercise')
})

const reservationTypeLabel = (type) => {
  const n = normalizeReservationType(type)
  return { SEAT: '좌석형', COUNT: '정원형', APPROVAL: '승인형' }[n] || type || '-'
}

const onReserveClick = () => {
  if (isGxType.value) {
    router.push(
      `/resident/${route.params.complexId}/facility/${route.params.facilityId}/gx-programs`,
    )
    return
  }
  if (normalizedResType.value === 'APPROVAL') {
    approvalModal.show = true
    return
  }
  router.push(`/resident/${route.params.complexId}/facility/${route.params.facilityId}/reserve`)
}

const fetchDetail = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const res = await facilityStore.fetchFacilityDetail(route.params.facilityId)
    state.detail = res
  } catch (e) {
    state.errorMessage =
      e?.response?.data?.resultMessage || '시설 정보를 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="facility-detail">
    <!-- 뒤로가기 -->
    <button class="back-btn" type="button" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>시설 목록</span>
    </button>

    <!-- 로딩 -->
    <div v-if="state.loading" class="loading-area">
      <p class="loading-text">불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="state.errorMessage" class="error-area">
      <p class="error-text">{{ state.errorMessage }}</p>
      <button class="btn-retry" type="button" @click="fetchDetail">다시 시도</button>
    </div>

    <!-- 상세 내용 -->
    <template v-else-if="state.detail">
      <!-- 히어로 -->
      <div class="detail-hero">
        <div class="hero-badges">
          <span class="type-badge">{{ state.detail.typeName || '-' }}</span>
          <span :class="['status-badge', facilityStatus === 'ACTIVE' ? 'is-active' : 'is-inactive']">
            {{ facilityStatus === 'ACTIVE' ? '운영 중' : '운영 중단' }}
          </span>
        </div>
        <h1 class="detail-title">{{ state.detail.name }}</h1>
        <p v-if="state.detail.description" class="detail-desc">{{ state.detail.description }}</p>
      </div>

      <!-- 승인형 안내 (GX 타입은 프로그램 신청 흐름이므로 제외) -->
      <div v-if="normalizedResType === 'APPROVAL' && !isGxType" class="approval-notice">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
        </svg>
        <span>관리자 승인 후 이용 가능한 시설입니다.</span>
      </div>

      <!-- 정보 카드 -->
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">운영 시간</span>
          <span class="info-value">{{ formatTime(state.detail.openTime) }} ~ {{ formatTime(state.detail.closeTime) }}</span>
        </div>
        <div class="info-divider" />
        <div class="info-row">
          <span class="info-label">예약 방식</span>
          <span class="info-value">{{ reservationTypeLabel(state.detail.reservationType) }}</span>
        </div>
        <div v-if="state.detail.capacity" class="info-divider" />
        <div v-if="state.detail.capacity" class="info-row">
          <span class="info-label">최대 정원</span>
          <span class="info-value">{{ state.detail.capacity }}명</span>
        </div>
        <div v-if="state.detail.maxReservationPerDay" class="info-divider" />
        <div v-if="state.detail.maxReservationPerDay" class="info-row">
          <span class="info-label">1일 최대 예약</span>
          <span class="info-value">{{ state.detail.maxReservationPerDay }}회</span>
        </div>
      </div>
    </template>

    <!-- CTA 영역 (상세 로드 완료 시) -->
    <div v-if="state.detail && !state.loading" class="cta-area">
      <button
        class="btn-reserve"
        type="button"
        :disabled="facilityStatus !== 'ACTIVE'"
        @click="onReserveClick"
      >
        <template v-if="facilityStatus !== 'ACTIVE'">운영 중단 시설</template>
        <template v-else-if="isGxType">GX 신청하기</template>
        <template v-else>예약하기</template>
      </button>
    </div>

    <!-- 승인형 예약 준비 중 모달 -->
    <ResidentModal
      :visible="approvalModal.show"
      type="info"
      title="승인형 예약 준비 중"
      subtitle="승인형 예약은 현재 준비 중입니다."
      confirmText="확인"
      confirmType="primary"
      @close="approvalModal.show = false"
      @confirm="approvalModal.show = false"
    />
  </div>
</template>

<style scoped>
.facility-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 16px 120px;
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
}

/* 히어로 */
.detail-hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.hero-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #eef3fb;
  color: #4973e5;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
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

.detail-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.detail-desc {
  font-size: 14px;
  color: #718096;
  line-height: 1.6;
  margin: 0;
}

/* 승인형 안내 */
.approval-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #fff8e1;
  border-radius: 10px;
  color: #b7791f;
  font-size: 13px;
  font-weight: 500;
}

/* 정보 카드 */
.info-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 4px 0;
  box-shadow: 0 2px 10px rgba(73, 115, 229, 0.07);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
}

.info-label {
  font-size: 13px;
  color: #94a3b8;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}

.info-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0 16px;
}

/* CTA */
.cta-area {
  position: fixed;
  bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  padding: 0 16px;
  z-index: 100;
}

.btn-reserve {
  width: 100%;
  height: 52px;
  background: #4973e5;
  color: #ffffff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  transition: background 0.15s;
}

.btn-reserve:hover:not(:disabled) {
  background: #3a5ec8;
}

.btn-reserve:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

/* 상태 */
.loading-area,
.error-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 16px;
  gap: 12px;
}

.loading-text {
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
