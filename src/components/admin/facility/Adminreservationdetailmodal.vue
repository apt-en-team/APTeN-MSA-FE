<script setup>
import { reactive, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import reservationApi from '@/api/reservationApi'

const props = defineProps({
  reservationId: {
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
  () => props.reservationId,
  async (id) => {
    if (!id) return

    state.isLoading = true

    try {
      state.reservation = await reservationApi.getAdminReservationDetail(id)
    } catch {
      state.reservation = null
    } finally {
      state.isLoading = false
    }
  },
  { immediate: true },
)

const statusLabel = (s) =>
  ({ CONFIRMED: '확정', PENDING: '대기', CANCELLED: '취소', COMPLETED: '완료' }[s] || s)

const statusClass = (s) =>
  ({
    CONFIRMED: 'badge-confirmed',
    PENDING: 'badge-pending',
    CANCELLED: 'badge-cancelled',
    COMPLETED: 'badge-completed',
  }[s] || '')

const fmt = (dt) => (dt ? String(dt).replace('T', ' ').slice(0, 16) : '-')

const isCancellable = (s) => s === 'CONFIRMED' || s === 'PENDING'
</script>

<template>
  <BaseModal title="예약 상세 정보" :subtitle="`ID ${reservationId}`" @close="$emit('close')">
    <div v-if="state.isLoading" class="loading">로딩 중...</div>

    <template v-else-if="state.reservation">
      <div class="summary">
        <span :class="['badge', statusClass(state.reservation.status)]">
          {{ statusLabel(state.reservation.status) }}
        </span>
        <h3 class="facility-name">{{ state.reservation.facilityName }}</h3>
      </div>

      <div class="detail-grid">
        <div class="detail-item">
          <span class="label">예약 ID</span>
          <span class="value">{{ state.reservation.reservationId }}</span>
        </div>
        <div class="detail-item">
          <span class="label">예약자</span>
          <span class="value">{{ state.reservation.residentName }}</span>
        </div>
        <div class="detail-item">
          <span class="label">시설명</span>
          <span class="value">{{ state.reservation.facilityName }}</span>
        </div>
        <div class="detail-item">
          <span class="label">예약 날짜</span>
          <span class="value">{{ state.reservation.reservationDate ?? '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">시간</span>
          <span class="value">
            {{ state.reservation.startTime ?? '-' }} ~ {{ state.reservation.endTime ?? '-' }}
          </span>
        </div>
        <div class="detail-item">
          <span class="label">예약 상태</span>
          <span :class="['badge', statusClass(state.reservation.status)]">
            {{ statusLabel(state.reservation.status) }}
          </span>
        </div>
        <div v-if="state.reservation.seatNo" class="detail-item">
          <span class="label">좌석 번호</span>
          <span class="value">{{ state.reservation.seatNo }}번</span>
        </div>
        <div class="detail-item">
          <span class="label">예약일</span>
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
.facility-name {
  font-size: 20px;
  font-weight: 700;
  margin: 8px 0 4px;
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
.badge-completed {
  background: #e8eaf6;
  color: #3949ab;
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
