<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { useReservationStore } from '@/stores/useReservationStore.js'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import { toList } from '@/utils/apiResponse'
import { normalizeReservationType } from '@/utils/normalize.js'
import { getMySubscriptions } from '@/api/facilityApi.js'

const route = useRoute()
const router = useRouter()
const facilityStore = useFacilityStore()
const reservationStore = useReservationStore()

// 로컬 날짜 기준 오늘 (toISOString은 UTC 기준이므로 UTC+9에서 이른 시간대에 어제 날짜가 될 수 있음)
const _now = new Date()
const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`

// API 전송용 날짜를 yyyy-MM-dd 형식으로 보정한다.
// "2026. 05. 17.", "2026.05.17" → "2026-05-17"
const toApiDate = (value) => {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return value.replace(/\s/g, '').replace(/\./g, '-').replace(/-$/, '')
}

const state = reactive({
  facility: null,
  facilityLoading: false,
  facilityError: '',

  form: {
    date: todayStr,
    selectedTime: null,
    selectedSeat: null,
  },

  times: [],
  timesLoading: false,
  timesError: '',

  seats: [],
  seatsLoading: false,
  seatsError: '',

  submitting: false,
  isAlreadySubscribed: false,
})

const resultModal = reactive({ show: false, success: false, message: '' })

// 구독형 시설 첫 예약 시 요금 안내 확인 모달
const billingConfirmModal = reactive({ show: false })

const reservationType = computed(() => normalizeReservationType(state.facility?.reservationType))
const isApproval = computed(() => reservationType.value === 'APPROVAL')
const isSeat = computed(() => reservationType.value === 'SEAT')
const isCount = computed(() => reservationType.value === 'COUNT')

// FLAT/PER_PERSON 시설 = 구독형 → 예약 시 요금 안내 필요
const isSubscriptionType = computed(() => {
  const fee = state.facility?.feeType
  return fee === 'FLAT' || fee === 'PER_PERSON'
})

const canSubmit = computed(() => {
  if (!state.form.selectedTime) return false
  if (isSeat.value && !state.form.selectedSeat) return false
  return true
})

const reservationTypeLabel = (type) =>
  ({ SEAT: '좌석형', COUNT: '정원형', APPROVAL: '승인형' }[type] || type || '-')

const formatTime = (t) => (t ? t.slice(0, 5) : '-')

const goBack = () => {
  router.push(`/resident/${route.params.complexId}/facility/${route.params.facilityId}`)
}

const fetchFacility = async () => {
  state.facilityLoading = true
  state.facilityError = ''
  try {
    const res = await facilityStore.fetchFacilityDetail(route.params.facilityId)
    state.facility = res
  } catch (e) {
    state.facilityError =
      e?.response?.data?.message || '시설 정보를 불러오지 못했습니다.'
  } finally {
    state.facilityLoading = false
  }
}

const fetchAvailableTimes = async () => {
  if (!state.form.date) return
  state.times = []
  state.form.selectedTime = null
  state.form.selectedSeat = null
  state.seats = []
  state.timesLoading = true
  state.timesError = ''
  try {
    const res = await reservationStore.fetchAvailableTimes({
      facilityId: route.params.facilityId,
      reservationDate: toApiDate(state.form.date),
    })
    state.times = toList(res)
  } catch (e) {
    state.timesError =
      e?.response?.data?.message || '예약 가능 시간을 불러오지 못했습니다.'
  } finally {
    state.timesLoading = false
  }
}

const fetchSeats = async () => {
  if (!state.form.selectedTime) return
  state.seats = []
  state.form.selectedSeat = null
  state.seatsLoading = true
  state.seatsError = ''
  try {
    const res = await facilityStore.fetchResidentSeatStatus(route.params.facilityId, {
      targetDate: toApiDate(state.form.date),
      startTime: state.form.selectedTime.startTime,
      endTime: state.form.selectedTime.endTime,
    })
    state.seats = toList(res)
  } catch (e) {
    state.seatsError =
      e?.response?.data?.message || '좌석 정보를 불러오지 못했습니다.'
  } finally {
    state.seatsLoading = false
  }
}

const onDateChange = () => {
  fetchAvailableTimes()
}

const selectTime = (slot) => {
  if (slot.isReservable === false) return
  if (
    state.form.selectedTime?.startTime === slot.startTime &&
    state.form.selectedTime?.endTime === slot.endTime
  ) {
    state.form.selectedTime = null
    state.form.selectedSeat = null
    state.seats = []
    return
  }
  state.form.selectedTime = slot
  if (isSeat.value) {
    fetchSeats()
  }
}

const isSlotSelected = (slot) =>
  state.form.selectedTime?.startTime === slot.startTime &&
  state.form.selectedTime?.endTime === slot.endTime

const isSlotDisabled = (slot) => slot.isReservable === false || slot.availableCount === 0

const selectSeat = (seat) => {
  if (seat.status !== 'AVAILABLE') return
  if (state.form.selectedSeat?.seatId === seat.seatId) {
    state.form.selectedSeat = null
    return
  }
  state.form.selectedSeat = seat
}

const isSeatSelected = (seat) => state.form.selectedSeat?.seatId === seat.seatId

const isSeatAvailable = (seat) => seat.status === 'AVAILABLE'

const seatStatusLabel = (status) =>
  ({ AVAILABLE: '예약 가능', RESERVED: '예약됨', HOLDING: '선점됨', BLOCKED: '차단됨' }[status] || '')

// 구독형이고 아직 구독 전이면 요금 안내 모달 표시, 이미 구독 중이면 바로 예약
const onReserveClick = () => {
  if (!canSubmit.value || state.submitting) return
  if (isSubscriptionType.value && !state.isAlreadySubscribed) {
    billingConfirmModal.show = true
    return
  }
  submitReservation()
}

const submitReservation = async () => {
  if (!canSubmit.value || state.submitting) return
  state.submitting = true
  try {
    const apiDate = toApiDate(state.form.date)
    if (isCount.value) {
      await reservationStore.createReservation({
        facilityId: route.params.facilityId,
        reservationDate: apiDate,
        startTime: state.form.selectedTime.startTime,
        endTime: state.form.selectedTime.endTime,
      })
    } else if (isSeat.value) {
      const holdRes = await reservationStore.holdSeat({
        facilityId: route.params.facilityId,
        seatId: state.form.selectedSeat.seatId,
        reservationDate: apiDate,
        startTime: state.form.selectedTime.startTime,
        endTime: state.form.selectedTime.endTime,
      })
      await reservationStore.createReservation({
        facilityId: route.params.facilityId,
        reservationDate: apiDate,
        startTime: state.form.selectedTime.startTime,
        endTime: state.form.selectedTime.endTime,
        holdId: holdRes?.holdId,
        seatId: state.form.selectedSeat.seatId,
      })
    }
    resultModal.success = true
    resultModal.message = '예약이 완료되었습니다.'
  } catch (e) {
    resultModal.success = false
    resultModal.message =
      e?.response?.data?.message || '예약에 실패했습니다. 다시 시도해 주세요.'
  } finally {
    state.submitting = false
    resultModal.show = true
  }
}

const onResultClose = () => {
  resultModal.show = false
  if (resultModal.success) {
    router.push(`/resident/${route.params.complexId}/reservations`)
  }
}

const checkSubscription = async () => {
  if (!isSubscriptionType.value) return
  try {
    const subs = await getMySubscriptions()
    const facilityId = String(route.params.facilityId)
    state.isAlreadySubscribed = Array.isArray(subs) && subs.some(
      (s) => String(s.facilityId) === facilityId && (String(s.status) === 'ACTIVE' || String(s.status) === '구독중'),
    )
  } catch {
    // 구독 조회 실패 시 모달 표시 경로 유지
  }
}

onMounted(async () => {
  await fetchFacility()
  checkSubscription()
  if (!isApproval.value) {
    fetchAvailableTimes()
  }
})
</script>

<template>
  <div class="reserve-create">
    <!-- 뒤로가기 -->
    <button class="back-btn" type="button" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>시설 상세</span>
    </button>

    <!-- 시설 로딩 -->
    <div v-if="state.facilityLoading" class="loading-area">
      <p class="loading-text">불러오는 중...</p>
    </div>

    <!-- 시설 에러 -->
    <div v-else-if="state.facilityError" class="error-area">
      <p class="error-text">{{ state.facilityError }}</p>
      <button class="btn-retry" type="button" @click="fetchFacility">다시 시도</button>
    </div>

    <template v-else-if="state.facility">
      <!-- 시설 요약 -->
      <div class="facility-summary">
        <div class="summary-badges">
          <span class="type-badge">{{ state.facility.typeName || '-' }}</span>
          <span class="reserve-type-badge">{{ reservationTypeLabel(reservationType) }}</span>
        </div>
        <h1 class="summary-title">{{ state.facility.name }}</h1>
        <p class="summary-hours">
          운영 {{ formatTime(state.facility.openTime) }} ~ {{ formatTime(state.facility.closeTime) }}
        </p>
      </div>

      <!-- APPROVAL 안내 -->
      <div v-if="isApproval" class="notice-card is-warning">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
        </svg>
        <div>
          <p class="notice-title">승인형 예약 준비 중</p>
          <p class="notice-desc">승인형 예약은 현재 온라인 신청이 지원되지 않습니다. 관리사무소에 직접 문의해 주세요.</p>
        </div>
      </div>

      <!-- 날짜 선택 (APPROVAL 제외) -->
      <template v-if="!isApproval">
        <div class="section">
          <p class="section-label">예약 날짜</p>
          <input
            v-model="state.form.date"
            class="date-input"
            type="date"
            :min="todayStr"
            @change="onDateChange"
          />
        </div>

        <!-- 예약 가능 시간 -->
        <div class="section">
          <p class="section-label">예약 시간</p>

          <div v-if="state.timesLoading" class="times-loading">
            <p class="loading-text">시간 조회 중...</p>
          </div>

          <div v-else-if="state.timesError" class="times-error">
            <p class="error-text-sm">{{ state.timesError }}</p>
            <button class="btn-retry-sm" type="button" @click="fetchAvailableTimes">다시 시도</button>
          </div>

          <div v-else-if="state.times.length === 0" class="times-empty">
            <p>선택한 날짜에 예약 가능한 시간이 없습니다.</p>
          </div>

          <div v-else class="time-chips">
            <button
              v-for="slot in state.times"
              :key="slot.startTime"
              :class="[
                'time-chip',
                isSlotSelected(slot) && 'is-selected',
                isSlotDisabled(slot) && 'is-disabled',
              ]"
              type="button"
              :disabled="isSlotDisabled(slot)"
              @click="selectTime(slot)"
            >
              <span class="chip-time">{{ formatTime(slot.startTime) }}~{{ formatTime(slot.endTime) }}</span>
              <span v-if="isCount && slot.availableCount != null" class="chip-count">
                잔여 {{ slot.availableCount }}
              </span>
            </button>
          </div>
        </div>

        <!-- 좌석 선택 (SEAT + 시간 선택 후) -->
        <div v-if="isSeat && state.form.selectedTime" class="section">
          <p class="section-label">좌석 선택</p>

          <div v-if="state.seatsLoading" class="times-loading">
            <p class="loading-text">좌석 조회 중...</p>
          </div>

          <div v-else-if="state.seatsError" class="times-error">
            <p class="error-text-sm">{{ state.seatsError }}</p>
            <button class="btn-retry-sm" type="button" @click="fetchSeats">다시 시도</button>
          </div>

          <div v-else-if="state.seats.length === 0" class="times-empty">
            <p>이용 가능한 좌석이 없습니다.</p>
          </div>

          <div v-else class="seat-grid">
            <button
              v-for="seat in state.seats"
              :key="seat.seatId"
              :class="[
                'seat-card',
                `is-${seat.status.toLowerCase()}`,
                isSeatSelected(seat) && 'is-selected',
              ]"
              type="button"
              :disabled="!isSeatAvailable(seat)"
              @click="selectSeat(seat)"
            >
              <span class="seat-name">{{ seat.seatName || `${seat.seatNo}번` }}</span>
              <span class="seat-status-label">{{ seatStatusLabel(seat.status) }}</span>
            </button>
          </div>
        </div>
      </template>
    </template>

    <!-- CTA -->
    <div v-if="state.facility && !state.facilityLoading && !isApproval" class="cta-area">
      <button
        class="btn-submit"
        type="button"
        :disabled="!canSubmit || state.submitting"
        @click="onReserveClick"
      >
        {{ state.submitting ? '예약 중...' : '예약하기' }}
      </button>
    </div>

    <!-- 구독형 요금 안내 확인 모달 (FLAT/PER_PERSON 시설 첫 예약 시) -->
    <ResidentModal
      :visible="billingConfirmModal.show"
      type="info"
      title="매월 요금이 청구됩니다"
      subtitle="이 시설은 구독 방식으로 운영됩니다. 예약 후 매월 이용 요금이 청구되며, 해지 전까지 자동 갱신됩니다."
      confirmText="예약하기"
      confirmType="primary"
      @close="billingConfirmModal.show = false"
      @confirm="() => { billingConfirmModal.show = false; submitReservation() }"
    />

    <!-- 결과 모달 -->
    <ResidentModal
      :visible="resultModal.show"
      :type="resultModal.success ? 'success' : 'danger'"
      :title="resultModal.success ? '예약 완료' : '예약 실패'"
      :subtitle="resultModal.message"
      confirmText="확인"
      confirmType="primary"
      :infoRows="resultModal.success && state.form.selectedTime ? [
        { label: '시설', value: state.facility?.name || '-' },
        { label: '날짜', value: state.form.date },
        { label: '시간', value: `${formatTime(state.form.selectedTime?.startTime)} ~ ${formatTime(state.form.selectedTime?.endTime)}` },
        ...(isSeat && state.form.selectedSeat ? [{ label: '좌석', value: state.form.selectedSeat.seatName || `${state.form.selectedSeat.seatNo}번` }] : [])
      ] : []"
      @close="onResultClose"
      @confirm="onResultClose"
    />
  </div>
</template>

<style scoped>
.reserve-create {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

/* 시설 요약 */
.facility-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #eef3fb;
  color: #4973e5;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
}

.reserve-type-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #f1f5f9;
  color: #718096;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
}

.summary-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.summary-hours {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
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

/* 섹션 */
.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  font-size: 13px;
  font-weight: 700;
  color: #718096;
  margin: 0;
}

/* 날짜 입력 */
.date-input {
  width: 100%;
  height: 48px;
  padding: 0 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #1a202c;
  background: #ffffff;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.date-input:focus {
  outline: none;
  border-color: #4973e5;
}

/* 시간 칩 */
.time-chips {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.time-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}

.time-chip.is-selected {
  border-color: #4973e5;
  background: #4973e5;
  color: #ffffff;
}

.time-chip.is-disabled {
  background: #f8f9fa;
  border-color: #e2e8f0;
  color: #cbd5e1;
  cursor: not-allowed;
}

.chip-time {
  font-size: 12px;
  font-weight: 700;
}

.chip-count {
  font-size: 10px;
  opacity: 0.75;
}

/* 좌석 그리드 */
.seat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.seat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-card.is-available:not(.is-selected):hover {
  border-color: #4973e5;
}

.seat-card.is-selected {
  border-color: #4973e5;
  background: #4973e5;
  color: #ffffff;
}

.seat-card.is-reserved,
.seat-card.is-blocked {
  background: #f8f9fa;
  border-color: #e2e8f0;
  color: #cbd5e1;
  cursor: not-allowed;
}

.seat-card.is-holding {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
  cursor: not-allowed;
}

.seat-name {
  font-size: 13px;
  font-weight: 700;
}

.seat-status-label {
  font-size: 10px;
  opacity: 0.8;
}

/* 시간/좌석 조회 상태 */
.times-loading,
.times-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: #ffffff;
  border-radius: 12px;
}

.times-loading .loading-text,
.times-empty p {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.times-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #fff5f5;
  border-radius: 12px;
}

.error-text-sm {
  font-size: 13px;
  color: #e53e3e;
  margin: 0;
  text-align: center;
}

.btn-retry-sm {
  padding: 6px 14px;
  background: #4973e5;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
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

.btn-submit {
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

.btn-submit:hover:not(:disabled) {
  background: #3a5ec8;
}

.btn-submit:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
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
