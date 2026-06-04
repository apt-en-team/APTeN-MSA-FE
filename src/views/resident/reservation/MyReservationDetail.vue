<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReservationStore } from '@/stores/useReservationStore.js'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import { normalizeReservationStatus } from '@/utils/normalize.js'

const route = useRoute()
const router = useRouter()
const reservationStore = useReservationStore()

const state = reactive({
  detail: null,
  loading: false,
  errorMessage: '',
})

const cancelModal = reactive({ show: false })
const resultModal = reactive({ show: false, success: false, message: '' })

const isCancellable = computed(() =>
  normalizeReservationStatus(state.detail?.status) === 'CONFIRMED' &&
  state.detail?.cancelable !== false,
)

const goBack = () => {
  router.push(`/resident/${route.params.complexId}/reservations`)
}

const statusLabel = (s) =>
  ({ CONFIRMED: '예약완료', COMPLETED: '이용완료', CANCELLED: '취소됨' }[normalizeReservationStatus(s)] || s || '-')

const statusClass = (s) =>
  ({ CONFIRMED: 'is-confirmed', COMPLETED: 'is-completed', CANCELLED: 'is-cancelled' }[normalizeReservationStatus(s)] || '')

const formatDate = (d) => (d ? d.slice(0, 10).replace(/-/g, '.') : '-')
const formatTime = (t) => (t ? t.slice(0, 5) : '-')

const fetchDetail = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const res = await reservationStore.fetchMyReservationDetail(route.params.reservationId)
    state.detail = res
  } catch (e) {
    state.errorMessage =
      e?.response?.data?.message || '예약 정보를 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const onCancelConfirm = async () => {
  cancelModal.show = false
  try {
    await reservationStore.cancelMyReservation(route.params.reservationId)
    state.detail = { ...state.detail, status: 'CANCELLED' }
    resultModal.success = true
    resultModal.message = '예약이 취소되었습니다.'
  } catch (e) {
    resultModal.success = false
    resultModal.message =
      e?.response?.data?.message || '취소에 실패했습니다. 다시 시도해 주세요.'
  } finally {
    resultModal.show = true
  }
}

const onResultClose = () => {
  resultModal.show = false
  if (resultModal.success) {
    router.push(`/resident/${route.params.complexId}/reservations`)
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<template>
  <div class="reservation-detail">
    <!-- 뒤로가기 -->
    <button class="back-btn" type="button" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>내 예약</span>
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
        <span :class="['status-badge', statusClass(state.detail.status)]">
          {{ statusLabel(state.detail.status) }}
        </span>
        <h1 class="detail-title">{{ state.detail.facilityName || '-' }}</h1>
        <p class="detail-date">{{ formatDate(state.detail.reservationDate) }}</p>
      </div>

      <!-- 예약 정보 카드 -->
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">예약 시간</span>
          <span class="info-value">
            {{ formatTime(state.detail.startTime) }} ~ {{ formatTime(state.detail.endTime) }}
          </span>
        </div>
        <div v-if="state.detail.seatNo" class="info-divider" />
        <div v-if="state.detail.seatNo" class="info-row">
          <span class="info-label">좌석</span>
          <span class="info-value">{{ state.detail.seatNo }}</span>
        </div>
        <div v-if="state.detail.headCount" class="info-divider" />
        <div v-if="state.detail.headCount" class="info-row">
          <span class="info-label">이용 인원</span>
          <span class="info-value">{{ state.detail.headCount }}명</span>
        </div>
        <div class="info-divider" />
        <div class="info-row">
          <span class="info-label">신청일</span>
          <span class="info-value">{{ formatDate(state.detail.createdAt) }}</span>
        </div>
      </div>

      <!-- 취소 불가 안내 -->
      <div v-if="!isCancellable" class="status-notice">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
        </svg>
        <span v-if="normalizeReservationStatus(state.detail.status) === 'COMPLETED'">이미 이용이 완료된 예약입니다.</span>
        <span v-else-if="normalizeReservationStatus(state.detail.status) === 'CANCELLED'">이미 취소된 예약입니다.</span>
      </div>
    </template>

    <!-- CTA: 예약 취소 (CONFIRMED만 표시) -->
    <div v-if="isCancellable && !state.loading" class="cta-area">
      <button class="btn-cancel-reserve" type="button" @click="cancelModal.show = true">
        예약 취소
      </button>
    </div>

    <!-- 취소 확인 모달 -->
    <ResidentModal
      :visible="cancelModal.show"
      type="warning"
      title="예약을 취소하시겠어요?"
      subtitle="취소된 예약은 복구할 수 없습니다."
      confirmText="예약 취소"
      confirmType="danger"
      :infoRows="state.detail ? [
        { label: '시설', value: state.detail.facilityName || '-' },
        { label: '예약일', value: formatDate(state.detail.reservationDate) },
        { label: '시간', value: `${formatTime(state.detail.startTime)} ~ ${formatTime(state.detail.endTime)}` },
      ] : []"
      @close="cancelModal.show = false"
      @confirm="onCancelConfirm"
    />

    <!-- 결과 모달 -->
    <ResidentModal
      :visible="resultModal.show"
      :type="resultModal.success ? 'success' : 'danger'"
      :title="resultModal.success ? '취소 완료' : '취소 실패'"
      :subtitle="resultModal.message"
      confirmText="확인"
      confirmType="primary"
      @close="onResultClose"
      @confirm="onResultClose"
    />
  </div>
</template>

<style scoped>
.reservation-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 16px calc(88px + env(safe-area-inset-bottom, 0px) + 16px);
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

.status-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  width: fit-content;
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

.detail-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.detail-date {
  font-size: 15px;
  font-weight: 600;
  color: #4973e5;
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

.info-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0 16px;
}

/* 상태 안내 */
.status-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #f8faff;
  border-radius: 10px;
  color: #718096;
  font-size: 13px;
}

/* CTA */
.cta-area {
  margin-top: 4px;
}

.btn-cancel-reserve {
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

.btn-cancel-reserve:hover {
  background: #c53030;
}

/* 상태 영역 */
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
