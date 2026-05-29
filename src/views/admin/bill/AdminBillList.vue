<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBillStore } from '@/stores/useBillStore'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const authStore = useAuthStore()
const billStore = useBillStore()

const state = reactive({
  listLoading: false,
  errorMessage: '',
  filters: {
    billYear: new Date().getFullYear(),
    billMonth: '',
    status: '',
    building: '',
    unit: '',
  },
  pagination: {
    currentPage: 1,
    pageSize: 20,
  },
  modals: {
    detail: false,
    confirmBill: false,
    unconfirmBill: false,
  },
  detailLoading: false,
  selectedBill: null,
  actionSubmitting: false,
  actionError: '',
  resultModal: {
    visible: false,
    type: 'success',
    title: '',
    subtitle: '',
    desc: '',
    itemName: '',
    time: '',
    actionLabel: '',
    actor: '',
    afterConfirm: null,
  },
})

const billColumns = computed(() => [
  { key: 'number', label: '#' },
  { key: 'address', label: '세대' },
  { key: 'billPeriod', label: '청구년월' },
  { key: 'baseFeeLabel', label: '기본관리비' },
  { key: 'vehicleFeeLabel', label: '차량비용' },
  { key: 'facilityFeeLabel', label: '시설이용비' },
  { key: 'visitorFeeLabel', label: '방문차량' },
  { key: 'totalFeeLabel', label: '총액' },
  { key: 'statusLabel', label: '상태' },
])

const bills = computed(() => {
  const d = billStore.bills
  if (!d) return []
  if (Array.isArray(d)) return d
  if (Array.isArray(d.content)) return d.content
  return []
})

const totalElements = computed(() => billStore.bills?.totalElements ?? bills.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalElements.value / state.pagination.pageSize)))

const billDetail = computed(() => billStore.billDetail)

const summaryItems = computed(() => {
  const total = totalElements.value
  const draft = bills.value.filter((b) => b.status === 'DRAFT').length
  const confirmed = bills.value.filter((b) => b.status === 'CONFIRMED').length
  const selectedMonth = state.filters.billMonth ? `${state.filters.billMonth}월` : '전체 월'
  return [
    { label: '납부 미완', value: draft, unit: '건', desc: '확정 전 상태', descClass: 'warning' },
    { label: '납부 완료', value: confirmed, unit: '건', desc: '청구 확정된 건', descClass: 'success' },
    { label: '전체 청구', value: total, unit: '건', desc: '조회 조건 기준', descClass: '' },
    { label: '조회 기간', value: state.filters.billYear, unit: '년', desc: selectedMonth, descClass: '' },
  ]
})

const yearOptions = computed(() => {
  const now = new Date().getFullYear()
  return [now - 1, now, now + 1].map((y) => ({ value: y, label: `${y}년` }))
})

const monthOptions = [
  { value: '', label: '전체' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}월` })),
]

const statusOptions = [
  { value: '', label: '전체' },
  { value: 'DRAFT', label: '임시계산' },
  { value: 'CONFIRMED', label: '확정완료' },
]

const pagedBills = computed(() =>
  bills.value.map((b, index) => ({
    ...b,
    number: (state.pagination.currentPage - 1) * state.pagination.pageSize + index + 1,
    address: `${b.building ?? '-'}동 ${b.unit ?? '-'}호`,
    billPeriod: `${b.billYear ?? '-'}년 ${b.billMonth ?? '-'}월`,
    baseFeeLabel: '-',
    vehicleFeeLabel: '-',
    facilityFeeLabel: '-',
    visitorFeeLabel: '-',
    totalFeeLabel: formatFee(b.totalFee),
    statusLabel: billStatusLabel(b.status),
  })),
)

const detailItems = computed(() => {
  const d = billDetail.value
  if (!d?.items) return []
  return d.items
})

function billStatusLabel(s) {
  return { DRAFT: '임시계산', CONFIRMED: '확정완료' }[s] ?? s ?? '-'
}

function billStatusClass(s) {
  return { DRAFT: 'is-warning', CONFIRMED: 'is-success' }[s] ?? 'is-gray'
}

function itemTypeLabel(t) {
  return { BASE_FEE: '기본관리비', VEHICLE_FEE: '차량비용', FACILITY_FEE: '시설이용비용', VISITOR_FEE: '방문차량비용' }[t] ?? t ?? '-'
}

function formatFee(value) {
  if (value == null) return '-'
  return Number(value).toLocaleString('ko-KR') + '원'
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

function getErrorMessage(error, fallback = '잠시 후 다시 시도해주세요.') {
  const responseData = error?.response?.data
  if (responseData?.message) return responseData.message
  if (responseData?.data?.message) return responseData.data.message
  if (error?.message && !error.message.startsWith('Request failed with status code')) return error.message
  return fallback
}

function getCurrentTimeText() {
  return new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCurrentActorName() {
  return authStore.userInfo?.name || authStore.user?.name || authStore.name || '관리자'
}

function openResultModal({ type = 'success', title, subtitle = '', desc = '', itemName = '', actionLabel = '', afterConfirm = null }) {
  state.resultModal.visible = true
  state.resultModal.type = type
  state.resultModal.title = title
  state.resultModal.subtitle = subtitle
  state.resultModal.desc = desc
  state.resultModal.itemName = itemName
  state.resultModal.time = getCurrentTimeText()
  state.resultModal.actionLabel = actionLabel
  state.resultModal.actor = getCurrentActorName()
  state.resultModal.afterConfirm = afterConfirm
}

async function handleResultConfirm() {
  const callback = state.resultModal.afterConfirm
  state.resultModal.visible = false
  state.resultModal.afterConfirm = null
  if (typeof callback === 'function') await callback()
}

async function loadBills() {
  state.listLoading = true
  state.errorMessage = ''
  try {
    await billStore.fetchAdminBills({
      billYear: state.filters.billYear || undefined,
      billMonth: state.filters.billMonth || undefined,
      status: state.filters.status || undefined,
      building: state.filters.building.trim() || undefined,
      unit: state.filters.unit.trim() || undefined,
      page: state.pagination.currentPage - 1,
      size: state.pagination.pageSize,
    })
  } catch (e) {
    state.errorMessage = getErrorMessage(e, '목록을 불러오지 못했습니다.')
  } finally {
    state.listLoading = false
  }
}

function handleSearch() {
  state.pagination.currentPage = 1
  loadBills()
}

function handleReset() {
  state.filters.billYear = new Date().getFullYear()
  state.filters.billMonth = ''
  state.filters.status = ''
  state.filters.building = ''
  state.filters.unit = ''
  state.pagination.currentPage = 1
  loadBills()
}

function handlePageChange(page) {
  state.pagination.currentPage = page
  loadBills()
}

async function handleRowClick(row) {
  state.selectedBill = row
  state.modals.detail = true
  state.detailLoading = true
  try {
    await billStore.fetchAdminBillDetail(row.billId)
  } catch (e) {
    console.error(e)
  } finally {
    state.detailLoading = false
  }
}

async function handleConfirmBill() {
  if (state.actionSubmitting) return
  state.modals.confirmBill = false
  state.actionSubmitting = true
  state.actionError = ''
  try {
    await billStore.confirmBill(state.selectedBill.billId)
    const label = `${state.selectedBill.building}동 ${state.selectedBill.unit}호 ${state.selectedBill.billYear}년 ${state.selectedBill.billMonth}월`
    state.modals.detail = false
    openResultModal({
      type: 'success',
      title: '관리비가 확정되었습니다.',
      itemName: label,
      actionLabel: '관리비 확정',
      afterConfirm: async () => { await loadBills() },
    })
  } catch (error) {
    state.actionError = getErrorMessage(error, '확정 처리에 실패했습니다.')
  } finally {
    state.actionSubmitting = false
  }
}

async function handleUnconfirmBill() {
  if (state.actionSubmitting) return
  state.modals.unconfirmBill = false
  state.actionSubmitting = true
  state.actionError = ''
  try {
    await billStore.unconfirmBill(state.selectedBill.billId)
    const label = `${state.selectedBill.building}동 ${state.selectedBill.unit}호 ${state.selectedBill.billYear}년 ${state.selectedBill.billMonth}월`
    state.modals.detail = false
    openResultModal({
      type: 'success',
      title: '관리비 확정이 취소되었습니다.',
      itemName: label,
      actionLabel: '확정 취소',
      afterConfirm: async () => { await loadBills() },
    })
  } catch (error) {
    state.actionError = getErrorMessage(error, '확정 취소에 실패했습니다.')
  } finally {
    state.actionSubmitting = false
  }
}

onMounted(() => {
  loadBills()
})
</script>

<template>
  <section class="bill-page">

    <StatsCards :stats="summaryItems" />

    <!-- 필터 -->
    <div class="bill-card">
      <AdminFilterBar @search="handleSearch" @reset="handleReset">
        <select v-model="state.filters.billYear" class="filter-select">
          <option v-for="opt in yearOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="state.filters.billMonth" class="filter-select">
          <option v-for="opt in monthOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select v-model="state.filters.status" class="filter-select">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <input
          v-model="state.filters.building"
          class="filter-input"
          placeholder="동 검색 (예: 101)"
          @keyup.enter="handleSearch"
        />
        <input
          v-model="state.filters.unit"
          class="filter-input"
          placeholder="호수 검색 (예: 101)"
          @keyup.enter="handleSearch"
        />
      </AdminFilterBar>

      <!-- 목록 -->
      <div class="bill-card__meta">
        <span class="bill-card__count">총 <strong>{{ totalElements }}</strong>건</span>
      </div>
      <div v-if="state.listLoading" class="table-feedback">불러오는 중...</div>
      <div v-else-if="state.errorMessage" class="table-feedback table-feedback--error">{{ state.errorMessage }}</div>
      <template v-else>
        <AdminTable
          :columns="billColumns"
          :rows="pagedBills"
          :loading="state.listLoading"
          @row-click="handleRowClick"
        >
          <template #cell-statusLabel="{ row }">
            <span :class="['bill-status-badge', billStatusClass(row.status)]">{{ row.statusLabel }}</span>
          </template>
        </AdminTable>
        <div v-if="pagedBills.length === 0" class="table-feedback">조회된 청구 내역이 없습니다.</div>
        <AppPagination
          :current-page="state.pagination.currentPage"
          :total-pages="totalPages"
          @page-change="handlePageChange"
        />
      </template>
    </div>

    <!-- 상세 모달 -->
    <BaseModal
      :visible="state.modals.detail"
      title="관리비 상세"
      :subtitle="state.selectedBill ? `${state.selectedBill.building}동 ${state.selectedBill.unit}호` : ''"
      @close="state.modals.detail = false"
    >
      <div v-if="state.detailLoading" class="table-feedback">불러오는 중...</div>
      <template v-else-if="billDetail">
        <!-- 헤더 정보 -->
        <div class="detail-hero">
          <div class="detail-address-row">
            <h2 class="detail-address">{{ billDetail.building }}동 {{ billDetail.unit }}호</h2>
            <span :class="['detail-status-badge', billStatusClass(billDetail.status)]">{{ billStatusLabel(billDetail.status) }}</span>
          </div>
          <p class="detail-sub">{{ billDetail.billYear }}년 {{ billDetail.billMonth }}월 청구</p>
        </div>
        <div class="detail-divider" />

        <!-- 금액 요약 -->
        <div class="detail-fee-grid">
          <div class="detail-fee-item">
            <span class="detail-fee-label">기본관리비</span>
            <span class="detail-fee-value">{{ formatFee(billDetail.baseFee) }}</span>
          </div>
          <div class="detail-fee-item">
            <span class="detail-fee-label">차량비용</span>
            <span class="detail-fee-value">{{ formatFee(billDetail.vehicleFee) }}</span>
          </div>
          <div class="detail-fee-item">
            <span class="detail-fee-label">시설이용비</span>
            <span class="detail-fee-value">{{ formatFee(billDetail.facilityFee) }}</span>
          </div>
          <div class="detail-fee-item">
            <span class="detail-fee-label">방문차량비</span>
            <span class="detail-fee-value">{{ formatFee(billDetail.visitorFee) }}</span>
          </div>
          <div class="detail-fee-item detail-fee-item--total">
            <span class="detail-fee-label">총 청구액</span>
            <span class="detail-fee-value detail-fee-value--total">{{ formatFee(billDetail.totalFee) }}</span>
          </div>
        </div>
        <div class="detail-divider" />

        <!-- 청구 항목 목록 -->
        <div class="detail-section-title">청구 항목 상세</div>
        <div v-if="detailItems.length === 0" class="detail-empty">등록된 항목이 없습니다.</div>
        <div v-else class="detail-item-list">
          <div v-for="(item, idx) in detailItems" :key="idx" class="detail-item-row">
            <div class="detail-item-left">
              <span class="detail-item-type">{{ itemTypeLabel(item.itemType) }}</span>
              <span class="detail-item-name">{{ item.itemName }}</span>
            </div>
            <div class="detail-item-right">
              <span class="detail-item-amount">{{ formatFee(item.amount) }}</span>
              <span v-if="item.calcMemo" class="detail-item-memo">{{ item.calcMemo }}</span>
            </div>
          </div>
        </div>

        <!-- 확정 정보 -->
        <div v-if="billDetail.confirmedAt" class="detail-confirmed-info">
          <span>확정일시 : {{ formatDate(billDetail.confirmedAt) }}</span>
        </div>

        <p v-if="state.actionError" class="form-feedback error">{{ state.actionError }}</p>
      </template>

      <template #footer>
        <template v-if="billDetail">
          <button
            v-if="billDetail.status === 'CONFIRMED'"
            class="btn btn--secondary"
            @click="state.modals.unconfirmBill = true"
          >확정 취소</button>
          <button
            v-if="billDetail.status === 'DRAFT'"
            class="btn btn--primary"
            @click="state.modals.confirmBill = true"
          >확정 처리</button>
        </template>
        <button class="btn btn--ghost" @click="state.modals.detail = false">닫기</button>
      </template>
    </BaseModal>

    <!-- 확정 확인 모달 -->
    <ConfirmModal
      :visible="state.modals.confirmBill"
      title="관리비 확정"
      :subtitle="`${state.selectedBill?.building ?? ''}동 ${state.selectedBill?.unit ?? ''}호 ${state.selectedBill?.billYear ?? ''}년 ${state.selectedBill?.billMonth ?? ''}월`"
      item-label="청구"
      action-text="관리비 확정"
      confirm-text="확정"
      cancel-text="취소"
      confirm-type="primary"
      @confirm="handleConfirmBill"
      @cancel="state.modals.confirmBill = false"
    />

    <!-- 확정 취소 확인 모달 -->
    <ConfirmModal
      :visible="state.modals.unconfirmBill"
      title="확정 취소"
      :subtitle="`${state.selectedBill?.building ?? ''}동 ${state.selectedBill?.unit ?? ''}호 ${state.selectedBill?.billYear ?? ''}년 ${state.selectedBill?.billMonth ?? ''}월`"
      item-label="청구"
      action-text="확정 취소"
      confirm-text="취소 처리"
      cancel-text="닫기"
      confirm-type="danger"
      @confirm="handleUnconfirmBill"
      @cancel="state.modals.unconfirmBill = false"
    />

    <!-- 결과 모달 -->
    <ActionResultModal
      :visible="state.resultModal.visible"
      :type="state.resultModal.type"
      :title="state.resultModal.title"
      :subtitle="state.resultModal.subtitle"
      :desc="state.resultModal.desc"
      :item-name="state.resultModal.itemName"
      :time="state.resultModal.time"
      :action-label="state.resultModal.actionLabel"
      :actor="state.resultModal.actor"
      @confirm="handleResultConfirm"
    />
  </section>
</template>

<style scoped>
.bill-page {
  display: grid;
  gap: 20px;
}

/* 필터 입력 요소 */
.filter-select,
.filter-input {
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: var(--color-text-primary);
  min-width: 100px;
}

/* 목록 카드 */
.bill-card {
  padding: 20px;
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
}

.bill-card__meta {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.bill-card__count strong {
  color: var(--color-text-primary);
  font-weight: 700;
}

/* 상태 뱃지 */
.bill-status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.bill-status-badge.is-warning {
  background: #fef3c7;
  color: #c05621;
}

.bill-status-badge.is-success {
  background: #c6f6d5;
  color: #276749;
}

.bill-status-badge.is-gray {
  background: #edf2f7;
  color: #687282;
}

/* 피드백 */
.table-feedback {
  padding: 32px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.table-feedback--error {
  color: var(--color-danger, #e53e3e);
}

/* 버튼 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--color-primary, #3b5bdb);
  color: #fff;
}

.btn--secondary {
  background: var(--color-bg-subtle, #edf2f7);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

/* 상세 모달 */
.detail-hero {
  margin: -14px 0 14px;
}

.detail-address-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2px;
}

.detail-address {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.detail-status-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.detail-status-badge.is-warning { background: #fef3c7; color: #c05621; }
.detail-status-badge.is-success { background: #c6f6d5; color: #276749; }
.detail-status-badge.is-gray { background: #edf2f7; color: #687282; }

.detail-sub {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.detail-divider {
  height: 1px;
  background: var(--color-border);
  margin: 16px 0;
}

/* 금액 요약 그리드 */
.detail-fee-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.detail-fee-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-bg-subtle, #f7fafc);
  border-radius: 8px;
  font-size: 13px;
}

.detail-fee-item--total {
  grid-column: 1 / -1;
  background: var(--color-primary-light, #ebf4ff);
  border: 1px solid var(--color-primary-border, #bee3f8);
}

.detail-fee-label {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.detail-fee-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-fee-value--total {
  font-size: 16px;
  color: var(--color-primary, #3b5bdb);
}

.detail-section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.detail-empty {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 16px;
}

.detail-item-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 12px;
  background: var(--color-bg-subtle, #f7fafc);
  border-radius: 8px;
  gap: 12px;
}

.detail-item-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item-type {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.detail-item-name {
  font-size: 13px;
  color: var(--color-text-primary);
}

.detail-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.detail-item-amount {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.detail-item-memo {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.detail-confirmed-info {
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: right;
}

.form-feedback.error {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-danger, #e53e3e);
}
</style>
