<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGxStore } from '@/stores/useGxStore.js'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import { normalizeGxProgramStatus, normalizeGxReservationStatus } from '@/utils/normalize.js'

const route = useRoute()
const router = useRouter()
const gxStore = useGxStore()

const state = reactive({
  detail: null,
  loading: false,
  errorMessage: '',

  // 신청 후 저장되는 예약 정보 (detail.myReservation 갱신 전 임시 보관)
  gxReservationId: null,
  myStatus: null,

  waitingOrder: null,
  waitingLoading: false,

  submitting: false,
})

const applyModal = reactive({ show: false })
const cancelModal = reactive({ show: false })
const resultModal = reactive({ show: false, success: false, message: '' })

// 서버에서 내려온 기존 신청 정보 우선 사용
const myReservation = computed(() => state.detail?.myReservation ?? null)
const activeGxReservationId = computed(
  () =>
    myReservation.value?.gxReservationId ||
    myReservation.value?.id ||
    state.detail?.myReservationId ||
    state.gxReservationId,
)
const activeMyStatus = computed(() =>
  normalizeGxReservationStatus(myReservation.value?.status || state.myStatus),
)
const normalizedDetailStatus = computed(() => normalizeGxProgramStatus(state.detail?.status))

const isProgramApplicable = computed(() => {
  const n = normalizedDetailStatus.value
  return n === 'RECRUITING' || (n === 'CLOSED' && state.detail?.waitingEnabled)
})

const canApply = computed(() => {
  if (!isProgramApplicable.value) return false
  const cur = activeMyStatus.value
  return !cur || cur === 'CANCELLED' || cur === 'REJECTED'
})

const canCancel = computed(() =>
  activeMyStatus.value === 'CONFIRMED' || activeMyStatus.value === 'WAITING',
)

const isMyStatusActive = computed(() => {
  const cur = activeMyStatus.value
  return cur && cur !== 'CANCELLED' && cur !== 'REJECTED'
})

const goBack = () => {
  router.push(`/resident/${route.params.complexId}/facility`)
}

const formatTime = (t) => (t ? t.slice(0, 5) : '-')
const formatDate = (d) => (d ? d.slice(0, 10).replace(/-/g, '.') : '-')
const formatFee = (fee) => {
  if (fee == null) return '-'
  if (fee === 0) return '무료'
  return `${Number(fee).toLocaleString('ko-KR')}원`
}

const DAY_LABEL = {
  MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수',
  THURSDAY: '목', FRIDAY: '금', SATURDAY: '토', SUNDAY: '일',
}
const formatDays = (days) => {
  if (!days) return '-'
  const arr = Array.isArray(days)
    ? days
    : String(days).split(',').map((s) => s.trim()).filter(Boolean)
  return arr.map((d) => DAY_LABEL[d] || d).join(', ')
}

const gxStatusLabel = (s) =>
  ({
    RECRUITING: '모집 중',
    ACTIVE: '진행 중',
    CLOSED: '마감',
    CANCELLED: '취소됨',
  }[normalizeGxProgramStatus(s)] || s || '')

const gxStatusClass = (s) =>
  ({
    RECRUITING: 'is-open',
    ACTIVE: 'is-active',
    CLOSED: 'is-closed',
    CANCELLED: 'is-cancelled',
  }[normalizeGxProgramStatus(s)] || '')

const reservationStatusLabel = (s) =>
  ({ WAITING: '대기 중', CONFIRMED: '신청 완료', CANCELLED: '취소됨', REJECTED: '거절됨' }[normalizeGxReservationStatus(s)] || s || '')

const reservationStatusClass = (s) =>
  ({
    WAITING: 'is-waiting',
    CONFIRMED: 'is-confirmed',
    CANCELLED: 'is-cancelled',
    REJECTED: 'is-rejected',
  }[normalizeGxReservationStatus(s)] || '')

const fetchDetail = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const res = await gxStore.fetchGxProgramDetail(route.params.programId)
    state.detail = res
    if (normalizeGxReservationStatus(res?.myReservation?.status) === 'WAITING' && res?.myReservation?.gxReservationId) {
      fetchWaitingOrder(res.myReservation.gxReservationId)
    }
  } catch (e) {
    state.errorMessage =
      e?.response?.data?.resultMessage || 'GX 프로그램 정보를 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const fetchWaitingOrder = async (gxReservationId) => {
  if (!gxReservationId) return
  state.waitingLoading = true
  try {
    const res = await gxStore.fetchGxWaitingStatus(gxReservationId)
    state.waitingOrder = res?.waitingOrder ?? res?.waitingNumber ?? res?.waitNo ?? null
  } catch {
    // 대기 순번 조회 실패는 표시 생략
  } finally {
    state.waitingLoading = false
  }
}

const onApplyConfirm = async () => {
  applyModal.show = false
  state.submitting = true
  try {
    const res = await gxStore.createGxReservation({ programId: route.params.programId })
    state.gxReservationId = res?.gxReservationId
    state.myStatus = res?.status

    const isWaiting = normalizeGxReservationStatus(res?.status) === 'WAITING'
    resultModal.success = true
    resultModal.message = isWaiting
      ? '대기 신청이 완료되었습니다.'
      : '신청이 완료되었습니다.'

    if (isWaiting && res?.gxReservationId) {
      fetchWaitingOrder(res.gxReservationId)
    }
    fetchDetail()
  } catch (e) {
    resultModal.success = false
    resultModal.message =
      e?.response?.data?.resultMessage || '신청에 실패했습니다. 다시 시도해 주세요.'
  } finally {
    state.submitting = false
    resultModal.show = true
  }
}

const onCancelConfirm = async () => {
  cancelModal.show = false
  const id = activeGxReservationId.value
  if (!id) return
  try {
    await gxStore.cancelGxReservation(id)
    state.myStatus = 'CANCELLED'
    state.waitingOrder = null
    resultModal.success = true
    resultModal.message = '신청이 취소되었습니다.'
    fetchDetail()
  } catch (e) {
    resultModal.success = false
    resultModal.message =
      e?.response?.data?.resultMessage || '취소에 실패했습니다. 다시 시도해 주세요.'
  } finally {
    resultModal.show = true
  }
}

const onResultClose = () => {
  resultModal.show = false
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="gx-detail">
    <!-- 뒤로가기 -->
    <button class="back-btn" type="button" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>GX 강습</span>
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

    <template v-else-if="state.detail">
      <!-- 프로그램 헤더 -->
      <div class="detail-hero">
        <div class="hero-badges">
          <span class="facility-badge">{{ state.detail.facilityName || 'GX' }}</span>
          <span :class="['program-status-badge', gxStatusClass(state.detail.status)]">
            {{ gxStatusLabel(state.detail.status) }}
          </span>
        </div>
        <h1 class="detail-title">{{ state.detail.programName || state.detail.name }}</h1>
      </div>

      <!-- 프로그램 정보 카드 -->
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">기간</span>
          <span class="info-value">
            {{ formatDate(state.detail.startDate) }} ~ {{ formatDate(state.detail.endDate) }}
          </span>
        </div>
        <template v-if="state.detail.dayOfWeeks || state.detail.daysOfWeek">
          <div class="info-divider" />
          <div class="info-row">
            <span class="info-label">요일</span>
            <span class="info-value">{{ formatDays(state.detail.dayOfWeeks || state.detail.daysOfWeek) }}</span>
          </div>
        </template>
        <div class="info-divider" />
        <div class="info-row">
          <span class="info-label">시간</span>
          <span class="info-value">
            {{ formatTime(state.detail.startTime) }} ~ {{ formatTime(state.detail.endTime) }}
          </span>
        </div>
        <div class="info-divider" />
        <div class="info-row">
          <span class="info-label">수강료</span>
          <span class="info-value fee-value">{{ formatFee(state.detail.baseFee) }}</span>
        </div>
        <template v-if="state.detail.maxCount != null">
          <div class="info-divider" />
          <div class="info-row">
            <span class="info-label">정원</span>
            <span class="info-value">
              {{ state.detail.currentCount ?? state.detail.confirmedCount ?? '-' }} /
              {{ state.detail.maxCount }}명
            </span>
          </div>
        </template>
      </div>

      <!-- 프로그램 안내 카드 -->
      <div class="notice-section">
        <p class="notice-section-title">프로그램 안내</p>
        <div class="notice-section-body">
          <p v-if="state.detail.description" class="notice-section-text">{{ state.detail.description }}</p>
          <p v-else class="notice-section-empty">등록된 프로그램 안내가 없습니다.</p>
        </div>
      </div>

      <!-- 내 신청 현황 -->
      <div v-if="isMyStatusActive" class="my-status-card">
        <div class="my-status-header">
          <span class="my-status-label">내 신청 현황</span>
          <span :class="['reservation-status-badge', reservationStatusClass(activeMyStatus)]">
            {{ reservationStatusLabel(activeMyStatus) }}
          </span>
        </div>
        <template v-if="activeMyStatus === 'WAITING'">
          <div v-if="state.waitingLoading" class="waiting-loading">
            <span>순번 조회 중...</span>
          </div>
          <div v-else-if="state.waitingOrder != null" class="waiting-order">
            현재 대기 순번 <strong>{{ state.waitingOrder }}번</strong>
          </div>
        </template>
      </div>

      <!-- 마감 안내 (대기 불가) -->
      <div
        v-if="normalizedDetailStatus === 'CLOSED' && !state.detail.waitingEnabled && !isMyStatusActive"
        class="notice-card is-warning"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
        </svg>
        <div>
          <p class="notice-title">신청 마감</p>
          <p class="notice-desc">정원이 마감되었습니다.</p>
        </div>
      </div>

      <!-- 마감 안내 (대기 가능) -->
      <div
        v-else-if="normalizedDetailStatus === 'CLOSED' && state.detail.waitingEnabled && !isMyStatusActive"
        class="notice-card is-info"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
        </svg>
        <div>
          <p class="notice-title">대기 신청 가능</p>
          <p class="notice-desc">정원이 마감되었으나 대기 신청이 가능합니다. 취소 발생 시 자동 승격됩니다.</p>
        </div>
      </div>

      <!-- 프로그램 취소 안내 -->
      <div
        v-else-if="normalizedDetailStatus === 'CANCELLED'"
        class="notice-card is-warning"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
        </svg>
        <div>
          <p class="notice-title">취소된 프로그램</p>
          <p class="notice-desc">해당 프로그램은 취소되었습니다.</p>
        </div>
      </div>
    </template>

    <!-- CTA -->
    <div v-if="state.detail && !state.loading" class="cta-area">
      <button
        v-if="canApply"
        class="btn-apply"
        type="button"
        :disabled="state.submitting"
        @click="applyModal.show = true"
      >
        {{
          normalizedDetailStatus === 'CLOSED' && state.detail.waitingEnabled
            ? '대기 신청하기'
            : '신청하기'
        }}
      </button>
      <button
        v-else-if="canCancel"
        class="btn-cancel"
        type="button"
        @click="cancelModal.show = true"
      >
        신청 취소
      </button>
    </div>

    <!-- 신청 확인 모달 -->
    <ResidentModal
      :visible="applyModal.show"
      type="info"
      title="신청하시겠어요?"
      subtitle="아래 프로그램에 신청합니다."
      confirmText="신청하기"
      confirmType="primary"
      :infoRows="state.detail ? [
        { label: '프로그램', value: state.detail.programName || state.detail.name },
        { label: '기간', value: `${formatDate(state.detail.startDate)} ~ ${formatDate(state.detail.endDate)}` },
        { label: '시간', value: `${formatTime(state.detail.startTime)} ~ ${formatTime(state.detail.endTime)}` },
        { label: '수강료', value: formatFee(state.detail.baseFee) },
      ] : []"
      @close="applyModal.show = false"
      @confirm="onApplyConfirm"
    />

    <!-- 취소 확인 모달 -->
    <ResidentModal
      :visible="cancelModal.show"
      type="warning"
      title="신청을 취소하시겠어요?"
      subtitle="취소 후 재신청이 불가할 수 있습니다."
      confirmText="신청 취소"
      confirmType="danger"
      :infoRows="state.detail ? [
        { label: '프로그램', value: state.detail.programName || state.detail.name },
        { label: '기간', value: `${formatDate(state.detail.startDate)} ~ ${formatDate(state.detail.endDate)}` },
      ] : []"
      @close="cancelModal.show = false"
      @confirm="onCancelConfirm"
    />

    <!-- 결과 모달 -->
    <ResidentModal
      :visible="resultModal.show"
      :type="resultModal.success ? 'success' : 'danger'"
      :title="resultModal.success ? '완료' : '오류'"
      :subtitle="resultModal.message"
      confirmText="확인"
      confirmType="primary"
      @close="onResultClose"
      @confirm="onResultClose"
    />
  </div>
</template>

<style scoped>
.gx-detail {
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

/* 프로그램 헤더 */
.detail-hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.hero-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.facility-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #eef3fb;
  color: #4973e5;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
}

.program-status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.program-status-badge.is-open {
  background: #e6f4ec;
  color: #2e7d52;
}

.program-status-badge.is-active {
  background: #eef3fb;
  color: #4973e5;
}

.program-status-badge.is-closed {
  background: #f1f5f9;
  color: #94a3b8;
}

.program-status-badge.is-cancelled {
  background: #fff5f5;
  color: #e53e3e;
}

.detail-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
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

.fee-value {
  color: #4973e5;
  font-size: 15px;
}

.info-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0 16px;
}

/* 프로그램 안내 카드 */
.notice-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(73, 115, 229, 0.07);
}

.notice-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.notice-section-body {
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.notice-section-text {
  font-size: 14px;
  color: #4a5568;
  line-height: 1.7;
  margin: 0;
  white-space: pre-line;
}

.notice-section-empty {
  font-size: 13px;
  color: #cbd5e1;
  margin: 0;
}

/* 내 신청 현황 카드 */
.my-status-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(73, 115, 229, 0.07);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.my-status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.my-status-label {
  font-size: 13px;
  font-weight: 700;
  color: #1a202c;
}

.reservation-status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

.reservation-status-badge.is-confirmed {
  background: #eef3fb;
  color: #4973e5;
}

.reservation-status-badge.is-waiting {
  background: #fef9ec;
  color: #c08b2d;
}

.reservation-status-badge.is-cancelled {
  background: #fff5f5;
  color: #e53e3e;
}

.reservation-status-badge.is-rejected {
  background: #f1f5f9;
  color: #94a3b8;
}

.waiting-loading {
  font-size: 13px;
  color: #94a3b8;
}

.waiting-order {
  font-size: 14px;
  color: #718096;
}

.waiting-order strong {
  color: #4973e5;
  font-weight: 700;
}

/* 안내 카드 */
.notice-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  flex-shrink: 0;
}

.notice-card.is-warning {
  background: #fff8e1;
  color: #b7791f;
}

.notice-card.is-info {
  background: #eef3fb;
  color: #4973e5;
}

.notice-card svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.notice-title {
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 4px;
}

.notice-desc {
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  opacity: 0.85;
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

.btn-apply {
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

.btn-apply:hover:not(:disabled) {
  background: #3a5ec8;
}

.btn-apply:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.btn-cancel {
  width: 100%;
  height: 52px;
  background: #e53e3e;
  color: #ffffff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  transition: background 0.15s;
}

.btn-cancel:hover {
  background: #c53030;
}

/* 로딩 / 에러 */
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
