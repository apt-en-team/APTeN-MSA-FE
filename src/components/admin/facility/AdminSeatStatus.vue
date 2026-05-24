<script setup>
import { reactive, watch } from 'vue'
import facilityApi from '@/api/facilityApi'
import reservationApi from '@/api/reservationApi'
import { useAuthStore } from '@/stores/useAuthStore.js'
import AdminReservationDetailModal from '@/components/admin/facility/Adminreservationdetailmodal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const props = defineProps({
  facilityId: {
    type: [Number, String],
    required: true,
  },
  selectedDate: {
    type: String,
    default: '',
  },
  openTime: {
    type: String,
    default: '',
  },
  closeTime: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update-summary'])

const authStore = useAuthStore()

const getCurrentTimeText = () =>
  new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const getCurrentActorName = () =>
  authStore.userInfo?.name || authStore.user?.name || authStore.name || '관리자'

const state = reactive({
  loading: false,
  error: false,
  seats: [],
  detailModal: { show: false, reservationId: null },
  cancelModal: { show: false, loading: false, targetId: null, targetName: '', targetUnit: '' },
})

const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
  desc: '',
  itemName: '',
  time: '',
  actionLabel: '',
  actor: '',
  afterConfirm: null,
})

const openResultModal = ({
  type = 'success',
  title,
  subtitle = '',
  desc = '',
  itemName = '',
  time = '',
  actionLabel = '',
  actor = '',
  afterConfirm = null,
} = {}) => {
  Object.assign(resultModal, { show: true, type, title, subtitle, desc, itemName, time, actionLabel, actor, afterConfirm })
}

const handleResultConfirm = async () => {
  const callback = resultModal.afterConfirm
  resultModal.show = false
  resultModal.afterConfirm = null
  if (typeof callback === 'function') await callback()
}

const isOccupied = (seat) => seat.status !== 'AVAILABLE'

const openDetailModal = (seat) => {
  if (!seat.reservationId) return
  state.detailModal.reservationId = seat.reservationId
  state.detailModal.show = true
}

const closeDetailModal = () => {
  state.detailModal.show = false
  state.detailModal.reservationId = null
}

const openCancelModal = (reservation) => {
  state.cancelModal.targetId = reservation.reservationId
  state.cancelModal.targetName = reservation.facilityName || `예약 #${reservation.reservationId}`
  state.cancelModal.targetUnit = reservation.unit || ''
  state.cancelModal.show = true
}

const closeCancelModal = () => {
  state.cancelModal.show = false
  state.cancelModal.loading = false
  state.cancelModal.targetId = null
  state.cancelModal.targetName = ''
  state.cancelModal.targetUnit = ''
}

const handleCancel = async () => {
  state.cancelModal.loading = true
  const { targetName } = state.cancelModal
  try {
    await reservationApi.cancelAdminReservation(state.cancelModal.targetId, {})
    closeCancelModal()
    closeDetailModal()
    openResultModal({
      type: 'success',
      title: '예약이 취소되었습니다.',
      subtitle: '관리자 강제 취소 처리가 완료되었습니다.',
      itemName: targetName,
      time: getCurrentTimeText(),
      actionLabel: '시설 예약 강제 취소',
      actor: getCurrentActorName(),
      afterConfirm: fetchSeatStatus,
    })
  } catch (e) {
    closeCancelModal()
    openResultModal({
      type: 'danger',
      title: '취소 처리에 실패했습니다.',
      subtitle: e?.response?.data?.message || '잠시 후 다시 시도해주세요.',
      itemName: targetName,
    })
  }
}

const fetchSeatStatus = async () => {
  if (!props.facilityId || !props.selectedDate || !props.openTime || !props.closeTime) return

  state.loading = true
  state.error = false

  try {
    const res = await facilityApi.getFacilitySeatStatus(props.facilityId, {
      targetDate: props.selectedDate,
      startTime: props.openTime,
      endTime: props.closeTime,
    })

    state.seats = Array.isArray(res) ? res : []

    emit('update-summary', {
      reservedCount: state.seats.filter((s) => isOccupied(s)).length,
      totalCount: state.seats.length,
    })
  } catch {
    state.seats = []
    state.error = true
    emit('update-summary', { reservedCount: 0, totalCount: 0 })
  } finally {
    state.loading = false
  }
}

watch(
  [() => props.facilityId, () => props.selectedDate, () => props.openTime, () => props.closeTime],
  () => {
    fetchSeatStatus()
  },
  { immediate: true },
)
</script>

<template>
  <div class="study-page">
    <div v-if="state.loading" class="empty-text">좌석 현황을 불러오는 중입니다.</div>

    <div v-else-if="state.error" class="empty-text error-text">현황 데이터를 불러오지 못했습니다.</div>

    <div v-else-if="state.seats.length === 0" class="empty-text">
      좌석 데이터가 없습니다.
    </div>

    <div v-else class="room-panel">
      <div class="panel-head">
        <h3 class="panel-title">좌석 현황</h3>
        <span class="panel-desc">전체 {{ state.seats.length }}석</span>
      </div>

      <div class="seat-grid">
        <div
          v-for="seat in state.seats"
          :key="seat.seatId ?? seat.seatNo"
          class="seat-box"
          :class="{ reserved: isOccupied(seat), clickable: !!seat.reservationId }"
          @click="openDetailModal(seat)"
        >
          <p class="seat-no">{{ seat.seatNo ?? '-' }}번</p>
          <p v-if="seat.seatName" class="seat-name">{{ seat.seatName }}</p>
          <template v-if="isOccupied(seat)">
            <p class="seat-user">{{ seat.residentName ?? '-' }}</p>
            <p v-if="seat.unit" class="seat-unit">{{ seat.unit }}</p>
          </template>
          <template v-else>
            <p class="seat-empty">빈자리</p>
          </template>
        </div>
      </div>
    </div>
  </div>

  <AdminReservationDetailModal
    v-if="state.detailModal.show"
    :reservation-id="state.detailModal.reservationId"
    @close="closeDetailModal"
    @cancel-request="openCancelModal"
  />

  <ConfirmModal
    :visible="state.cancelModal.show"
    title="예약을 취소하시겠습니까?"
    subtitle="취소된 예약은 되돌릴 수 없습니다."
    subtitle-color="#e53e3e"
    item-label="예약"
    :item-name="state.cancelModal.targetName"
    action-label="시설 예약"
    action-text="관리자 강제 취소"
    :extra-value="state.cancelModal.targetUnit"
    extra-label="소속 세대"
    confirm-text="예약 취소"
    cancel-text="닫기"
    confirm-type="danger"
    :loading="state.cancelModal.loading"
    @confirm="handleCancel"
    @cancel="closeCancelModal"
  />

  <ActionResultModal
    :visible="resultModal.show"
    :type="resultModal.type"
    :title="resultModal.title"
    :subtitle="resultModal.subtitle"
    :desc="resultModal.desc"
    :item-name="resultModal.itemName"
    :time="resultModal.time"
    :action-label="resultModal.actionLabel"
    :actor="resultModal.actor"
    confirm-text="확인"
    @close="handleResultConfirm"
  />
</template>

<style scoped>
.study-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.room-panel {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
  background: #fff;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.panel-desc {
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.seat-box {
  min-height: 92px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.seat-box.reserved {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.seat-no {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  color: #334155;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-name {
  margin: 0 0 4px;
  font-size: 11px;
  color: #94a3b8;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-user {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: #2b3a55;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-empty {
  margin: 0;
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-unit {
  margin: 0;
  font-size: 11px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-box.clickable {
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.seat-box.clickable:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.error-text {
  color: #e53e3e;
}
</style>
