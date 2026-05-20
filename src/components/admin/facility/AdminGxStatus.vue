<script setup>
import { reactive, computed, watch } from 'vue'
import gxApi from '@/api/gxApi'
import { toList } from '@/utils/apiResponse'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const props = defineProps({
  programId: {
    type: [Number, String],
    required: true,
  },
  program: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['refresh'])

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'WAITING', label: '대기' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'REJECTED', label: '거절' },
  { value: 'CANCELLED', label: '취소' },
]

const RESERVATION_STATUS_LABEL = {
  WAITING: '대기',
  PENDING: '대기',
  CONFIRMED: '확정',
  REJECTED: '거절',
  CANCELLED: '취소',
  COMPLETED: '이용완료',
}

const state = reactive({
  loading: false,
  status: null,

  statusFilter: '',
  reservations: {
    loading: false,
    error: false,
    list: [],
  },

  approveModal: {
    show: false,
    loading: false,
    reservationId: null,
    residentName: '',
  },

  rejectModal: {
    show: false,
    loading: false,
    reservationId: null,
    residentName: '',
    reason: '',
  },

  bulkModal: {
    show: false,
    loading: false,
  },

  resultModal: {
    show: false,
    type: 'success',
    title: '',
    subtitle: '',
  },
})

const programStatusLabel = (status) => {
  return { OPEN: '모집중', CLOSED: '종료', CANCELLED: '취소됨' }[status] || status || '-'
}

const programStatusClass = (status) => {
  return { OPEN: 'open', CLOSED: 'closed', CANCELLED: 'cancelled' }[status] || ''
}

const resStatusClass = (status) => {
  return (
    {
      WAITING: 'res-status--waiting',
      PENDING: 'res-status--waiting',
      CONFIRMED: 'res-status--confirmed',
      REJECTED: 'res-status--rejected',
      CANCELLED: 'res-status--cancelled',
      COMPLETED: 'res-status--completed',
    }[status] || ''
  )
}

const waitingCount = computed(
  () => state.status?.waitingCount ?? props.program?.waitingCount ?? 0,
)

// 일괄 승인 가능 인원: 대기 인원과 (최대 정원 - 확정 인원) 중 작은 값
const bulkApproveCount = computed(() => {
  const confirmedCount = state.status?.confirmedCount ?? 0
  const remaining = Math.max(0, (props.program?.maxCount ?? 0) - confirmedCount)
  return Math.min(waitingCount.value, remaining)
})

const canApprove = (status) => {
  const s = (status || '').toUpperCase()
  return s === 'WAITING' || s === 'PENDING'
}

const canReject = (status) => {
  const s = (status || '').toUpperCase()
  return s === 'WAITING' || s === 'PENDING'
}

const formatUnit = (row) => {
  if (row.unit) return row.unit
  const parts = [row.dong, row.ho].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : '-'
}

const formatDateTime = (dt) => {
  if (!dt) return '-'
  return String(dt).slice(0, 16).replace('T', ' ')
}

const fetchStatus = async () => {
  if (!props.programId) return
  state.loading = true
  try {
    state.status = await gxApi.getGxProgramStatus(props.programId)
  } catch {
    state.status = null
  } finally {
    state.loading = false
  }
}

const fetchReservations = async () => {
  if (!props.programId) return
  state.reservations.loading = true
  state.reservations.error = false
  try {
    const params = { page: 0, size: 100 }
    if (state.statusFilter) params.status = state.statusFilter
    const res = await gxApi.getAdminGxProgramReservations(props.programId, params)
    state.reservations.list = toList(res)
  } catch {
    state.reservations.list = []
    state.reservations.error = true
  } finally {
    state.reservations.loading = false
  }
}

const refreshAll = async () => {
  await Promise.all([fetchStatus(), fetchReservations()])
}

const changeFilter = (value) => {
  state.statusFilter = value
  fetchReservations()
}

// 일괄승인
const openBulkApprove = () => {
  state.bulkModal.show = true
}

const closeBulkApprove = () => {
  state.bulkModal.show = false
  state.bulkModal.loading = false
}

const confirmBulkApprove = async () => {
  state.bulkModal.loading = true
  try {
    await gxApi.bulkApproveGxProgram(props.programId, { approveCount: bulkApproveCount.value })
    state.bulkModal.show = false
    state.bulkModal.loading = false
    state.resultModal = {
      show: true,
      type: 'success',
      title: '일괄 승인 완료',
      subtitle: `${bulkApproveCount.value}명이 승인 처리되었습니다.`,
    }
    await refreshAll()
    emit('refresh')
  } catch {
    state.bulkModal.loading = false
    state.resultModal = {
      show: true,
      type: 'error',
      title: '일괄 승인 실패',
      subtitle: '처리 중 오류가 발생했습니다.',
    }
  }
}

// 단건 승인
const openApprove = (row) => {
  state.approveModal = {
    show: true,
    loading: false,
    reservationId: row.gxReservationId,
    residentName: row.residentName || '-',
  }
}

const closeApprove = () => {
  state.approveModal.show = false
  state.approveModal.loading = false
}

const confirmApprove = async () => {
  state.approveModal.loading = true
  const residentName = state.approveModal.residentName
  try {
    await gxApi.approveGxReservation(state.approveModal.reservationId)
    closeApprove()
    state.resultModal = {
      show: true,
      type: 'success',
      title: '승인 완료',
      subtitle: `${residentName}님이 승인 처리되었습니다.`,
    }
    await refreshAll()
    emit('refresh')
  } catch {
    state.approveModal.loading = false
    state.resultModal = {
      show: true,
      type: 'error',
      title: '승인 실패',
      subtitle: '처리 중 오류가 발생했습니다.',
    }
  }
}

// 단건 거절
const openReject = (row) => {
  state.rejectModal = {
    show: true,
    loading: false,
    reservationId: row.gxReservationId,
    residentName: row.residentName || '-',
    reason: '',
  }
}

const closeReject = () => {
  state.rejectModal.show = false
  state.rejectModal.loading = false
  state.rejectModal.reason = ''
}

const confirmReject = async () => {
  state.rejectModal.loading = true
  const residentName = state.rejectModal.residentName
  try {
    await gxApi.rejectGxReservation(state.rejectModal.reservationId, {
      rejectReason: state.rejectModal.reason || null,
    })
    closeReject()
    state.resultModal = {
      show: true,
      type: 'success',
      title: '거절 완료',
      subtitle: `${residentName}님이 거절 처리되었습니다.`,
    }
    await refreshAll()
    emit('refresh')
  } catch {
    state.rejectModal.loading = false
    state.resultModal = {
      show: true,
      type: 'error',
      title: '거절 실패',
      subtitle: '처리 중 오류가 발생했습니다.',
    }
  }
}

watch(
  () => props.programId,
  () => {
    state.statusFilter = ''
    refreshAll()
  },
  { immediate: true },
)
</script>

<template>
  <div class="gx-detail-panel">
    <!-- 프로그램 헤더 -->
    <div class="detail-head">
      <div>
        <h3 class="detail-title">{{ program.name }}</h3>
        <p class="detail-desc">
          {{ program.startDate ?? '-' }} ~ {{ program.endDate ?? '-' }}
          &nbsp;·&nbsp;
          {{ program.startTime ?? '-' }} ~ {{ program.endTime ?? '-' }}
        </p>
      </div>
      <span class="status-badge" :class="programStatusClass(program.status)">
        {{ programStatusLabel(program.status) }}
      </span>
    </div>

    <!-- 현황 카드 -->
    <div v-if="state.loading" class="loading-text">현황을 불러오는 중입니다.</div>
    <div v-else class="summary-row">
      <div class="summary-card">
        <p class="summary-label">최소 인원</p>
        <p class="summary-value">{{ program.minCount ?? '-' }}명</p>
      </div>
      <div class="summary-card">
        <p class="summary-label">최대 정원</p>
        <p class="summary-value">{{ program.maxCount ?? '-' }}명</p>
      </div>
      <div class="summary-card confirmed-card">
        <p class="summary-label">확정 인원</p>
        <p class="summary-value">{{ state.status?.confirmedCount ?? '-' }}명</p>
      </div>
      <div class="summary-card waiting-card">
        <p class="summary-label">대기 인원</p>
        <p class="summary-value">{{ state.status?.waitingCount ?? '-' }}명</p>
      </div>
      <div class="summary-card rejected-card">
        <p class="summary-label">거절 인원</p>
        <p class="summary-value">{{ state.status?.rejectedCount ?? '-' }}명</p>
      </div>
      <div class="summary-card cancelled-card">
        <p class="summary-label">취소 인원</p>
        <p class="summary-value">{{ state.status?.cancelledCount ?? '-' }}명</p>
      </div>
    </div>

    <!-- 일괄승인 -->
    <div class="bulk-area">
      <button
        class="btn-bulk-approve"
        :disabled="bulkApproveCount === 0 || state.bulkModal.loading"
        @click="openBulkApprove"
      >
        일괄 승인 ({{ bulkApproveCount }}명)
      </button>
      <p class="bulk-info">최대 정원까지만 승인됩니다.</p>
    </div>

    <!-- 상태 필터 -->
    <div class="filter-tabs">
      <button
        v-for="opt in STATUS_FILTER_OPTIONS"
        :key="opt.value"
        :class="['filter-tab', { active: state.statusFilter === opt.value }]"
        @click="changeFilter(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 신청자 목록 -->
    <div class="reservations-section">
      <div v-if="state.reservations.loading" class="state-text">신청자 목록을 불러오는 중입니다.</div>
      <div v-else-if="state.reservations.error" class="state-text error-text">
        신청자 목록을 불러오지 못했습니다.
      </div>
      <div v-else-if="state.reservations.list.length === 0" class="state-text">
        신청자가 없습니다.
      </div>
      <div v-else class="table-wrap">
        <table class="res-table">
          <thead>
            <tr>
              <th>예약자명</th>
              <th>세대</th>
              <th>상태</th>
              <th>대기순번</th>
              <th>신청일</th>
              <th>비고</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in state.reservations.list" :key="row.gxReservationId">
              <td>{{ row.residentName || '-' }}</td>
              <td>{{ formatUnit(row) }}</td>
              <td>
                <span :class="['res-status', resStatusClass(row.status)]">
                  {{ row.statusName || RESERVATION_STATUS_LABEL[row.status] || row.status || '-' }}
                </span>
              </td>
              <td>{{ row.waitNo ?? '-' }}</td>
              <td>{{ formatDateTime(row.createdAt) }}</td>
              <td class="note-cell">
                <span v-if="row.approvedAt">승인: {{ formatDateTime(row.approvedAt) }}</span>
                <span v-else-if="row.rejectReason">사유: {{ row.rejectReason }}</span>
                <span v-else-if="row.cancelReason">취소: {{ row.cancelReason }}</span>
                <span v-else>-</span>
              </td>
              <td class="action-cell">
                <template v-if="canApprove(row.status) || canReject(row.status)">
                  <button
                    v-if="canApprove(row.status)"
                    class="btn-approve-sm"
                    @click="openApprove(row)"
                  >
                    승인
                  </button>
                  <button
                    v-if="canReject(row.status)"
                    class="btn-reject-sm"
                    @click="openReject(row)"
                  >
                    거절
                  </button>
                </template>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- 일괄승인 확인 모달 -->
  <ConfirmModal
    :visible="state.bulkModal.show"
    title="일괄 승인"
    :subtitle="`대기 중인 ${waitingCount}명 중 최대 정원 기준 ${bulkApproveCount}명을 승인합니다.`"
    confirm-type="success"
    confirm-text="승인"
    :loading="state.bulkModal.loading"
    @confirm="confirmBulkApprove"
    @cancel="closeBulkApprove"
  />

  <!-- 단건 승인 확인 모달 -->
  <ConfirmModal
    :visible="state.approveModal.show"
    title="승인"
    :subtitle="`${state.approveModal.residentName}님을 승인 처리하시겠습니까?`"
    confirm-type="success"
    confirm-text="승인"
    :loading="state.approveModal.loading"
    @confirm="confirmApprove"
    @cancel="closeApprove"
  />

  <!-- 단건 거절 모달 -->
  <BaseModal :visible="state.rejectModal.show" title="거절" @close="closeReject">
    <div class="reject-form">
      <p class="reject-label">거절 사유 (선택)</p>
      <textarea
        v-model="state.rejectModal.reason"
        class="reject-textarea"
        placeholder="거절 사유를 입력하세요."
        rows="3"
      />
    </div>
    <template #footer>
      <button class="btn-modal-cancel" @click="closeReject">취소</button>
      <button
        class="btn-modal-reject"
        :disabled="state.rejectModal.loading"
        @click="confirmReject"
      >
        {{ state.rejectModal.loading ? '처리 중...' : '거절' }}
      </button>
    </template>
  </BaseModal>

  <!-- 결과 모달 -->
  <ActionResultModal
    :visible="state.resultModal.show"
    :type="state.resultModal.type"
    :title="state.resultModal.title"
    :subtitle="state.resultModal.subtitle"
    @close="state.resultModal.show = false"
  />
</template>

<style scoped>
.gx-detail-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 헤더 */
.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.detail-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.loading-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 현황 카드 */
.summary-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-card {
  flex: 1;
  min-width: 110px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.summary-card.confirmed-card {
  background: #e8f5e9;
  border-color: #a5d6a7;
}

.summary-card.waiting-card {
  background: #fff3e0;
  border-color: #ffcc80;
}

.summary-card.rejected-card {
  background: #fce4ec;
  border-color: #f48fb1;
}

.summary-card.cancelled-card {
  background: #f5f5f5;
  border-color: #e0e0e0;
}

.summary-label {
  margin: 0 0 8px;
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.summary-value {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 일괄승인 */
.bulk-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bulk-info {
  margin: 0;
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-bulk-approve {
  padding: 10px 20px;
  background: #4f46e5;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-bulk-approve:hover:not(:disabled) {
  background: #4338ca;
}

.btn-bulk-approve:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

/* 상태 필터 */
.filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #ffffff;
  font-size: 12px;
  font-weight: 600;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-tab:hover {
  background: #f1f5f9;
}

.filter-tab.active {
  background: #2b3a55;
  border-color: #2b3a55;
  color: #ffffff;
}

/* 신청자 목록 */
.reservations-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.state-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
  padding: 8px 0;
}

.error-text {
  color: #e53e3e;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.res-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Noto Sans KR', sans-serif;
}

.res-table th,
.res-table td {
  padding: 12px 10px;
  text-align: left;
  font-size: 13px;
  border-bottom: 1px solid #edf2f7;
  white-space: nowrap;
}

.res-table th {
  background: #f8fafc;
  color: #718096;
  font-weight: 700;
  font-size: 12px;
}

.res-table td {
  color: #2d3748;
}

.res-table tbody tr:last-child td {
  border-bottom: none;
}

/* 예약 상태 배지 */
.res-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.res-status--waiting {
  background: #fff3e0;
  color: #e65100;
}

.res-status--confirmed {
  background: #e8f5e9;
  color: #2e7d32;
}

.res-status--rejected {
  background: #fce4ec;
  color: #c62828;
}

.res-status--cancelled {
  background: #f5f5f5;
  color: #616161;
}

.res-status--completed {
  background: #e2e8f0;
  color: #475569;
}

/* 비고 / 처리 컬럼 */
.note-cell {
  font-size: 12px;
  color: #718096;
  max-width: 160px;
  white-space: normal;
  word-break: break-all;
}

.action-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-approve-sm {
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-approve-sm:hover {
  background: #c8e6c9;
}

.btn-reject-sm {
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: #fce4ec;
  color: #c62828;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-reject-sm:hover {
  background: #f8bbd9;
}

/* 거절 모달 */
.reject-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reject-label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  font-family: 'Noto Sans KR', sans-serif;
}

.reject-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Noto Sans KR', sans-serif;
  color: #374151;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.reject-textarea:focus {
  border-color: #94a3b8;
}

.btn-modal-cancel,
.btn-modal-reject {
  min-width: 80px;
  height: 40px;
  padding: 0 16px;
  border-radius: 7px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-modal-cancel {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #718096;
}

.btn-modal-cancel:hover {
  background: #f8fafc;
}

.btn-modal-reject {
  border: none;
  background: #e53e3e;
  color: #ffffff;
}

.btn-modal-reject:hover:not(:disabled) {
  background: #c53030;
}

.btn-modal-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 프로그램 상태 배지 */
.status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  flex-shrink: 0;
  font-family: 'Noto Sans KR', sans-serif;
}

.status-badge.open {
  background: #e6f4ea;
  color: #4d8b5a;
}

.status-badge.closed {
  background: #e2e8f0;
  color: #475569;
}

.status-badge.cancelled {
  background: #fce4ec;
  color: #e53e3e;
}
</style>
