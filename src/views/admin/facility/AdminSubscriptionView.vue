<script setup>
// UI-650 관리자 구독 현황 — 세대별 구독 목록 + 상세 모달
import { computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore.js'
import facilityApi from '@/api/facilityApi.js'
import AdminTable from '@/components/admin/AdminTable.vue'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const PAGE_SIZE = 10

const state = reactive({
  list: [],
  loading: false,
  errorMessage: '',
  currentPage: 1,
  filter: {
    buildingNo: '',
    unitNo: '',
  },
})

const detailModal = reactive({
  show: false,
  loading: false,
  data: null,
})

const confirmModal = reactive({
  show: false,
  subscriptionId: null,
  facilityName: '',
  householdLabel: '',
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

const filteredList = computed(() => {
  let result = state.list
  const b = state.filter.buildingNo.trim()
  const u = state.filter.unitNo.trim()
  if (b) result = result.filter((h) => h.buildingNo?.includes(b))
  if (u) result = result.filter((h) => h.unitNo?.includes(u))
  return result
})

watch(
  () => [state.filter.buildingNo, state.filter.unitNo],
  () => { state.currentPage = 1 },
)

const resetFilter = () => {
  state.filter.buildingNo = ''
  state.filter.unitNo = ''
  state.currentPage = 1
}

const goToReservationList = () => router.push('/admin/reservations/list')

const summaryItems = computed(() => [
  { label: '구독 세대', value: state.list.length, unit: '세대' },
  { label: '구독 중', value: state.list.reduce((s, h) => s + h.activeCount, 0), unit: '건' },
  { label: '해지', value: state.list.reduce((s, h) => s + h.cancelledCount, 0), unit: '건' },
])

const columns = [
  { key: 'no', label: '번호' },
  { key: 'location', label: '동/호' },
  { key: 'activeCount', label: '구독 중' },
  { key: 'cancelledCount', label: '해지' },
]

const allRows = computed(() =>
  filteredList.value.map((h, i) => ({
    ...h,
    no: i + 1,
    location: `${h.buildingNo}동 ${h.unitNo}호`,
  })),
)

const totalPages = computed(() => Math.max(1, Math.ceil(allRows.value.length / PAGE_SIZE)))

const pagedRows = computed(() => {
  const start = (state.currentPage - 1) * PAGE_SIZE
  return allRows.value.slice(start, start + PAGE_SIZE)
})

const goToPage = (page) => { state.currentPage = page }

// 세대별 구독 목록 조회
const fetchList = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const res = await facilityApi.getAdminHouseholdSubscriptionList()
    state.list = Array.isArray(res) ? res : []
  } catch (e) {
    state.errorMessage = e?.response?.data?.message || '목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

// 세대 상세 조회
const openDetail = async (row) => {
  detailModal.show = true
  detailModal.loading = true
  detailModal.data = null
  try {
    detailModal.data = await facilityApi.getAdminHouseholdSubscriptionDetail(row.householdId)
  } catch {
    detailModal.show = false
  } finally {
    detailModal.loading = false
  }
}

const closeDetail = () => {
  detailModal.show = false
  detailModal.data = null
}

// 관리자 구독 강제 해지 확인 모달 열기
const openCancelModal = (sub) => {
  confirmModal.subscriptionId = sub.subscriptionId
  confirmModal.facilityName = sub.facilityName
  confirmModal.householdLabel = detailModal.data
    ? `${detailModal.data.buildingNo}동 ${detailModal.data.unitNo}호`
    : ''
  confirmModal.show = true
}

const closeConfirmModal = () => { confirmModal.show = false }

// 관리자 구독 강제 해지 실행
const handleCancelConfirm = async () => {
  confirmModal.show = false
  try {
    await facilityApi.adminCancelSubscription(confirmModal.subscriptionId)
    const updated = await facilityApi.getAdminHouseholdSubscriptionDetail(detailModal.data.householdId)
    detailModal.data = updated
    await fetchList()
    openResultModal({
      type: 'success',
      title: '구독이 해지되었습니다.',
      itemName: confirmModal.facilityName,
      actionLabel: '관리자 해지',
      time: getCurrentTimeText(),
      actor: getCurrentActorName(),
    })
  } catch (e) {
    openResultModal({
      type: 'error',
      title: '해지할 수 없습니다.',
      subtitle: e?.response?.data?.message || '오류가 발생했습니다.',
    })
  }
}

// resultModal 헬퍼
function getCurrentTimeText() {
  return new Date().toLocaleString('ko-KR', { hour12: false })
}

function getCurrentActorName() {
  return authStore.name || authStore.email || '관리자'
}

function openResultModal({ type, title, subtitle = '', desc = '', itemName = '', time = '', actionLabel = '', actor = '', afterConfirm = null }) {
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

async function handleResultConfirm() {
  const callback = resultModal.afterConfirm
  resultModal.show = false
  resultModal.afterConfirm = null
  if (callback) await callback()
}

// 요금 방식 한글 변환
const feeTypeLabel = (t) => {
  if (!t) return '-'
  if (t === 'FLAT') return '월정액'
  if (t === 'PER_PERSON') return '인당 정액'
  if (t === 'PER_USE') return '건당 요금'
  return t
}

const formatDate = (d) => (d ? String(d).replaceAll('-', '.') : '-')

// PER_USE 여부
const isPerUse = (sub) => sub.feeType === 'PER_USE'

// 구독 활성 여부
const isActiveSub = (sub) => sub.status === '구독중' || sub.status === 'ACTIVE'

// 상태 레이블: PER_USE는 구독 아닌 이용 개념으로 표시
const subStatusLabel = (sub) => {
  if (isPerUse(sub)) return isActiveSub(sub) ? '이용 중' : '이용 완료'
  return isActiveSub(sub) ? '구독 중' : '해지'
}

// 상태 뱃지 클래스
const subStatusClass = (sub) => {
  if (isPerUse(sub)) return isActiveSub(sub) ? 'badge--usage' : 'badge--done'
  return isActiveSub(sub) ? 'badge--active' : 'badge--cancelled'
}

// 날짜 텍스트: 구독 중/해지/PER_USE 각각 다르게 표시
const subDateText = (sub) => {
  if (isPerUse(sub)) {
    return formatDate(sub.subscribedAt) + ' 이용 등록'
  }
  if (!isActiveSub(sub) && sub.cancelledAt) {
    return formatDate(sub.subscribedAt) + ' ~ ' + formatDate(sub.cancelledAt)
  }
  return formatDate(sub.subscribedAt) + ' 구독 시작'
}

// 요금 표시: PER_PERSON은 /인 단위로 표시
const feeDisplay = (sub) => {
  if (sub.baseFee == null) return '-'
  const price = Number(sub.baseFee).toLocaleString('ko-KR')
  if (sub.feeType === 'PER_PERSON') return `${price}원/인`
  return `${price}원`
}

onMounted(() => fetchList())
</script>

<template>
  <div class="subscription-view">
    <!-- 상단 통계 카드 -->
    <StatsCards :stats="summaryItems" />

    <section class="card-shell">
      <!-- 필터바 -->
      <div class="filter-row">
        <AdminFilterBar class="filter-bar-inner" @reset="resetFilter">
          <div class="search-wrap">
            <input
              v-model="state.filter.buildingNo"
              class="search-input"
              type="text"
              placeholder="동 검색"
            />
          </div>
          <div class="search-wrap">
            <input
              v-model="state.filter.unitNo"
              class="search-input"
              type="text"
              placeholder="호 검색"
            />
          </div>
        </AdminFilterBar>
        <div class="filter-actions">
          <button class="btn-go-reservation" type="button" @click="goToReservationList">
            예약현황 →
          </button>
        </div>
      </div>

      <!-- 목록 테이블 -->
      <div v-if="state.loading" class="empty-box">목록을 불러오는 중...</div>
      <div v-else-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

      <template v-else>
        <AdminTable
          :columns="columns"
          :rows="pagedRows"
          row-clickable
          @row-click="openDetail"
        >
          <template #cell-activeCount="{ value }">
            <span v-if="value > 0" class="badge badge--active">{{ value }}건</span>
            <span v-else class="badge-zero">-</span>
          </template>
          <template #cell-cancelledCount="{ value }">
            <span v-if="value > 0" class="badge badge--cancelled">{{ value }}건</span>
            <span v-else class="badge-zero">-</span>
          </template>
        </AdminTable>

        <AppPagination
          :currentPage="state.currentPage"
          :maxPage="totalPages"
          :totalAll="state.list.length"
          :totalFiltered="filteredList.length"
          unit="세대"
          @change="goToPage"
        />
      </template>
    </section>

    <!-- 세대 구독 상세 모달 -->
    <BaseModal
      :visible="detailModal.show"
      :title="detailModal.data ? `${detailModal.data.buildingNo}동 ${detailModal.data.unitNo}호` : '상세 정보'"
      subtitle="구독 현황"
      @close="closeDetail"
    >
      <div v-if="detailModal.loading" class="detail-loading">불러오는 중...</div>
      <div v-else-if="detailModal.data" class="detail-body">

        <!-- 세대원 섹션 -->
        <div class="detail-section">
          <p class="detail-section-title">세대원</p>
          <div class="member-list">
            <div
              v-for="(m, i) in detailModal.data.members"
              :key="i"
              class="member-chip"
              :class="{ 'is-primary': m.isPrimary }"
            >
              <span class="member-name">{{ m.name }}</span>
              <span class="member-role">{{ m.isPrimary ? '세대주' : '세대원' }}</span>
            </div>
            <div v-if="detailModal.data.members.length === 0" class="empty-text">세대원 정보 없음</div>
          </div>
        </div>

        <div class="detail-divider" />

        <!-- 구독 시설 섹션 -->
        <div class="detail-section">
          <p class="detail-section-title">구독 시설 ({{ detailModal.data.subscriptions.length }}건)</p>
          <div class="sub-list">
            <div
              v-for="sub in detailModal.data.subscriptions"
              :key="sub.subscriptionId"
              class="sub-item"
              :class="{ 'is-cancelled': sub.status !== 'ACTIVE' && sub.status !== '구독중' }"
            >
              <div class="sub-item__info">
                <div class="sub-item__name">{{ sub.facilityName }}</div>
                <div class="sub-item__meta">
                  <span class="meta-tag">{{ feeTypeLabel(sub.feeType) }}</span>
                  <span class="meta-fee">{{ feeDisplay(sub) }}</span>
                  <span class="meta-date">{{ subDateText(sub) }}</span>
                </div>
              </div>
              <div class="sub-item__right">
                <span :class="['status-badge', subStatusClass(sub)]">
                  {{ subStatusLabel(sub) }}
                </span>
                <button
                  v-if="!isPerUse(sub) && isActiveSub(sub)"
                  class="btn-cancel"
                  type="button"
                  @click="openCancelModal(sub)"
                >
                  해지
                </button>
              </div>
            </div>
            <div v-if="detailModal.data.subscriptions.length === 0" class="empty-text">구독 내역 없음</div>
          </div>
        </div>
      </div>
    </BaseModal>

    <!-- 해지 확인 모달 (부모 레벨) -->
    <ConfirmModal
      :visible="confirmModal.show"
      title="구독을 해지하시겠습니까?"
      :subtitle="`${confirmModal.householdLabel} · ${confirmModal.facilityName}`"
      subtitle-color="#e53e3e"
      item-label="시설"
      :item-name="confirmModal.facilityName"
      action-label="구독"
      action-text="관리자 해지"
      :extra-value="confirmModal.householdLabel"
      extra-label="세대"
      confirm-text="해지하기"
      cancel-text="취소"
      confirm-type="danger"
      @confirm="handleCancelConfirm"
      @cancel="closeConfirmModal"
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
      @confirm="handleResultConfirm"
    />
  </div>
</template>

<style scoped>
.subscription-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card-shell {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

/* 필터바 행 */
.filter-row {
  display: flex;
  align-items: stretch;
}

.filter-bar-inner {
  flex: 1;
}

.filter-actions {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 7px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13px;
  color: #1a202c;
  background: #ffffff;
  width: 100px;
  outline: none;
  font-family: inherit;
}

.search-input:focus {
  border-color: #a0aec0;
}

.btn-go-reservation {
  padding: 7px 14px;
  background: var(--color-primary);
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-primary-contrast);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.btn-go-reservation:hover {
  opacity: 0.85;
}

/* 뱃지 */
.badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.badge--active {
  background: #ebfbee;
  color: #4d8b5a;
}

.badge--cancelled {
  background: #f5f6f8;
  color: #687282;
}

.badge--usage {
  background: #eff6ff;
  color: #3b82f6;
}

.badge--done {
  background: #f5f6f8;
  color: #94a3b8;
}

.badge-zero {
  color: #cbd5e1;
  font-size: 13px;
}

/* 로딩/에러 박스 */
.empty-box {
  padding: 40px;
  text-align: center;
  color: #7b8ea8;
  font-size: 13px;
}

.error-box {
  padding: 14px 20px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
}

/* 상세 모달 */
.detail-loading {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail-section {
  padding: 18px 20px;
}

.detail-section-title {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px 0;
}

.detail-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0;
}

/* 세대원 */
.member-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
}

.member-chip.is-primary {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.member-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a202c;
}

.member-role {
  font-size: 11px;
  color: #94a3b8;
}

.member-chip.is-primary .member-role {
  color: #3b82f6;
}

/* 구독 목록 */
.sub-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.sub-item.is-cancelled {
  opacity: 0.55;
}

.sub-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-item__name {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
}

.sub-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  padding: 1px 6px;
  background: #e2e8f0;
  border-radius: 4px;
  font-size: 11px;
  color: #4a5568;
  font-weight: 600;
}

.meta-fee {
  font-size: 12px;
  font-weight: 700;
  color: #2b3a55;
}

.meta-date {
  font-size: 11px;
  color: #94a3b8;
}

.sub-item__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

/* 해지 버튼 */
.btn-cancel {
  padding: 4px 10px;
  background: transparent;
  border: 1.5px solid #e53e3e;
  color: #e53e3e;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.btn-cancel:hover {
  background: #fff5f5;
}

.empty-text {
  font-size: 13px;
  color: #94a3b8;
  padding: 8px 0;
}
</style>
