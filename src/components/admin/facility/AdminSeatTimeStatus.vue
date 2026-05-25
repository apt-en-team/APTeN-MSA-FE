<script setup>
import { reactive, computed, watch } from 'vue'
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
  slotMin: {
    type: Number,
    default: 60,
  },
})

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
  timeRows: [],
  seatNos: [],
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

const selectedDateLabel = computed(() => {
  const date = new Date(props.selectedDate)
  if (Number.isNaN(date.getTime())) return props.selectedDate
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  return `${month}월 ${day}일 (${dayNames[date.getDay()]})`
})

const toMinutes = (timeStr) => {
  if (!timeStr) return null
  const parts = timeStr.split(':')
  return Number(parts[0]) * 60 + Number(parts[1])
}

const formatAsTime = (minutes) => {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const generateSlots = () => {
  const startMin = toMinutes(props.openTime)
  const closeRaw = toMinutes(props.closeTime)
  if (startMin === null || closeRaw === null || !props.slotMin) return []

  const endMin = closeRaw === 0 ? 24 * 60 : closeRaw
  if (startMin >= endMin) return []

  const slots = []
  let cur = startMin
  while (cur < endMin) {
    const slotEndMin = Math.min(cur + props.slotMin, endMin)
    slots.push({
      start: formatAsTime(cur),
      end: formatAsTime(slotEndMin % (24 * 60)),
    })
    cur += props.slotMin
  }
  return slots
}

const fetchGolfStatus = async () => {
  if (!props.facilityId || !props.selectedDate || !props.openTime || !props.closeTime) return

  state.loading = true
  state.timeRows = []
  state.seatNos = []

  try {
    const slots = generateSlots()
    if (slots.length === 0) return

    const results = await Promise.all(
      slots.map((slot) =>
        facilityApi.getFacilitySeatStatus(props.facilityId, {
          targetDate: props.selectedDate,
          startTime: slot.start,
          endTime: slot.end,
        }),
      ),
    )

    const firstResult = results.find((r) => Array.isArray(r) && r.length > 0)
    if (firstResult) {
      state.seatNos = firstResult.map((s) => s.seatNo).sort((a, b) => a - b)
    }

    state.timeRows = slots.map((slot, i) => {
      const seats = {}
      const seatList = Array.isArray(results[i]) ? results[i] : []
      seatList.forEach((s) => {
        seats[s.seatNo] = s
      })
      return {
        timeStart: slot.start,
        timeEnd: slot.end,
        seats,
      }
    })
  } catch {
    state.timeRows = []
  } finally {
    state.loading = false
  }
}

const isOccupied = (seat) => seat && seat.status !== 'AVAILABLE' && seat.status !== 'BLOCKED'

const visibleTimeRows = computed(() =>
  state.timeRows.filter((row) => state.seatNos.some((seatNo) => isOccupied(row.seats[seatNo]))),
)

const openDetailModal = (seat) => {
  if (!seat?.reservationId) return
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
      afterConfirm: fetchGolfStatus,
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

watch(
  [
    () => props.facilityId,
    () => props.selectedDate,
    () => props.openTime,
    () => props.closeTime,
    () => props.slotMin,
  ],
  fetchGolfStatus,
  { immediate: true },
)
</script>

<template>
  <div class="golf-page">
    <div v-if="state.loading" class="empty-text">골프 현황을 불러오는 중입니다.</div>

    <div class="golf-table-wrap">
      <h3 class="table-title">{{ selectedDateLabel }} 타석 현황</h3>

      <div v-if="!state.loading && visibleTimeRows.length === 0" class="empty-row">
        예약 데이터가 없습니다.
      </div>

      <div v-else-if="!state.loading" class="table-scroll">
        <table class="golf-table">
          <thead>
            <tr>
              <th class="time-head">시간</th>
              <th v-for="seatNo in state.seatNos" :key="seatNo">{{ seatNo }}번 타석</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visibleTimeRows" :key="row.timeStart">
              <td class="time-cell">
                <span class="time-start">{{ row.timeStart }}</span>
                <span class="time-end">~{{ row.timeEnd }}</span>
              </td>
              <td
                v-for="seatNo in state.seatNos"
                :key="`${row.time}-${seatNo}`"
                class="seat-cell"
                :class="{
                  occupied: isOccupied(row.seats[seatNo]),
                  blocked: row.seats[seatNo]?.status === 'BLOCKED',
                  clickable: !!row.seats[seatNo]?.reservationId,
                }"
                @click="openDetailModal(row.seats[seatNo])"
              >
                <template v-if="isOccupied(row.seats[seatNo])">
                  <div class="seat-user-box">
                    <p class="seat-user-name">{{ row.seats[seatNo].residentName ?? '-' }}</p>
                    <p v-if="row.seats[seatNo].unit" class="seat-user-household">
                      {{ row.seats[seatNo].unit }}
                    </p>
                  </div>
                </template>
                <template v-else-if="row.seats[seatNo]?.status === 'BLOCKED'">
                  <span class="blocked-mark">차단</span>
                </template>
                <template v-else>
                  <span class="empty-mark">-</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
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
.golf-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.golf-table-wrap {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  padding: 0 0 16px;
}

.table-title {
  margin: 0;
  padding: 20px 20px 12px;
  font-size: 20px;
  font-weight: 900;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.table-scroll {
  overflow-x: auto;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 24px;
  font-size: 13px;
  font-family: 'Noto Sans KR', sans-serif;
}

.golf-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  min-width: 600px;
}

.golf-table th,
.golf-table td {
  border: 1px solid #e2e8f0;
  text-align: center;
  vertical-align: middle;
  font-family: 'Noto Sans KR', sans-serif;
}

.golf-table th {
  background: #f8fafc;
  color: #718096;
  font-size: 12px;
  font-weight: 800;
  padding: 10px 8px;
  white-space: nowrap;
}

.time-head {
  width: 80px;
}

.time-cell {
  padding: 12px 8px;
  font-weight: 900;
  color: #1a202c;
  background: #fff;
  white-space: nowrap;
}

.time-start {
  display: block;
  font-size: 13px;
  color: #1a202c;
}

.time-end {
  display: block;
  font-size: 13px;
  color: #718096;
}

.seat-cell {
  padding: 12px 6px;
  min-width: 90px;
}

.seat-cell.occupied {
  background: #eef2ff;
}

.seat-cell.blocked {
  background: #f1f5f9;
}

.seat-user-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.seat-user-name {
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  color: #1a202c;
}

.seat-user-household {
  margin: 0;
  font-size: 12px;
  color: #718096;
}

.empty-mark {
  color: #cbd5e0;
  font-size: 20px;
  font-weight: 700;
}

.blocked-mark {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
}

.empty-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
  padding: 8px 0;
}

.seat-cell.clickable {
  cursor: pointer;
  transition: background 0.15s;
}

.seat-cell.clickable:hover {
  background: #e8edf8;
}
</style>
