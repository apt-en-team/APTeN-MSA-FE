<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useReservationStore } from '@/stores/useReservationStore.js'
import { useGxStore } from '@/stores/useGxStore.js'
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

const RESERVATION_KIND_OPTIONS = [
  { value: '', label: '전체 구분' },
  { value: 'FACILITY', label: '시설 예약' },
  { value: 'GX', label: 'GX 예약' },
]

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'CONFIRMED', label: '예약완료' },
  { value: 'PENDING', label: '대기' },
  { value: 'WAITING', label: '대기(GX)' },
  { value: 'COMPLETED', label: '이용완료' },
  { value: 'CANCELLED', label: '취소' },
  { value: 'REJECTED', label: '거절' },
]

const STATUS_LABEL = {
  CONFIRMED: '예약완료',
  PENDING: '대기',
  WAITING: '대기',
  COMPLETED: '이용완료',
  CANCELLED: '취소',
  REJECTED: '거절',
}

const STATUS_CLASS = {
  CONFIRMED: 'status--confirmed',
  PENDING: 'status--pending',
  WAITING: 'status--pending',
  COMPLETED: 'status--completed',
  CANCELLED: 'status--cancelled',
  REJECTED: 'status--cancelled',
}

const CANCEL_REASON_LABEL = {
  USER: '사용자취소',
  ADMIN: '관리자취소',
  PROGRAM: '프로그램취소',
}

const columns = [
  { key: 'reservationKind', label: '구분' },
  { key: 'facilityName', label: '시설/프로그램' },
  { key: 'residentName', label: '예약자' },
  { key: 'unit', label: '세대' },
  { key: 'reservationDate', label: '예약일' },
  { key: 'time', label: '시간' },
  { key: 'status', label: '상태' },
  { key: 'createdAt', label: '등록일시' },
  { key: 'actions', label: '' },
]

const state = reactive({
  list: [],
  reservationKind: '',
  residentName: '',   // UI 보류 - overview API 미지원 (백엔드 지원 시 연결 예정)
  facilityName: '',   // UI 보류 - overview API 미지원 (백엔드 지원 시 연결 예정)
  status: '',
  reservationDate: '',
  currentPage: 1,
  size: 20,
  maxPage: 1,
  totalElements: 0,
  loading: false,
  errorMessage: '',
})

const detailModal = reactive({
  show: false,
  loading: false,
  data: null,
  errorMessage: '',
})

const cancelModal = reactive({
  show: false,
  loading: false,
  reason: '',
  targetId: null,
  targetName: '',
})

const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
})

const gxDetailModal = reactive({
  show: false,
  loading: false,
  data: null,
  errorMessage: '',
})

const gxApproveModal = reactive({
  show: false,
  loading: false,
  targetId: null,
  targetName: '',
})

const gxRejectModal = reactive({
  show: false,
  loading: false,
  targetId: null,
  targetName: '',
  reason: '',
})

const gxCancelModal = reactive({
  show: false,
  loading: false,
  targetId: null,
  targetName: '',
})

// TODO: 전체 통계 API 연동 전까지 전체 건수 + 현재 페이지 기준 상태별 카운트로 표시합니다.
const stats = computed(() => {
  const confirmed = state.list.filter((r) => r.status === 'CONFIRMED').length
  const completed = state.list.filter((r) => r.status === 'COMPLETED').length
  const cancelled = state.list.filter((r) => r.status === 'CANCELLED').length
  return [
    { label: '전체 예약', value: state.totalElements, unit: '건', desc: '전체 기준' },
    { label: '예약완료', value: confirmed, unit: '건', desc: '현재 페이지 기준' },
    { label: '이용완료', value: completed, unit: '건', desc: '현재 페이지 기준' },
    { label: '취소', value: cancelled, unit: '건', desc: '현재 페이지 기준' },
  ]
})

const gxCanApprove = (status) => {
  const s = (status || '').toUpperCase()
  return s === 'WAITING' || s === 'PENDING'
}

const gxCanReject = (status) => {
  const s = (status || '').toUpperCase()
  return s === 'WAITING' || s === 'PENDING'
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
    status: state.status || undefined,
    reservationDate: state.reservationDate || undefined,
    page: state.currentPage - 1,
    size: state.size,
  }

  try {
    const res = await reservationStore.fetchAdminReservationOverview(params)
    state.list = toList(res)
    state.totalElements = res?.totalElements ?? 0
    state.maxPage = res?.totalPages ?? 1
  } catch (error) {
    state.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '예약 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
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

// ── FACILITY 상세/강제취소 ──────────────────────────────────────────

const openDetail = async (item) => {
  if (item.reservationKind === 'GX') return

  detailModal.show = true
  detailModal.loading = true
  detailModal.data = null
  detailModal.errorMessage = ''

  try {
    const res = await reservationStore.fetchAdminReservationDetail(item.reservationId)
    detailModal.data = res
  } catch (error) {
    detailModal.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '예약 상세 조회에 실패했습니다.'
  } finally {
    detailModal.loading = false
  }
}

const closeDetail = () => {
  detailModal.show = false
  detailModal.data = null
  detailModal.errorMessage = ''
}

const openCancelConfirm = () => {
  if (!detailModal.data) return
  cancelModal.targetId = detailModal.data.reservationId
  cancelModal.targetName = detailModal.data.facilityName || ''
  cancelModal.reason = ''
  cancelModal.show = true
}

const closeCancelConfirm = () => {
  cancelModal.show = false
  cancelModal.reason = ''
  cancelModal.targetId = null
}

const handleCancel = async () => {
  cancelModal.loading = true

  try {
    await reservationStore.cancelAdminReservation(cancelModal.targetId, {
      reason: cancelModal.reason || null,
    })
    cancelModal.show = false
    closeDetail()
    resultModal.type = 'success'
    resultModal.title = '예약이 강제 취소되었습니다.'
    resultModal.subtitle = `${cancelModal.targetName} 예약을 취소 처리했습니다.`
    resultModal.show = true
    await fetchList()
  } catch (error) {
    cancelModal.show = false
    resultModal.type = 'danger'
    resultModal.title = '강제 취소에 실패했습니다.'
    resultModal.subtitle =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '잠시 후 다시 시도해주세요.'
    resultModal.show = true
  } finally {
    cancelModal.loading = false
  }
}

const closeResultModal = () => {
  resultModal.show = false
}

// ── GX 상세 ────────────────────────────────────────────────────────

const openGxDetail = async (item) => {
  gxDetailModal.show = true
  gxDetailModal.loading = true
  gxDetailModal.data = null
  gxDetailModal.errorMessage = ''

  try {
    const res = await gxStore.fetchAdminGxReservationDetail(item.gxReservationId)
    gxDetailModal.data = res
  } catch (error) {
    gxDetailModal.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      'GX 예약 상세 조회에 실패했습니다.'
  } finally {
    gxDetailModal.loading = false
  }
}

const closeGxDetail = () => {
  gxDetailModal.show = false
  gxDetailModal.data = null
  gxDetailModal.errorMessage = ''
}

// ── GX 승인 ────────────────────────────────────────────────────────

const openGxApprove = (item) => {
  gxApproveModal.targetId = item.gxReservationId
  gxApproveModal.targetName = item.programName || item.facilityName || ''
  gxApproveModal.show = true
}

const openGxApproveFromDetail = () => {
  const data = gxDetailModal.data
  closeGxDetail()
  openGxApprove(data)
}

const closeGxApprove = () => {
  gxApproveModal.show = false
  gxApproveModal.loading = false
  gxApproveModal.targetId = null
  gxApproveModal.targetName = ''
}

const handleGxApprove = async () => {
  gxApproveModal.loading = true

  try {
    await gxStore.approveGxReservation(gxApproveModal.targetId)
    gxApproveModal.show = false
    resultModal.type = 'success'
    resultModal.title = 'GX 예약을 승인했습니다.'
    resultModal.subtitle = `${gxApproveModal.targetName} 예약이 승인 처리되었습니다.`
    resultModal.show = true
    await fetchList()
  } catch (error) {
    gxApproveModal.show = false
    resultModal.type = 'danger'
    resultModal.title = '승인 처리에 실패했습니다.'
    resultModal.subtitle =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '잠시 후 다시 시도해주세요.'
    resultModal.show = true
  } finally {
    gxApproveModal.loading = false
  }
}

// ── GX 거절 ────────────────────────────────────────────────────────

const openGxReject = (item) => {
  gxRejectModal.targetId = item.gxReservationId
  gxRejectModal.targetName = item.programName || item.facilityName || ''
  gxRejectModal.reason = ''
  gxRejectModal.show = true
}

const openGxRejectFromDetail = () => {
  const data = gxDetailModal.data
  closeGxDetail()
  openGxReject(data)
}

const closeGxReject = () => {
  gxRejectModal.show = false
  gxRejectModal.loading = false
  gxRejectModal.targetId = null
  gxRejectModal.targetName = ''
  gxRejectModal.reason = ''
}

const handleGxReject = async () => {
  gxRejectModal.loading = true

  try {
    await gxStore.rejectGxReservation(gxRejectModal.targetId, {
      rejectReason: gxRejectModal.reason || null,
    })
    gxRejectModal.show = false
    resultModal.type = 'success'
    resultModal.title = 'GX 예약을 거절했습니다.'
    resultModal.subtitle = `${gxRejectModal.targetName} 예약이 거절 처리되었습니다.`
    resultModal.show = true
    await fetchList()
  } catch (error) {
    gxRejectModal.show = false
    resultModal.type = 'danger'
    resultModal.title = '거절 처리에 실패했습니다.'
    resultModal.subtitle =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '잠시 후 다시 시도해주세요.'
    resultModal.show = true
  } finally {
    gxRejectModal.loading = false
  }
}

// ── GX 취소 ────────────────────────────────────────────────────────

const openGxCancel = (item) => {
  gxCancelModal.targetId = item.gxReservationId
  gxCancelModal.targetName = item.programName || item.facilityName || ''
  gxCancelModal.show = true
}

const openGxCancelFromDetail = () => {
  const data = gxDetailModal.data
  closeGxDetail()
  openGxCancel(data)
}

const closeGxCancel = () => {
  gxCancelModal.show = false
  gxCancelModal.loading = false
  gxCancelModal.targetId = null
  gxCancelModal.targetName = ''
}

const handleGxCancel = async () => {
  gxCancelModal.loading = true

  try {
    await gxStore.cancelAdminGxReservation(gxCancelModal.targetId)
    gxCancelModal.show = false
    resultModal.type = 'success'
    resultModal.title = 'GX 예약이 강제 취소되었습니다.'
    resultModal.subtitle = `${gxCancelModal.targetName} 예약을 취소 처리했습니다.`
    resultModal.show = true
    await fetchList()
  } catch (error) {
    gxCancelModal.show = false
    resultModal.type = 'danger'
    resultModal.title = 'GX 강제 취소에 실패했습니다.'
    resultModal.subtitle =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '잠시 후 다시 시도해주세요.'
    resultModal.show = true
  } finally {
    gxCancelModal.loading = false
  }
}

// ── 공통 포맷 ──────────────────────────────────────────────────────

const formatTime = (t) => (t ? String(t).slice(0, 5) : '-')
const formatDate = (d) => (d ? String(d).replace(/-/g, '.') : '-')
const formatDateTime = (dt) => (dt ? String(dt).slice(0, 16).replace('T', ' ') : '-')

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

onMounted(fetchList)
</script>

<template>
  <div class="reservation-page">
    <!-- TODO: 전체 통계 API 연동 전까지 현재 페이지 기준 카운트로 표시합니다. -->
    <StatsCards :stats="stats" />

    <div class="table-section">
      <AdminFilterBar @reset="resetFilters">
        <select v-model="state.reservationKind" class="filter-select">
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
            class="search-input search-input--disabled"
            type="text"
            placeholder="예약자 검색 (미지원)"
            @keyup.enter="doSearch"
          />
        </div>
        <input
          v-model="state.facilityName"
          class="filter-text filter-text--disabled"
          type="text"
          placeholder="시설명 검색 (미지원)"
          @keyup.enter="doSearch"
        />
        <select v-model="state.status" class="filter-select">
          <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <input v-model="state.reservationDate" class="filter-date" type="date" />
        <button class="btn-search" type="button" @click="doSearch">조회</button>
      </AdminFilterBar>

      <div v-if="state.errorMessage" class="error-message">{{ state.errorMessage }}</div>

      <div v-if="state.loading" class="loading-row">조회 중...</div>
      <AdminTable v-else :columns="columns" :rows="state.list" @row-click="openDetail">
        <template #cell-reservationKind="{ value }">
          <span :class="['kind-badge', value === 'GX' ? 'kind--gx' : 'kind--facility']">
            {{ value === 'GX' ? 'GX 예약' : '시설 예약' }}
          </span>
        </template>
        <template #cell-facilityName="{ row }">
          <span v-if="row.reservationKind === 'GX'">
            {{ [row.facilityName, row.programName].filter(Boolean).join(' · ') || '-' }}
          </span>
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
            {{ row.statusName || STATUS_LABEL[row.status] || row.status || '-' }}
          </span>
        </template>
        <template #cell-createdAt="{ value }">
          <span class="td-date">{{ formatDateTime(value) }}</span>
        </template>
        <template #cell-actions="{ row }">
          <template v-if="row.reservationKind !== 'GX'">
            <button class="btn-detail" @click.stop="openDetail(row)">상세</button>
          </template>
          <div v-else class="gx-actions">
            <button class="btn-detail" @click.stop="openGxDetail(row)">상세</button>
            <button v-if="gxCanApprove(row.status)" class="btn-approve-sm" @click.stop="openGxApprove(row)">승인</button>
            <button v-if="gxCanReject(row.status)" class="btn-reject-sm" @click.stop="openGxReject(row)">거절</button>
            <button v-if="gxCanCancel(row.status)" class="btn-cancel-sm" @click.stop="openGxCancel(row)">취소</button>
          </div>
        </template>
      </AdminTable>

      <AppPagination
        :currentPage="state.currentPage"
        :maxPage="state.maxPage"
        :totalAll="state.totalElements"
        :totalFiltered="state.totalElements"
        unit="건"
        @change="goToPage"
      />
    </div>

    <!-- ── FACILITY 상세 모달 ─────────────────────────────────── -->
    <BaseModal
      v-if="detailModal.show"
      title="예약 상세 정보"
      :subtitle="detailModal.data ? '#' + detailModal.data.reservationId : ''"
      @close="closeDetail"
    >
      <div v-if="detailModal.loading" class="modal-loading">조회 중...</div>

      <div v-else-if="detailModal.errorMessage" class="error-message">
        {{ detailModal.errorMessage }}
      </div>

      <template v-else-if="detailModal.data">
        <div class="detail-status-row">
          <span :class="['status-badge', STATUS_CLASS[detailModal.data.status] || '']">
            {{ STATUS_LABEL[detailModal.data.status] || detailModal.data.status || '-' }}
          </span>
        </div>

        <div class="detail-divider"></div>

        <div class="detail-grid">
          <div class="detail-cell">
            <span class="detail-label">시설명</span>
            <span class="detail-value">{{ detailModal.data.facilityName || '-' }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">예약자</span>
            <span class="detail-value">{{ detailModal.data.residentName || '-' }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">예약일</span>
            <span class="detail-value">{{ formatDate(detailModal.data.reservationDate) }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">시간</span>
            <span class="detail-value">
              {{ formatTime(detailModal.data.startTime) }} ~ {{ formatTime(detailModal.data.endTime) }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">좌석 번호</span>
            <span class="detail-value">
              {{ detailModal.data.seatNo != null ? detailModal.data.seatNo + '번' : '-' }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">등록일시</span>
            <span class="detail-value">{{ formatDateTime(detailModal.data.createdAt) }}</span>
          </div>

          <template v-if="detailModal.data.status === 'CANCELLED'">
            <div class="detail-cell">
              <span class="detail-label">취소 사유</span>
              <span class="detail-value">
                {{ CANCEL_REASON_LABEL[detailModal.data.cancelReason] || detailModal.data.cancelReason || '-' }}
              </span>
            </div>
            <div class="detail-cell">
              <span class="detail-label">취소 시각</span>
              <span class="detail-value">{{ formatDateTime(detailModal.data.cancelledAt) }}</span>
            </div>
          </template>

          <template v-if="detailModal.data.status === 'COMPLETED'">
            <div class="detail-cell">
              <span class="detail-label">완료 시각</span>
              <span class="detail-value">{{ formatDateTime(detailModal.data.completedAt) }}</span>
            </div>
          </template>
        </div>
      </template>

      <template #footer>
        <button
          v-if="detailModal.data?.status === 'CONFIRMED'"
          class="btn-danger"
          @click="openCancelConfirm"
        >
          강제 취소
        </button>
      </template>
    </BaseModal>

    <!-- ── GX 상세 모달 ───────────────────────────────────────── -->
    <BaseModal
      v-if="gxDetailModal.show"
      title="GX 예약 상세"
      @close="closeGxDetail"
    >
      <div v-if="gxDetailModal.loading" class="modal-loading">조회 중...</div>

      <div v-else-if="gxDetailModal.errorMessage" class="error-message">
        {{ gxDetailModal.errorMessage }}
      </div>

      <template v-else-if="gxDetailModal.data">
        <div class="detail-status-row">
          <span :class="['status-badge', STATUS_CLASS[gxDetailModal.data.status] || '']">
            {{ gxDetailModal.data.statusName || STATUS_LABEL[gxDetailModal.data.status] || gxDetailModal.data.status || '-' }}
          </span>
          <span v-if="gxDetailModal.data.waitNo" class="wait-no-badge">
            대기 {{ gxDetailModal.data.waitNo }}번
          </span>
        </div>

        <div class="detail-divider"></div>

        <div class="detail-grid">
          <div class="detail-cell">
            <span class="detail-label">프로그램명</span>
            <span class="detail-value">{{ gxDetailModal.data.programName || '-' }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">시설명</span>
            <span class="detail-value">{{ gxDetailModal.data.facilityName || '-' }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">예약자</span>
            <span class="detail-value">{{ gxDetailModal.data.residentName || '-' }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">세대</span>
            <span class="detail-value">{{ getUnitDisplay(gxDetailModal.data) }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">프로그램 기간</span>
            <span class="detail-value">
              {{ formatDate(gxDetailModal.data.startDate) }} ~ {{ formatDate(gxDetailModal.data.endDate) }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">운영 시간</span>
            <span class="detail-value">
              {{ formatTime(gxDetailModal.data.startTime) }} ~ {{ formatTime(gxDetailModal.data.endTime) }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-label">신청일시</span>
            <span class="detail-value">{{ formatDateTime(gxDetailModal.data.createdAt) }}</span>
          </div>
          <div v-if="gxDetailModal.data.rejectReason" class="detail-cell">
            <span class="detail-label">거절 사유</span>
            <span class="detail-value">{{ gxDetailModal.data.rejectReason }}</span>
          </div>
          <template v-if="gxDetailModal.data.cancelReason">
            <div class="detail-cell">
              <span class="detail-label">취소 사유</span>
              <span class="detail-value">
                {{ CANCEL_REASON_LABEL[gxDetailModal.data.cancelReason] || gxDetailModal.data.cancelReason || '-' }}
              </span>
            </div>
            <div class="detail-cell">
              <span class="detail-label">취소 시각</span>
              <span class="detail-value">{{ formatDateTime(gxDetailModal.data.cancelledAt) }}</span>
            </div>
          </template>
        </div>
      </template>

      <template #footer>
        <template v-if="gxDetailModal.data">
          <button
            v-if="gxCanApprove(gxDetailModal.data.status)"
            class="btn-approve"
            @click="openGxApproveFromDetail"
          >
            승인
          </button>
          <button
            v-if="gxCanReject(gxDetailModal.data.status)"
            class="btn-reject"
            @click="openGxRejectFromDetail"
          >
            거절
          </button>
          <button
            v-if="gxCanCancel(gxDetailModal.data.status)"
            class="btn-danger"
            @click="openGxCancelFromDetail"
          >
            강제 취소
          </button>
        </template>
      </template>
    </BaseModal>

    <!-- ── GX 거절 사유 모달 ──────────────────────────────────── -->
    <BaseModal
      v-if="gxRejectModal.show"
      title="GX 예약 거절"
      :subtitle="gxRejectModal.targetName"
      @close="closeGxReject"
    >
      <div class="reject-form">
        <label class="reject-label">거절 사유 (선택)</label>
        <textarea
          v-model="gxRejectModal.reason"
          class="reject-textarea"
          placeholder="거절 사유를 입력하세요"
          rows="3"
        />
      </div>

      <template #footer>
        <button class="btn-outline" @click="closeGxReject">닫기</button>
        <button class="btn-danger" :disabled="gxRejectModal.loading" @click="handleGxReject">
          {{ gxRejectModal.loading ? '처리 중...' : '거절 처리' }}
        </button>
      </template>
    </BaseModal>

    <!-- ── FACILITY 강제 취소 확인 모달 ──────────────────────── -->
    <ConfirmModal
      :visible="cancelModal.show"
      title="예약을 강제 취소하시겠습니까?"
      subtitle="취소된 예약은 되돌릴 수 없습니다."
      subtitle-color="#e53e3e"
      item-label="시설명"
      :item-name="cancelModal.targetName"
      confirm-text="강제 취소"
      confirm-type="danger"
      :loading="cancelModal.loading"
      @confirm="handleCancel"
      @cancel="closeCancelConfirm"
    />

    <!-- ── GX 승인 확인 모달 ─────────────────────────────────── -->
    <ConfirmModal
      :visible="gxApproveModal.show"
      title="GX 예약을 승인하시겠습니까?"
      item-label="프로그램"
      :item-name="gxApproveModal.targetName"
      confirm-text="승인"
      confirm-type="success"
      :loading="gxApproveModal.loading"
      @confirm="handleGxApprove"
      @cancel="closeGxApprove"
    />

    <!-- ── GX 취소 확인 모달 ─────────────────────────────────── -->
    <ConfirmModal
      :visible="gxCancelModal.show"
      title="GX 예약을 강제 취소하시겠습니까?"
      subtitle="취소된 예약은 되돌릴 수 없습니다."
      subtitle-color="#e53e3e"
      item-label="프로그램"
      :item-name="gxCancelModal.targetName"
      confirm-text="강제 취소"
      confirm-type="danger"
      :loading="gxCancelModal.loading"
      @confirm="handleGxCancel"
      @cancel="closeGxCancel"
    />

    <!-- ── 결과 모달 ──────────────────────────────────────────── -->
    <ActionResultModal
      :visible="resultModal.show"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      confirm-text="확인"
      @close="closeResultModal"
    />
  </div>
</template>

<style scoped>
.reservation-page {
  display: flex;
  flex-direction: column;
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
}

.search-input--disabled,
.filter-text--disabled {
  background: #f8fafc;
  color: #a0aec0;
}

.filter-text {
  height: 34px;
  width: 150px;
  padding: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13px;
  color: #333;
  outline: none;
  font-family: 'Noto Sans KR', sans-serif;
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

.btn-search {
  padding: 7px 16px;
  border: 0;
  border-radius: 7px;
  background: #1e2a3e;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-search:hover {
  background: #121a27;
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

.btn-approve {
  height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: #38a169;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-reject {
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

.btn-detail {
  padding: 4px 10px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background: #fff;
  color: #4a5568;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  white-space: nowrap;
}

.btn-detail:hover {
  background: #f7fafc;
}

.btn-approve-sm {
  padding: 4px 8px;
  border: 0;
  border-radius: 6px;
  background: #38a169;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  white-space: nowrap;
}

.btn-reject-sm {
  padding: 4px 8px;
  border: 0;
  border-radius: 6px;
  background: #e53e3e;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  white-space: nowrap;
}

.btn-cancel-sm {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #718096;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  white-space: nowrap;
}

.gx-actions {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
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

.kind-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.kind--facility {
  background: #ebf4ff;
  color: #3a7bd5;
}

.kind--gx {
  background: #f3e8ff;
  color: #7c3aed;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.status--confirmed {
  background: #ebf5ee;
  color: #4d8b5a;
}

.status--pending {
  background: #fff3e0;
  color: #e65100;
}

.status--completed {
  background: #ebf4ff;
  color: #3a7bd5;
}

.status--cancelled {
  background: #f5f5f5;
  color: #718096;
}

.modal-loading {
  padding: 32px;
  text-align: center;
  color: #a0aec0;
  font-size: 13px;
}

.detail-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.wait-no-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: #fef3c7;
  color: #92400e;
}

.detail-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 12px 0 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-cell {
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

.reject-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reject-label {
  font-size: 13px;
  color: #4a5568;
  font-weight: 600;
}

.reject-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #333;
  resize: vertical;
  outline: none;
  font-family: 'Noto Sans KR', sans-serif;
  box-sizing: border-box;
}

.reject-textarea:focus {
  border-color: #a0aec0;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
