<script setup>
import { reactive, computed, watch, onMounted } from 'vue'
import gxApi from '@/api/gxApi'
import { toList } from '@/utils/apiResponse'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const RESERVATION_STATUS_LABEL = {
  WAITING: '대기',
  PENDING: '대기',
  CONFIRMED: '확정',
  REJECTED: '거절',
  CANCELLED: '취소',
  COMPLETED: '이용완료',
}

const state = reactive({
  programs: { loading: false, error: '', list: [] },
  selectedProgramId: null,

  statusLoading: false,
  status: null,

  reservations: { loading: false, error: false, list: [] },

  bulkModal: { show: false, loading: false },
  closeModal: { show: false, loading: false },
  resultModal: { show: false, type: 'success', title: '', subtitle: '' },
})

const selectedProgram = computed(() =>
  state.programs.list.find((p) => String(p.programId) === String(state.selectedProgramId)) || null,
)

const waitingCount = computed(() => state.status?.waitingCount ?? 0)
const confirmedCount = computed(() => state.status?.confirmedCount ?? 0)

const bulkApproveCount = computed(() => {
  const remaining = Math.max(0, (selectedProgram.value?.maxCount ?? 0) - confirmedCount.value)
  return Math.min(waitingCount.value, remaining)
})

const waitingList = computed(() =>
  state.reservations.list
    .filter((r) => r.status === 'WAITING' || r.status === 'PENDING')
    .sort((a, b) => (a.waitNo ?? Infinity) - (b.waitNo ?? Infinity))
    .map((r, i) => ({ ...r, willConfirm: i < bulkApproveCount.value })),
)

const overflowCount = computed(() => Math.max(0, waitingCount.value - bulkApproveCount.value))

const programStatusLabel = (status) =>
  ({ OPEN: '모집중', CLOSED: '종료', CANCELLED: '취소됨' }[status] || status || '-')

const programStatusClass = (status) =>
  ({ OPEN: 'open', CLOSED: 'closed', CANCELLED: 'cancelled' }[status] || '')

const resStatusClass = (status) =>
  ({
    WAITING: 'res-status--waiting',
    PENDING: 'res-status--waiting',
    CONFIRMED: 'res-status--confirmed',
    REJECTED: 'res-status--rejected',
    CANCELLED: 'res-status--cancelled',
    COMPLETED: 'res-status--completed',
  }[status] || '')

const formatDate = (d) => (d ? String(d).replace(/-/g, '.') : '-')
const formatTime = (t) => (t ? String(t).slice(0, 5) : '-')
const formatDateTime = (dt) => {
  if (!dt) return '-'
  return String(dt).slice(0, 16).replace('T', ' ')
}
const formatUnit = (row) => {
  if (row.unit) return row.unit
  const parts = [row.dong, row.ho].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : '-'
}

const fetchPrograms = async () => {
  state.programs.loading = true
  state.programs.error = ''
  try {
    const res = await gxApi.getAdminGxPrograms({ page: 0, size: 100 })
    state.programs.list = toList(res)
    if (state.programs.list.length > 0 && !state.selectedProgramId) {
      state.selectedProgramId = state.programs.list[0].programId
    }
  } catch {
    state.programs.error = 'GX 프로그램 목록을 불러오지 못했습니다.'
    state.programs.list = []
  } finally {
    state.programs.loading = false
  }
}

const fetchStatus = async () => {
  if (!state.selectedProgramId) return
  state.statusLoading = true
  try {
    state.status = await gxApi.getGxProgramStatus(state.selectedProgramId)
  } catch {
    state.status = null
  } finally {
    state.statusLoading = false
  }
}

const fetchReservations = async () => {
  if (!state.selectedProgramId) return
  state.reservations.loading = true
  state.reservations.error = false
  try {
    const res = await gxApi.getAdminGxProgramReservations(state.selectedProgramId, {
      page: 0,
      size: 100,
    })
    state.reservations.list = toList(res)
  } catch {
    state.reservations.list = []
    state.reservations.error = true
  } finally {
    state.reservations.loading = false
  }
}

const refreshDetail = async () => {
  await Promise.all([fetchStatus(), fetchReservations()])
}

const selectProgram = (id) => {
  state.selectedProgramId = id
}

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
    await gxApi.bulkApproveGxProgram(state.selectedProgramId, { approveCount: bulkApproveCount.value })
    state.bulkModal.show = false
    state.bulkModal.loading = false
    state.resultModal = {
      show: true,
      type: 'success',
      title: '일괄 승인 완료',
      subtitle: `${bulkApproveCount.value}명이 승인 처리되었습니다.`,
    }
    await Promise.all([fetchPrograms(), refreshDetail()])
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

const openClose = () => {
  state.closeModal.show = true
}

const cancelClose = () => {
  state.closeModal.show = false
  state.closeModal.loading = false
}

const confirmClose = async () => {
  state.closeModal.loading = true
  try {
    const res = await gxApi.closeWaiting(state.selectedProgramId)
    state.closeModal.show = false
    state.closeModal.loading = false
    state.resultModal = {
      show: true,
      type: 'success',
      title: '모집 마감 완료',
      subtitle: `${res?.rejectedCount ?? 0}명이 거절 처리되어 모집이 마감되었습니다.`,
    }
    await Promise.all([fetchPrograms(), refreshDetail()])
  } catch (e) {
    state.closeModal.loading = false
    state.resultModal = {
      show: true,
      type: 'error',
      title: '마감 처리 실패',
      subtitle:
        e?.response?.data?.resultMessage || e?.response?.data?.message || '처리 중 오류가 발생했습니다.',
    }
  }
}

watch(
  () => state.selectedProgramId,
  (id) => {
    if (id) refreshDetail()
  },
  { immediate: false },
)

onMounted(fetchPrograms)
</script>

<template>
  <div class="gx-layout">
    <!-- 왼쪽: 프로그램 목록 -->
    <div class="program-panel">
      <div v-if="state.programs.loading" class="panel-state">GX 프로그램 조회 중...</div>
      <div v-else-if="state.programs.error" class="panel-error">{{ state.programs.error }}</div>
      <div v-else-if="state.programs.list.length === 0" class="panel-state">
        등록된 GX 프로그램이 없습니다.
      </div>
      <div v-else class="program-list">
        <div
          v-for="p in state.programs.list"
          :key="p.programId"
          :class="['program-item', { active: String(state.selectedProgramId) === String(p.programId) }]"
          @click="selectProgram(p.programId)"
        >
          <div class="program-item-top">
            <span class="program-name">{{ p.name }}</span>
            <span v-if="(p.waitingCount ?? 0) > 0" class="pending-badge">대기 {{ p.waitingCount }}</span>
          </div>
          <div class="program-period">
            {{ formatDate(p.startDate) }} ~ {{ formatDate(p.endDate) }}
          </div>
          <div class="program-capacity">
            최대 {{ p.maxCount ?? '-' }}명 · 최소 {{ p.minCount ?? '-' }}명
          </div>
          <div class="program-chips">
            <span class="chip chip-confirmed">확정 {{ p.confirmedCount ?? 0 }}</span>
            <span class="chip chip-waiting">대기 {{ p.waitingCount ?? 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 오른쪽: 상세 패널 -->
    <div class="detail-panel">
      <div v-if="!selectedProgram" class="panel-state">왼쪽에서 GX 프로그램을 선택하세요.</div>
      <template v-else>
        <!-- 헤더 -->
        <div class="detail-head">
          <div class="detail-head-info">
            <h3 class="detail-title">{{ selectedProgram.name }}</h3>
            <p class="detail-desc">
              {{ formatDate(selectedProgram.startDate) }} ~ {{ formatDate(selectedProgram.endDate) }}
              &nbsp;·&nbsp;
              {{ formatTime(selectedProgram.startTime) }} ~ {{ formatTime(selectedProgram.endTime) }}
            </p>
          </div>
          <div class="detail-head-actions">
            <span class="status-badge" :class="programStatusClass(selectedProgram.status)">
              {{ programStatusLabel(selectedProgram.status) }}
            </span>
            <button
              class="btn-approve"
              :disabled="bulkApproveCount === 0"
              @click="openBulkApprove"
            >
              일괄 승인 ({{ bulkApproveCount }}명)
            </button>
            <button
              class="btn-close"
              :disabled="selectedProgram.status !== 'OPEN' || state.closeModal.loading"
              @click="openClose"
            >
              모집 마감
            </button>
          </div>
        </div>

        <!-- 신청자 목록 -->
        <div v-if="state.reservations.loading" class="panel-state">
          신청자 목록을 불러오는 중입니다.
        </div>
        <div v-else-if="state.reservations.error" class="panel-state error-text">
          신청자 목록을 불러오지 못했습니다.
        </div>
        <div v-else-if="state.reservations.list.length === 0" class="panel-state">
          신청자가 없습니다.
        </div>
        <div v-else class="table-wrap">
          <table class="custom-table">
            <thead>
              <tr>
                <th>예약자명</th>
                <th>세대</th>
                <th>상태</th>
                <th>대기순번</th>
                <th>신청일</th>
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
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>

  <!-- 일괄 승인 모달 -->
  <BaseModal
    :visible="state.bulkModal.show"
    title="일괄 승인"
    subtitle="대기 인원을 승인 순서대로 처리합니다."
    @close="closeBulkApprove"
  >
    <div class="bulk-stat-cards">
      <div class="bulk-stat-card">
        <p class="bulk-stat-label">승인 대기</p>
        <p class="bulk-stat-value">{{ waitingCount }}명</p>
      </div>
      <div class="bulk-stat-card">
        <p class="bulk-stat-label">최대 정원</p>
        <p class="bulk-stat-value">{{ selectedProgram?.maxCount ?? '-' }}명</p>
      </div>
      <div class="bulk-stat-card">
        <p class="bulk-stat-label">확정 가능</p>
        <p class="bulk-stat-value">{{ bulkApproveCount }}명</p>
      </div>
    </div>
    <div v-if="bulkApproveCount > 0" class="bulk-notice">
      신청 순서대로 <strong>{{ bulkApproveCount }}명</strong> 확정되며, 나머지
      <strong>{{ overflowCount }}명</strong>은 대기 상태를 유지합니다.
    </div>
    <div v-else class="bulk-notice bulk-notice--warn">
      확정 가능한 인원이 없습니다. (정원 초과 또는 대기자 없음)
    </div>
    <div v-if="waitingList.length > 0" class="bulk-pending-list">
      <div
        v-for="r in waitingList"
        :key="r.gxReservationId"
        :class="['bulk-pending-item', r.willConfirm ? 'will-confirm' : 'will-remain']"
      >
        <span class="bulk-pending-name">{{ r.residentName || '-' }}</span>
        <span :class="['bulk-badge', r.willConfirm ? 'badge-confirm' : 'badge-remain']">
          {{ r.willConfirm ? '확정 예정' : '대기 유지' }}
        </span>
      </div>
    </div>
    <template #footer>
      <button class="btn-modal-secondary" @click="closeBulkApprove">닫기</button>
      <button
        class="btn-modal-primary"
        :disabled="bulkApproveCount === 0 || state.bulkModal.loading"
        @click="confirmBulkApprove"
      >
        {{ state.bulkModal.loading ? '처리 중...' : '일괄 승인' }}
      </button>
    </template>
  </BaseModal>

  <!-- 모집 마감 확인 모달 -->
  <ConfirmModal
    :visible="state.closeModal.show"
    title="모집 마감 처리"
    :subtitle="`잔여 대기자 ${waitingCount}명이 거절 처리되고 모집이 마감됩니다. 계속하시겠습니까?`"
    confirm-type="danger"
    confirm-text="마감 처리"
    :loading="state.closeModal.loading"
    @confirm="confirmClose"
    @cancel="cancelClose"
  />

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
/* ── 2컬럼 레이아웃 ───────────────────────────── */
.gx-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  align-items: start;
}

.program-panel,
.detail-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  min-height: 480px;
}

/* ── 상태 텍스트 ──────────────────────────────── */
.panel-state {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
  padding: 20px 0;
}

.panel-error {
  font-size: 13px;
  color: #e53e3e;
  font-family: 'Noto Sans KR', sans-serif;
  padding: 10px 14px;
  background: #fff5f5;
  border-radius: 8px;
}

.error-text {
  color: #e53e3e;
}

/* ── 프로그램 목록 ────────────────────────────── */
.program-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.program-item {
  padding: 20px 24px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s;
}

.program-item:hover {
  background: #f1f5f9;
}

.program-item.active {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.program-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.program-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.pending-badge {
  background: #f6e3bf;
  color: #a35318;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  font-family: 'Noto Sans KR', sans-serif;
}

.program-period,
.program-capacity {
  font-size: 12px;
  color: #718096;
  margin-bottom: 4px;
  font-family: 'Noto Sans KR', sans-serif;
}

.program-chips {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.chip {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: 'Noto Sans KR', sans-serif;
}

.chip-confirmed {
  background: #d9f0dc;
  color: #2e7d32;
}

.chip-waiting {
  background: #fff3e0;
  color: #e65100;
}

/* ── 상세 헤더 ───────────────────────────────── */
.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
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

.detail-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
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

.btn-approve {
  height: 36px;
  padding: 0 14px;
  background: #2b3a55;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.btn-approve:hover:not(:disabled) {
  background: #1e2d44;
}

.btn-approve:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

.btn-close {
  height: 36px;
  padding: 0 14px;
  background: #ffffff;
  color: #e53e3e;
  border: 1.5px solid #fecaca;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-close:hover:not(:disabled) {
  background: #fff5f5;
  border-color: #e53e3e;
}

.btn-close:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── 신청자 테이블 ────────────────────────────── */
.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Noto Sans KR', sans-serif;
}

.custom-table th,
.custom-table td {
  padding: 12px 14px;
  text-align: left;
  font-size: 13px;
  border-bottom: 1px solid #edf2f7;
  white-space: nowrap;
}

.custom-table th {
  background: #f8fafc;
  color: #718096;
  font-weight: 700;
  font-size: 12px;
}

.custom-table td {
  color: #2d3748;
}

.custom-table tbody tr:last-child td {
  border-bottom: none;
}

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

/* ── 일괄 승인 모달 ──────────────────────────── */
.bulk-stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.bulk-stat-card {
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  text-align: center;
}

.bulk-stat-label {
  margin: 0 0 4px;
  font-size: 11px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.bulk-stat-value {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.bulk-notice {
  padding: 12px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
  margin-bottom: 16px;
  font-family: 'Noto Sans KR', sans-serif;
}

.bulk-notice--warn {
  background: #fef2f2;
  border-color: #fecaca;
  color: #c62828;
}

.bulk-pending-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
}

.bulk-pending-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 8px;
  font-family: 'Noto Sans KR', sans-serif;
}

.bulk-pending-item.will-confirm {
  background: #e6f4ea;
}

.bulk-pending-item.will-remain {
  background: #f5f5f5;
}

.bulk-pending-name {
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
}

.bulk-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}

.badge-confirm {
  background: #d9f0dc;
  color: #2e7d32;
}

.badge-remain {
  background: #e5e7eb;
  color: #6b7280;
}

/* ── 모달 버튼 ───────────────────────────────── */
.btn-modal-secondary,
.btn-modal-primary {
  min-width: 80px;
  height: 40px;
  padding: 0 16px;
  border-radius: 7px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-modal-secondary {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #718096;
}

.btn-modal-secondary:hover {
  background: #f8fafc;
}

.btn-modal-primary {
  border: none;
  background: #2b3a55;
  color: #ffffff;
}

.btn-modal-primary:hover:not(:disabled) {
  background: #1e2d44;
}

.btn-modal-primary:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

@media (max-width: 1100px) {
  .gx-layout {
    grid-template-columns: 1fr;
  }
}
</style>
