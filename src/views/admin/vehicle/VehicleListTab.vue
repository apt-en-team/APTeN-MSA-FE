<script setup>
// 차량 관리 컨테이너의 차량 목록 탭이다.
// 통계 카드 + 필터(검색/상태/세대) + 테이블 + 페이지네이션 + 상세/승인/거절 모달로 구성한다.
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useVehicleStore } from '@/stores/useVehicleStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { useAuthStore } from '@/stores/useAuthStore'
import StatsCards from '@/components/admin/StatsCards.vue'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const vehicleStore = useVehicleStore()
const complexStore = useComplexStore()
const authStore = useAuthStore()

// 상태 한글 값에 따른 뱃지 색상 매핑
const STATUS_VARIANT = {
  승인대기: 'warning',
  승인완료: 'success',
  승인거절: 'danger',
}

// 상태 필터 선택지, value는 BE enum 이름으로 전달
const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'PENDING', label: '승인대기' },
  { value: 'APPROVED', label: '승인완료' },
  { value: 'REJECTED', label: '승인거절' },
]

// 테이블 컬럼 정의
const columns = [
  { key: 'rowNumber', label: 'ID' },
  { key: 'licensePlate', label: '차량번호' },
  { key: 'modelName', label: '차종' },
  { key: 'location', label: '소속 세대' },
  { key: 'residentName', label: '등록자' },
  { key: 'status', label: '승인 상태' },
  { key: 'createdAt', label: '등록일' },
]

// 필터 초기값 생성
const initialFilter = () => ({
  keyword: '',
  status: '',
  building: '',
  unit: '',
})

const filter = reactive(initialFilter())
const pageSize = 10
const currentPage = ref(1)
const listLoading = ref(false)
const listError = ref('')

// 동/호 옵션 소스, 동별 호 목록 구조를 그대로 보관한다 (BE에서 자연 정렬 완료)
const locationBuildings = computed(() => vehicleStore.vehicleLocations?.buildings ?? [])

// 동 드롭다운 옵션
const buildingOptions = computed(() => locationBuildings.value.map((item) => item.building))

// 호 드롭다운 옵션, 선택된 동의 호 목록
const unitOptions = computed(() => {
  if (!filter.building) return []
  const found = locationBuildings.value.find((item) => String(item.building) === String(filter.building))
  return found?.units ?? []
})

// 상세 모달 상태
const isDetailModalOpen = ref(false)
const detailLoading = ref(false)
const showRejectForm = ref(false)
const rejectReason = ref('')
const actionError = ref('')
const approveSubmitting = ref(false)
const rejectSubmitting = ref(false)

// 관리자 차량 페이지 응답 안전 추출
const vehiclePage = computed(() => {
  const data = vehicleStore.adminVehicles
  if (data && Array.isArray(data.content)) return data
  return { content: [], totalElements: 0, totalPages: 1 }
})

// 테이블 행 데이터, 행 key용 id와 페이지 기준 순번 부여
const rows = computed(() =>
  vehiclePage.value.content.map((vehicle, index) => ({
    ...vehicle,
    id: vehicle.vehicleId,
    rowNumber: (currentPage.value - 1) * pageSize + index + 1,
  })),
)

// 통계 카드 항목 구성
const statsItems = computed(() => {
  const stats = vehicleStore.adminVehicleStats
  return [
    { label: '전체 등록', value: stats?.total ?? 0, unit: '대', desc: '단지 전체 기준', descClass: '' },
    { label: '승인 대기', value: stats?.pending ?? 0, unit: '대', desc: '처리 필요', descClass: 'warning' },
    { label: '승인 완료', value: stats?.approved ?? 0, unit: '대', desc: '등록 완료', descClass: 'success' },
    { label: '거부', value: stats?.rejected ?? 0, unit: '대', desc: '거절 처리', descClass: '' },
  ]
})

// 상세 조회 데이터
const detail = computed(() => vehicleStore.vehicleDetail)

// 상세 상태가 승인대기인지 판단
const isPending = computed(() => detail.value?.status === '승인대기')

// 상태 뱃지 색상 반환
const badgeVariant = (status) => STATUS_VARIANT[status] ?? 'neutral'

// 날짜 문자열을 yyyy.MM.dd 형태로 변환
const formatDate = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

// 일시 문자열을 yyyy-MM-dd HH:mm 형태로 변환
const formatDateTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

// 대표 차량 여부 라벨 변환
const primaryLabel = (value) => (value ? '대표 차량' : '일반 차량')

// 빈 값을 제외한 목록 조회 파라미터 생성
const buildParams = () => {
  const params = {
    page: currentPage.value - 1,
    size: pageSize,
  }
  if (filter.keyword.trim()) params.keyword = filter.keyword.trim()
  if (filter.status) params.status = filter.status
  if (filter.building) params.building = filter.building
  if (filter.unit) params.unit = filter.unit
  return params
}

// 현재 필터와 페이지로 차량 목록 조회
const loadVehicles = async () => {
  listLoading.value = true
  listError.value = ''
  await vehicleStore.fetchAdminVehicles(buildParams())
  if (vehicleStore.error) listError.value = '차량 목록을 불러오지 못했습니다.'
  listLoading.value = false
}

// 차량 상태별 통계 조회
const loadStats = async () => {
  await vehicleStore.fetchAdminVehicleStats()
}

// 동/호 옵션 1회 적재
const loadLocations = async () => {
  await vehicleStore.fetchVehicleLocations()
}

// 검색 실행, 1페이지부터 재조회
const handleSearch = () => {
  currentPage.value = 1
  loadVehicles()
}

// 동 선택 변경 시 호 선택 초기화 후 재조회, 호 옵션은 캐시에서 자동 재계산
const handleBuildingChange = () => {
  filter.unit = ''
  handleSearch()
}

// 필터 초기화 후 1페이지부터 재조회
const handleReset = () => {
  Object.assign(filter, initialFilter())
  currentPage.value = 1
  loadVehicles()
}

// 페이지 변경 시 해당 페이지 재조회
const handlePageChange = (page) => {
  currentPage.value = page
  loadVehicles()
}

// 상세 모달 열기와 상세 조회
const openDetailModal = async (row) => {
  isDetailModalOpen.value = true
  detailLoading.value = true
  showRejectForm.value = false
  rejectReason.value = ''
  actionError.value = ''
  vehicleStore.vehicleDetail = null
  await vehicleStore.fetchAdminVehicleDetail(row.vehicleId)
  if (vehicleStore.error) actionError.value = '차량 상세 정보를 불러오지 못했습니다.'
  detailLoading.value = false
}

// 상세 모달 닫기
const closeDetailModal = () => {
  isDetailModalOpen.value = false
  showRejectForm.value = false
  rejectReason.value = ''
  actionError.value = ''
}

// 행 클릭 시 상세 모달 열기
const handleRowClick = (row) => {
  openDetailModal(row)
}

// 차량 승인 처리
const handleApprove = async () => {
  if (approveSubmitting.value || !detail.value) return
  approveSubmitting.value = true
  actionError.value = ''
  await vehicleStore.approveVehicle(detail.value.vehicleId)
  approveSubmitting.value = false
  if (vehicleStore.error) {
    actionError.value = '차량 승인에 실패했습니다.'
    return
  }
  closeDetailModal()
  await loadVehicles()
  await loadStats()
}

// 거절 사유 입력 영역 열기
const openRejectForm = () => {
  showRejectForm.value = true
  rejectReason.value = ''
  actionError.value = ''
}

// 차량 거절 처리
const handleReject = async () => {
  if (rejectSubmitting.value || !detail.value) return
  if (!rejectReason.value.trim()) {
    actionError.value = '거절 사유를 입력해주세요.'
    return
  }
  rejectSubmitting.value = true
  actionError.value = ''
  await vehicleStore.rejectVehicle(detail.value.vehicleId, { rejectReason: rejectReason.value.trim() })
  rejectSubmitting.value = false
  if (vehicleStore.error) {
    actionError.value = '차량 거절에 실패했습니다.'
    return
  }
  closeDetailModal()
  await loadVehicles()
  await loadStats()
}

// 마운트 시 최초 조회, 동/호 옵션은 목록/통계와 독립적으로 로드
onMounted(async () => {
  loadLocations()
  await loadVehicles()
  await loadStats()
})

// MASTER 단지 전환 시 필터와 동/호 옵션 초기화 후 재조회
watch(
  () => complexStore.selectedComplex?.complexId,
  async (nextComplexId, prevComplexId) => {
    if (authStore.role !== 'MASTER' || !nextComplexId || nextComplexId === prevComplexId) return
    Object.assign(filter, initialFilter())
    currentPage.value = 1
    loadLocations()
    await loadVehicles()
    await loadStats()
  },
)
</script>

<template>
  <section class="admin-page">

    <!-- 상단 통계 카드 -->
    <StatsCards :stats="statsItems" />

    <section class="admin-page__card">
      <!-- 필터바 -->
      <AdminFilterBar @search="handleSearch" @reset="handleReset">
        <input
          v-model="filter.keyword"
          type="text"
          class="filter-input"
          placeholder="차량번호, 차종, 등록자명 검색"
          @keyup.enter="handleSearch"
        />
        <select v-model="filter.status" class="filter-input" @change="handleSearch">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <select v-model="filter.building" class="filter-input" @change="handleBuildingChange">
          <option value="">전체 동</option>
          <option v-for="building in buildingOptions" :key="building" :value="building">
            {{ building }}동
          </option>
        </select>
        <select
          v-model="filter.unit"
          class="filter-input"
          :disabled="!filter.building"
          @change="handleSearch"
        >
          <option value="">전체 호</option>
          <option v-for="unit in unitOptions" :key="unit" :value="unit">{{ unit }}호</option>
        </select>
        <button type="button" class="btn-search" @click="handleSearch">검색</button>
      </AdminFilterBar>

      <!-- 테이블 -->
      <div class="admin-page__table-shell">
        <div v-if="listLoading" class="table-feedback">차량 목록을 불러오는 중입니다.</div>
        <div v-else-if="listError" class="table-feedback error">{{ listError }}</div>
        <AdminTable
          v-else
          :columns="columns"
          :rows="rows"
          @row-click="handleRowClick"
        >
          <template #cell-rowNumber="{ row }">#{{ row.rowNumber }}</template>
          <template #cell-location="{ row }">
            {{ row.building || '-' }}동 {{ row.unit || '-' }}호
          </template>
          <template #cell-status="{ row }">
            <BaseBadge :variant="badgeVariant(row.status)">{{ row.status }}</BaseBadge>
          </template>
          <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
        </AdminTable>
      </div>

      <!-- 페이지네이션 -->
      <AppPagination
        v-if="!listLoading && !listError && rows.length > 0"
        :current-page="currentPage"
        :total-pages="vehiclePage.totalPages"
        :total-all="vehiclePage.totalElements"
        :total-filtered="rows.length"
        unit="대"
        @change="handlePageChange"
      />
    </section>

    <!-- 차량 상세 모달 -->
    <BaseModal
      :visible="isDetailModalOpen"
      title="차량 상세 정보"
      subtitle="등록 차량의 상세 정보를 확인하고 승인 여부를 처리합니다."
      @close="closeDetailModal"
    >
      <div v-if="detailLoading" class="table-feedback">상세 정보를 불러오는 중입니다.</div>
      <div v-else-if="detail" class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">차량번호</span>
          <span class="detail-value">{{ detail.licensePlate || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">차종</span>
          <span class="detail-value">{{ detail.modelName || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">차주명</span>
          <span class="detail-value">{{ detail.residentName || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">소속 세대</span>
          <span class="detail-value">{{ detail.building || '-' }}동 {{ detail.unit || '-' }}호</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">차량구분</span>
          <span class="detail-value">{{ detail.vehicleType || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">상태</span>
          <span class="detail-value">
            <BaseBadge :variant="badgeVariant(detail.status)">{{ detail.status }}</BaseBadge>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">대표차량 여부</span>
          <span class="detail-value">{{ primaryLabel(detail.isPrimary) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">승인일시</span>
          <span class="detail-value">{{ formatDateTime(detail.approvedAt) }}</span>
        </div>
        <div v-if="detail.status === '승인거절'" class="detail-row">
          <span class="detail-label">거절사유</span>
          <span class="detail-value">{{ detail.rejectReason || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">등록일시</span>
          <span class="detail-value">{{ formatDateTime(detail.createdAt) }}</span>
        </div>

        <!-- 거절 사유 입력 영역 -->
        <div v-if="showRejectForm" class="reject-form">
          <label class="reject-form__label">거절 사유</label>
          <textarea
            v-model="rejectReason"
            class="reject-form__input"
            rows="3"
            placeholder="거절 사유를 입력해주세요."
          />
        </div>

        <p v-if="actionError" class="form-error">{{ actionError }}</p>
      </div>
      <div v-else class="table-feedback error">{{ actionError || '차량 정보를 찾을 수 없습니다.' }}</div>

      <template #footer>
        <button type="button" class="btn-cancel" @click="closeDetailModal">닫기</button>
        <template v-if="isPending">
          <button
            type="button"
            class="btn-reject"
            :disabled="rejectSubmitting"
            @click="showRejectForm ? handleReject() : openRejectForm()"
          >
            {{ showRejectForm ? (rejectSubmitting ? '처리 중...' : '거절 확정') : '거절' }}
          </button>
          <button
            v-if="!showRejectForm"
            type="button"
            class="btn-submit"
            :disabled="approveSubmitting"
            @click="handleApprove"
          >
            {{ approveSubmitting ? '처리 중...' : '승인' }}
          </button>
        </template>
      </template>
    </BaseModal>
  </section>
</template>

<style scoped>
.admin-page {
  display: grid;
  gap: var(--space-20);
}

.admin-page__card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-small);
  overflow: hidden;
}

.filter-input {
  height: 32px;
  padding: 0 var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
}

.filter-input:focus {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
  border-color: var(--color-primary);
}

.filter-input:disabled {
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.btn-search {
  height: 32px;
  padding: 0 var(--space-16);
  border: none;
  border-radius: var(--radius-8);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
}

.btn-search:hover {
  filter: brightness(1.08);
}

.admin-page__table-shell {
  min-height: 120px;
}

.table-feedback {
  padding: 48px 0;
  color: var(--color-text-secondary);
  text-align: center;
  font-size: 13px;
}

.table-feedback.error {
  color: var(--color-danger);
}

/* 상세 모달 본문 */
.detail-grid {
  display: grid;
  gap: var(--space-12);
}

.detail-row {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.detail-label {
  flex: 0 0 96px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
  font-weight: 600;
}

.detail-value {
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
}

/* 거절 사유 입력 */
.reject-form {
  display: grid;
  gap: var(--space-8);
  margin-top: var(--space-8);
}

.reject-form__label {
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
  font-weight: 600;
}

.reject-form__input {
  width: 100%;
  padding: var(--space-8) var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  font-size: var(--font-size-detail);
  resize: vertical;
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-detail);
}

.btn-cancel,
.btn-submit,
.btn-reject {
  min-width: 88px;
  height: 40px;
  padding: 0 var(--space-16);
  border-radius: var(--radius-8);
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  border: 1px solid var(--color-border);
  background: #FFFFFF;
  color: var(--color-text-secondary);
}

.btn-submit {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.btn-reject {
  border: 1px solid var(--color-danger);
  background: var(--color-danger);
  color:#fff;
}

.btn-submit:disabled,
.btn-reject:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
