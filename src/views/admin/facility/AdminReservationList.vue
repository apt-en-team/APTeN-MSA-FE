<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useReservationStore } from '@/stores/useReservationStore.js'
import { useGxStore } from '@/stores/useGxStore.js'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { toList } from '@/utils/apiResponse'
import StatsCards from '@/components/admin/StatsCards.vue'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const reservationStore = useReservationStore()
const gxStore = useGxStore()
const authStore = useAuthStore()

const RESERVATION_KIND_OPTIONS = [
  { value: '', label: '전체 구분' },
  { value: 'FACILITY', label: '시설' },
  { value: 'GX', label: 'GX' },
]

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'CANCELLED', label: '취소' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'WAITING', label: '대기' },
]

const STATUS_LABEL = {
  CONFIRMED: '확정',
  PENDING: '대기',
  WAITING: '대기',
  COMPLETED: '완료',
  CANCELLED: '취소',
  REJECTED: '거절',
}

const STATUS_CLASS = {
  CONFIRMED: 'status--confirmed',
  PENDING: 'status--waiting',
  WAITING: 'status--waiting',
  COMPLETED: 'status--completed',
  CANCELLED: 'status--cancelled',
  REJECTED: 'status--cancelled',
}

const CANCEL_REASON_LABEL = {
  USER: '사용자 취소',
  ADMIN: '관리자 취소',
  PROGRAM: '프로그램 취소',
}

const columns = [
  { key: 'reservationKind', label: '구분' },
  { key: 'facilityName', label: '시설/프로그램' },
  { key: 'residentName', label: '예약자' },
  { key: 'unit', label: '세대' },
  { key: 'reservationDate', label: '예약날짜' },
  { key: 'time', label: '시간' },
  { key: 'status', label: '상태' },
  { key: 'createdAt', label: '등록일' },
]

const state = reactive({
  list: [],
  reservationKind: '',
  residentName: '',
  facilityName: '',
  status: '',
  reservationDate: '',
  currentPage: 1,
  size: 20,
  maxPage: 1,
  totalElements: 0,
  totalAll: 0,
  loading: false,
  errorMessage: '',
})

const statsData = reactive({
  todayTotal: 0,
  activeCount: 0,
  cancelledCount: 0,
  monthlyTotal: 0,
})

const detailModal = reactive({
  show: false,
  loading: false,
  data: null,
  kind: null,
  errorMessage: '',
})

const cancelModal = reactive({
  show: false,
  loading: false,
  kind: null,
  targetId: null,
  targetName: '',
  targetUnit: '',
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

const stats = computed(() => [
  { label: '오늘 전체 예약', value: statsData.todayTotal, unit: '건', desc: '오늘 날짜 기준' },
  { label: '진행 중 예약', value: statsData.activeCount, unit: '건', desc: '확정·대기 합산' },
  { label: '취소된 예약', value: statsData.cancelledCount, unit: '건', desc: '시설·GX 합산' },
  { label: '이번달 누적', value: statsData.monthlyTotal, unit: '건', desc: '이번 달 신청 기준' },
])

const fetchStats = async () => {
  try {
    const res = await reservationStore.fetchAdminReservationStats()
    statsData.todayTotal = res?.todayTotal ?? 0
    statsData.activeCount = res?.activeCount ?? 0
    statsData.cancelledCount = res?.cancelledCount ?? 0
    statsData.monthlyTotal = res?.monthlyTotal ?? 0
  } catch {
    // 통계 조회 실패는 목록에 영향을 주지 않으므로 무시한다
  }
}

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

const openResultModal = ({ type = 'success', title, subtitle = '', desc = '', itemName = '', time = '', actionLabel = '', actor = '', afterConfirm = null } = {}) => {
  resultModal.show = true
  resultModal.type = type
  resultModal.title = title
  resultModal.subtitle = subtitle
  resultModal.desc = desc
  resultModal.itemName = itemName
  resultModal.time = time
  resultModal.actionLabel = actionLabel
  resultModal.actor = actor
  resultModal.afterConfirm = afterConfirm
}

const handleResultConfirm = async () => {
  const callback = resultModal.afterConfirm
  resultModal.show = false
  resultModal.afterConfirm = null
  if (typeof callback === 'function') {
    await callback()
  }
}

const hasActiveFilter = () => {
  return !!(state.reservationKind || state.residentName || state.facilityName || state.status || state.reservationDate)
}

const gxCanCancel = (status) => {
  const s = (status || '').toUpperCase()
  return s === 'WAITING' || s === 'PENDING' || s === 'CONFIRMED'
}

const fetchList = async () => {
  state.loading = true
  state.errorMessage = ''

  const params = {
    reservationKind: state.reservationKind || undefined,
    residentName: state.residentName || undefined,
    facilityName: state.facilityName || undefined,
    status: state.status || undefined,
    reservationDate: state.reservationDate || undefined,
    page: state.currentPage - 1,
    size: state.size,
  }

  try {
    const res = await reservationStore.fetchAdminReservationOverview(params)
    state.list = toList(res)
    state.totalElements = Number(res?.totalElements ?? 0)
    state.maxPage = Number(res?.totalPages ?? 1)
    // 필터 없을 때만 전체 건수 갱신
    if (!hasActiveFilter()) {
      state.totalAll = state.totalElements
    }
  } catch (error) {
    state.errorMessage =
      error.response?.data?.message ||
      error.response?.data?.message ||
      '예약 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

let searchTimer = null
const scheduleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    state.currentPage = 1
    fetchList()
  }, 300)
}

const doSearch = () => {
  state.currentPage = 1
  fetchList()
}

const resetFilters = () => {
  state.reservationKind = ''
  state.residentName = ''
  state.facilityName = ''
  state.status = ''
  state.reservationDate = ''
  state.currentPage = 1
  fetchList()
}

const goToPage = (page) => {
  state.currentPage = page
  fetchList()
}

// ── 통합 상세 모달 ─────────────────────────────────────────────────

const openRowDetail = async (row) => {
  detailModal.show = true
  detailModal.loading = true
  detailModal.data = null
  detailModal.kind = row.reservationKind
  detailModal.errorMessage = ''

  try {
    if (row.reservationKind === 'GX') {
      detailModal.data = await gxStore.fetchAdminGxReservationDetail(row.gxReservationId)
    } else {
      detailModal.data = await reservationStore.fetchAdminReservationDetail(row.reservationId)
    }
  } catch (error) {
    detailModal.errorMessage =
      error.response?.data?.message ||
      error.response?.data?.message ||
      '예약 상세 조회에 실패했습니다.'
  } finally {
    detailModal.loading = false
  }
}

const closeDetail = () => {
  detailModal.show = false
  detailModal.data = null
  detailModal.kind = null
  detailModal.errorMessage = ''
}

const detailCanCancel = computed(() => {
  if (!detailModal.data) return false
  const status = String(detailModal.data.status?.name ?? detailModal.data.status ?? '').toUpperCase()
  if (detailModal.kind === 'GX') return gxCanCancel(status)
  return status === 'CONFIRMED'
})

// ── 예약 취소 ──────────────────────────────────────────────────────

const openCancelFromDetail = () => {
  if (!detailModal.data) return
  const data = detailModal.data
  cancelModal.kind = detailModal.kind
  cancelModal.targetId = detailModal.kind === 'GX' ? data.gxReservationId : data.reservationId
  cancelModal.targetName = data.programName || data.facilityName || ''
  cancelModal.targetUnit = getUnitDisplay(data)
  cancelModal.show = true
}

const closeCancelModal = () => {
  cancelModal.show = false
  cancelModal.loading = false
  cancelModal.kind = null
  cancelModal.targetId = null
  cancelModal.targetName = ''
  cancelModal.targetUnit = ''
}

const handleCancel = async () => {
  cancelModal.loading = true
  const { targetName, kind } = cancelModal
  const actionLabel = kind === 'GX' ? 'GX 예약 강제 취소' : '시설 예약 강제 취소'

  try {
    if (kind === 'GX') {
      await gxStore.cancelAdminGxReservation(cancelModal.targetId)
    } else {
      await reservationStore.cancelAdminReservation(cancelModal.targetId, { reason: null })
    }
    cancelModal.show = false
    closeDetail()
    openResultModal({
      type: 'success',
      title: '예약이 취소되었습니다.',
      subtitle: '관리자 강제 취소 처리가 완료되었습니다.',
      itemName: targetName,
      time: getCurrentTimeText(),
      actionLabel,
      actor: getCurrentActorName(),
      afterConfirm: async () => {
        await fetchStats()
        await fetchList()
      },
    })
  } catch (error) {
    cancelModal.show = false
    openResultModal({
      type: 'danger',
      title: '취소 처리에 실패했습니다.',
      subtitle:
        error.response?.data?.message ||
        error.response?.data?.message ||
        '잠시 후 다시 시도해주세요.',
    })
  } finally {
    cancelModal.loading = false
  }
}

// ── 공통 포맷 ──────────────────────────────────────────────────────

const formatTime = (t) => (t ? String(t).slice(0, 5) : '-')
const formatDate = (d) => (d ? String(d).replace(/-/g, '.') : '-')
const formatDateTime = (dt) => (dt ? String(dt).slice(0, 10).replace(/-/g, '.') : '-')

const getUnitDisplay = (row) => {
  if (row.unit) return row.unit
  if (row.dong || row.ho) return [row.dong, row.ho].filter(Boolean).join(' ')
  return '-'
}

const getDateDisplay = (row) => {
  if (row.reservationKind === 'GX') {
    if (row.startDate && row.endDate) return `${formatDate(row.startDate)} ~ ${formatDate(row.endDate)}`
    if (row.startDate) return formatDate(row.startDate)
    return '-'
  }
  return formatDate(row.reservationDate)
}

const getDetailStatus = (data) => {
  if (!data) return ''
  return String(data.status?.name ?? data.status ?? '').toUpperCase()
}

onMounted(() => {
  fetchStats()
  fetchList()
})
</script>

<template>
  <div class="reservation-page">
    <!-- TODO: 전체 통계 API 연동 전까지 현재 페이지 기준 카운트로 표시합니다. -->
    <StatsCards :stats="stats" />

    <div class="table-section">
      <AdminFilterBar @reset="resetFilters">
        <select v-model="state.reservationKind" class="filter-select" @change="doSearch">
          <option v-for="opt in RESERVATION_KIND_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="state.residentName"
            class="search-input"
            type="text"
            placeholder="예약자 검색"
            @input="scheduleSearch"
            @keyup.enter="doSearch"
          />
        </div>
        <div class="search-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="state.facilityName"
            class="search-input"
            type="text"
            placeholder="시설/프로그램 검색"
            @input="scheduleSearch"
            @keyup.enter="doSearch"
          />
        </div>
        <select v-model="state.status" class="filter-select" @change="doSearch">
          <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <input v-model="state.reservationDate" class="filter-date" type="date" @change="doSearch" />
      </AdminFilterBar>

      <div v-if="state.errorMessage" class="error-message">{{ state.errorMessage }}</div>

      <div v-if="state.loading" class="loading-row">조회 중...</div>
      <AdminTable v-else :columns="columns" :rows="state.list" @row-click="openRowDetail">
        <template #cell-reservationKind="{ value }">
          <span :class="['kind-tag', value === 'GX' ? 'kind-tag--gx' : 'kind-tag--facility']">
            {{ value === 'GX' ? 'GX' : '시설' }}
          </span>
        </template>
        <template #cell-facilityName="{ row }">
          <span v-if="row.reservationKind === 'GX'">{{ row.programName || '-' }}</span>
          <span v-else>{{ row.facilityName || '-' }}</span>
        </template>
        <template #cell-residentName="{ value }">
          {{ value || '-' }}
        </template>
        <template #cell-unit="{ row }">
          {{ getUnitDisplay(row) }}
        </template>
        <template #cell-reservationDate="{ row }">
          {{ getDateDisplay(row) }}
        </template>
        <template #cell-time="{ row }">
          {{ formatTime(row.startTime) }} ~ {{ formatTime(row.endTime) }}
        </template>
        <template #cell-status="{ row }">
          <span :class="['status-badge', STATUS_CLASS[row.status] || '']">
            {{ STATUS_LABEL[row.status] || row.statusName || row.status || '-' }}
          </span>
        </template>
        <template #cell-createdAt="{ value }">
          <span class="td-date">{{ formatDateTime(value) }}</span>
        </template>
      </AdminTable>

      <AppPagination
        :currentPage="state.currentPage"
        :maxPage="state.maxPage"
        :totalAll="state.totalAll"
        :totalFiltered="state.totalElements"
        unit="건"
        @change="goToPage"
      />
    </div>

    <!-- ── 통합 상세 모달 ─────────────────────────────────────── -->
    <BaseModal
      v-if="detailModal.show"
      :title="detailModal.kind === 'GX' ? 'GX 예약 상세' : '예약 상세'"
      @close="closeDetail"
    >
      <div v-if="detailModal.loading" class="modal-loading">조회 중...</div>

      <div v-else-if="detailModal.errorMessage" class="error-message">
        {{ detailModal.errorMessage }}
      </div>

      <template v-else-if="detailModal.data">
        <!-- 요약 영역 -->
        <div class="detail-summary">
          <span v-if="detailModal.data.waitNo" class="wait-no-badge">
            대기 {{ detailModal.data.waitNo }}번
          </span>
          <span v-else :class="['status-badge', STATUS_CLASS[getDetailStatus(detailModal.data)] || '']">
            {{ STATUS_LABEL[getDetailStatus(detailModal.data)] || detailModal.data.statusName || getDetailStatus(detailModal.data) || '-' }}
          </span>
          <h3 class="detail-summary-title">
            {{ detailModal.data.programName || detailModal.data.facilityName || '-' }}
          </h3>
        </div>

        <div class="detail-divider"></div>

        <div class="detail-grid">
          <div class="detail-cell">
            <span class="detail-label">예약 ID</span>
            <span class="detail-value">
              {{ detailModal.data.gxReservationId || detailModal.data.reservationId || '-' }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">예약자</span>
            <span class="detail-value">{{ detailModal.data.residentName || '-' }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">{{ detailModal.kind === 'GX' ? '프로그램명' : '시설명' }}</span>
            <span class="detail-value">
              {{ detailModal.kind === 'GX' ? (detailModal.data.programName || '-') : (detailModal.data.facilityName || '-') }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">소속 세대</span>
            <span class="detail-value">{{ getUnitDisplay(detailModal.data) }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">예약 날짜</span>
            <span class="detail-value">
              <template v-if="detailModal.kind === 'GX'">
                {{ formatDate(detailModal.data.startDate) }} ~ {{ formatDate(detailModal.data.endDate) }}
              </template>
              <template v-else>
                {{ formatDate(detailModal.data.reservationDate) }}
              </template>
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">시간</span>
            <span class="detail-value">
              {{ formatTime(detailModal.data.startTime) }} ~ {{ formatTime(detailModal.data.endTime) }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">예약 상태</span>
            <span v-if="detailModal.data.waitNo" class="wait-no-badge">
              대기 {{ detailModal.data.waitNo }}번
            </span>
            <span v-else :class="['status-badge', STATUS_CLASS[getDetailStatus(detailModal.data)] || '']">
              {{ STATUS_LABEL[getDetailStatus(detailModal.data)] || detailModal.data.statusName || getDetailStatus(detailModal.data) || '-' }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">예약일</span>
            <span class="detail-value">{{ formatDateTime(detailModal.data.createdAt) }}</span>
          </div>

          <!-- 현재예약인원 -->
          <div class="detail-cell">
            <span class="detail-label">현재 예약 인원</span>
            <span class="detail-value">
              <template v-if="detailModal.kind === 'GX'">
                {{ detailModal.data.confirmedCount ?? '-' }} / {{ detailModal.data.maxCount ?? '-' }}명
              </template>
              <template v-else>
                {{ detailModal.data.currentCount ?? '-' }} / {{ detailModal.data.maxCount ?? '-' }}명
              </template>
            </span>
          </div>

          <!-- GX 승인일 -->
          <template v-if="detailModal.kind === 'GX' && detailModal.data.approvedAt">
            <div class="detail-cell">
              <span class="detail-label">승인일</span>
              <span class="detail-value">{{ formatDateTime(detailModal.data.approvedAt) }}</span>
            </div>
          </template>

          <!-- FACILITY 좌석 번호 -->
          <template v-if="detailModal.kind !== 'GX' && detailModal.data.seatNo != null">
            <div class="detail-cell">
              <span class="detail-label">좌석 번호</span>
              <span class="detail-value">{{ detailModal.data.seatNo }}번</span>
            </div>
          </template>

          <!-- 취소 정보 -->
          <template v-if="getDetailStatus(detailModal.data) === 'CANCELLED'">
            <div class="detail-cell">
              <span class="detail-label">취소 사유</span>
              <span class="detail-value">
                {{ CANCEL_REASON_LABEL[detailModal.data.cancelReason] || detailModal.data.cancelReason || detailModal.data.rejectReason || '-' }}
              </span>
            </div>
          </template>
        </div>
      </template>

      <template #footer>
        <button class="btn-outline" @click="closeDetail">닫기</button>
        <button
          v-if="detailCanCancel"
          class="btn-danger"
          @click="openCancelFromDetail"
        >
          예약 취소
        </button>
      </template>
    </BaseModal>

    <!-- ── 취소 확인 모달 ─────────────────────────────────────── -->
    <ConfirmModal
      :visible="cancelModal.show"
      title="예약을 취소하시겠습니까?"
      subtitle="취소된 예약은 되돌릴 수 없습니다."
      subtitle-color="#e53e3e"
      item-label="예약"
      :item-name="cancelModal.targetName"
      :action-label="cancelModal.kind === 'GX' ? 'GX 예약' : '시설 예약'"
      action-text="관리자 강제 취소"
      :extra-value="cancelModal.targetUnit"
      extra-label="소속 세대"
      confirm-text="예약 취소"
      cancel-text="닫기"
      confirm-type="danger"
      :loading="cancelModal.loading"
      @confirm="handleCancel"
      @cancel="closeCancelModal"
    />

    <!-- ── 결과 모달 ──────────────────────────────────────────── -->
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
  </div>
</template>

<style scoped>
.reservation-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Noto Sans KR', sans-serif;
}

.table-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.search-wrap {
  position: relative;
  width: 180px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 34px;
  padding: 0 10px 0 32px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13px;
  color: #333;
  outline: none;
  font-family: 'Noto Sans KR', sans-serif;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #a0aec0;
}

.filter-select {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 7px 28px 7px 12px;
  font-size: 13px;
  color: #333;
  background: #fff
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")
    no-repeat right 10px center;
  appearance: none;
  cursor: pointer;
  outline: none;
  font-family: 'Noto Sans KR', sans-serif;
}

.filter-date {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 7px 12px;
  font-size: 13px;
  color: #333;
  outline: none;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-danger {
  height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: #e53e3e;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-outline {
  height: 38px;
  padding: 0 16px;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  background: #fff;
  color: #4a5568;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.error-message {
  margin: 12px 20px 0;
  padding: 10px 14px;
  border-radius: 8px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
}

.loading-row {
  padding: 48px;
  text-align: center;
  color: #a0aec0;
  font-size: 13px;
}

.td-date {
  color: #7b8ea8;
  font-size: 12px;
}

/* 구분 태그 — 색상 없이 텍스트만 */
.kind-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
}

.kind-tag--facility {
  color: #4a5568;
}

.kind-tag--gx {
  color: #7c3aed;
}

.status-badge {
  display: inline-block;
  width: fit-content;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

/* 확정 - 초록 */
.status--confirmed {
  background: #e6f4ea;
  color: #2e7d32;
}

/* 대기 - 주황 */
.status--waiting {
  background: #fff3e0;
  color: #e65100;
}

/* 완료 - 노랑 */
.status--completed {
  background: #fef9e7;
  color: #b7950b;
}

/* 취소/거절 - 빨강 */
.status--cancelled {
  background: #fce4ec;
  color: #c62828;
}

.modal-loading {
  padding: 32px;
  text-align: center;
  color: #a0aec0;
  font-size: 13px;
}

.detail-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-summary-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
}

.wait-no-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: #fef3c7;
  color: #92400e;
  width: fit-content;
}

.detail-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 12px 0 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #eee;
}

.detail-cell {
  padding: 12px 4px;
  border-bottom: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #a0aec0;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
