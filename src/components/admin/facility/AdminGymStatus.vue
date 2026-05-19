<script setup>
import { reactive, watch } from 'vue'
import facilityApi from '@/api/facilityApi'
import AdminReservationDetailModal from '@/components/admin/facility/Adminreservationdetailmodal.vue'

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

const state = reactive({
  loading: false,
  error: false,
  data: null,
  detailModal: {
    show: false,
    reservationId: null,
  },
})

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
</script>

<template>
  <div class="gym-page">
    <div v-if="state.loading" class="empty-text">헬스장 데이터를 불러오는 중입니다.</div>

    <div v-else-if="state.error" class="empty-text error-text">현황 데이터를 불러오지 못했습니다.</div>

    <div v-else class="table-wrap">
      <table class="custom-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>예약자</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!state.data?.users || state.data.users.length === 0">
            <td colspan="2" class="empty-row">예약 데이터가 없습니다.</td>
          </tr>

          <tr
            v-for="user in state.data?.users ?? []"
            :key="user.reservationId"
            class="clickable-row"
            @click="openDetailModal(user)"
          >
            <td>{{ user.reservationId }}</td>
            <td>{{ user.residentName ?? '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminReservationDetailModal
      v-if="state.detailModal.show"
      :reservation-id="state.detailModal.reservationId"
      @close="closeDetailModal"
      @cancelled="
        async () => {
          closeDetailModal()
          await fetchCountStatus()
        }
      "
    />
  </div>
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
</style>
