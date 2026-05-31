<script setup>
// 방문차량 관리 컨테이너의 고정방문차량 탭이다.
// 필터(검색/활성여부) + 테이블 + 페이지네이션 + 상세/등록 모달로 구성하며, 강제삭제는 별도 확인 모달에서 처리한다.
import { computed, inject, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useVisitorVehicleStore } from '@/stores/useVisitorVehicleStore'
import { useHouseholdStore } from '@/stores/useHouseholdStore'
import { useVehicleStore } from '@/stores/useVehicleStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { useAuthStore } from '@/stores/useAuthStore'
import visitorVehicleApi from '@/api/visitorVehicleApi'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import { VISIT_PURPOSE_PRESETS, VISIT_PURPOSE_CUSTOM } from '@/constants/visitPurpose'

const visitorVehicleStore = useVisitorVehicleStore()
const householdStore = useHouseholdStore()
const vehicleStore = useVehicleStore()
const complexStore = useComplexStore()
const authStore = useAuthStore()

// AdminLayout 헤더 액션 버튼이 누를 등록 모달 열기 함수를 등록한다.
const registerOpenModal = inject('registerOpenModal', null)

// 활성 여부 필터 선택지
const activeOptions = [
  { value: '', label: '전체' },
  { value: 'true', label: '활성' },
  { value: 'false', label: '비활성' },
]

// 방문 목적 프리셋 목록 (템플릿 노출용)
const visitPurposePresets = VISIT_PURPOSE_PRESETS

// 직접 입력 식별값 (템플릿 노출용)
const purposeCustomValue = VISIT_PURPOSE_CUSTOM

// 테이블 컬럼 정의
const columns = [
  { key: 'rowNumber', label: 'ID' },
  { key: 'licensePlate', label: '차량번호' },
  { key: 'visitorName', label: '방문자명' },
  { key: 'phone', label: '연락처' },
  { key: 'visitPurpose', label: '방문목적' },
  { key: 'period', label: '기간' },
  { key: 'location', label: '동/호' },
  { key: 'isActive', label: '활성여부' },
  { key: 'createdAt', label: '등록일' },
]

// 필터 초기값 생성
const initialFilter = () => ({
  keyword: '',
  isActive: '',
})

const filter = reactive(initialFilter())
const pageSize = 10
const currentPage = ref(1)
const listLoading = ref(false)
const listError = ref('')

// 등록 모달의 동/호 옵션 로딩 상태
const locationsLoading = ref(false)
const locationsError = ref('')

// 상세 모달 상태, 목록 행 데이터를 그대로 표시
const isDetailModalOpen = ref(false)
const detailRow = ref(null)
const isForceDeleteOpen = ref(false)
const deleteSubmitting = ref(false)
const detailError = ref('')

// 등록 모달 상태
const isCreateModalOpen = ref(false)
const createForm = reactive({
  building: '',
  unit: '',
  licensePlate: '',
  visitorName: '',
  phone: '',
  purposeSelect: '',
  purposeCustom: '',
  startDate: '',
  endDate: '',
})
const createSubmitting = ref(false)
const createError = ref('')

// 결과 모달 상태
const resultModal = reactive({
  visible: false,
  type: 'success',
  title: '',
  subtitle: '',
  itemName: '',
  time: '',
  actionLabel: '',
  actor: '',
  afterConfirm: null,
})

// 처리 시각 문자열 생성
const getCurrentTimeText = () => {
  return new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 처리자 이름 조회
const getCurrentActorName = () => {
  return authStore.userInfo?.name || authStore.user?.name || authStore.name || '관리자'
}

// 결과 모달 열기
const openResultModal = ({ type, title, subtitle = '', itemName = '', actionLabel = '', afterConfirm = null }) => {
  resultModal.visible = true
  resultModal.type = type
  resultModal.title = title
  resultModal.subtitle = subtitle
  resultModal.itemName = itemName
  resultModal.time = getCurrentTimeText()
  resultModal.actionLabel = actionLabel
  resultModal.actor = getCurrentActorName()
  resultModal.afterConfirm = afterConfirm
}

// 결과 모달 확인 후 후속 처리 실행
const handleResultConfirm = async () => {
  const cb = resultModal.afterConfirm
  resultModal.visible = false
  resultModal.afterConfirm = null
  if (typeof cb === 'function') {
    await cb()
  }
}

// 관리자 고정방문차량 페이지 응답 안전 추출
const regularPage = computed(() => {
  const data = visitorVehicleStore.adminRegularVisitorVehicles
  if (data && Array.isArray(data.content)) return data
  return { content: [], totalElements: 0, totalPages: 1 }
})

// 테이블 행 데이터, 행 key용 id와 페이지 기준 순번 부여
const rows = computed(() =>
  regularPage.value.content.map((vehicle, index) => ({
    ...vehicle,
    id: vehicle.regularVisitorVehicleId,
    rowNumber: (currentPage.value - 1) * pageSize + index + 1,
  })),
)

// vehicle-locations 응답의 동별 호 목록 구조를 그대로 보관
const locationBuildings = computed(() => vehicleStore.vehicleLocations?.buildings ?? [])

// 동 드롭다운 옵션
const buildingOptions = computed(() => locationBuildings.value.map((item) => item.building))

// 호 드롭다운 옵션, 선택된 동의 호 목록
const unitOptions = computed(() => {
  if (!createForm.building) return []
  const found = locationBuildings.value.find((item) => String(item.building) === String(createForm.building))
  return found?.units ?? []
})

// 날짜 문자열을 yyyy.MM.dd 형태로 변환
const formatDate = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

// 시작일과 종료일을 기간 문자열로 변환
const formatPeriod = (startDate, endDate) => `${formatDate(startDate)} ~ ${endDate ? formatDate(endDate) : '무기한'}`

// 빈 값을 제외한 목록 조회 파라미터 생성
const buildParams = () => {
  const params = {
    page: currentPage.value - 1,
    size: pageSize,
  }
  if (filter.keyword.trim()) params.keyword = filter.keyword.trim()
  if (filter.isActive !== '') params.isActive = filter.isActive === 'true'
  return params
}

// 현재 필터와 페이지로 고정방문차량 목록 조회
const loadRegularVehicles = async () => {
  listLoading.value = true
  listError.value = ''
  await visitorVehicleStore.fetchAdminRegularVisitorVehicles(buildParams())
  if (visitorVehicleStore.error) listError.value = '고정방문차량 목록을 불러오지 못했습니다.'
  listLoading.value = false
}

// 등록 모달 동/호 옵션을 vehicle-locations로 비동기 적재
const loadLocations = async () => {
  locationsLoading.value = true
  locationsError.value = ''
  await vehicleStore.fetchVehicleLocations()
  if (vehicleStore.error) locationsError.value = '동/호 목록을 불러오지 못했습니다.'
  locationsLoading.value = false
}

// 검색 실행, 1페이지부터 재조회
const handleSearch = () => {
  currentPage.value = 1
  loadRegularVehicles()
}

// 필터 초기화 후 1페이지부터 재조회
const handleReset = () => {
  Object.assign(filter, initialFilter())
  currentPage.value = 1
  loadRegularVehicles()
}

// 페이지 변경 시 해당 페이지 재조회
const handlePageChange = (page) => {
  currentPage.value = page
  loadRegularVehicles()
}

// 상세 모달 열기, 선택 행 보관
const openDetailModal = (row) => {
  detailRow.value = row
  isForceDeleteOpen.value = false
  detailError.value = ''
  isDetailModalOpen.value = true
}

// 상세 모달 닫기
const closeDetailModal = () => {
  isDetailModalOpen.value = false
  isForceDeleteOpen.value = false
  detailError.value = ''
}

// 행 클릭 시 상세 모달 열기
const handleRowClick = (row) => {
  openDetailModal(row)
}

// 강제삭제 확인 모달 열기
const openDeleteConfirm = () => {
  detailError.value = ''
  isForceDeleteOpen.value = true
}

// 강제삭제 확인 모달 닫기
const closeDeleteConfirm = () => {
  if (deleteSubmitting.value) return
  isForceDeleteOpen.value = false
  detailError.value = ''
}

// 강제삭제 처리
const handleForceDelete = async () => {
  if (deleteSubmitting.value || !detailRow.value) return
  deleteSubmitting.value = true
  detailError.value = ''
  try {
    // 삭제 항목명 캡처 후 결과 모달 노출
    const itemName = `${detailRow.value.licensePlate || '-'} (${detailRow.value.building || '-'}동 ${detailRow.value.unit || '-'}호)`
    await visitorVehicleApi.deleteAdminRegularVisitorVehicle(detailRow.value.regularVisitorVehicleId)
    isForceDeleteOpen.value = false
    closeDetailModal()
    openResultModal({
      type: 'success',
      title: '고정방문차량이 삭제되었습니다.',
      itemName,
      actionLabel: '고정방문차량 강제삭제',
      afterConfirm: async () => {
        await loadRegularVehicles()
      },
    })
  } catch (e) {
    console.error(e)
    detailError.value = '고정방문차량 삭제에 실패했습니다.'
  } finally {
    deleteSubmitting.value = false
  }
}

// 등록 모달 열기와 입력값 초기화
const openCreateModal = () => {
  Object.assign(createForm, {
    building: '',
    unit: '',
    licensePlate: '',
    visitorName: '',
    phone: '',
    purposeSelect: '',
    purposeCustom: '',
    startDate: '',
    endDate: '',
  })
  createError.value = ''
  isCreateModalOpen.value = true
  // 모달을 먼저 열고 동/호 옵션은 비동기로 채움
  loadLocations()
}

// 등록 모달 닫기
const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

// 동 선택 변경 시 호 선택 초기화
const handleBuildingChange = () => {
  createForm.unit = ''
}

// 선택 또는 직접 입력값으로 최종 방문 목적 문자열 해석
const resolveVisitPurpose = () => {
  if (createForm.purposeSelect === VISIT_PURPOSE_CUSTOM) return createForm.purposeCustom.trim()
  return createForm.purposeSelect
}

// 등록 제출
const submitCreate = async () => {
  if (createSubmitting.value) return
  // 필수 입력값 검증
  if (!createForm.building || !createForm.unit) {
    createError.value = '동/호를 선택해주세요.'
    return
  }
  if (!createForm.licensePlate.trim()) {
    createError.value = '차량번호를 입력해주세요.'
    return
  }
  if (!createForm.startDate) {
    createError.value = '시작일을 입력해주세요.'
    return
  }
  // 기간 일관성 검증, 종료일이 시작일보다 앞서면 거부
  if (createForm.endDate && createForm.endDate < createForm.startDate) {
    createError.value = '종료일은 시작일 이후여야 합니다.'
    return
  }
  createSubmitting.value = true
  createError.value = ''
  // 제출 시점에 동/호로 세대 1건 조회해 householdId 확보
  let householdId = null
  try {
    const household = await householdStore.findHouseholdByAddress(createForm.building, createForm.unit)
    householdId = household?.householdId ?? null
  } catch (e) {
    console.error(e)
    createSubmitting.value = false
    createError.value = '세대 조회에 실패했습니다.'
    return
  }
  if (!householdId) {
    createSubmitting.value = false
    createError.value = '해당 동/호 세대를 찾을 수 없습니다.'
    return
  }
  await visitorVehicleStore.createAdminRegularVisitorVehicle({
    householdId,
    licensePlate: createForm.licensePlate.trim(),
    visitorName: createForm.visitorName.trim() || null,
    phone: createForm.phone.trim() || null,
    visitPurpose: resolveVisitPurpose() || null,
    startDate: createForm.startDate,
    endDate: createForm.endDate || null,
  })
  createSubmitting.value = false
  if (visitorVehicleStore.error) {
    createError.value = '고정방문차량 등록에 실패했습니다.'
    return
  }
  // 등록 항목명 캡처 후 결과 모달 노출
  const itemName = `${createForm.licensePlate.trim()} (${createForm.building}동 ${createForm.unit}호)`
  closeCreateModal()
  openResultModal({
    type: 'success',
    title: '고정방문차량이 등록되었습니다.',
    itemName,
    actionLabel: '고정방문차량 등록',
    afterConfirm: async () => {
      await loadRegularVehicles()
    },
  })
}

// 마운트 시 최초 조회, 세대 캐시는 목록과 독립적으로 로드
onMounted(async () => {
  if (registerOpenModal) {
    registerOpenModal(openCreateModal)
  }
  await loadRegularVehicles()
})

// 언마운트 시 헤더 액션 버튼 연결 해제
onUnmounted(() => {
  if (registerOpenModal) {
    registerOpenModal(null)
  }
})

// MASTER 단지 전환 시 필터와 세대 캐시 초기화 후 재조회
watch(
  () => complexStore.selectedComplex?.complexId,
  async (nextComplexId, prevComplexId) => {
    if (authStore.role !== 'MASTER' || !nextComplexId || nextComplexId === prevComplexId) return
    Object.assign(filter, initialFilter())
    currentPage.value = 1
    await loadRegularVehicles()
  },
)
</script>

<template>
  <section class="admin-page">
    <section class="admin-page__card">
      <!-- 필터바 -->
      <AdminFilterBar @search="handleSearch" @reset="handleReset">
        <input
          v-model="filter.keyword"
          type="text"
          class="filter-input"
          placeholder="차량번호, 방문자명 검색"
          @keyup.enter="handleSearch"
        />
        <select v-model="filter.isActive" class="filter-input" @change="handleSearch">
          <option v-for="opt in activeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button type="button" class="btn-search" @click="handleSearch">검색</button>
      </AdminFilterBar>

      <!-- 테이블 -->
      <div class="admin-page__table-shell">
        <div v-if="listLoading" class="table-feedback">고정방문차량 목록을 불러오는 중입니다.</div>
        <div v-else-if="listError" class="table-feedback error">{{ listError }}</div>
        <AdminTable
          v-else
          :columns="columns"
          :rows="rows"
          @row-click="handleRowClick"
        >
          <template #cell-rowNumber="{ row }">#{{ row.rowNumber }}</template>
          <template #cell-visitPurpose="{ row }">{{ row.visitPurpose || '-' }}</template>
          <template #cell-period="{ row }">{{ formatPeriod(row.startDate, row.endDate) }}</template>
          <template #cell-location="{ row }">
            {{ row.building || '-' }}동 {{ row.unit || '-' }}호
          </template>
          <template #cell-isActive="{ row }">
            <BaseBadge :variant="row.isActive ? 'success' : 'neutral'">
              {{ row.isActive ? '활성' : '비활성' }}
            </BaseBadge>
          </template>
          <template #cell-createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
        </AdminTable>
      </div>

      <!-- 페이지네이션 -->
      <AppPagination
        v-if="!listLoading && !listError && rows.length > 0"
        :current-page="currentPage"
        :total-pages="regularPage.totalPages"
        :total-all="regularPage.totalElements"
        :total-filtered="rows.length"
        unit="건"
        @change="handlePageChange"
      />
    </section>

    <!-- 고정방문차량 상세 모달 -->
    <BaseModal
      :visible="isDetailModalOpen"
      title="고정방문차량 상세 정보"
      subtitle="등록된 고정방문차량 정보를 확인하고 강제삭제할 수 있습니다."
      @close="closeDetailModal"
    >
      <div v-if="detailRow" class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">차량번호</span>
          <span class="detail-value">{{ detailRow.licensePlate || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">방문자명</span>
          <span class="detail-value">{{ detailRow.visitorName || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">연락처</span>
          <span class="detail-value">{{ detailRow.phone || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">등록 세대</span>
          <span class="detail-value">{{ detailRow.building || '-' }}동 {{ detailRow.unit || '-' }}호</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">세대주</span>
          <span class="detail-value">{{ detailRow.residentName || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">방문목적</span>
          <span class="detail-value">{{ detailRow.visitPurpose || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">기간</span>
          <span class="detail-value">{{ formatPeriod(detailRow.startDate, detailRow.endDate) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">활성여부</span>
          <span class="detail-value">
            <BaseBadge :variant="detailRow.isActive ? 'success' : 'neutral'">
              {{ detailRow.isActive ? '활성' : '비활성' }}
            </BaseBadge>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">등록일</span>
          <span class="detail-value">{{ formatDate(detailRow.createdAt) }}</span>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn-cancel" @click="closeDetailModal">닫기</button>
        <button type="button" class="btn-delete" @click="openDeleteConfirm">강제삭제</button>
      </template>
    </BaseModal>

    <!-- 고정방문차량 강제삭제 확인 모달 -->
    <ConfirmModal
      :visible="isForceDeleteOpen"
      title="이 고정방문차량을 강제삭제하시겠습니까?"
      subtitle="삭제 후 되돌릴 수 없습니다."
      subtitle-color="#e53e3e"
      item-label="차량번호"
      :item-name="detailRow?.licensePlate || '-'"
      action-label="강제삭제"
      confirm-text="삭제 확정"
      cancel-text="취소"
      confirm-type="danger"
      :loading="deleteSubmitting"
      @confirm="handleForceDelete"
      @cancel="closeDeleteConfirm"
    >
      <p v-if="detailError" class="form-error">{{ detailError }}</p>
    </ConfirmModal>

    <!-- 고정방문차량 등록 모달 -->
    <BaseModal
      :visible="isCreateModalOpen"
      title="고정방문차량 등록"
      subtitle="세대를 선택하고 고정방문차량 정보를 입력합니다."
      @close="closeCreateModal"
    >
      <div class="create-form">
        <div class="create-form__row create-form__row--split">
          <div>
            <label class="create-form__label">동</label>
            <select v-model="createForm.building" class="create-form__input" :disabled="locationsLoading" @change="handleBuildingChange">
              <option value="">{{ locationsLoading ? '불러오는 중...' : '동 선택' }}</option>
              <option v-for="building in buildingOptions" :key="building" :value="building">{{ building }}동</option>
            </select>
          </div>
          <div>
            <label class="create-form__label">호</label>
            <select v-model="createForm.unit" class="create-form__input" :disabled="!createForm.building || locationsLoading">
              <option value="">호 선택</option>
              <option v-for="unit in unitOptions" :key="unit" :value="unit">{{ unit }}호</option>
            </select>
          </div>
        </div>
        <p v-if="locationsError" class="create-form__error">
          {{ locationsError }}
          <button type="button" class="btn-retry" @click="loadLocations">다시 시도</button>
        </p>
        <div class="create-form__row">
          <label class="create-form__label">차량번호</label>
          <input v-model="createForm.licensePlate" type="text" class="create-form__input" placeholder="12가 3456" />
        </div>
        <div class="create-form__row">
          <label class="create-form__label">방문자명</label>
          <input v-model="createForm.visitorName" type="text" class="create-form__input" placeholder="선택 입력" />
        </div>
        <div class="create-form__row">
          <label class="create-form__label">연락처</label>
          <input v-model="createForm.phone" type="text" class="create-form__input" placeholder="선택 입력" />
        </div>
        <div class="create-form__row">
          <label class="create-form__label">방문목적</label>
          <select v-model="createForm.purposeSelect" class="create-form__input">
            <option value="">방문목적 선택</option>
            <option v-for="purpose in visitPurposePresets" :key="purpose" :value="purpose">{{ purpose }}</option>
            <option :value="purposeCustomValue">직접 입력</option>
          </select>
        </div>
        <div v-if="createForm.purposeSelect === purposeCustomValue" class="create-form__row">
          <label class="create-form__label">방문목적 직접 입력</label>
          <input v-model="createForm.purposeCustom" type="text" class="create-form__input" placeholder="방문 목적을 입력하세요" />
        </div>
        <div class="create-form__row create-form__row--split">
          <div>
            <label class="create-form__label">시작일</label>
            <input v-model="createForm.startDate" type="date" class="create-form__input" />
          </div>
          <div>
            <label class="create-form__label">종료일</label>
            <input v-model="createForm.endDate" type="date" class="create-form__input" />
          </div>
        </div>
        <p v-if="createError" class="create-form__error">{{ createError }}</p>
      </div>
      <template #footer>
        <button type="button" class="btn-cancel" :disabled="createSubmitting" @click="closeCreateModal">취소</button>
        <button type="button" class="btn-submit" :disabled="createSubmitting" @click="submitCreate">
          {{ createSubmitting ? '등록 중...' : '등록' }}
        </button>
      </template>
    </BaseModal>

    <!-- 처리 결과 알림 모달 -->
    <ActionResultModal
      :visible="resultModal.visible"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      :item-name="resultModal.itemName"
      :time="resultModal.time"
      :action-label="resultModal.actionLabel"
      :actor="resultModal.actor"
      @close="handleResultConfirm"
    />
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

.btn-retry {
  margin-left: var(--space-8);
  padding: 2px 8px;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-8);
  background: #ffffff;
  color: var(--color-danger);
  font-size: 12px;
  cursor: pointer;
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

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-detail);
}

.create-form {
  display: grid;
  gap: var(--space-16);
}

.create-form__row {
  display: grid;
  gap: var(--space-8);
}

.create-form__row--split {
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
}

.create-form__label {
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
  font-weight: 600;
}

.create-form__input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  font-size: var(--font-size-detail);
  box-sizing: border-box;
}

.create-form__error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-detail);
}

.btn-cancel,
.btn-submit,
.btn-delete {
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
  background: #ffffff;
  color: var(--color-text-secondary);
}

.btn-submit {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.btn-delete {
  border: 1px solid var(--color-danger);
  background: var(--color-danger);
  color: #ffffff;
}

.btn-submit:disabled,
.btn-cancel:disabled,
.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
