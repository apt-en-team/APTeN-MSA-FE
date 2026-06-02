<script setup>
import { reactive, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useVoteStore } from '@/stores/useVoteStore'
import StatsCards from '@/components/admin/StatsCards.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const router = useRouter()
const voteStore = useVoteStore()

// AdminLayout의 + 투표 등록 버튼과 연결
const registerOpenModal = inject('registerOpenModal', null)
if (registerOpenModal) {
  registerOpenModal(() => router.push('/admin/votes/create'))
}

// ── 상태 ──────────────────────────────────────────────
const state = reactive({
  keyword: '',
  filterStatus: '',
  page: 1,
  size: 10,

  selectedVote: null,

  // 본문 상세 모달
  showBodyModal: false,

  // 확인/결과 모달
  showDeleteModal: false,
  showCloseModal: false,
  showResultModal: false,
  isSubmitting: false,
  resultModalData: { type: 'success', title: '', subtitle: '' },
})

// ── 계산값 ────────────────────────────────────────────
const votes = computed(() => voteStore.adminVotes?.content ?? [])
const totalPages = computed(() => voteStore.adminVotes?.totalPages ?? 1)
const totalElements = computed(() => Number(voteStore.adminVotes?.totalElements ?? 0))
const loading = computed(() => voteStore.loading)

const summaryItems = computed(() => {
  const s = voteStore.adminVotes?.summary
  return [
    { label: '총 투표', value: s?.total ?? 0, unit: '건', desc: '전체 등록 투표' },
    { label: '진행 중', value: s?.open ?? 0, unit: '건', desc: '현재 투표중', descClass: (s?.open ?? 0) > 0 ? 'success' : '' },
    { label: '시작 전', value: s?.ready ?? 0, unit: '건', desc: '투표 예정' },
    { label: '종료', value: s?.closed ?? 0, unit: '건', desc: '결과 확인 가능' },
  ]
})

const columns = [
  { key: 'no', label: 'No.' },
  { key: 'status', label: '상태' },
  { key: 'title', label: '제목' },
  { key: 'period', label: '기간' },
  { key: 'householdCount', label: '참여 세대' },
  { key: 'result', label: '찬/반' },
]

const tableRows = computed(() =>
  votes.value.map((v, i) => ({
    ...v,
    no: totalElements.value - ((state.page - 1) * state.size + i),
    period: `${formatDate(v.startAt)} ~ ${formatDate(v.endAt)}`,
    result: (v.status === 'CLOSED' || v.status === '종료')
      ? `찬 ${v.agreeCount ?? 0} / 반 ${v.disagreeCount ?? 0}`
      : '-',
  }))
)

// ── 도넛 차트 ──────────────────────────────────────────
const circumference = 2 * Math.PI * 52

const donutData = computed(() => {
  const v = state.selectedVote
  if (!v) return { agree: 0, disagree: 0, total: 0 }
  const agree = v.agreeCount ?? 0
  const disagree = v.disagreeCount ?? 0
  const total = agree + disagree
  if (total === 0) return { agree: 0, disagree: 0, total: 0 }
  return {
    agree: Math.round((agree / total) * 100),
    disagree: Math.round((disagree / total) * 100),
    total,
  }
})

const donutDasharray = computed(() => {
  if (donutData.value.total === 0) return `0 ${circumference}`
  const dominant = donutData.value.agree >= donutData.value.disagree
    ? donutData.value.agree
    : donutData.value.disagree
  const dominantLen = (dominant / 100) * circumference
  return `${dominantLen} ${circumference - dominantLen}`
})

const isTie = computed(() =>
  donutData.value.total > 0 && donutData.value.agree === donutData.value.disagree
)

const isDominantAgree = computed(() =>
  donutData.value.agree > donutData.value.disagree
)

const donutCenterText = computed(() => {
  if (donutData.value.total === 0) return '-'
  if (isTie.value) return '50%'
  return isDominantAgree.value ? `${donutData.value.agree}%` : `${donutData.value.disagree}%`
})

const donutCenterLabel = computed(() => {
  if (donutData.value.total === 0) return '데이터 없음'
  if (isTie.value) return '동률'
  return isDominantAgree.value ? '찬성' : '반대'
})

// ── API 호출 ──────────────────────────────────────────
const fetchVotes = async () => {
  await voteStore.fetchAdminVotes({
    page: state.page - 1,
    size: state.size,
    status: state.filterStatus || undefined,
    keyword: state.keyword || undefined,
  })
}

// ── 행 클릭 ──────────────────────────────────────────
const onRowClick = (row) => {
  state.selectedVote = row
}

// ── 수정 페이지 이동 ──────────────────────────────────
const goToEdit = () => {
  if (!state.selectedVote) return
  router.push(`/admin/votes/${state.selectedVote.voteId}/edit`)
}

// ── 투표 종료 ──────────────────────────────────────────
const onCloseVote = async () => {
  if (!state.selectedVote || state.isSubmitting) return
  state.isSubmitting = true
  try {
    await voteStore.closeVote(state.selectedVote.voteId)
    state.showCloseModal = false
    state.resultModalData = { type: 'success', title: '투표가 종료되었습니다.', subtitle: '결과를 확인하세요.' }
    state.showResultModal = true
    await fetchVotes()
    state.selectedVote = null
  } catch (e) {
    state.showCloseModal = false
    const code = e?.response?.data?.resultCode
    state.resultModalData = code === 'BRD_400_04'
      ? { type: 'warning', title: '종료할 수 없는 상태입니다.', subtitle: '이미 종료되었거나 시작 전인 투표입니다.' }
      : { type: 'danger', title: '종료에 실패했습니다.', subtitle: '다시 시도해주세요.' }
    state.showResultModal = true
  } finally {
    state.isSubmitting = false
  }
}

// ── 투표 삭제 ──────────────────────────────────────────
const onDeleteVote = async () => {
  if (!state.selectedVote || state.isSubmitting) return
  state.isSubmitting = true
  try {
    await voteStore.deleteVote(state.selectedVote.voteId)
    state.showDeleteModal = false
    state.resultModalData = { type: 'success', title: '투표가 삭제되었습니다.', subtitle: '' }
    state.showResultModal = true
    await fetchVotes()
    state.selectedVote = null
  } catch {
    state.showDeleteModal = false
    state.resultModalData = { type: 'danger', title: '삭제에 실패했습니다.', subtitle: '다시 시도해주세요.' }
    state.showResultModal = true
  } finally {
    state.isSubmitting = false
  }
}

// ── 기타 ──────────────────────────────────────────────
const onReset = () => {
  state.keyword = ''
  state.filterStatus = ''
  state.page = 1
  fetchVotes()
}

const onPageChange = (page) => {
  state.page = page
  fetchVotes()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const statusVariant = (status) => {
  if (status === 'OPEN' || status === '진행 중') return 'success'
  if (status === 'CLOSED' || status === '종료') return 'neutral'
  return 'info'
}

const statusLabel = (status) => {
  if (status === 'OPEN' || status === '진행 중') return '투표중'
  if (status === 'CLOSED' || status === '종료') return '결과 발표'
  return '시작 전'
}

onMounted(() => {
  fetchVotes()
})
</script>

<template>
  <div class="vote-manage">
    <StatsCards :stats="summaryItems" />

    <div class="vote-manage__body">
      <!-- 좌측: 목록 -->
      <section class="card-shell">
        <AdminFilterBar @reset="onReset">
          <input
            v-model="state.keyword"
            class="search-input"
            type="text"
            placeholder="제목 검색"
            @keyup.enter="fetchVotes"
          />
          <select
            v-model="state.filterStatus"
            class="filter-select"
            @change="() => { state.page = 1; fetchVotes() }"
          >
            <option value="">전체 상태</option>
            <option value="READY">시작 전</option>
            <option value="OPEN">투표중</option>
            <option value="CLOSED">종료</option>
          </select>
        </AdminFilterBar>

        <div v-if="loading" class="loading-wrap">
          <span class="dot" /><span class="dot" /><span class="dot" />
        </div>

        <AdminTable
          v-else
          :columns="columns"
          :rows="tableRows"
          :row-class="(row) => row.voteId === state.selectedVote?.voteId ? 'row--selected' : ''"
          @row-click="onRowClick"
        >
          <template #cell-status="{ row }">
            <BaseBadge :variant="statusVariant(row.status)">{{ statusLabel(row.status) }}</BaseBadge>
          </template>
          <template #cell-title="{ row }">
            <span class="title-text">{{ row.title }}</span>
          </template>
          <template #cell-period="{ row }">
            <span class="period-text">{{ row.period }}</span>
          </template>
          <template #cell-householdCount="{ row }">
            {{ row.householdCount ?? 0 }}세대
          </template>
        </AdminTable>

        <AppPagination
          :current-page="state.page"
          :max-page="totalPages"
          :total-all="totalElements"
          :total-filtered="tableRows.length"
          unit="건"
          @change="onPageChange"
        />
      </section>

      <!-- 우측: 상세 패널 -->
      <aside class="detail-panel">
        <!-- 선택 전 빈 상태 -->
        <div v-if="!state.selectedVote" class="panel-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" stroke-width="1.5">
            <circle cx="12" cy="12" r="9"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <p>목록에서 투표를 선택하면<br>상세 정보가 표시됩니다.</p>
        </div>

        <template v-else>
          <div class="panel-card">
            <!-- 상태 뱃지 -->
            <div class="panel-badge-row">
              <BaseBadge :variant="statusVariant(state.selectedVote.status)">
                {{ statusLabel(state.selectedVote.status) }}
              </BaseBadge>
            </div>

            <!-- 제목 -->
            <h3 class="panel-title">{{ state.selectedVote.title }}</h3>

            <!-- 기간/참여 정보 -->
            <div class="panel-info">
              <div class="info-row">
                <span class="info-label">투표 기간</span>
                <span class="info-value">
                  {{ formatDateTime(state.selectedVote.startAt) }}<br>
                  ~ {{ formatDateTime(state.selectedVote.endAt) }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">참여 세대</span>
                <span class="info-value">{{ state.selectedVote.householdCount ?? 0 }}세대</span>
              </div>
            </div>

            <!-- 도넛 차트 (항상 표시) -->
            <div class="donut-section">
              <div class="donut-wrap">
                <svg class="donut-svg" viewBox="0 0 130 130">
                  <!-- 데이터 없음: 회색 -->
                  <template v-if="donutData.total === 0">
                    <circle cx="65" cy="65" r="52" fill="none" stroke="#e2e8f0" stroke-width="16"/>
                  </template>
                  <!-- 동률: 파랑 반 + 빨강 반 -->
                  <template v-else-if="isTie">
                    <circle cx="65" cy="65" r="52" fill="none" stroke="#E53E3E" stroke-width="16"
                      :stroke-dasharray="`${circumference / 2} ${circumference / 2}`"
                      stroke-linecap="butt"
                      transform="rotate(-90 65 65)"
                    />
                    <circle cx="65" cy="65" r="52" fill="none" stroke="#4973E5" stroke-width="16"
                      :stroke-dasharray="`${circumference / 2} ${circumference / 2}`"
                      stroke-linecap="butt"
                      transform="rotate(90 65 65)"
                    />
                  </template>
                  <!-- 일반: 우세 색 앞링 + 배경링 -->
                  <template v-else>
                    <circle cx="65" cy="65" r="52" fill="none"
                      :stroke="isDominantAgree ? '#FED7D7' : '#BEE3F8'"
                      stroke-width="16"
                    />
                    <circle cx="65" cy="65" r="52" fill="none"
                      :stroke="isDominantAgree ? '#4973E5' : '#E53E3E'"
                      stroke-width="16"
                      :stroke-dasharray="donutDasharray"
                      stroke-linecap="round"
                      transform="rotate(-90 65 65)"
                    />
                  </template>
                  <!-- 중앙 텍스트 -->
                  <text x="65" y="65" text-anchor="middle" font-size="20" font-weight="700"
                    :fill="donutData.total === 0 ? '#CBD5E0' : '#1A202C'">
                    {{ donutCenterText }}
                  </text>
                  <text x="65" y="85" text-anchor="middle" font-size="11"
                    :fill="donutData.total === 0 ? '#CBD5E0' : '#718096'">
                    {{ donutCenterLabel }}
                  </text>
                </svg>
              </div>

              <!-- 찬반 수치 -->
              <div class="result-counts">
                <div class="count-item">
                  <span class="count-label">찬성</span>
                  <span class="count-value count-agree">{{ state.selectedVote.agreeCount ?? 0 }}</span>
                </div>
                <div class="count-divider" />
                <div class="count-item">
                  <span class="count-label">반대</span>
                  <span class="count-value count-disagree">{{ state.selectedVote.disagreeCount ?? 0 }}</span>
                </div>
                <div class="count-divider" />
                <div class="count-item">
                  <span class="count-label">참여</span>
                  <span class="count-value">{{ state.selectedVote.householdCount ?? 0 }}</span>
                </div>
              </div>
            </div>

            <!-- 본문 보기 버튼 (항상 표시) -->
            <button class="btn-body-view" @click="state.showBodyModal = true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              본문 보기
            </button>
          </div>

          <!-- 관리 버튼 -->
          <div class="panel-actions">
            <button
              v-if="state.selectedVote.status !== 'CLOSED' && state.selectedVote.status !== '종료'"
              class="btn-action btn-edit"
              @click="goToEdit"
            >
              수정
            </button>
            <button
              v-if="state.selectedVote.status === 'OPEN' || state.selectedVote.status === '진행 중'"
              class="btn-action btn-close"
              @click="state.showCloseModal = true"
            >
              투표 종료
            </button>
            <button class="btn-action btn-delete" @click="state.showDeleteModal = true">
              삭제
            </button>
          </div>
        </template>
      </aside>
    </div>

    <!-- ── 본문 상세 모달 ── -->
    <BaseModal
      :visible="state.showBodyModal"
      :title="state.selectedVote?.title ?? ''"
      subtitle="투표 본문 내용입니다."
      @close="state.showBodyModal = false"
    >
      <div class="body-modal">
        <!-- 메타 정보 -->
        <div class="body-modal__meta">
          <div class="body-meta-row">
            <span class="body-meta-label">상태</span>
            <BaseBadge :variant="statusVariant(state.selectedVote?.status)">
              {{ statusLabel(state.selectedVote?.status) }}
            </BaseBadge>
          </div>
          <div class="body-meta-row">
            <span class="body-meta-label">기간</span>
            <span class="body-meta-value">
              {{ formatDateTime(state.selectedVote?.startAt) }} ~ {{ formatDateTime(state.selectedVote?.endAt) }}
            </span>
          </div>
          <div class="body-meta-row">
            <span class="body-meta-label">찬성 / 반대</span>
            <span class="body-meta-value">
              <span class="agree-text">찬 {{ state.selectedVote?.agreeCount ?? 0 }}</span>
              &nbsp;/&nbsp;
              <span class="disagree-text">반 {{ state.selectedVote?.disagreeCount ?? 0 }}</span>
            </span>
          </div>
        </div>

        <div class="body-modal__divider" />

        <!-- 본문 -->
        <div
          v-if="state.selectedVote?.description"
          class="body-modal__content"
          v-html="state.selectedVote.description"
        />
        <div v-else class="body-modal__empty">
          작성된 본문이 없습니다.
        </div>
      </div>

      <template #footer>
        <button class="btn-modal-close" @click="state.showBodyModal = false">닫기</button>
      </template>
    </BaseModal>

    <!-- ── 종료 확인 모달 ── -->
    <ConfirmModal
      :visible="state.showCloseModal"
      title="투표를 종료하시겠습니까?"
      subtitle="종료 후에는 더 이상 투표에 참여할 수 없습니다."
      :item-name="state.selectedVote?.title"
      confirm-text="종료"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.isSubmitting"
      @confirm="onCloseVote"
      @cancel="state.showCloseModal = false"
    />

    <!-- ── 삭제 확인 모달 ── -->
    <ConfirmModal
      :visible="state.showDeleteModal"
      title="투표를 삭제하시겠습니까?"
      subtitle="삭제된 투표는 복구할 수 없습니다."
      :item-name="state.selectedVote?.title"
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      :loading="state.isSubmitting"
      @confirm="onDeleteVote"
      @cancel="state.showDeleteModal = false"
    />

    <!-- ── 처리 결과 모달 ── -->
    <ActionResultModal
      :visible="state.showResultModal"
      :type="state.resultModalData.type"
      :title="state.resultModalData.title"
      :subtitle="state.resultModalData.subtitle"
      confirm-text="확인"
      @close="state.showResultModal = false"
    />
  </div>
</template>

<style scoped>
.vote-manage {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.vote-manage__body {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: var(--space-20);
  align-items: start;
}

/* 목록 카드 */
.card-shell {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  gap: var(--space-8);
  padding: var(--space-48);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  animation: dotBounce 0.7s infinite alternate;
}
.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes dotBounce {
  from { transform: translateY(0); opacity: 0.3; }
  to { transform: translateY(-5px); opacity: 1; }
}

.search-input {
  padding: 7px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13px;
  color: #1a202c;
  background: #fff;
  width: 220px;
  outline: none;
}
.search-input:focus { border-color: #a0aec0; }

.filter-select {
  height: 34px;
  padding: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13px;
  color: #1a202c;
  background: #fff;
  outline: none;
  cursor: pointer;
}

.title-text {
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
  max-width: 260px;
  text-align: left;
}

.period-text {
  font-size: 11px;
  color: #718096;
}

:deep(.row--selected td) {
  background: rgba(73, 115, 229, 0.07) !important;
}

/* 우측 패널 */
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-48) var(--space-20);
  border: 1px dashed #cbd5e0;
  border-radius: 14px;
  color: #a0aec0;
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
}

.panel-card {
  padding: var(--space-20);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.panel-badge-row { display: flex; gap: var(--space-8); }

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  line-height: 1.4;
}

.panel-info {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-8);
  padding: 14px var(--space-16);
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #94a3b8; flex-shrink: 0; }
.info-value { font-weight: 400; color: #1a202c; text-align: right; line-height: 1.5; }

/* 도넛 섹션 */
.donut-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-16);
  padding: var(--space-8) 0;
}

.donut-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-svg {
  width: 160px;
  height: 160px;
}

/* 찬반 수치 */
.result-counts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-20);
  width: 100%;
  padding-top: var(--space-12);
  border-top: 1px solid #f0f4fd;
}

.count-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.count-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.count-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a202c;
  line-height: 1;
}

.count-agree { color: #4973e5; }
.count-disagree { color: #e53e3e; }

.count-divider {
  width: 1px;
  height: 36px;
  background: #e2e8f0;
}

/* 본문 보기 버튼 */
.btn-body-view {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  width: 100%;
  height: 38px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  color: #718096;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-body-view:hover {
  background: #eef3fb;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 패널 액션 버튼 */
.panel-actions {
  display: flex;
  gap: var(--space-8);
}
.btn-action {
  flex: 1;
  height: 38px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-action:hover { opacity: 0.85; }
.btn-edit { border: 1px solid #e2e8f0; background: #fff; color: #1a202c; }
.btn-close { border: none; background: #2b3a55; color: #fff; }
.btn-delete { border: 1px solid #e53e3e; background: #fff; color: #e53e3e; }

/* 본문 모달 */
.body-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.body-modal__meta {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.body-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  padding: 14px var(--space-16);
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}
.body-meta-row:last-child { border-bottom: none; }
.body-meta-label { color: #94a3b8; font-size: 12px; flex-shrink: 0; }
.body-meta-value { font-weight: 400; color: #1a202c; }
.agree-text { color: #4973e5; }
.disagree-text { color: #e53e3e; }

.body-modal__divider {
  height: 1px;
  background: #e2e8f0;
}

.body-modal__content {
  font-size: 14px;
  color: #1a202c;
  line-height: 1.8;
  min-height: 80px;
  max-height: 400px;
  overflow-y: auto;
}

.body-modal__empty {
  padding: var(--space-32) 0;
  text-align: center;
  font-size: 13px;
  color: #a0aec0;
}

:deep(.body-modal__content p) { margin-bottom: var(--space-8); }
:deep(.body-modal__content strong) { font-weight: 700; }
:deep(.body-modal__content em) { font-style: italic; }
:deep(.body-modal__content ul) { padding-left: var(--space-20); list-style: disc; }
:deep(.body-modal__content ol) { padding-left: var(--space-20); list-style: decimal; }
:deep(.body-modal__content h1) { font-size: 20px; font-weight: 700; margin-bottom: var(--space-8); }
:deep(.body-modal__content h2) { font-size: 17px; font-weight: 700; margin-bottom: var(--space-8); }
:deep(.body-modal__content h3) { font-size: 15px; font-weight: 700; margin-bottom: var(--space-8); }
:deep(.body-modal__content u) { text-decoration: underline; }
:deep(.body-modal__content s) { text-decoration: line-through; }
:deep(.body-modal__content blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: var(--space-12);
  color: #718096;
  margin: var(--space-8) 0;
  font-style: italic;
}

.btn-modal-close {
  height: 38px;
  padding: 0 var(--space-24);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-modal-close:hover { background: #f5f6f8; }
</style>
