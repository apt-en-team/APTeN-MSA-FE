<script setup>
import { reactive, computed, watch, onMounted } from 'vue'
import gxApi from '@/api/gxApi'
import { toList } from '@/utils/apiResponse'
import { useAuthStore } from '@/stores/useAuthStore.js'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import AdminGxReservationDetailModal from '@/components/admin/facility/AdminGxReservationDetailModal.vue'
import AdminGxApprovalModal from '@/components/admin/facility/Admingxapprovalmodal.vue'
import AppPagination from '@/components/common/AppPagination.vue'


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
  programs: { loading: false, error: '', list: [] },
  selectedProgramId: null,

  statusLoading: false,
  status: null,

  reservations: { loading: false, error: false, list: [], currentPage: 1 },

  bulkModal: { show: false, loading: false },
  closeModal: { show: false, loading: false },
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
    .filter((r) => r.status === '대기')
    .sort((a, b) => (a.waitNo ?? Infinity) - (b.waitNo ?? Infinity)),
)

const programWaitingCount = (p) => {
  if (String(p.programId) === String(state.selectedProgramId)) {
    return waitingList.value.length
  }
  return p.waitingCount ?? 0
}

const programCancelledCount = (p) => {
  if (String(p.programId) === String(state.selectedProgramId)) {
    return state.reservations.list.filter((r) => r.status === '거절' || r.status === '취소').length
  }
  return p.cancelledCount ?? 0
}

const PAGE_SIZE = 10

const pagedReservations = computed(() => {
  const start = (state.reservations.currentPage - 1) * PAGE_SIZE
  return state.reservations.list.slice(start, start + PAGE_SIZE)
})

const totalResPages = computed(() =>
  Math.max(1, Math.ceil(state.reservations.list.length / PAGE_SIZE)),
)

const programStatusLabel = (status) => status || '-'

const programStatusClass = (status) =>
  ({ '모집중': 'open', '모집마감': 'waiting-closed', '종료': 'closed', '프로그램취소': 'cancelled' }[status] || '')

const resStatusClass = (status) =>
  ({
    대기: 'status--waiting',
    확정: 'status--confirmed',
    거절: 'status--cancelled',
    취소: 'status--cancelled',
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

const props = defineProps({
  filterMonth: { type: String, default: '' },
  filterStatus: { type: String, default: '' },
})

const filteredPrograms = computed(() => {
  return state.programs.list.filter((p) => {
    if (props.filterMonth) {
      const [y, m] = props.filterMonth.split('-').map(Number)
      const monthStart = props.filterMonth + '-01'
      const monthEnd = `${props.filterMonth}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
      const start = p.startDate || '0000-01-01'
      const end = p.endDate || '9999-12-31'
      if (!(start <= monthEnd && end >= monthStart)) return false
    }
    if (props.filterStatus && p.status !== props.filterStatus) return false
    return true
  })
})

// 필터 변경 시 선택 프로그램이 목록에 없으면 첫 번째로 재선택
watch(filteredPrograms, (list) => {
  if (!list.find((p) => String(p.programId) === String(state.selectedProgramId))) {
    state.selectedProgramId = list[0]?.programId ?? null
  }
})

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
    state.reservations.currentPage = 1
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

const openDetailModal = (row) => {
  state.detailModal.reservationId = row.gxReservationId
  state.detailModal.show = true
}

const closeDetailModal = () => {
  state.detailModal.show = false
  state.detailModal.reservationId = null
}

const openGxCancelModal = (reservation) => {
  state.cancelModal.targetId = reservation.gxReservationId
  state.cancelModal.targetName =
    reservation.programName
      ? `${reservation.programName} · ${reservation.residentName ?? ''}`
      : `GX 예약 #${reservation.gxReservationId}`
  state.cancelModal.targetUnit = reservation.unit || ''
  state.cancelModal.show = true
}

const closeGxCancelModal = () => {
  state.cancelModal.show = false
  state.cancelModal.loading = false
  state.cancelModal.targetId = null
  state.cancelModal.targetName = ''
  state.cancelModal.targetUnit = ''
}

const handleGxCancel = async () => {
  state.cancelModal.loading = true
  const { targetName } = state.cancelModal
  try {
    await gxApi.cancelAdminGxReservation(state.cancelModal.targetId)
    closeGxCancelModal()
    closeDetailModal()
    openResultModal({
      type: 'success',
      title: '예약이 취소되었습니다.',
      subtitle: '관리자 강제 취소 처리가 완료되었습니다.',
      itemName: targetName,
      time: getCurrentTimeText(),
      actionLabel: 'GX 예약 강제 취소',
      actor: getCurrentActorName(),
      afterConfirm: refreshDetail,
    })
  } catch (e) {
    closeGxCancelModal()
    openResultModal({
      type: 'danger',
      title: '취소 처리에 실패했습니다.',
      subtitle: e?.response?.data?.message || '잠시 후 다시 시도해주세요.',
      itemName: targetName,
    })
  }
}

const openBulkApprove = () => {
  state.bulkModal.show = true
}

const closeBulkApprove = () => {
  state.bulkModal.show = false
}

const handleApproved = async () => {
  await Promise.all([fetchPrograms(), refreshDetail()])
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
  const programName = selectedProgram.value?.name || ''
  const pendingCount = waitingList.value.length
  try {
    await gxApi.closeWaiting(state.selectedProgramId)
    state.closeModal.show = false
    state.closeModal.loading = false
    openResultModal({
      type: 'success',
      title: '모집이 마감되었습니다.',
      subtitle: programName,
      desc: `대기자 ${pendingCount}명이 거절 처리되었습니다.`,
      itemName: programName,
      time: getCurrentTimeText(),
      actionLabel: 'GX 모집 마감',
      actor: getCurrentActorName(),
      afterConfirm: async () => { await Promise.all([fetchPrograms(), refreshDetail()]) },
    })
  } catch (e) {
    state.closeModal.loading = false
    openResultModal({
      type: 'danger',
      title: '마감 처리에 실패했습니다.',
      subtitle: e?.response?.data?.message || e?.response?.data?.message || '잠시 후 다시 시도해주세요.',
      itemName: programName,
    })
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
      <div v-else-if="filteredPrograms.length === 0" class="panel-state">
        해당 월에 등록된 GX 프로그램이 없습니다.
      </div>
      <div v-else class="program-list">
        <div
          v-for="p in filteredPrograms"
          :key="p.programId"
          :class="['program-item', { active: String(state.selectedProgramId) === String(p.programId) }]"
          @click="selectProgram(p.programId)"
        >
          <div class="program-item-top">
            <span class="program-name">{{ p.name }}</span>
            <span v-if="programWaitingCount(p) > 0" class="pending-badge">대기 {{ programWaitingCount(p) }}</span>
          </div>
          <div class="program-period">
            {{ formatDate(p.startDate) }} ~ {{ formatDate(p.endDate) }}
          </div>
          <div class="program-capacity-row">
            <span class="program-capacity">최대 {{ p.maxCount ?? '-' }}명 · 최소 {{ p.minCount ?? '-' }}명</span>
            <div class="program-chips">
              <span class="chip chip-confirmed">확정 {{ p.confirmedCount ?? 0 }}</span>
              <span class="chip chip-cancelled">취소 {{ programCancelledCount(p) }}</span>
            </div>
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
              :disabled="selectedProgram.status !== '모집중' || state.closeModal.loading"
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
                <th>번호</th>
                <th>세대</th>
                <th>예약자명</th>
                <th>신청일</th>
                <th>대기순번</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in pagedReservations"
                :key="row.gxReservationId"
                class="clickable-row"
                @click="openDetailModal(row)"
              >
                <td>{{ (state.reservations.currentPage - 1) * PAGE_SIZE + index + 1 }}</td>
                <td>{{ formatUnit(row) }}</td>
                <td>{{ row.residentName || '-' }}</td>
                <td>{{ formatDateTime(row.createdAt) }}</td>
                <td>{{ row.waitNo ?? '-' }}</td>
                <td>
                  <span :class="['status-badge', resStatusClass(row.status)]">
                    {{ row.status || '-' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <AppPagination
            :current-page="state.reservations.currentPage"
            :total-pages="totalResPages"
            :total-all="state.reservations.list.length"
            :total-filtered="pagedReservations.length"
            unit="명"
            @change="(p) => (state.reservations.currentPage = p)"
          />
        </div>
      </template>
    </div>
  </div>

  <!-- 일괄 승인 모달 -->
  <AdminGxApprovalModal
    v-if="state.bulkModal.show"
    :program="selectedProgram"
    :waiting-list="waitingList"
    @close="closeBulkApprove"
    @approved="handleApproved"
  />

  <!-- 모집 마감 확인 모달 -->
  <ConfirmModal
    :visible="state.closeModal.show"
    title="모집을 마감하시겠습니까?"
    subtitle="취소된 대기 예약은 되돌릴 수 없습니다."
    subtitle-color="#e53e3e"
    item-label="프로그램"
    :item-name="selectedProgram?.name"
    action-label="GX 모집"
    action-text="마감 처리"
    :extra-value="`${waitingList.length}명`"
    extra-label="잔여 대기자"
    confirm-text="마감 처리"
    cancel-text="닫기"
    confirm-type="danger"
    :loading="state.closeModal.loading"
    @confirm="confirmClose"
    @cancel="cancelClose"
  />

  <!-- 결과 모달 -->
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

  <!-- GX 예약 상세 모달 -->
  <AdminGxReservationDetailModal
    v-if="state.detailModal.show"
    :gx-reservation-id="state.detailModal.reservationId"
    @close="closeDetailModal"
    @cancel-request="openGxCancelModal"
  />

  <!-- GX 예약 취소 확인 모달 -->
  <ConfirmModal
    :visible="state.cancelModal.show"
    title="예약을 취소하시겠습니까?"
    subtitle="취소된 예약은 되돌릴 수 없습니다."
    subtitle-color="#e53e3e"
    item-label="예약"
    :item-name="state.cancelModal.targetName"
    action-label="GX 예약"
    action-text="관리자 강제 취소"
    :extra-value="state.cancelModal.targetUnit"
    extra-label="소속 세대"
    confirm-text="예약 취소"
    cancel-text="닫기"
    confirm-type="danger"
    :loading="state.cancelModal.loading"
    @confirm="handleGxCancel"
    @cancel="closeGxCancelModal"
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

.program-period {
  font-size: 12px;
  color: #718096;
  margin-bottom: 4px;
  font-family: 'Noto Sans KR', sans-serif;
}

.program-capacity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.program-capacity {
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.program-chips {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
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

.chip-cancelled {
  background: #fce4ec;
  color: #c62828;
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

.status-badge.waiting-closed {
  background: #fff3e0;
  color: #e65100;
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

.clickable-row {
  cursor: pointer;
  transition: background 0.12s;
}

.clickable-row:hover td {
  background: #f8fafc;
}

.status-badge {
  display: inline-block;
  width: fit-content;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.status--confirmed {
  background: #e6f4ea;
  color: #2e7d32;
}

.status--waiting {
  background: #fff3e0;
  color: #e65100;
}

.status--completed {
  background: #fef9e7;
  color: #b7950b;
}

.status--cancelled {
  background: #fce4ec;
  color: #c62828;
}


@media (max-width: 1100px) {
  .gx-layout {
    grid-template-columns: 1fr;
  }
}
</style>
