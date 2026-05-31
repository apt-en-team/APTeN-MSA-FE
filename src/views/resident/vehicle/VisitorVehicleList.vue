<script setup>
// 입주민 방문차량 목록 화면입니다.
import { ref, reactive, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useVisitorVehicleStore } from '@/stores/useVisitorVehicleStore'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import VisitorVehicleFormModal from '@/components/resident/vehicle/VisitorVehicleFormModal.vue'
import VisitorVehicleDetailModal from '@/components/resident/vehicle/VisitorVehicleDetailModal.vue'

const visitorVehicleStore = useVisitorVehicleStore()
const { visitorVehicles } = storeToRefs(visitorVehicleStore)

// 방문차량 상태 한글 value에 따른 뱃지 색상 매핑
const STATUS_VARIANT = {
  등록완료: 'success',
  사용자취소: 'neutral',
  자동만료: 'warning',
  삭제: 'danger',
}

// 상태 필터 선택지, value는 BE status 파라미터로 전달되는 영문 enum name
const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'APPROVED', label: '등록완료' },
  { value: 'CANCELLED', label: '사용자취소' },
  { value: 'EXPIRED', label: '자동만료' },
]

// 목록 로딩/에러 상태 (store.loading은 변이 액션과 공유되므로 화면 전용 상태를 따로 둔다)
const listLoading = ref(false)
const loadError = ref(false)

const pageSize = 10
const currentPage = ref(1)

// 필터 초기값 생성
const initialFilter = () => ({
  status: '',
  fromDate: '',
  toDate: '',
  plate: '',
})

const filter = reactive(initialFilter())

// 상세 모달 상태
const detailModal = reactive({
  open: false,
  loading: false,
  error: '',
  data: null,
})

// 등록/수정/재등록 모달 상태
const formModal = reactive({
  open: false,
  mode: 'create',
  vehicle: null,
  submitting: false,
  errorMessage: '',
})

// 삭제 확인 모달 상태
const deleteModal = reactive({
  open: false,
  target: null,
  submitting: false,
})

// 결과 모달 상태
const resultModal = reactive({
  open: false,
  type: 'success',
  title: '',
  desc: '',
})

// 목록 응답을 페이지 구조로 정규화
const listData = computed(() => {
  const data = visitorVehicles.value
  if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1 }
  if (data && Array.isArray(data.content)) return data
  return { content: [], totalElements: 0, totalPages: 1 }
})

// 차량번호 검색어로 거른 표시 목록
const rows = computed(() => {
  const keyword = filter.plate.trim().toLowerCase()
  if (!keyword) return listData.value.content
  return listData.value.content.filter((item) =>
    String(item.licensePlate ?? '').toLowerCase().includes(keyword),
  )
})

// 상태 뱃지 색상 반환
const badgeVariant = (status) => STATUS_VARIANT[status] ?? 'neutral'

// 날짜 문자열을 yyyy.MM.dd 형태로 변환
const formatDate = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

// 빈 값을 제외한 목록 조회 파라미터 생성
const buildParams = () => {
  const params = {
    page: currentPage.value - 1,
    size: pageSize,
  }
  if (filter.status) params.status = filter.status
  if (filter.fromDate) params.fromDate = filter.fromDate
  if (filter.toDate) params.toDate = filter.toDate
  return params
}

// 현재 필터와 페이지로 방문차량 목록 조회
const loadList = async () => {
  listLoading.value = true
  loadError.value = false
  try {
    await visitorVehicleStore.fetchVisitorVehicles(buildParams())
    if (visitorVehicleStore.error) loadError.value = true
  } catch {
    loadError.value = true
  } finally {
    listLoading.value = false
  }
}

onMounted(loadList)

// 검색 실행, 1페이지부터 재조회
const handleSearch = () => {
  currentPage.value = 1
  loadList()
}

// 필터 초기화 후 1페이지부터 재조회
const handleReset = () => {
  Object.assign(filter, initialFilter())
  currentPage.value = 1
  loadList()
}

// 페이지 변경 시 해당 페이지 재조회
const handlePageChange = (page) => {
  currentPage.value = page
  loadList()
}

// 결과 모달 표시
const openResult = (type, title, desc = '') => {
  resultModal.type = type
  resultModal.title = title
  resultModal.desc = desc
  resultModal.open = true
}

// 결과 모달 닫기
const closeResult = () => {
  resultModal.open = false
}

// 상세 모달 열기와 상세 조회
const openDetail = async (item) => {
  detailModal.open = true
  detailModal.loading = true
  detailModal.error = ''
  detailModal.data = null
  try {
    detailModal.data = await visitorVehicleStore.fetchVisitorVehicleDetail(item.visitorVehicleId)
  } catch (e) {
    detailModal.error = e?.response?.data?.message || '상세 정보를 불러오지 못했습니다.'
  } finally {
    detailModal.loading = false
  }
}

// 상세 모달 닫기
const closeDetail = () => {
  detailModal.open = false
  detailModal.data = null
}

// 등록 모달 열기
const openCreate = () => {
  formModal.mode = 'create'
  formModal.vehicle = null
  formModal.errorMessage = ''
  formModal.open = true
}

// 상세 모달의 수정 요청 처리
const handleEdit = (vehicle) => {
  detailModal.open = false
  formModal.mode = 'edit'
  formModal.vehicle = vehicle
  formModal.errorMessage = ''
  formModal.open = true
}

// 상세 모달의 재등록 요청 처리
const handleReRegister = (vehicle) => {
  detailModal.open = false
  formModal.mode = 're-register'
  formModal.vehicle = vehicle
  formModal.errorMessage = ''
  formModal.open = true
}

// 등록/수정/재등록 모달 닫기
const closeForm = () => {
  formModal.open = false
}

// 등록/수정/재등록 폼 제출 처리
const submitForm = async (payload) => {
  formModal.submitting = true
  formModal.errorMessage = ''
  const mode = formModal.mode
  try {
    if (mode === 'create') {
      await visitorVehicleStore.createVisitorVehicle({
        licensePlate: payload.licensePlate,
        visitorName: payload.visitorName || null,
        phone: payload.phone || null,
        visitPurpose: payload.visitPurpose || null,
        visitDate: payload.visitDate,
      })
    } else if (mode === 'edit') {
      await visitorVehicleStore.updateVisitorVehicle(formModal.vehicle.visitorVehicleId, {
        licensePlate: payload.licensePlate,
        visitorName: payload.visitorName || null,
        phone: payload.phone || null,
        visitPurpose: payload.visitPurpose || null,
        visitDate: payload.visitDate,
      })
    } else {
      await visitorVehicleStore.reRegisterVisitorVehicle(formModal.vehicle.visitorVehicleId, {
        visitDate: payload.visitDate,
      })
    }
    // 변이 액션은 에러를 store.error에 담으므로 통일된 처리로 끌어올린다.
    if (visitorVehicleStore.error) throw visitorVehicleStore.error
    formModal.open = false
    const successTitle =
      mode === 'create'
        ? '방문차량이 등록되었습니다'
        : mode === 'edit'
          ? '방문차량 정보가 수정되었습니다'
          : '방문차량이 재등록되었습니다'
    openResult('success', successTitle)
    await loadList()
  } catch (e) {
    const message = e?.response?.data?.message || '처리에 실패했습니다.'
    const failTitle = mode === 'create' ? '등록 실패' : mode === 'edit' ? '수정 실패' : '재등록 실패'
    openResult('danger', failTitle, message)
  } finally {
    formModal.submitting = false
  }
}

// 상세 모달의 삭제 요청 처리
const handleDelete = (vehicle) => {
  detailModal.open = false
  deleteModal.target = vehicle
  deleteModal.open = true
}

// 삭제 확인 모달 닫기
const cancelDelete = () => {
  deleteModal.open = false
  deleteModal.target = null
}

// 방문차량 삭제 처리
const confirmDelete = async () => {
  if (!deleteModal.target) return
  deleteModal.submitting = true
  try {
    await visitorVehicleStore.deleteVisitorVehicle(deleteModal.target.visitorVehicleId)
    if (visitorVehicleStore.error) throw visitorVehicleStore.error
    deleteModal.open = false
    openResult('success', '방문차량이 삭제되었습니다')
    await loadList()
  } catch (e) {
    deleteModal.open = false
    const message = e?.response?.data?.message || '삭제에 실패했습니다.'
    openResult('danger', '삭제 실패', message)
  } finally {
    deleteModal.submitting = false
    deleteModal.target = null
  }
}
</script>

<template>
  <section class="visitor-page">
    <header class="visitor-page__header">
      <h1 class="visitor-page__title">방문차량</h1>
      <p class="visitor-page__subtitle">우리 세대에 등록된 방문 예정 차량을 확인하고 관리하세요.</p>
    </header>

    <!-- 필터 -->
    <div class="visitor-filter">
      <input
        v-model="filter.plate"
        type="text"
        class="visitor-filter__input"
        placeholder="차량번호 검색"
        @keyup.enter="handleSearch"
      />
      <select v-model="filter.status" class="visitor-filter__input" @change="handleSearch">
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <div class="visitor-filter__dates">
        <input v-model="filter.fromDate" type="date" class="visitor-filter__input" @change="handleSearch" />
        <span class="visitor-filter__tilde">~</span>
        <input v-model="filter.toDate" type="date" class="visitor-filter__input" @change="handleSearch" />
      </div>
      <div class="visitor-filter__actions">
        <button type="button" class="visitor-filter__btn visitor-filter__btn--search" @click="handleSearch">검색</button>
        <button type="button" class="visitor-filter__btn" @click="handleReset">초기화</button>
      </div>
    </div>

    <!-- 등록 카드 -->
    <button type="button" class="visitor-register" @click="openCreate">
      <span class="visitor-register__circle" aria-hidden="true">+</span>
      <span class="visitor-register__label">새 방문차량 등록하기</span>
    </button>

    <!-- 로딩 -->
    <BaseLoading v-if="listLoading">방문차량 목록을 불러오는 중입니다...</BaseLoading>

    <!-- 에러 -->
    <BaseEmpty v-else-if="loadError">방문차량 정보를 불러오지 못했습니다.</BaseEmpty>

    <!-- 목록 -->
    <template v-else>
      <BaseEmpty v-if="rows.length === 0">표시할 방문차량이 없습니다.</BaseEmpty>

      <ul v-else class="visitor-list">
        <li
          v-for="item in rows"
          :key="item.visitorVehicleId"
          class="visitor-card"
          @click="openDetail(item)"
        >
          <div class="visitor-card__main">
            <span class="visitor-card__id">#{{ item.visitorVehicleId }}</span>
            <span class="visitor-card__plate">{{ item.licensePlate }}</span>
            <BaseBadge :variant="badgeVariant(item.status)">{{ item.status || '-' }}</BaseBadge>
          </div>
          <div class="visitor-card__sub">
            <span class="visitor-card__date-label">방문예정일</span>
            <span class="visitor-card__date">{{ formatDate(item.visitDate) }}</span>
          </div>
        </li>
      </ul>

      <!-- 페이지네이션 -->
      <AppPagination
        v-if="rows.length > 0"
        :current-page="currentPage"
        :total-pages="listData.totalPages"
        :total-all="listData.totalElements"
        :total-filtered="rows.length"
        unit="건"
        @change="handlePageChange"
      />
    </template>

    <!-- 상세 모달 -->
    <VisitorVehicleDetailModal
      :visible="detailModal.open"
      :loading="detailModal.loading"
      :error-message="detailModal.error"
      :vehicle="detailModal.data"
      @close="closeDetail"
      @edit="handleEdit"
      @delete="handleDelete"
      @re-register="handleReRegister"
    />

    <!-- 등록/수정/재등록 모달 -->
    <VisitorVehicleFormModal
      :visible="formModal.open"
      :mode="formModal.mode"
      :vehicle="formModal.vehicle"
      :submitting="formModal.submitting"
      :error-message="formModal.errorMessage"
      @close="closeForm"
      @submit="submitForm"
    />

    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      :visible="deleteModal.open"
      title="방문차량을 삭제하시겠습니까?"
      subtitle="삭제하면 해당 방문차량 정보가 제거됩니다."
      item-label="차량번호"
      :item-name="deleteModal.target?.licensePlate || ''"
      action-label="삭제"
      confirm-text="삭제"
      confirm-type="danger"
      :loading="deleteModal.submitting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- 결과 모달 -->
    <ActionResultModal
      :visible="resultModal.open"
      :type="resultModal.type"
      :title="resultModal.title"
      :desc="resultModal.desc"
      @close="closeResult"
    />
  </section>
</template>

<style scoped>
.visitor-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: var(--space-20) var(--space-16);
  min-height: 100%;
}

/* 헤더 */
.visitor-page__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 500;
}

.visitor-page__subtitle {
  margin: 5px 0 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* 필터 */
.visitor-filter {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-card-bg);
}

.visitor-filter__input {
  height: 42px;
  padding: 0 var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: 14px;
  box-sizing: border-box;
}

.visitor-filter__dates {
  display: flex;
  align-items: center;
  gap: 8px;
}

.visitor-filter__dates .visitor-filter__input {
  flex: 1;
  min-width: 0;
}

.visitor-filter__tilde {
  color: var(--color-text-secondary);
}

.visitor-filter__actions {
  display: flex;
  gap: 8px;
}

.visitor-filter__btn {
  flex: 1;
  height: 42px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.visitor-filter__btn--search {
  border: none;
  background: var(--resident-primary);
  color: #FFFFFF;
}

/* 등록 카드 */
.visitor-register {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 96px;
  border: 1.5px dashed var(--color-border);
  border-radius: 16px;
  background: var(--color-card-bg);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.visitor-register:hover {
  border-color: var(--resident-primary);
  background: #F8FAFF;
}

.visitor-register__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid var(--resident-primary);
  border-radius: 999px;
  color: var(--resident-primary);
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.visitor-register__label {
  font-size: 14px;
  font-weight: 700;
  color: var(--resident-primary);
}

/* 목록 */
.visitor-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.visitor-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-card-bg);
  box-shadow: 0 6px 18px rgba(73, 115, 229, 0.08);
  cursor: pointer;
}

.visitor-card__main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.visitor-card__id {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.visitor-card__plate {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visitor-card__sub {
  display: flex;
  align-items: center;
  gap: 8px;
}

.visitor-card__date-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.visitor-card__date {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}
</style>
