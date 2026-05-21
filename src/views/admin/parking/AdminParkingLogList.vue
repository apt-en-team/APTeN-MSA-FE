<script setup>
// 관리자 입출차 기록 목록 화면
// 상단 통계 카드 4장 + 필터 + 테이블 + 기록 등록 모달 구성
import { onMounted, reactive, ref, computed, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useParkingStore } from '@/stores/useParkingStore'
import { useAuthStore } from '@/stores/useAuthStore'
import StatsCards from '@/components/admin/StatsCards.vue'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import parkingApi from '@/api/parkingApi'

const parkingStore = useParkingStore()
const authStore = useAuthStore()

// AdminLayout 헤더 액션 버튼이 누를 함수를 등록한다.
const registerOpenModal = inject('registerOpenModal', null)

const { parkingLogPage, parkingLogSummary, parkingZones } = storeToRefs(parkingStore)

// 날짜 프리셋 옵션
const datePresetOptions = [
  { value: '', label: '전체 기간' },
  { value: 'today', label: '오늘' },
  { value: 'yesterday', label: '어제' },
  { value: 'thisWeek', label: '이번 주' },
]

// 필터 초기값
const initialFilter = () => ({
  licensePlate: '',
  entryType: '',
  vehicleCategory: '',
  datePreset: '',
})

const filter = reactive(initialFilter())
const pageSize = 9
const currentPage = ref(1)

// 등록 모달 상태
const isCreateModalOpen = ref(false)
const createForm = reactive({
  zoneId: '',
  licensePlate: '',
  entryType: 'IN',
  memo: '',
})
const createSubmitting = ref(false)
const createError = ref('')

// 활성 zone 목록 필터링 결과
const activeZones = computed(() => (parkingZones.value ?? []).filter((zone) => zone.isActive))

// 구역 표시 라벨 변환
const formatZoneLabel = (zone) => {
  if (!zone) return ''
  return zone.zoneName ? `${zone.areaName} / ${zone.zoneName}` : zone.areaName
}

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

// 테이블 컬럼 정의
const columns = [
  { key: 'rowNumber', label: 'ID' },
  { key: 'licensePlate', label: '차량번호' },
  { key: 'entryType', label: '입/출차' },
  { key: 'vehicleCategory', label: '차량 유형' },
  { key: 'loggedAt', label: '기록 시각' },
  { key: 'memo', label: '비고' },
]

// 통계 카드 데이터
// descClass: success(녹색) / warning(주황) / 빈 문자열(회색)
const summaryItems = computed(() => {
  const s = parkingLogSummary.value
  // 전일 대비 차이 표기 (+3, -1, 0)
  const formatDiff = (diff) => {
    if (diff > 0) return `전일 대비 +${diff}`
    if (diff < 0) return `전일 대비 ${diff}`
    return '전일 대비 동일'
  }

  return [
    {
      label: '오늘 입차',
      value: s.todayInCount,
      unit: '건',
      desc: formatDiff(s.todayInDiffFromYesterday),
      descClass: s.todayInDiffFromYesterday >= 0 ? 'success' : '',
    },
    {
      label: '오늘 출차',
      value: s.todayOutCount,
      unit: '건',
      desc: formatDiff(s.todayOutDiffFromYesterday),
      descClass: '',
    },
    {
      label: '미등록 차량',
      value: s.unregisteredCount,
      unit: '건',
      desc: '즉시 확인 필요',
      descClass: 'warning',
    },
    {
      label: '이번 달 전체',
      value: s.monthlyTotalCount,
      unit: '건',
      desc: `일 평균 ${s.monthlyDailyAverage}건`,
      descClass: '',
    },
  ]
})

// 날짜 프리셋을 fromDate, toDate로 변환
const resolveDateRange = (preset) => {
  const today = new Date()
  const toIso = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  if (preset === 'today') {
    const iso = toIso(today)
    return { fromDate: iso, toDate: iso }
  }
  if (preset === 'yesterday') {
    const y = new Date(today)
    y.setDate(y.getDate() - 1)
    const iso = toIso(y)
    return { fromDate: iso, toDate: iso }
  }
  if (preset === 'thisWeek') {
    // 이번 주 월요일부터 오늘까지
    const day = today.getDay() // 일=0, 월=1, ...
    const diffToMonday = day === 0 ? 6 : day - 1
    const monday = new Date(today)
    monday.setDate(monday.getDate() - diffToMonday)
    return { fromDate: toIso(monday), toDate: toIso(today) }
  }
  return { fromDate: '', toDate: '' }
}

// 빈 값 제외한 쿼리 파라미터 생성
const buildParams = () => {
  const params = {
    page: currentPage.value - 1,
    size: pageSize,
  }
  const range = resolveDateRange(filter.datePreset)
  if (range.fromDate) params.fromDate = range.fromDate
  if (range.toDate) params.toDate = range.toDate
  if (filter.licensePlate?.trim()) params.licensePlate = filter.licensePlate.trim()
  if (filter.entryType) params.entryType = filter.entryType
  if (filter.vehicleCategory) params.vehicleCategory = filter.vehicleCategory
  return params
}

// 현재 필터와 페이지로 입출차 로그 목록 조회
const loadLogs = () => parkingStore.fetchParkingLogs(buildParams())

// 통계 요약 조회
const loadSummary = () => parkingStore.fetchParkingLogSummary()

// 검색 클릭, 1페이지부터 재조회
const handleSearch = () => {
  currentPage.value = 1
  loadLogs()
}

// 필터 초기화 후 1페이지부터 재조회
const handleReset = () => {
  Object.assign(filter, initialFilter())
  currentPage.value = 1
  loadLogs()
}

// 페이지 변경 시 호출
const handlePageChange = (page) => {
  currentPage.value = page
  loadLogs()
}

// 기록 시각을 yyyy-MM-dd HH:mm 형태로 변환
const formatDateTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

// 입출차 enum에 따른 BaseBadge variant
const entryTypeVariant = (value) => {
  if (value === 'IN') return 'success'
  if (value === 'OUT') return 'danger'
  return 'neutral'
}

// 입출차 enum 한글 라벨
const entryTypeLabel = (value) => {
  if (value === 'IN') return '입차'
  if (value === 'OUT') return '출차'
  return value ?? '-'
}

// 차량 유형 enum에 따른 BaseBadge variant
// 등록 차량(RESIDENT)은 info, 미등록은 warning, 방문은 neutral, 고정 방문은 primary
const vehicleCategoryVariant = (value) => {
  if (value === 'RESIDENT') return 'info'
  if (value === 'UNREGISTERED') return 'warning'
  if (value === 'REGULAR_VISITOR') return 'primary'
  return 'neutral'
}

// 행 번호 계산 (현재 페이지 기준)
const getRowNumber = (index) => {
  return (currentPage.value - 1) * pageSize + index + 1
}

// 기록 등록 모달 열기
const openCreateModal = () => {
  Object.assign(createForm, {
    zoneId: '',
    licensePlate: '',
    entryType: 'IN',
    memo: '',
  })
  createError.value = ''
  isCreateModalOpen.value = true
}

// 기록 등록 모달 닫기
const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

// 기록 등록 제출
const submitCreate = async () => {
  if (!createForm.zoneId || !createForm.licensePlate?.trim()) {
    createError.value = '주차 구역과 차량번호를 입력해주세요'
    return
  }

  createSubmitting.value = true
  createError.value = ''
  try {
    await parkingApi.createParkingLog({
      zoneId: String(createForm.zoneId).trim(),
      licensePlate: createForm.licensePlate.trim(),
      entryType: createForm.entryType,
      loggedAt: new Date().toISOString(),
      memo: createForm.memo?.trim() || null,
    })
    // 등록 시점 폼 값 캡처, 모달이 다시 열리기 전에 안전 확보
    const licensePlate = createForm.licensePlate.trim()
    const selectedZone = activeZones.value.find(
      (zone) => String(zone.zoneId) === createForm.zoneId,
    )
    const zoneLabel = formatZoneLabel(selectedZone)
    const entryTypeText = createForm.entryType === 'IN' ? '입차' : '출차'
    const itemName = zoneLabel ? `${licensePlate} (${zoneLabel})` : licensePlate

    closeCreateModal()
    openResultModal({
      type: 'success',
      title: '입출차 기록이 등록되었습니다.',
      subtitle: '현재 시각으로 기록되었습니다.',
      itemName,
      actionLabel: `${entryTypeText} 등록`,
      afterConfirm: async () => {
        await Promise.all([loadLogs(), loadSummary()])
      },
    })
  } catch (e) {
    console.error(e)
    createError.value = e?.response?.data?.message || '등록 실패'
  } finally {
    createSubmitting.value = false
  }
}

// 마운트 시 최초 목록 + 통계 조회 + 기록 버튼
onMounted(() => {
  if (registerOpenModal) {
    registerOpenModal(openCreateModal)
  }
  loadLogs()
  loadSummary()
  if (!parkingZones.value || parkingZones.value.length === 0) {
    parkingStore.fetchParkingZones()
  }
})
</script>

<template>
  <section class="admin-page">
    <!-- 상단 통계 카드 4장 -->
    <StatsCards :stats="summaryItems" />

    <section class="admin-page__card">
      <!-- 필터바 + 등록 버튼 -->
      <AdminFilterBar @reset="handleReset">
        <input
          v-model="filter.licensePlate"
          type="text"
          class="filter-input"
          placeholder="차량번호 검색"
          @keyup.enter="handleSearch"
        />
        <select v-model="filter.entryType" class="filter-input">
          <option value="">입/출차</option>
          <option value="IN">입차</option>
          <option value="OUT">출차</option>
        </select>
        <select v-model="filter.vehicleCategory" class="filter-input">
          <option value="">차량 유형</option>
          <option value="RESIDENT">등록 차량</option>
          <option value="VISITOR">방문</option>
          <option value="REGULAR_VISITOR">고정 방문</option>
          <option value="UNREGISTERED">미등록</option>
        </select>
        <select v-model="filter.datePreset" class="filter-input">
          <option v-for="opt in datePresetOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button type="button" class="btn-search" @click="handleSearch">검색</button>
      </AdminFilterBar>

      <!-- 테이블 -->
      <AdminTable :columns="columns" :rows="parkingLogPage.content">
        <template #cell-rowNumber="{ row }">
          #{{ getRowNumber(parkingLogPage.content.indexOf(row)) }}
        </template>
        <template #cell-entryType="{ value }">
          <BaseBadge :variant="entryTypeVariant(value)">
            {{ entryTypeLabel(value) }}
          </BaseBadge>
        </template>
        <template #cell-vehicleCategory="{ row }">
          <BaseBadge :variant="vehicleCategoryVariant(row.vehicleCategory)">
            {{ row.vehicleCategoryLabel || '-' }}
          </BaseBadge>
        </template>
        <template #cell-loggedAt="{ value }">{{ formatDateTime(value) }}</template>
        <template #cell-memo="{ value }">{{ value || '-' }}</template>
      </AdminTable>

      <!-- 페이지네이션 -->
      <AppPagination
        :current-page="currentPage"
        :total-pages="parkingLogPage.totalPages"
        :total-all="parkingLogPage.totalElements"
        :total-filtered="parkingLogPage.totalElements"
        unit="건"
        @change="handlePageChange"
      />
    </section>

    <!-- 기록 등록 모달 -->
    <BaseModal
      :visible="isCreateModalOpen"
      title="입출차 수동 등록"
      subtitle="현재 시각으로 기록이 등록됩니다"
      @close="closeCreateModal"
    >
      <div class="create-form">
        <div class="create-form__row">
          <label class="create-form__label">주차 구역</label>
          <select v-model="createForm.zoneId" class="create-form__input">
            <option value="">구역 선택</option>
            <option
              v-for="zone in activeZones"
              :key="zone.zoneId"
              :value="String(zone.zoneId)"
            >
              {{ formatZoneLabel(zone) }}
            </option>
          </select>
        </div>
        <div class="create-form__row">
          <label class="create-form__label">차량번호</label>
          <input
            v-model="createForm.licensePlate"
            type="text"
            class="create-form__input"
            placeholder="12가 3456"
          />
        </div>
        <div class="create-form__row">
          <label class="create-form__label">입/출차</label>
          <select v-model="createForm.entryType" class="create-form__input">
            <option value="IN">입차</option>
            <option value="OUT">출차</option>
          </select>
        </div>
        <div class="create-form__row">
          <label class="create-form__label">비고</label>
          <input
            v-model="createForm.memo"
            type="text"
            class="create-form__input"
            placeholder="선택 입력"
          />
        </div>
        <p v-if="createError" class="create-form__error">{{ createError }}</p>
      </div>
      <template #footer>
        <button
          type="button"
          class="btn-cancel"
          :disabled="createSubmitting"
          @click="closeCreateModal"
        >
          취소
        </button>
        <button
          type="button"
          class="btn-submit"
          :disabled="createSubmitting"
          @click="submitCreate"
        >
          {{ createSubmitting ? '등록 중...' : '등록' }}
        </button>
      </template>
    </BaseModal>

    <!-- 등록 결과 알림 모달 -->
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

/* 등록 모달 폼 */
.create-form {
  display: grid;
  gap: var(--space-16);
}

.create-form__row {
  display: grid;
  gap: var(--space-8);
}

.create-form__label {
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
  font-weight: 600;
}

.create-form__input {
  height: 40px;
  padding: 0 var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  font-size: var(--font-size-detail);
}

.create-form__error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-detail);
}

.btn-cancel,
.btn-submit {
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

.btn-submit:disabled,
.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
