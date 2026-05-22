<script setup>
import { reactive, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import gxApi from '@/api/gxApi'

const props = defineProps({
  gxReservationId: {
    type: [Number, String],
    required: true,
  },
})

const emit = defineEmits(['close', 'cancel-request'])

const state = reactive({
  reservation: null,
  isLoading: false,
})

watch(
  () => props.gxReservationId,
  async (id) => {
    if (!id) return
    state.isLoading = true
    try {
      state.reservation = await gxApi.getAdminGxReservationDetail(id)
    } catch {
      state.reservation = null
    } finally {
      state.isLoading = false
    }
  },
  { immediate: true },
)

const STATUS_LABEL = {
  CONFIRMED: '확정',
  WAITING: '대기',
  CANCELLED: '취소',
  REJECTED: '거절',
}

const STATUS_CLASS = {
  CONFIRMED: 'badge-confirmed',
  WAITING: 'badge-pending',
  CANCELLED: 'badge-cancelled',
  REJECTED: 'badge-cancelled',
}

const statusLabel = (s) => STATUS_LABEL[s] || s || '-'
const statusClass = (s) => STATUS_CLASS[s] || ''
const isCancellable = (s) => s === 'CONFIRMED' || s === 'WAITING'

const fmt = (dt) => (dt ? String(dt).replace('T', ' ').slice(0, 16) : '-')
const fmtDate = (d) => (d ? String(d).replace(/-/g, '.') : '-')
const fmtTime = (t) => (t ? String(t).slice(0, 5) : '-')
</script>

<template>
  <BaseModal
    title="GX 예약 상세 정보"
    :subtitle="`ID ${gxReservationId}`"
    @close="$emit('close')"
  >
    <div v-if="state.isLoading" class="loading">로딩 중...</div>

    <template v-else-if="state.reservation">
      <div class="summary">
        <span :class="['badge', statusClass(state.reservation.status)]">
          {{ statusLabel(state.reservation.status) }}
        </span>
        <h3 class="program-name">{{ state.reservation.programName }}</h3>
        <p class="facility-name">{{ state.reservation.facilityName }}</p>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">예약 ID</span>
          <span class="value">{{ state.reservation.gxReservationId }}</span>
        </div>
        <div class="detail-item">
          <span class="label">예약자</span>
          <span class="value">{{ state.reservation.residentName ?? '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">세대</span>
          <span class="value">{{ state.reservation.unit ?? '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">예약 상태</span>
          <span :class="['badge', statusClass(state.reservation.status)]">
            {{ statusLabel(state.reservation.status) }}
          </span>
        </div>
        <div class="detail-item">
          <span class="label">프로그램 기간</span>
          <span class="value">
            {{ fmtDate(state.reservation.startDate) }} ~ {{ fmtDate(state.reservation.endDate) }}
          </span>
        </div>
        <div class="detail-item">
          <span class="label">운영 시간</span>
          <span class="value">
            {{ fmtTime(state.reservation.startTime) }} ~ {{ fmtTime(state.reservation.endTime) }}
          </span>
        </div>
        <div v-if="state.reservation.waitNo" class="detail-item">
          <span class="label">대기 순번</span>
          <span class="value">{{ state.reservation.waitNo }}번</span>
        </div>
        <div
          v-if="state.reservation.confirmedCount != null && state.reservation.maxCount != null"
          class="detail-item"
        >
          <span class="label">현재 확정 / 최대</span>
          <span class="value">
            {{ state.reservation.confirmedCount }} / {{ state.reservation.maxCount }}명
          </span>
        </div>
        <div class="detail-item">
          <span class="label">신청일</span>
          <span class="value">{{ fmt(state.reservation.createdAt) }}</span>
        </div>
        <div v-if="state.reservation.cancelledAt" class="detail-item">
          <span class="label">취소일</span>
          <span class="value">{{ fmt(state.reservation.cancelledAt) }}</span>
        </div>
      </div>
    </template>

    <template #footer>
      <button
        v-if="state.reservation && isCancellable(state.reservation.status)"
        class="btn-danger"
        @click="$emit('cancel-request', state.reservation)"
      >
        예약 취소
      </button>
      <button class="btn-primary" @click="$emit('close')">닫기</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.loading {
  text-align: center;
  padding: 40px;
  color: #888;
}

.summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.program-name {
  font-size: 18px;
  font-weight: 700;
  margin: 8px 0 2px;
  color: #1a202c;
}

.facility-name {
  font-size: 13px;
  color: #718096;
  margin: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #eee;
}

.detail-item {
  padding: 12px 4px;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #888;
}

.value {
  font-size: 14px;
  font-weight: 500;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge-confirmed {
  background: #e6f4ea;
  color: #2e7d32;
}

.badge-pending {
  background: #fff3e0;
  color: #e65100;
}

.badge-cancelled {
  background: #fce4ec;
  color: #c62828;
}

.btn-primary {
  padding: 9px 20px;
  border-radius: 8px;
  background: #1e2533;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.btn-danger {
  padding: 9px 20px;
  border-radius: 8px;
  background: #ff4d4f;
  border: 1px solid #ff4d4f;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
</style>
