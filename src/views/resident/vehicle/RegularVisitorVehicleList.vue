<script setup>
// 입주민 고정방문차량 목록 화면입니다.
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useVisitorVehicleStore } from '@/stores/useVisitorVehicleStore'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import RegularVisitorVehicleDetailModal from '@/components/resident/vehicle/RegularVisitorVehicleDetailModal.vue'

const route = useRoute()
const router = useRouter()
const visitorVehicleStore = useVisitorVehicleStore()
const { regularVisitorVehicles } = storeToRefs(visitorVehicleStore)

// 활성 여부 필터 선택지, value는 BE isActive 파라미터로 전달
const activeOptions = [
  { value: '', label: '전체' },
  { value: 'true', label: '활성' },
  { value: 'false', label: '비활성' },
]

// 목록 로딩/에러 상태 (store.loading은 변이 액션과 공유되므로 화면 전용 상태를 따로 둔다)
const listLoading = ref(false)
const loadError = ref(false)

const pageSize = 10
const currentPage = ref(1)

// 필터 초기값 생성
const initialFilter = () => ({
  isActive: '',
  plate: '',
})

const filter = reactive(initialFilter())

// 차량번호 검색 확정값 (검색 실행 시점에만 입력값을 반영)
const appliedPlate = ref('')

// 상세 모달 상태
const detailModal = reactive({
  open: false,
  loading: false,
  error: '',
  data: null,
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
  const data = regularVisitorVehicles.value
  if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1 }
  if (data && Array.isArray(data.content)) return data
  return { content: [], totalElements: 0, totalPages: 1 }
})

// 확정된 차량번호 검색어로 거른 표시 목록
const rows = computed(() => {
  const keyword = appliedPlate.value.trim().toLowerCase()
  if (!keyword) return listData.value.content
  return listData.value.content.filter((item) =>
    String(item.licensePlate ?? '').toLowerCase().includes(keyword),
  )
})

// 활성 여부 뱃지 색상 반환
const activeVariant = (isActive) => (isActive ? 'success' : 'neutral')

// 활성 여부 한글 표기 반환
const activeLabel = (isActive) => (isActive ? '활성' : '비활성')

// 날짜 문자열을 yyyy.MM.dd 형태로 변환
const formatDate = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

// 시작일과 종료일을 기간 문자열로 결합, 종료일 미설정은 무기한으로 표기
const periodText = (item) => {
  const start = formatDate(item.startDate)
  if (!item.endDate) return `${start} ~ 무기한`
  return `${start} ~ ${formatDate(item.endDate)}`
}

// 빈 값을 제외한 목록 조회 파라미터 생성
const buildParams = () => {
  const params = {
    page: currentPage.value - 1,
    size: pageSize,
  }
  if (filter.isActive !== '') params.isActive = filter.isActive === 'true'
  return params
}

// 현재 필터와 페이지로 고정방문차량 목록 조회
const loadList = async () => {
  listLoading.value = true
  loadError.value = false
  try {
    await visitorVehicleStore.fetchRegularVisitorVehicles(buildParams())
    if (visitorVehicleStore.error) loadError.value = true
  } catch {
    loadError.value = true
  } finally {
    listLoading.value = false
  }
}

onMounted(loadList)

// 검색 실행, 입력한 차량번호를 확정값에 반영하고 1페이지부터 재조회
const handleSearch = () => {
  appliedPlate.value = filter.plate
  currentPage.value = 1
  loadList()
}

// 필터 초기화 후 1페이지부터 재조회
const handleReset = () => {
  Object.assign(filter, initialFilter())
  appliedPlate.value = ''
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
    detailModal.data = await visitorVehicleStore.fetchRegularVisitorVehicleDetail(item.regularVisitorVehicleId)
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

// 등록 페이지로 이동
const openCreate = () => {
  router.push(`/resident/${route.params.complexId}/regular-visitor-vehicle/register`)
}

// 상세 모달의 수정 요청 처리, 수정 페이지로 이동
const handleEdit = (vehicle) => {
  detailModal.open = false
  router.push(`/resident/${route.params.complexId}/regular-visitor-vehicle/${vehicle.regularVisitorVehicleId}/edit`)
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

// 고정방문차량 삭제 처리
const confirmDelete = async () => {
  if (!deleteModal.target || deleteModal.submitting) return
  deleteModal.submitting = true
  try {
    await visitorVehicleStore.deleteRegularVisitorVehicle(deleteModal.target.regularVisitorVehicleId)
    if (visitorVehicleStore.error) throw visitorVehicleStore.error
    deleteModal.open = false
    openResult('success', '고정방문차량이 삭제되었습니다')
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
  <section class="regular-page">
    <header class="regular-page__header">
      <h1 class="regular-page__title">고정방문차량</h1>
      <p class="regular-page__subtitle">우리 세대에 등록된 고정방문 차량을 확인하고 관리하세요.</p>
    </header>

    <!-- 필터 -->
    <div class="regular-filter">
      <input
        v-model="filter.plate"
        type="text"
        class="regular-filter__input"
        placeholder="차량번호 검색"
        @keyup.enter="handleSearch"
      />
      <select v-model="filter.isActive" class="regular-filter__input" @change="handleSearch">
        <option v-for="opt in activeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <div class="regular-filter__actions">
        <button type="button" class="regular-filter__btn regular-filter__btn--search" @click="handleSearch">검색</button>
        <button type="button" class="regular-filter__btn" @click="handleReset">초기화</button>
      </div>
    </div>

    <!-- 등록 카드 -->
    <button type="button" class="regular-register" @click="openCreate">
      <span class="regular-register__circle" aria-hidden="true">+</span>
      <span class="regular-register__label">새 고정방문차량 등록하기</span>
    </button>

    <!-- 로딩 -->
    <BaseLoading v-if="listLoading">고정방문차량 목록을 불러오는 중입니다...</BaseLoading>

    <!-- 에러 -->
    <BaseEmpty v-else-if="loadError">고정방문차량 정보를 불러오지 못했습니다.</BaseEmpty>

    <!-- 목록 -->
    <template v-else>
      <BaseEmpty v-if="rows.length === 0">표시할 고정방문차량이 없습니다.</BaseEmpty>

      <ul v-else class="regular-list">
        <li
          v-for="item in rows"
          :key="item.regularVisitorVehicleId"
          class="regular-card"
          @click="openDetail(item)"
        >
          <div class="regular-card__main">
            <span class="regular-card__plate">{{ item.licensePlate }}</span>
            <BaseBadge :variant="activeVariant(item.isActive)">{{ activeLabel(item.isActive) }}</BaseBadge>
          </div>
          <div class="regular-card__sub">
            <span class="regular-card__date-label">기간</span>
            <span class="regular-card__date">{{ periodText(item) }}</span>
          </div>
        </li>
      </ul>

      <!-- 페이지네이션 (입주민 포인트색 적용, 조회 건수 텍스트 숨김) -->
      <div v-if="rows.length > 0" class="regular-pagination">
        <AppPagination
          :current-page="currentPage"
          :total-pages="listData.totalPages"
          :total-all="listData.totalElements"
          :total-filtered="rows.length"
          unit="건"
          active-color="var(--resident-primary)"
          @change="handlePageChange"
        />
      </div>
    </template>

    <!-- 상세 모달 -->
    <RegularVisitorVehicleDetailModal
      :visible="detailModal.open"
      :loading="detailModal.loading"
      :error-message="detailModal.error"
      :vehicle="detailModal.data"
      @close="closeDetail"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- 삭제 확인 모달 -->
    <ResidentModal
      :visible="deleteModal.open"
      type="danger"
      title="고정방문차량을 삭제하시겠습니까?"
      subtitle="삭제하면 해당 고정방문차량 정보가 제거됩니다."
      :info-rows="deleteModal.target ? [{ label: '차량번호', value: deleteModal.target.licensePlate }] : []"
      confirm-text="삭제"
      confirm-type="danger"
      cancel-text="취소"
      @confirm="confirmDelete"
      @close="cancelDelete"
    />

    <!-- 결과 모달 -->
    <ResidentModal
      :visible="resultModal.open"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.desc"
      :show-cancel="false"
      confirm-text="확인"
      @close="closeResult"
      @confirm="closeResult"
    />
  </section>
</template>

<style scoped>
.regular-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: var(--space-20) var(--space-16);
  min-height: 100%;
}

/* 헤더 */
.regular-page__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 500;
}

.regular-page__subtitle {
  margin: 5px 0 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* 필터 */
.regular-filter {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-card-bg);
}

.regular-filter__input {
  height: 42px;
  padding: 0 var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: 14px;
  box-sizing: border-box;
}

.regular-filter__actions {
  display: flex;
  gap: 8px;
}

.regular-filter__btn {
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

.regular-filter__btn--search {
  border: none;
  background: var(--resident-primary);
  color: #FFFFFF;
}

/* 등록 카드 */
.regular-register {
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

.regular-register:hover {
  border-color: var(--resident-primary);
  background: #F8FAFF;
}

.regular-register__circle {
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

.regular-register__label {
  font-size: 14px;
  font-weight: 700;
  color: var(--resident-primary);
}

/* 목록 */
.regular-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.regular-card {
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

.regular-card__main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.regular-card__id {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.regular-card__plate {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.regular-card__sub {
  display: flex;
  align-items: center;
  gap: 8px;
}

.regular-card__date-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.regular-card__date {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

/* 페이지네이션의 조회 건수 텍스트만 감춰 가운데 정렬은 유지 */
.regular-pagination :deep(.pagination-info) {
  visibility: hidden;
}
</style>
