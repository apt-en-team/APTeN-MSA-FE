<script setup>
// 선택된 단지의 관리자와 스태프 계정을 관리하는 공통 관리자 화면
import { computed, inject, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { getComplexAdminRoleLabel } from '@/constants/complexCodes'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const authStore = useAuthStore()
const complexStore = useComplexStore()
const registerOpenModal = inject('registerOpenModal', null)

// 목록, 필터, 페이지네이션 상태
const state = reactive({
  listLoading: false,
  errorMessage: '',
  detailWarning: '',
  list: [],
  keyword: '',
  role: '',
  status: 'active',
  currentPage: 1,
  size: 10,
  maxPage: 1,
  totalElements: 0,
  submitting: false,
})

// 상세 모달 상태
const detailModal = reactive({
  show: false,
  admin: null,
})

// 등록/수정 공용 폼 모달 상태
const formModal = reactive({
  show: false,
  mode: 'create',
  adminId: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  role: '01',
  status: 'ACTIVE',
  error: '',
})

// 확인 모달 상태
const confirmModal = reactive({
  show: false,
  target: null,
  type: '',
})

// 결과 모달 상태
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

// 권한 필터 select에 사용할 옵션 목록이다.
const roleOptions = [
  { value: '', label: '전체' },
  { value: '01', label: '매니저' },
  { value: '02', label: '스태프' },
]

// 활성 여부 필터 select에 사용할 옵션 목록이다.
const activeOptions = [
  { value: '', label: '전체' },
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' },
]

// MASTER와 MANAGER만 관리자 관리 액션을 사용할 수 있다.
const canManageAdmins = computed(() => {
  return ['MASTER', 'MANAGER'].includes(authStore.role)
})

// 기본 관리자 목록 컬럼만 유지하고 관리 버튼은 action 슬롯으로만 처리한다.
const adminColumns = computed(() => {
  return [
    { key: 'number', label: '번호' },
    { key: 'name', label: '이름' },
    { key: 'email', label: '이메일' },
    { key: 'phone', label: '연락처' },
    { key: 'role', label: '권한' },
    { key: 'active', label: '활성 여부' },
    { key: 'assignedAt', label: '배정일' },
  ]
})

// 로그인한 사용자가 MASTER인지 확인한다.
const isMasterUser = computed(() => authStore.role === 'MASTER')

// 기존 MASTER 전용 URL로 진입한 경우에만 route params의 code를 임시 bootstrap 값으로 사용한다.
const legacyMasterRouteCode = computed(() => {
  if (!isMasterUser.value) {
    return ''
  }

  return String(route.params.code || '')
})

// 예전 MASTER 관리자 업무 URL로 직접 진입한 경우를 구분한다.
const isLegacyMasterRoute = computed(() => {
  return isMasterUser.value && route.path.startsWith('/admin/master/complexes/') && !!legacyMasterRouteCode.value
})

// MASTER와 일반 관리자 모드에 따라 현재 단지 정보를 다르게 계산한다.
const currentComplex = computed(() => {
  if (!isMasterUser.value) {
    return {
      complexId: complexStore.myComplex?.complexId ?? null,
      code: complexStore.myComplex?.code || '-',
      name: complexStore.myComplex?.name || '내 단지',
      status: complexStore.myComplex?.status ?? null,
      address: complexStore.myComplex?.address || '',
      updatedAt: complexStore.myComplex?.updatedAt || '',
    }
  }

  const base = {
    ...complexStore.complexDetail,
    ...complexStore.selectedComplex,
  }

  return {
    complexId: base?.complexId ?? null,
    code: base?.code || legacyMasterRouteCode.value || '-',
    name: base?.name || legacyMasterRouteCode.value || '선택 단지',
    status: base?.status ?? null,
    address: base?.address || '',
    updatedAt: base?.updatedAt || '',
    ...base,
  }
})

// 검색어와 권한, 활성 여부 필터를 현재 목록에 적용한다.
const filteredAdmins = computed(() => {
  return state.list.filter((admin) => {
    const keyword = state.keyword.trim().toLowerCase()
    const roleMatched = !state.role || String(admin?.adminRole || '') === state.role
    const activeMatched =
      !state.status ||
      (state.status === 'active' ? !!admin?.isActive : !admin?.isActive)

    const keywordMatched =
      !keyword ||
      String(admin?.name || '')
        .toLowerCase()
        .includes(keyword) ||
      String(admin?.email || '')
        .toLowerCase()
        .includes(keyword) ||
      String(admin?.userId || '')
        .toLowerCase()
        .includes(keyword)

    return roleMatched && activeMatched && keywordMatched
  })
})

// 필터 결과 기준 전체 페이지 수를 계산한다.
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredAdmins.value.length / state.size))
})

// 필터된 목록 기준으로 현재 페이지에 표시할 행만 잘라낸다.
const pagedAdmins = computed(() => {
  const startIndex = (state.currentPage - 1) * state.size
  const pagedRows = filteredAdmins.value.slice(startIndex, startIndex + state.size)

  return pagedRows.map((admin, index) => ({
    ...admin,
    number: startIndex + index + 1,
    email: admin?.email || '-',
    phone: admin?.phone || admin?.contact || '-',
    role: admin?.adminRoleName || getComplexAdminRoleLabel(admin?.adminRole),
    active: admin?.isActive ? '활성' : '비활성',
    assignedAt: formatDate(admin?.assignedAt || admin?.createdAt),
  }))
})

// 요약 카드에 표시할 운영 상태와 인원 수를 계산한다.
const summaryItems = computed(() => {
  const managerCount = state.list.filter((admin) => {
    return String(admin?.adminRole || '') === '01' || admin?.adminRoleName === '매니저'
  }).length

  const staffCount = state.list.filter((admin) => {
    return String(admin?.adminRole || '') === '02' || admin?.adminRoleName === '스태프'
  }).length

  return [
    {
      label: '관리 단지',
      value: currentComplex.value?.name || '선택 단지',
      unit: '',
      desc: currentComplex.value?.code || '-',
      descClass: '',
    },
    {
      label: '총 관리자 인원',
      value: state.list.length,
      unit: '명',
      desc: '현재 단지 소속 관리자 수',
      descClass: '',
    },
    {
      label: '매니저 수',
      value: managerCount,
      unit: '명',
      desc: '운영 책임 권한 계정',
      descClass: 'success',
    },
    {
      label: '스태프 수',
      value: staffCount,
      unit: '명',
      desc: '실무 운영 권한 계정',
      descClass: '',
    },
  ]
})

// 확인 모달에 표시할 대상 관리자
const confirmTarget = computed(() => {
  if (confirmModal.type === 'delete') {
    return confirmModal.target || {}
  }

  return {
    name: formModal.name,
    email: formModal.email,
    adminRole: formModal.role,
    adminRoleName: getComplexAdminRoleLabel(formModal.role),
  }
})

// 확인 모달 제목
const confirmTitle = computed(() => {
  if (confirmModal.type === 'create') return '관리자 계정을 등록하시겠습니까?'
  if (confirmModal.type === 'update') return '관리자 계정 정보를 수정하시겠습니까?'
  return '관리자 계정을 삭제하시겠습니까?'
})

// 확인 모달 설명
const confirmSubtitle = computed(() => {
  if (confirmModal.type === 'create') return '선택한 단지에 새로운 관리자 또는 스태프 계정을 생성합니다.'
  if (confirmModal.type === 'update') return '이름, 연락처, 권한, 활성 상태 변경 내용을 저장합니다.'
  return '삭제 후에는 관리자 목록에서 더 이상 표시되지 않습니다.'
})

// 확인 모달 버튼 문구
const confirmText = computed(() => {
  if (confirmModal.type === 'create') return '등록'
  if (confirmModal.type === 'update') return '수정'
  return '관리자 삭제'
})

// 확인 모달 액션 문구
const confirmActionText = computed(() => {
  if (confirmModal.type === 'create') return '관리자 계정 생성'
  if (confirmModal.type === 'update') return '관리자 계정 수정'
  return '관리자 삭제'
})

// 확인 모달 강조 타입
const confirmType = computed(() => {
  return confirmModal.type === 'delete' ? 'danger' : 'primary'
})

// API 실패 응답에서 사용자에게 보여줄 메시지를 꺼낸다.
function getErrorMessage(error, fallback = '잠시 후 다시 시도해주세요.') {
  const responseData = error?.response?.data

  if (responseData?.message) return responseData.message
  if (responseData?.data?.message) return responseData.data.message
  if (error?.data?.message) return error.data.message
  if (error?.message && !error.message.startsWith('Request failed with status code')) return error.message

  return fallback
}

// 처리 시각을 결과 모달에 표시할 문자열로 만든다.
function getCurrentTimeText() {
  return new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 로그인한 사용자 이름을 결과 모달 처리자로 표시한다.
function getCurrentActorName() {
  return authStore.userInfo?.name || authStore.user?.name || authStore.name || '관리자'
}

// 명시적 사용자 액션 결과는 ActionResultModal로 안내한다.
function openResultModal({
  type = 'success',
  title,
  subtitle = '',
  desc = '',
  itemName = '',
  time = '',
  actionLabel = '',
  actor = '',
  afterConfirm = null,
}) {
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

// ActionResultModal 확인 후 후속 처리 콜백을 실행한다.
async function handleResultConfirm() {
  const callback = resultModal.afterConfirm
  resultModal.show = false
  resultModal.afterConfirm = null

  if (typeof callback === 'function') {
    await callback()
  }
}

// 폼 모달 초기화
function resetFormModal() {
  formModal.mode = 'create'
  formModal.adminId = ''
  formModal.name = ''
  formModal.email = ''
  formModal.password = ''
  formModal.phone = ''
  formModal.role = '01'
  formModal.status = 'ACTIVE'
  formModal.error = ''
}

// 현재 모드에 맞는 단지 컨텍스트를 복구한다.
async function restoreComplexContext() {
  state.detailWarning = ''

  if (!isMasterUser.value) {
    try {
      await complexStore.fetchMyComplex()
    } catch (error) {
      console.error(error)
      state.detailWarning = '내 단지 정보를 불러오지 못했습니다.'
    }
    return true
  }

  // 기존 MASTER 전용 URL로 들어오면 단지 선택 정보를 먼저 저장해 공통 관리자 흐름으로 맞춘다.
  if (isLegacyMasterRoute.value) {
    try {
      await complexStore.selectComplexForMaster(legacyMasterRouteCode.value)
    } catch (error) {
      console.error(error)
      state.detailWarning = '관리할 단지 정보를 불러오지 못했습니다. 단지 선택 화면에서 다시 시도해주세요.'
      return false
    }
  } else {
    // 공통 관리자 화면에서는 세션에 저장된 선택 단지 정보만 복구해 사용한다.
    complexStore.restoreSelectedComplex()
  }

  if (!complexStore.selectedComplex?.complexId) {
    state.detailWarning = '관리할 단지를 먼저 선택해주세요.'
    return false
  }

  if (
    complexStore.selectedComplex?.code &&
    complexStore.complexDetail?.code === complexStore.selectedComplex.code
  ) {
    return true
  }

  try {
    // MASTER 모드에서는 선택 단지 상세를 조회해 카드 표시 정보를 보강한다.
    const detail = await complexStore.fetchMasterComplexDetail(complexStore.selectedComplex.code)
    complexStore.setSelectedComplex(detail)
    return true
  } catch (error) {
    console.error(error)
    state.detailWarning = '단지 상세 정보를 불러오지 못했습니다. code 기준으로 화면을 표시합니다.'
    return true
  }
}

// 관리자 목록 조회
async function fetchAdminList() {
  state.listLoading = true
  state.errorMessage = ''

  try {
    // MASTER는 선택 단지 header를 통해, 일반 관리자는 내 단지 기준으로 같은 공통 API를 사용한다.
    if (isMasterUser.value && !complexStore.selectedComplex?.complexId) {
      state.errorMessage = '관리할 단지를 먼저 선택해주세요.'
      state.list = []
      state.totalElements = 0
      return
    }

    const admins = await complexStore.fetchMyComplexAdmins()
    state.list = Array.isArray(admins) ? admins : []
    state.totalElements = state.list.length
    state.maxPage = Math.max(1, Math.ceil(state.totalElements / state.size))
  } catch (error) {
    console.error(error)
    state.list = []
    state.totalElements = 0
    state.errorMessage = '관리자 목록을 불러오지 못했습니다.'
  } finally {
    state.listLoading = false
  }
}

// 검색 실행
function doSearch() {
  state.currentPage = 1
}

// 필터 초기화
function resetFilters() {
  state.keyword = ''
  state.role = ''
  state.status = 'active'
  state.currentPage = 1
}

// 페이지 변경 처리
function goToPage(page) {
  state.currentPage = page
}

// 상세 모달 열기
function openDetailModal(admin) {
  detailModal.admin = admin
  detailModal.show = true
}

// 상세 모달 닫기
function closeDetailModal() {
  detailModal.show = false
  detailModal.admin = null
}

// 신규 등록 모달 열기
function openCreateModal() {
  resetFormModal()
  formModal.mode = 'create'
  formModal.show = true
}

// 수정 모달 열기
function openEditModal(admin) {
  resetFormModal()
  formModal.mode = 'edit'
  formModal.adminId = String(admin?.userId || '')
  formModal.name = admin?.name || ''
  formModal.email = admin?.email || ''
  formModal.phone = admin?.phone || admin?.contact || ''
  formModal.role = admin?.adminRole || '01'
  formModal.status = admin?.isActive ? 'ACTIVE' : 'INACTIVE'
  formModal.show = true
}

// 등록/수정 모달 닫기
function closeFormModal() {
  formModal.show = false
  closeConfirmModal()
  resetFormModal()
}

// 폼 필수값 검증
function validateFormModal() {
  formModal.error = ''

  if (!formModal.name.trim()) {
    formModal.error = '이름을 입력해주세요.'
    return false
  }

  if (!formModal.email.trim()) {
    formModal.error = '이메일을 입력해주세요.'
    return false
  }

  if (formModal.mode === 'create' && !formModal.password.trim()) {
    formModal.error = '초기 비밀번호를 입력해주세요.'
    return false
  }

  if (!formModal.role) {
    formModal.error = '권한을 선택해주세요.'
    return false
  }

  return true
}

// 등록/수정 확인 모달 열기
function submitAdminForm() {
  if (!validateFormModal()) return

  openConfirmModal(null, formModal.mode === 'create' ? 'create' : 'update')
}

// 확인 모달 열기
function openConfirmModal(admin, type) {
  confirmModal.target = admin
  confirmModal.type = type
  confirmModal.show = true
}

// 삭제 확인 모달 열기
function openDeleteConfirm() {
  openConfirmModal(
    {
      userId: formModal.adminId,
      name: formModal.name,
      email: formModal.email,
      adminRole: formModal.role,
      adminRoleName: getComplexAdminRoleLabel(formModal.role),
    },
    'delete',
  )
}

// 확인 모달 닫기
function closeConfirmModal() {
  confirmModal.show = false
  confirmModal.target = null
  confirmModal.type = ''
}

// 확인 모달 액션 처리
async function handleConfirmAction() {
  if (state.submitting) return
  if (isMasterUser.value && !complexStore.selectedComplex?.complexId) return

  const actionType = confirmModal.type
  state.submitting = true
  formModal.error = ''
  resultModal.show = false

  try {
    if (actionType === 'create') {
      await createAdmin()
    } else if (actionType === 'update') {
      await updateAdmin()
    } else if (actionType === 'delete') {
      await deleteAdmin()
    }
  } catch (error) {
    console.error(error)
    closeConfirmModal()

    if (actionType === 'create' || actionType === 'update') {
      formModal.error = getErrorMessage(error, '입력값을 확인한 뒤 다시 시도해주세요.')
    } else {
      openResultModal({
        type: 'error',
        title: '관리자 삭제에 실패했습니다.',
        subtitle: getErrorMessage(error, '잠시 후 다시 시도해주세요.'),
      })
    }
  } finally {
    state.submitting = false
  }
}

// 관리자 등록 요청
async function createAdmin() {
  const submitData = {
    name: formModal.name,
    email: formModal.email,
    password: formModal.password,
    phone: formModal.phone,
    adminRole: formModal.role,
  }

  await complexStore.createAdminForMyComplex(submitData)

  const createdName = formModal.name || '관리자 계정'
  const createdRole = getComplexAdminRoleLabel(formModal.role)

  formModal.show = false
  closeConfirmModal()
  resetFormModal()

  openResultModal({
    type: 'success',
    title: '관리자 계정이 등록되었습니다.',
    subtitle: '선택한 단지에 관리자 또는 스태프 계정이 추가되었습니다.',
    itemName: createdName,
    time: getCurrentTimeText(),
    actionLabel: `${createdRole} 등록`,
    actor: getCurrentActorName(),
    afterConfirm: fetchAdminList,
  })
}

// 관리자 수정 요청
async function updateAdmin() {
  if (!formModal.adminId) return

  const submitData = {
    name: formModal.name,
    phone: formModal.phone,
    adminRole: formModal.role,
    isActive: formModal.status === 'ACTIVE',
  }

  await complexStore.updateAdminForMyComplex(formModal.adminId, submitData)

  const updatedName = formModal.name || '관리자 계정'
  const updatedRole = getComplexAdminRoleLabel(formModal.role)

  formModal.show = false
  closeConfirmModal()
  resetFormModal()

  openResultModal({
    type: 'success',
    title: '관리자 계정 정보가 수정되었습니다.',
    subtitle: '권한과 활성 여부가 최신 상태로 반영되었습니다.',
    itemName: updatedName,
    time: getCurrentTimeText(),
    actionLabel: `${updatedRole} 정보 수정`,
    actor: getCurrentActorName(),
    afterConfirm: fetchAdminList,
  })
}

// 관리자 삭제 요청
async function deleteAdmin() {
  const target = confirmModal.target

  if (!target?.userId) return

  const deletedName = target?.name || '관리자 계정'
  const deletedRole = target?.adminRoleName || getComplexAdminRoleLabel(target?.adminRole)

  await complexStore.deleteAdminFromMyComplex(target.userId)

  formModal.show = false
  closeConfirmModal()
  resetFormModal()

  openResultModal({
    type: 'success',
    title: '관리자 계정이 삭제되었습니다.',
    subtitle: '해당 계정의 단지 소속 해제 요청이 처리되었습니다.',
    itemName: deletedName,
    time: getCurrentTimeText(),
    actionLabel: `${deletedRole} 관리자 삭제`,
    actor: getCurrentActorName(),
    afterConfirm: fetchAdminList,
  })
}

// 날짜 값은 표와 요약 영역에서 간단히 잘라서 표시한다.
function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

// 화면 최초 진입 시 단지 컨텍스트를 복구하고 목록을 조회한다.
onMounted(async () => {
  // 관리자 관리 페이지에서는 레이아웃 상단 버튼으로 등록 모달을 열 수 있게 연결한다.
  if (typeof registerOpenModal === 'function') {
    registerOpenModal(openCreateModal)
  }

  const isReady = await restoreComplexContext()

  if (isReady) {
    await fetchAdminList()
  }
})

// 필터 변경 시 첫 페이지로 이동
watch(
  () => [state.keyword, state.role, state.status],
  () => {
    doSearch()
  },
)

// 페이지를 벗어날 때는 레이아웃 상단 버튼 연결을 정리한다.
onUnmounted(() => {
  if (typeof registerOpenModal === 'function') {
    registerOpenModal(null)
  }
})
</script>

<template>
  <section class="manage-page">
    <StatsCards :stats="summaryItems" />

    <div class="card-shell">
      <AdminFilterBar @reset="resetFilters">
        <input
          v-model="state.keyword"
          class="filter-input"
          type="text"
          placeholder="이름 또는 이메일 검색"
        />
        <select v-model="state.role" class="filter-select">
          <option v-for="item in roleOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
        <select v-model="state.status" class="filter-select">
          <option v-for="item in activeOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </AdminFilterBar>

      <div class="manage-page__table-shell">
        <div v-if="state.listLoading" class="table-feedback">관리자 목록을 불러오는 중입니다.</div>
        <div v-else-if="state.errorMessage" class="table-feedback error">{{ state.errorMessage }}</div>
        <div v-else-if="filteredAdmins.length === 0" class="table-feedback">
          등록된 관리자/스태프가 없습니다.
        </div>
        <AdminTable v-else :columns="adminColumns" :rows="pagedAdmins">
          <template #cell-role="{ row }">
            {{ row.role }}
          </template>
          <template #cell-active="{ row }">
            <span :class="['status-badge', row.active === '활성' ? 'is-active' : 'is-inactive']">
              {{ row.active }}
            </span>
          </template>
          <template v-if="canManageAdmins" #action="{ row }">
            <div class="table-actions">
              <button type="button" class="table-action-button" @click.stop="openEditModal(row)">
                수정
              </button>
            </div>
          </template>
        </AdminTable>
      </div>

      <div class="manage-page__pagination">
        <AppPagination
          v-if="!state.listLoading && filteredAdmins.length > 0"
          :current-page="state.currentPage"
          :total-pages="totalPages"
          :total-all="state.list.length"
          :total-filtered="filteredAdmins.length"
          @change="goToPage"
        />
      </div>
    </div>

    <BaseModal
      :visible="formModal.show"
      :title="formModal.mode === 'create' ? '관리자 계정 등록' : '관리자 계정 수정'"
      :subtitle="formModal.mode === 'create'
        ? '선택한 단지에 소속될 관리자 또는 스태프 계정을 생성합니다.'
        : '선택한 단지 내 권한과 활성 상태를 수정합니다.'"
      @close="closeFormModal"
    >
      <div class="form-grid">
        <label class="form-field">
          <span>이름</span>
          <input v-model="formModal.name" type="text" placeholder="이름" />
        </label>
        <label class="form-field">
          <span>이메일</span>
          <input
            v-model="formModal.email"
            type="email"
            placeholder="admin@example.com"
            :readonly="formModal.mode === 'edit'"
          />
        </label>
        <label v-if="formModal.mode === 'create'" class="form-field">
          <span>비밀번호</span>
          <input v-model="formModal.password" type="password" placeholder="초기 비밀번호" />
        </label>
        <label class="form-field">
          <span>연락처</span>
          <input v-model="formModal.phone" type="text" placeholder="010-0000-0000" />
        </label>
        <label class="form-field">
          <span>권한</span>
          <select v-model="formModal.role">
            <option value="01">매니저</option>
            <option value="02">스태프</option>
          </select>
        </label>
        <label v-if="formModal.mode === 'edit'" class="form-field">
          <span>활성 여부</span>
          <select v-model="formModal.status">
            <option value="ACTIVE">활성</option>
            <option value="INACTIVE">비활성</option>
          </select>
        </label>
      </div>

      <p v-if="formModal.error" class="form-feedback error">{{ formModal.error }}</p>

      <template #footer>
        <button
          v-if="formModal.mode === 'create'"
          type="button"
          class="page-button page-button--ghost"
          @click="closeFormModal"
        >
          취소
        </button>
        <button
          v-if="formModal.mode === 'edit' && canManageAdmins"
          type="button"
          class="page-button page-button--danger"
          :disabled="state.submitting"
          @click="openDeleteConfirm"
        >
          {{ state.submitting ? '처리 중...' : '관리자 삭제' }}
        </button>
        <button
          type="button"
          class="page-button page-button--primary"
          :disabled="state.submitting"
          @click="submitAdminForm"
        >
          {{ state.submitting ? '처리 중...' : formModal.mode === 'create' ? '등록' : '수정' }}
        </button>
      </template>
    </BaseModal>

    <ConfirmModal
      :visible="confirmModal.show"
      :title="confirmTitle"
      :subtitle="confirmSubtitle"
      :subtitle-color="confirmModal.type === 'delete' ? '#E53E3E' : ''"
      item-label="계정"
      :item-name="confirmTarget?.name || '관리자 계정'"
      :action-label="confirmTarget?.adminRoleName || getComplexAdminRoleLabel(confirmTarget?.adminRole)"
      :action-text="confirmActionText"
      :extra-value="confirmTarget?.email"
      extra-label="이메일"
      :confirm-text="confirmText"
      cancel-text="취소"
      :confirm-type="confirmType"
      :loading="state.submitting"
      @confirm="handleConfirmAction"
      @cancel="closeConfirmModal"
    />

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
      @close="handleResultConfirm"
    />
  </section>
</template>

<style scoped>
.page-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.page-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.page-button--ghost {
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #1A202C;
}

.page-button--primary {
  border: none;
  background: #2B3A55;
  color: #FFFFFF;
}

.page-button--danger {
  border: none;
  background: #E53E3E;
  color: #FFFFFF;
}

.manage-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-shell {
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  background: #FFFFFF;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.manage-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
}

.manage-page__hero-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
}

.manage-page__eyebrow {
  margin: 0;
  color: #687282;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.manage-page__title {
  margin: 0;
  color: #1A202C;
  font-size: 24px;
  font-weight: 700;
}

.manage-page__subtext {
  margin: 0;
  color: #687282;
  font-size: 13px;
}

.manage-page__address {
  margin: 0;
  color: #475467;
  font-size: 13px;
  line-height: 1.6;
}

.manage-page__warning {
  margin: 0;
  color: #C08B2D;
  font-size: 12px;
}

.manage-page__table-shell {
  background: #FFFFFF;
}

.manage-page__pagination {
  padding: 0 20px 20px;
}

.filter-input,
.filter-select,
.form-field input,
.form-field select {
  min-width: 160px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #FFFFFF;
  color: #1A202C;
  font: inherit;
  font-size: 13px;
}

.table-feedback {
  padding: 32px 20px;
  color: #687282;
  font-size: 13px;
  text-align: center;
}

.table-feedback.error {
  color: #E53E3E;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.is-active {
  background: rgba(77, 139, 90, 0.12);
  color: #4D8B5A;
}

.status-badge.is-inactive {
  background: rgba(229, 62, 62, 0.12);
  color: #E53E3E;
}

.table-actions {
  display: inline-flex;
  gap: 8px;
}

.table-action-button {
  min-width: 58px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  background: #FFFFFF;
  color: #1A202C;
  font-size: 12px;
  cursor: pointer;
}

.table-action-button.danger {
  color: #E53E3E;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-field {
  display: grid;
  gap: 8px;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field span {
  color: #687282;
  font-size: 12px;
}

.form-feedback {
  margin: 16px 0 0;
  color: #687282;
  font-size: 12px;
}

.form-feedback.error {
  color: #E53E3E;
}

@media (max-width: 760px) {
  .manage-page__hero,
  .page-header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
