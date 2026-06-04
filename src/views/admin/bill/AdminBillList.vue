<script setup>
import { computed, inject, onBeforeUnmount, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBillStore } from '@/stores/useBillStore'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const authStore = useAuthStore()
const billStore = useBillStore()
const registerOpenModal = inject('registerOpenModal', null)

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
    pageSize: 10,
  },
  modals: {
    detail: false,
    confirmBill: false,
    unconfirmBill: false,
    billSetting: false,
  },
  billSettingForm: {
    baseFee: '',
    sendDay: '',
    dueDay: '',
    homeDisplayEndDay: '',
    lateFeeRate: '',
    isActive: true,
    billYear: new Date().getFullYear(),
    billMonth: new Date().getMonth() + 1,
  },
  billSettingSubmitting: false,
  billSettingError: '',
  billSettingEditing: false,
  policyLoading: false,
  policyError: '',
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
  { key: 'number', label: 'ID' },
  { key: 'address', label: '세대' },
  { key: 'billPeriod', label: '청구년월' },
  { key: 'baseFeeLabel', label: '기본관리비' },
  { key: 'vehicleFeeLabel', label: '차량비용' },
  { key: 'facilityFeeLabel', label: '시설이용비' },
  { key: 'visitorFeeLabel', label: '방문차량' },
  { key: 'totalFeeLabel', label: '총액' },
  { key: 'payableAmountLabel', label: '납부금액' },
  { key: 'sendDateLabel', label: '발송일' },
  { key: 'dueDateLabel', label: '납기일' },
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
const currentPolicy = computed(() => billStore.basicBillPolicy)

const summaryItems = computed(() => {
  const total = billStore.bills?.totalBillCount ?? totalElements.value
  const draft = billStore.bills?.draftCount ?? bills.value.filter((b) => b.status === 'DRAFT').length
  const confirmed = billStore.bills?.confirmedCount ?? bills.value.filter((b) => b.status === 'CONFIRMED').length
  const selectedMonth = state.filters.billMonth ? `${state.filters.billMonth}월` : '전체 월'
  return [
    { label: '청구 미확정', value: draft, unit: '건', desc: '확정 전 청구', descClass: 'warning' },
    { label: '청구 확정', value: confirmed, unit: '건', desc: '입주민 공개 대상', descClass: 'success' },
    { label: '전체 청구', value: total, unit: '건', desc: '선택 기간 기준', descClass: '' },
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
  { value: 'DRAFT', label: '청구 미확정' },
  { value: 'CONFIRMED', label: '청구 확정' },
]

const pagedBills = computed(() =>
  bills.value.map((b, index) => ({
    ...b,
    number: (state.pagination.currentPage - 1) * state.pagination.pageSize + index + 1,
    address: `${b.building ?? '-'}동 ${b.unit ?? '-'}호`,
    billPeriod: `${b.billYear ?? '-'}년 ${b.billMonth ?? '-'}월`,
    baseFeeLabel: formatFee(b.baseFee),
    vehicleFeeLabel: formatFee(b.vehicleFee),
    facilityFeeLabel: formatFee(b.facilityFee),
    visitorFeeLabel: formatFee(b.visitorFee),
    totalFeeLabel: formatFee(b.totalFee),
    payableAmountLabel: formatFee(b.payableAmount ?? b.totalFee),
    sendDateLabel: formatDate(b.sendDate),
    dueDateLabel: formatDate(b.dueDate),
    statusLabel: billStatusLabel(b.status),
  })),
)

const detailItems = computed(() => {
  const d = billDetail.value
  if (!d?.items) return []
  return d.items
})

function billStatusLabel(s) {
  return { DRAFT: '청구 미확정', CONFIRMED: '청구 확정', '임시계산': '청구 미확정', '확정완료': '청구 확정' }[s] ?? s ?? '-'
}

function billStatusVariant(s) {
  return { DRAFT: 'warning', CONFIRMED: 'success', '임시계산': 'warning', '확정완료': 'success' }[s] ?? 'neutral'
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

function formatDay(value, prefix = '매월') {
  if (value == null || value === '') return '-'
  return `${prefix} ${value}일`
}

function formatUpdatedAt(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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

async function loadPolicy() {
  state.policyLoading = true
  state.policyError = ''
  try {
    await billStore.fetchBasicBillPolicy()
  } catch (e) {
    state.policyError = getErrorMessage(e, '관리비 정책을 불러오지 못했습니다.')
  } finally {
    state.policyLoading = false
  }
}

function handleSearch() {
  if (searchInputTimer) window.clearTimeout(searchInputTimer)
  state.pagination.currentPage = 1
  loadBills()
}

let searchInputTimer
function scheduleSearch() {
  if (searchInputTimer) window.clearTimeout(searchInputTimer)
  searchInputTimer = window.setTimeout(() => {
    handleSearch()
  }, 300)
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

function openBillSettingModal() {
  if (!currentPolicy.value) {
    resetBillSettingForm()
    state.billSettingEditing = true
  } else {
    state.billSettingEditing = false
  }
  state.billSettingError = ''
  state.modals.billSetting = true
}

function resetBillSettingForm() {
  state.billSettingForm.baseFee = ''
  state.billSettingForm.sendDay = ''
  state.billSettingForm.dueDay = ''
  state.billSettingForm.homeDisplayEndDay = ''
  state.billSettingForm.lateFeeRate = ''
  state.billSettingForm.isActive = true
  state.billSettingForm.billYear = new Date().getFullYear()
  state.billSettingForm.billMonth = new Date().getMonth() + 1
}

function fillBillSettingForm() {
  const policy = currentPolicy.value
  state.billSettingForm.baseFee = policy?.baseFee != null ? Math.round(Number(policy.baseFee) / 10000) : ''
  state.billSettingForm.sendDay = policy?.sendDay ?? ''
  state.billSettingForm.dueDay = policy?.dueDay ?? ''
  state.billSettingForm.homeDisplayEndDay = policy?.homeDisplayEndDay ?? ''
  state.billSettingForm.lateFeeRate = policy?.lateFeeRate ?? ''
  state.billSettingForm.isActive = policy?.isActive ?? true
  state.billSettingForm.billYear = new Date().getFullYear()
  state.billSettingForm.billMonth = new Date().getMonth() + 1
  state.billSettingError = ''
  state.billSettingEditing = true
}

function cancelBillSettingEdit() {
  const policy = currentPolicy.value
  state.billSettingForm.baseFee = policy?.baseFee != null ? Math.round(Number(policy.baseFee) / 10000) : ''
  state.billSettingForm.sendDay = policy?.sendDay ?? ''
  state.billSettingForm.dueDay = policy?.dueDay ?? ''
  state.billSettingForm.homeDisplayEndDay = policy?.homeDisplayEndDay ?? ''
  state.billSettingForm.lateFeeRate = policy?.lateFeeRate ?? ''
  state.billSettingForm.isActive = policy?.isActive ?? true
  state.billSettingForm.billYear = new Date().getFullYear()
  state.billSettingForm.billMonth = new Date().getMonth() + 1
  state.billSettingError = ''
  state.billSettingEditing = false
}
async function handleBillSettingSubmit() {
  if (state.billSettingSubmitting) return
  if (!state.billSettingForm.baseFee || !state.billSettingForm.sendDay || !state.billSettingForm.dueDay || !state.billSettingForm.homeDisplayEndDay || !state.billSettingForm.billYear || !state.billSettingForm.billMonth) {
    state.billSettingError = '필수 항목을 모두 입력해주세요.'
    return
  }
  state.billSettingSubmitting = true
  state.billSettingError = ''
  try {
    await billStore.saveBasicBillPolicy({
      baseFee: Number(state.billSettingForm.baseFee) * 10000,
      sendDay: Number(state.billSettingForm.sendDay),
      dueDay: Number(state.billSettingForm.dueDay),
      homeDisplayEndDay: Number(state.billSettingForm.homeDisplayEndDay),
      lateFeeRate: state.billSettingForm.lateFeeRate ? Number(state.billSettingForm.lateFeeRate) : 0,
      isActive: state.billSettingForm.isActive,
    })
    if (state.billSettingForm.isActive) {
      await billStore.reflectBaseFee({
        billYear: Number(state.billSettingForm.billYear),
        billMonth: Number(state.billSettingForm.billMonth),
      })
    }
    await loadPolicy()
    state.billSettingEditing = false
    state.modals.billSetting = false
    openResultModal({
      type: 'success',
      title: '관리비 정책이 저장되었습니다.',
      itemName: `${state.billSettingForm.billYear}년 ${state.billSettingForm.billMonth}월`,
      actionLabel: '관리비 정책 저장',
      afterConfirm: async () => { await loadBills() },
    })
  } catch (e) {
    state.billSettingError = getErrorMessage(e, '정책 저장에 실패했습니다.')
  } finally {
    state.billSettingSubmitting = false
  }
}

onMounted(() => {
  if (registerOpenModal) registerOpenModal(openBillSettingModal)
  loadPolicy()
  loadBills()
})

onBeforeUnmount(() => {
  if (searchInputTimer) window.clearTimeout(searchInputTimer)
})
</script>

<template>
  <section class="manage-page">

    <StatsCards :stats="summaryItems" />

    <!-- 필터 / 목록 영역 -->
    <div class="card-shell">
      <template v-if="currentPolicy && !currentPolicy.isActive">
        <div class="policy-inactive-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p class="policy-inactive-state__title">관리비 정책이 비활성 상태입니다.</p>
          <p class="policy-inactive-state__desc">정책을 활성화하면 청구 내역을 조회하고 관리할 수 있습니다.</p>
        </div>
      </template>

      <template v-else>
        <AdminFilterBar @search="handleSearch" @reset="handleReset">
          <select v-model="state.filters.billYear" class="filter-select" @change="handleSearch">
            <option v-for="opt in yearOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <select v-model="state.filters.billMonth" class="filter-select" @change="handleSearch">
            <option v-for="opt in monthOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <select v-model="state.filters.status" class="filter-select" @change="handleSearch">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input
            v-model="state.filters.building"
            class="filter-input"
            placeholder="동 검색 (예: 101)"
            @input="scheduleSearch"
            @keyup.enter="handleSearch"
          />
          <input
            v-model="state.filters.unit"
            class="filter-input"
            placeholder="호수 검색 (예: 101)"
            @input="scheduleSearch"
            @keyup.enter="handleSearch"
          />
        </AdminFilterBar>

        <div class="manage-page__table-shell">
          <div v-if="state.listLoading" class="table-feedback">불러오는 중...</div>
          <div v-else-if="state.errorMessage" class="table-feedback error">{{ state.errorMessage }}</div>
          <div v-else-if="pagedBills.length === 0" class="table-feedback">조회된 청구 내역이 없습니다.</div>
          <AdminTable
            v-else
            :columns="billColumns"
            :rows="pagedBills"
            @row-click="handleRowClick"
          >
            <template #cell-statusLabel="{ row }">
              <BaseBadge :variant="billStatusVariant(row.status)">{{ row.statusLabel }}</BaseBadge>
            </template>
          </AdminTable>
        </div>

        <div class="manage-page__pagination">
          <AppPagination
            v-if="!state.listLoading && totalElements > 0"
            :current-page="state.pagination.currentPage"
            :total-pages="totalPages"
            :total-all="totalElements"
            :total-filtered="pagedBills.length"
            unit="건"
            @change="handlePageChange"
          />
        </div>
      </template>
    </div>

    <!-- 상세 모달 -->
    <BaseModal
      :visible="state.modals.detail"
      title="관리비 상세 정보"
      @close="state.modals.detail = false"
    >
      <div v-if="state.detailLoading" class="table-feedback">불러오는 중...</div>
      <template v-else-if="billDetail">
        <div class="detail-hero">
          <div class="detail-address-row">
            <h2 class="detail-address">{{ billDetail.building }}동 {{ billDetail.unit }}호</h2>
            <BaseBadge :variant="billStatusVariant(billDetail.status)">{{ billStatusLabel(billDetail.status) }}</BaseBadge>
          </div>
          <p class="detail-sub">{{ billDetail.billYear }}년 {{ billDetail.billMonth }}월 청구</p>
        </div>
        <div class="detail-divider" />

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
          <div v-if="billDetail.overdue" class="detail-fee-item detail-fee-item--overdue">
            <span class="detail-fee-label">연체료</span>
            <span class="detail-fee-value detail-fee-value--overdue">{{ formatFee(billDetail.lateFee) }}</span>
          </div>
          <div v-if="billDetail.overdue" class="detail-fee-item detail-fee-item--total">
            <span class="detail-fee-label">납부금액 (연체 포함)</span>
            <span class="detail-fee-value detail-fee-value--total">{{ formatFee(billDetail.payableAmount) }}</span>
          </div>
        </div>

        <div class="detail-schedule">
          <div class="detail-schedule-item">
            <span class="detail-schedule-label">발송일</span>
            <span class="detail-schedule-value">{{ formatDate(billDetail.sendDate) }}</span>
          </div>
          <div class="detail-schedule-item">
            <span class="detail-schedule-label">납기일</span>
            <span class="detail-schedule-value">{{ formatDate(billDetail.dueDate) }}</span>
          </div>
          <div v-if="billDetail.overdue" class="detail-schedule-item detail-schedule-item--overdue">
            <span class="detail-schedule-label">연체 시작일</span>
            <span class="detail-schedule-value">{{ formatDate(billDetail.overdueStartDate) }}</span>
          </div>
        </div>
        <div class="detail-divider" />

        <div class="detail-section-title">청구 항목 상세</div>
        <div v-if="detailItems.length === 0" class="table-feedback">등록된 항목이 없습니다.</div>
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

        <div v-if="billDetail.confirmedAt" class="detail-confirmed-info">
          확정일시 : {{ formatDate(billDetail.confirmedAt) }}
        </div>
        <p v-if="state.actionError" class="form-error">{{ state.actionError }}</p>
      </template>

      <template #footer>
        <template v-if="billDetail">
          <button
            v-if="billDetail.status === '확정완료'"
            type="button"
            class="page-button page-button--ghost"
            @click="state.modals.unconfirmBill = true"
          >확정 취소</button>
          <button
            v-if="billDetail.status === '임시계산'"
            type="button"
            class="page-button page-button--primary"
            @click="state.modals.confirmBill = true"
          >확정 처리</button>
        </template>
        <button type="button" class="page-button page-button--ghost" @click="state.modals.detail = false">닫기</button>
      </template>
    </BaseModal>

    <!-- 확정 확인 모달 -->
    <ConfirmModal
      :visible="state.modals.confirmBill"
      title="관리비 확정 처리를 진행하시겠습니까?"
      subtitle="확정하면 입주민에게 공개됩니다. 발송일에 맞게 설정해주세요."
      item-label="청구"
      :item-name="`${state.selectedBill?.building ?? ''}동 ${state.selectedBill?.unit ?? ''}호 ${state.selectedBill?.billYear ?? ''}년 ${state.selectedBill?.billMonth ?? ''}월`"
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
      title="확정 취소 처리를 진행하시겠습니까?"
      subtitle="확정 취소 시 입주민에게 공개되지 않습니다."
      item-label="청구"
      :item-name="`${state.selectedBill?.building ?? ''}동 ${state.selectedBill?.unit ?? ''}호 ${state.selectedBill?.billYear ?? ''}년 ${state.selectedBill?.billMonth ?? ''}월`"
      action-text="확정 취소"
      confirm-text="취소 처리"
      cancel-text="닫기"
      confirm-type="danger"
      @confirm="handleUnconfirmBill"
      @cancel="state.modals.unconfirmBill = false"
    />

    <!-- 관리비 정책 설정 모달 -->
    <BaseModal
      :visible="state.modals.billSetting"
      title="관리비 정책 설정"
      @close="state.modals.billSetting = false"
    >
      <p class="bill-setting-desc">기본 관리비 정책을 설정합니다. 저장하면 해당 월 청구서에 즉시 반영됩니다.</p>

      <div v-if="state.billSettingEditing" class="form-grid">
        <label class="form-field">
          <span>기본 관리비<em class="required">*</em></span>
          <div class="form-field-row">
            <input v-model="state.billSettingForm.baseFee" type="number" min="0" placeholder="(예: 10)" />
            <span class="form-field-unit">만원</span>
          </div>
        </label>

        <label class="form-field">
          <span>연체료율</span>
          <div class="form-field-row">
            <input v-model="state.billSettingForm.lateFeeRate" type="number" min="0" placeholder="(예: 5)" />
            <span class="form-field-unit">%</span>
          </div>
        </label>

        <label class="form-field">
          <span>고지서 발송일<em class="required">*</em></span>
          <div class="form-field-row">
            <span class="form-field-prefix">매월</span>
            <input v-model="state.billSettingForm.sendDay" type="number" min="1" max="31" placeholder="(예: 25)" />
            <span class="form-field-unit">일</span>
          </div>
        </label>

        <label class="form-field">
          <span>납기일<em class="required">*</em></span>
          <div class="form-field-row">
            <span class="form-field-prefix">매월</span>
            <input v-model="state.billSettingForm.dueDay" type="number" min="1" max="31" placeholder="(예: 31)" />
            <span class="form-field-unit">일</span>
          </div>
        </label>

        <label class="form-field">
          <span>홈 화면 노출 종료일<em class="required">*</em></span>
          <div class="form-field-row">
            <span class="form-field-prefix">{{ state.billSettingForm.dueDay && state.billSettingForm.homeDisplayEndDay ? (Number(state.billSettingForm.homeDisplayEndDay) > Number(state.billSettingForm.dueDay) ? '당월' : '익월') : '' }}</span>
            <input v-model="state.billSettingForm.homeDisplayEndDay" type="number" min="1" max="31" placeholder="(예: 5)" />
            <span class="form-field-unit">일</span>
          </div>
        </label>

        <label class="form-field">
          <span>활성 상태</span>
          <select v-model="state.billSettingForm.isActive">
            <option :value="true">활성</option>
            <option :value="false">비활성</option>
          </select>
        </label>

        <label class="form-field form-field--full">
          <span>반영 월<em class="required">*</em></span>
          <div class="form-field-row">
            <select v-model="state.billSettingForm.billYear">
              <option v-for="opt in yearOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <select v-model="state.billSettingForm.billMonth">
              <option v-for="opt in monthOptions.filter(o => o.value !== '')" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </label>
      </div>

      <p v-if="state.billSettingEditing" class="bill-setting-required-note">* 표시 항목은 필수입력 사항입니다.</p>
      <p v-if="state.billSettingError" class="form-error">{{ state.billSettingError }}</p>

      <div class="modal-policy-section">
        <div class="modal-policy-header">
          <div>
            <h3>현재 설정된 기본 정책</h3>
            <p>현재 적용 중인 정책입니다. 수정하려면 수정하기를 눌러주세요.</p>
          </div>
          <button
            v-if="currentPolicy"
            type="button"
            :class="['page-button', state.billSettingEditing ? 'page-button--ghost' : 'page-button--primary']"
            @click="state.billSettingEditing ? cancelBillSettingEdit() : fillBillSettingForm()"
          >
            {{ state.billSettingEditing ? '\uCDE8\uC18C' : '\uC218\uC815\uD558\uAE30' }}
          </button>
        </div>

        <div v-if="state.policyLoading" class="table-feedback">현재 기본 관리비 정책을 불러오는 중..</div>
        <div v-else-if="state.policyError" class="table-feedback error">{{ state.policyError }}</div>
        <div v-else-if="!currentPolicy" class="policy-empty">설정된 기본 관리비 정책이 없습니다.</div>
        <div v-else class="policy-grid">
          <div class="policy-item">
            <span>기본 관리비</span>
            <strong>{{ formatFee(currentPolicy.baseFee) }}</strong>
          </div>
          <div class="policy-item">
            <span>발송일</span>
            <strong>{{ formatDay(currentPolicy.sendDay) }}</strong>
          </div>
          <div class="policy-item">
            <span>납기일</span>
            <strong>{{ formatDay(currentPolicy.dueDay) }}</strong>
          </div>
          <div class="policy-item">
            <span>홈 노출 종료일</span>
            <strong>{{ currentPolicy.homeDisplayEndDay > currentPolicy.dueDay ? '당월' : '익월' }} {{ currentPolicy.homeDisplayEndDay }}일</strong>
          </div>
          <div class="policy-item">
            <span>연체료율(%)</span>
            <strong>{{ currentPolicy.lateFeeRate ?? 0 }}%</strong>
          </div>
          <div class="policy-item">
            <span>마지막 수정일</span>
            <strong>{{ formatUpdatedAt(currentPolicy.updatedAt) }}</strong>
          </div>
          <div :class="['policy-item', 'policy-item--full', currentPolicy.isActive ? 'policy-item--active' : 'policy-item--inactive']">
            <span>활성 상태</span>
            <strong>{{ currentPolicy.isActive ? '✓ 활성' : '✕ 비활성' }}</strong>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="page-button page-button--ghost" @click="state.modals.billSetting = false">닫기</button>
        <button
          v-if="state.billSettingEditing"
          type="button"
          class="page-button page-button--primary"
          :disabled="state.billSettingSubmitting"
          @click="handleBillSettingSubmit"
        >
          {{ state.billSettingSubmitting ? '저장 중..' : '저장하기' }}
        </button>
      </template>
    </BaseModal>

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
      @close="handleResultConfirm"
    />
  </section>
</template>

<style scoped>
.manage-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.policy-card {
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  background: #FFFFFF;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.policy-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.policy-card__title {
  margin: 0;
  color: var(--admin-deep-text);
  font-size: 16px;
  font-weight: 700;
}

.policy-card__desc {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.policy-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.policy-item {
  display: grid;
  gap: 6px;
  min-height: 68px;
  padding: 12px;
  border: 1px solid #E2E8F0;
  border-radius: var(--radius-8);
  background: var(--admin-base-gray);
}

.policy-item span {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.policy-item strong {
  color: var(--admin-deep-text);
  font-size: 14px;
  font-weight: 700;
}

.policy-item--full {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: unset;
  padding: 8px 12px;
}

.policy-item--active {
  background: #F0FFF4;
  border-color: #9AE6B4;
}

.policy-item--active strong {
  color: #276749;
}

.policy-item--inactive {
  background: #FFF5F5;
  border-color: #FEB2B2;
}

.policy-item--inactive strong {
  color: var(--admin-danger);
}


.policy-inactive-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px 20px;
  text-align: center;
}

.policy-inactive-state__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--admin-deep-text);
  margin: 0;
}

.policy-inactive-state__desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.policy-empty {
  padding: 24px;
  border: 1px dashed #CBD5E1;
  border-radius: var(--radius-8);
  color: var(--text-secondary);
  text-align: center;
  font-size: 14px;
}

.card-shell {
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  background: #FFFFFF;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

/* 필터 입력 요소 */
.filter-select,
.filter-input {
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--admin-light-gray);
  border-radius: var(--radius-8);
  background: #fff;
  font-size: 13px;
  color: var(--admin-deep-text);
  min-width: 100px;
}

/* 테이블 */
.manage-page__table-shell {
  background: #FFFFFF;
}

.manage-page__pagination {
  padding: 0 20px 20px;
}

/* 피드백 */
.table-feedback {
  padding: 32px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.table-feedback.error {
  color: var(--admin-danger);
}

/* 상세 모달 */
.detail-hero {
  margin: 0 0 14px;
}

.detail-address-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.detail-address {
  font-size: 20px;
  font-weight: 700;
  color: var(--admin-deep-text);
  margin: 0;
}

.detail-sub {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.detail-divider {
  height: 1px;
  background: var(--admin-light-gray);
  margin: 16px 0;
}

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
  background: var(--admin-base-gray);
  border-radius: var(--radius-8);
  font-size: 13px;
}

.detail-fee-item--total {
  grid-column: 1 / -1;
  background: #EEF2FF;
  border: 1px solid #C7D2FE;
}

.detail-fee-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-fee-value {
  font-weight: 600;
  color: var(--admin-deep-text);
}

.detail-fee-value--total {
  font-size: 15px;
  color: var(--admin-main-navy);
}

.detail-section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--admin-deep-text);
  margin-bottom: 10px;
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
  background: var(--admin-base-gray);
  border-radius: var(--radius-8);
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
  color: var(--text-secondary);
}

.detail-item-name {
  font-size: 13px;
  color: var(--admin-deep-text);
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
  color: var(--admin-deep-text);
}

.detail-item-memo {
  font-size: 11px;
  color: var(--text-secondary);
}

.detail-fee-item--overdue {
  background: #FFF5F5;
  border: 1px solid #FED7D7;
}

.detail-fee-value--overdue {
  font-weight: 600;
  color: var(--admin-danger);
}

.detail-schedule {
  display: flex;
  gap: 8px;
  margin: 10px 0 0;
}

.detail-schedule-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--admin-base-gray);
  border-radius: var(--radius-8);
}

.detail-schedule-item--overdue {
  background: #FFF5F5;
  border: 1px solid #FED7D7;
}

.detail-schedule-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.detail-schedule-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-deep-text);
}

.detail-schedule-item--overdue .detail-schedule-value {
  color: var(--admin-danger);
}

.detail-confirmed-info {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

/* 관리비 정책 설정 모달 */
.bill-setting-desc {
  margin: 0 0 16px;
  font-size: var(--font-size-detail);
  color: var(--gray-600);
}

.modal-policy-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--admin-light-gray);
}

.modal-policy-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.modal-policy-header h3 {
  margin: 0;
  color: var(--admin-deep-text);
  font-size: 14px;
  font-weight: 700;
}

.modal-policy-header p {
  margin: 4px 0 0;
  color: var(--gray-600);
  font-size: var(--font-size-label);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-16);
}

.form-field {
  display: grid;
  gap: var(--space-8);
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field span {
  font-size: var(--font-size-label);
  color: var(--gray-600);
}

.form-field input,
.form-field select {
  height: 38px;
  padding: 0 var(--space-12);
  border: 1px solid var(--admin-light-gray);
  border-radius: var(--radius-8);
  background: var(--white);
  color: var(--admin-deep-text);
  font: inherit;
  font-size: var(--font-size-detail);
  outline: none;
  width: 100%;
}

.form-field input:focus,
.form-field select:focus {
  border-color: var(--admin-sub-blue);
}

.form-field-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.form-field-row input,
.form-field-row select {
  flex: 1;
  min-width: 0;
}

.form-field-prefix,
.form-field-unit {
  font-size: var(--font-size-detail);
  color: var(--gray-600);
  white-space: nowrap;
  flex-shrink: 0;
}

.required {
  color: var(--admin-danger);
  font-style: normal;
}

.bill-setting-required-note {
  margin: var(--space-12) 0 0;
  font-size: var(--font-size-label);
  color: var(--admin-danger);
}

/* page-button */
.page-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  height: 40px;
  padding: 0 var(--space-16);
  border-radius: var(--radius-8);
  font: inherit;
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-button--ghost {
  border: 1px solid var(--admin-light-gray);
  background: var(--white);
  color: var(--admin-deep-text);
}

.page-button--primary {
  border: none;
  background: var(--admin-sub-blue);
  color: var(--white);
}

.page-button--primary:hover:not(:disabled) {
  background: var(--admin-main-navy);
}

.form-error {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--admin-danger);
}
</style>
