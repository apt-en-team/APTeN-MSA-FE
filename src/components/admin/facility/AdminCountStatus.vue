<script setup>
import { reactive, computed, watch } from 'vue'
import facilityApi from '@/api/facilityApi'
import reservationApi from '@/api/reservationApi'
import { useAuthStore } from '@/stores/useAuthStore.js'
import AdminReservationDetailModal from '@/components/admin/facility/Adminreservationdetailmodal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'

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
  data: null,
  currentPage: 1,
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

const fetchCountStatus = async () => {
  if (!props.facilityId || !props.selectedDate || !props.openTime || !props.closeTime) return

  state.loading = true
  state.error = false

  try {
    const res = await facilityApi.getFacilityCountStatus(props.facilityId, {
      targetDate: props.selectedDate,
      startTime: props.openTime,
      endTime: props.closeTime,
    })

    state.data = res || null
    state.currentPage = 1

    emit('update-summary', {
      maxCount: res?.maxCount || 0,
      reservedCount: res?.reservedCount || 0,
      availableCount: res?.availableCount || 0,
    })
  } catch {
    state.data = null
    state.error = true
    emit('update-summary', { maxCount: 0, reservedCount: 0, availableCount: 0 })
  } finally {
    state.loading = false
  }
}

watch(
  [() => props.facilityId, () => props.selectedDate, () => props.openTime, () => props.closeTime],
  () => {
    fetchCountStatus()
  },
  { immediate: true },
)

const openDetailModal = (user) => {
  if (!user?.reservationId) return
  state.detailModal.reservationId = user.reservationId
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
      afterConfirm: fetchCountStatus,
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

const PAGE_SIZE = 10
const allUsers = computed(() => state.data?.users ?? [])
const pagedUsers = computed(() => {
  const start = (state.currentPage - 1) * PAGE_SIZE
  return allUsers.value.slice(start, start + PAGE_SIZE)
})
const totalPages = computed(() => Math.max(1, Math.ceil(allUsers.value.length / PAGE_SIZE)))

const statusLabel = (s) =>
  ({ CONFIRMED: '확정', COMPLETED: '완료', CANCELLED: '취소', WAITING: '대기' }[s] || s || '-')

const statusClass = (s) =>
  ({
    CONFIRMED: 'badge-confirmed',
    COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled',
    WAITING: 'badge-waiting',
  }[s] || '')
</script>

<template>
  <div class="gym-page">
    <div v-if="state.loading" class="empty-text">헬스장 데이터를 불러오는 중입니다.</div>

    <div v-else-if="state.error" class="empty-text error-text">현황 데이터를 불러오지 못했습니다.</div>

    <div v-else class="table-wrap">
      <table class="custom-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>예약자</th>
            <th>세대</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!state.data?.users || state.data.users.length === 0">
            <td colspan="4" class="empty-row">예약 데이터가 없습니다.</td>
          </tr>

          <tr
            v-for="(user, index) in pagedUsers"
            :key="user.reservationId"
            class="clickable-row"
            @click="openDetailModal(user)"
          >
            <td>{{ (state.currentPage - 1) * PAGE_SIZE + index + 1 }}</td>
            <td>{{ user.residentName ?? '-' }}</td>
            <td>{{ user.unit ?? '-' }}</td>
            <td>
              <span :class="['status-badge', statusClass(user.status)]">
                {{ statusLabel(user.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <AppPagination
        :current-page="state.currentPage"
        :total-pages="totalPages"
        :total-all="allUsers.length"
        :total-filtered="pagedUsers.length"
        unit="명"
        @change="(p) => (state.currentPage = p)"
      />
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
.gym-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.table-wrap {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
}

.custom-table th,
.custom-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #edf2f7;
  text-align: left;
  font-size: 13px;
  font-family: 'Noto Sans KR', sans-serif;
}

.custom-table th {
  background: #f8fafc;
  color: #718096;
  font-weight: 700;
}

.custom-table td {
  color: #2d3748;
}

.empty-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.error-text {
  color: #e53e3e;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
}

.clickable-row {
  cursor: pointer;
  transition: background 0.2s ease;
}

.clickable-row:hover {
  background: #f8fafc;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Noto Sans KR', sans-serif;
}

.badge-confirmed {
  background: #e6f4ea;
  color: #2e7d32;
}

.badge-completed {
  background: #e8eaf6;
  color: #3949ab;
}

.badge-cancelled {
  background: #fce4ec;
  color: #c62828;
}

.badge-waiting {
  background: #fff3e0;
  color: #e65100;
}
</style>
