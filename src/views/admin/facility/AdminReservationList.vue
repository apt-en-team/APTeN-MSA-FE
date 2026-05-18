<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useReservationStore } from '@/stores/useReservationStore.js'
import { toList } from '@/utils/apiResponse'
import StatsCards from '@/components/admin/StatsCards.vue'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const reservationStore = useReservationStore()

const STATUS_OPTIONS = [
  { value: '', label: '전체 상태' },
  { value: 'CONFIRMED', label: '예약완료' },
  { value: 'COMPLETED', label: '이용완료' },
  { value: 'CANCELLED', label: '취소' },
]

const STATUS_LABEL = {
  CONFIRMED: '예약완료',
  COMPLETED: '이용완료',
  CANCELLED: '취소',
}

const STATUS_CLASS = {
  CONFIRMED: 'status--confirmed',
  COMPLETED: 'status--completed',
  CANCELLED: 'status--cancelled',
}

const CANCEL_REASON_LABEL = {
  USER: '사용자취소',
  ADMIN: '관리자취소',
  PROGRAM: '프로그램취소',
}

const columns = [
  { key: 'reservationId', label: '예약 ID' },
  { key: 'facilityName', label: '시설명' },
  { key: 'residentName', label: '예약자' },
  { key: 'reservationDate', label: '예약일' },
  { key: 'time', label: '시간' },
  { key: 'seatNo', label: '좌석' },
  { key: 'status', label: '상태' },
  { key: 'createdAt', label: '등록일시' },
]

const state = reactive({
  list: [],
  status: '',
  reservationDate: '',
  // TODO: facilityId 필터 — 시설 목록 연동 후 드롭다운으로 전환 예정
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

const fetchList = async () => {
  state.loading = true
  state.errorMessage = ''

  const params = {
    status: state.status || undefined,
    reservationDate: state.reservationDate || undefined,
    page: state.currentPage - 1,
    size: state.size,
  }

  try {
    const res = await reservationStore.fetchAdminReservations(params)
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
  state.status = ''
  state.reservationDate = ''
  state.currentPage = 1
  fetchList()
}

const goToPage = (page) => {
  state.currentPage = page
  fetchList()
}

const openDetail = async (item) => {
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

const formatTime = (t) => (t ? String(t).slice(0, 5) : '-')
const formatDate = (d) => (d ? String(d).replace(/-/g, '.') : '-')
const formatDateTime = (dt) => (dt ? String(dt).slice(0, 16).replace('T', ' ') : '-')

onMounted(fetchList)
</script>

<template>
  <div class="reservation-page">
    <!-- TODO: 전체 통계 API 연동 전까지 현재 페이지 기준 카운트로 표시합니다. -->
    <StatsCards :stats="stats" />

    <div class="table-section">
      <AdminFilterBar @reset="resetFilters">
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
        <template #cell-reservationId="{ value }">
          <span class="td-id">#{{ value }}</span>
        </template>
        <template #cell-reservationDate="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #cell-time="{ row }">
          {{ formatTime(row.startTime) }} ~ {{ formatTime(row.endTime) }}
        </template>
        <template #cell-seatNo="{ row }">
          {{ row.seatNo != null ? row.seatNo + '번' : '-' }}
        </template>
        <template #cell-status="{ value }">
          <span :class="['status-badge', STATUS_CLASS[value] || '']">
            {{ STATUS_LABEL[value] || value || '-' }}
          </span>
        </template>
        <template #cell-createdAt="{ value }">
          <span class="td-date">{{ formatDateTime(value) }}</span>
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

    <!-- 상세 모달 -->
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

    <!-- 강제 취소 확인 모달 -->
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

    <!-- 결과 모달 -->
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

.td-id {
  color: #a0aec0;
  font-size: 12px;
}

.td-date {
  color: #7b8ea8;
  font-size: 12px;
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
  margin-bottom: 12px;
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

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
