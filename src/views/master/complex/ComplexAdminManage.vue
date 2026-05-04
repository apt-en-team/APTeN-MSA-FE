<script setup>
// 선택된 단지의 관리자와 스태프 계정을 관리하는 MASTER 전용 화면이다.
import { computed, onMounted, reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { getComplexAdminRoleLabel, getComplexStatusLabel } from '@/constants/complexCodes'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()

const state = reactive({
  listLoading: false,
  errorMessage: '',
  detailWarning: '',
  filters: {
    keyword: '',
    role: '',
    active: '',
  },
  pagination: {
    currentPage: 1,
    pageSize: 10,
  },
  modals: {
    create: false,
    edit: false,
    createConfirm: false,
    editConfirm: false,
    deleteConfirm: false,
  },
  createSubmitting: false,
  editSubmitting: false,
  deleteSubmitting: false,
  createErrorMessage: '',
  editErrorMessage: '',
  createForm: {
    name: '',
    email: '',
    password: '',
    phone: '',
    adminRole: '01',
  },
  editForm: {
    userId: '',
    name: '',
    email: '',
    phone: '',
    adminRole: '01',
    isActive: true,
  },
  selectedAdmin: null,
  resultModal: {
    visible: false,
    type: 'success',
    title: '',
    subtitle: '',
    desc: '',
    afterConfirm: null,
  },
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

const adminColumns = [
  { key: 'number', label: '번호' },
  { key: 'name', label: '이름' },
  { key: 'email', label: '이메일' },
  { key: 'phone', label: '연락처' },
  { key: 'role', label: '권한' },
  { key: 'active', label: '활성 여부' },
  { key: 'assignedAt', label: '배정일' },
]

// route params의 code를 현재 단지 식별값으로 사용한다.
const complexCode = computed(() => String(route.params.code || ''))

// 선택 단지와 상세 조회 결과를 합쳐 화면에서 사용할 단지 정보를 만든다.
const currentComplex = computed(() => {
  const base =
    complexStore.selectedComplex?.code === complexCode.value
      ? {
          ...complexStore.complexDetail,
          ...complexStore.selectedComplex,
        }
      : {
          ...complexStore.complexDetail,
          ...complexStore.selectedComplex,
        }

  return {
    complexId: base?.complexId ?? null,
    code: base?.code || complexCode.value || '-',
    name: base?.name || complexCode.value || '선택 단지',
    status: base?.status ?? null,
    address: base?.address || '',
    updatedAt: base?.updatedAt || '',
    ...base,
  }
})

// legacy AdminLayout에 표시할 메뉴 그룹을 구성한다.
const navGroups = computed(() => [
  {
    label: 'MASTER ADMIN',
    items: [
      {
        label: '단지 대시보드',
        to: `/admin/master/complexes/${complexCode.value}/dashboard`,
      },
      {
        label: '관리자 관리',
        to: `/admin/master/complexes/${complexCode.value}/admins`,
      },
    ],
  },
])

// 레이아웃 프로필 영역에 표시할 사용자 이름을 계산한다.
const profileName = computed(() => {
  return authStore.name || authStore.user?.name || '마스터 관리자'
})

// 현재 라우트 active 여부를 메뉴 강조에 사용한다.
function isMenuActive(targetPath) {
  return route.path === targetPath || route.path.startsWith(`${targetPath}/`)
}

// store의 관리자 목록을 항상 배열로 정리해 사용한다.
const adminList = computed(() => {
  return Array.isArray(complexStore.complexAdmins) ? complexStore.complexAdmins : []
})

// 검색어와 권한, 활성 여부 필터를 현재 목록에 적용한다.
const filteredAdmins = computed(() => {
  return adminList.value.filter((admin) => {
    const keyword = state.filters.keyword.trim().toLowerCase()
    const roleMatched = !state.filters.role || String(admin?.adminRole || '') === state.filters.role
    const activeMatched =
      !state.filters.active ||
      (state.filters.active === 'active' ? !!admin?.isActive : !admin?.isActive)

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
  return Math.max(1, Math.ceil(filteredAdmins.value.length / state.pagination.pageSize))
})

// 필터된 목록 기준으로 현재 페이지에 표시할 행만 잘라낸다.
const pagedAdmins = computed(() => {
  const startIndex = (state.pagination.currentPage - 1) * state.pagination.pageSize
  const pagedRows = filteredAdmins.value.slice(startIndex, startIndex + state.pagination.pageSize)

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
  const managerCount = adminList.value.filter((admin) => {
    return String(admin?.adminRole || '') === '01' || admin?.adminRoleName === '매니저'
  }).length

  const staffCount = adminList.value.filter((admin) => {
    return String(admin?.adminRole || '') === '02' || admin?.adminRoleName === '스태프'
  }).length

  return [
    { label: '운영 상태', value: getComplexStatusLabel(currentComplex.value?.status) },
    { label: '총 관리자 인원', value: `${adminList.value.length}명` },
    { label: '매니저 수', value: `${managerCount}명` },
    { label: '스태프 수', value: `${staffCount}명` },
  ]
})

// 명시적 사용자 액션 결과는 ActionResultModal로 안내한다.
function openResultModal({
  type = 'success',
  title,
  subtitle = '',
  desc = '',
  afterConfirm = null,
}) {
  state.resultModal.visible = true
  state.resultModal.type = type
  state.resultModal.title = title
  state.resultModal.subtitle = subtitle
  state.resultModal.desc = desc
  state.resultModal.afterConfirm = afterConfirm
}

// ActionResultModal 확인 후 후속 처리 콜백을 실행한다.
async function handleResultConfirm() {
  const callback = state.resultModal.afterConfirm

  state.resultModal.visible = false
  state.resultModal.afterConfirm = null

  if (typeof callback === 'function') {
    await callback()
  }
}

// 등록 모달을 닫을 때 폼과 에러 상태를 초기화한다.
function resetCreateForm() {
  state.createForm.name = ''
  state.createForm.email = ''
  state.createForm.password = ''
  state.createForm.phone = ''
  state.createForm.adminRole = '01'
  state.createErrorMessage = ''
  state.createSubmitting = false
}

// 수정 모달을 닫을 때 폼과 에러 상태를 초기화한다.
function resetEditForm() {
  state.editForm.userId = ''
  state.editForm.name = ''
  state.editForm.email = ''
  state.editForm.phone = ''
  state.editForm.adminRole = '01'
  state.editForm.isActive = true
  state.selectedAdmin = null
  state.editErrorMessage = ''
  state.editSubmitting = false
  state.deleteSubmitting = false
}

// store에 선택 단지 정보가 없으면 localStorage 복구와 상세 조회를 순서대로 시도한다.
async function restoreComplexContext() {
  state.detailWarning = ''
  complexStore.restoreSelectedComplex()

  if (!complexCode.value) {
    // 초기 자동 조회 실패는 화면을 막지 않고 inline 안내로 표시한다.
    state.detailWarning = '단지 코드를 확인할 수 없습니다. 단지 선택 화면에서 다시 진입해주세요.'
    return false
  }

  if (
    complexStore.selectedComplex?.code === complexCode.value &&
    complexStore.complexDetail?.code === complexCode.value
  ) {
    return true
  }

  try {
    const detail = await complexStore.fetchMasterComplexDetail(complexCode.value)
    complexStore.setSelectedComplex(detail)
    return true
  } catch (error) {
    console.error(error)
    // 단지 상세 조회가 실패해도 route code 기준으로 화면 진입은 유지한다.
    state.detailWarning = '단지 상세 정보를 불러오지 못했습니다. code 기준으로 화면을 표시합니다.'
    return true
  }
}

// route code 기준으로 관리자/스태프 목록을 조회한다.
async function loadAdmins() {
  if (!complexCode.value) {
    state.errorMessage = '단지 코드를 확인할 수 없습니다.'
    complexStore.complexAdmins = []
    return
  }

  state.listLoading = true
  state.errorMessage = ''

  try {
    await complexStore.fetchComplexAdmins(complexCode.value)
  } catch (error) {
    console.error(error)
    // 초기 목록 조회 실패는 modal이 아니라 inline 에러로 표시한다.
    complexStore.complexAdmins = []
    state.errorMessage = '관리자 목록을 불러오지 못했습니다.'
  } finally {
    state.listLoading = false
  }
}

// 필터 초기화
function resetFilters() {
  state.filters.keyword = ''
  state.filters.role = ''
  state.filters.active = ''
  state.pagination.currentPage = 1
}

// 페이지 변경 처리
function handlePageChange(page) {
  state.pagination.currentPage = page
}

// 단지 선택 홈으로 이동한다.
function goToComplexList() {
  router.push('/admin/master')
}

// 관리자 관리 화면에서 대시보드로 돌아간다.
function goToDashboard() {
  router.push(`/admin/master/complexes/${complexCode.value}/dashboard`)
}

// 신규 등록 모달을 열기 전에 폼 상태를 초기화한다.
function openCreateModal() {
  resetCreateForm()
  state.modals.create = true
}

// 신규 등록 모달을 닫을 때 관련 상태를 함께 정리한다.
function closeCreateModal() {
  state.modals.create = false
  state.modals.createConfirm = false
  resetCreateForm()
}

// 목록에서 선택한 관리자 정보를 수정 모달 초기값으로 복사한다.
function openEditModal(admin) {
  state.selectedAdmin = admin
  state.editForm.userId = String(admin?.userId || '')
  state.editForm.name = admin?.name || ''
  state.editForm.email = admin?.email || ''
  state.editForm.phone = admin?.phone || admin?.contact || ''
  state.editForm.adminRole = admin?.adminRole || '01'
  state.editForm.isActive = !!admin?.isActive
  state.editErrorMessage = ''
  state.modals.edit = true
}

// 수정 모달을 닫을 때 수정/삭제 관련 상태를 함께 정리한다.
function closeEditModal() {
  state.modals.edit = false
  state.modals.editConfirm = false
  state.modals.deleteConfirm = false
  resetEditForm()
}

// 등록 전 ConfirmModal을 연다.
function openCreateConfirm() {
  state.modals.createConfirm = true
}

// 수정 전 ConfirmModal을 연다.
function openEditConfirm() {
  state.modals.editConfirm = true
}

// 소속 해제 전 ConfirmModal을 연다.
function openDeleteConfirm(admin) {
  state.selectedAdmin = admin
  state.modals.deleteConfirm = true
}

// 등록 폼 값을 백엔드 요청 DTO에 맞게 변환한다.
function buildCreatePayload() {
  return {
    name: state.createForm.name,
    email: state.createForm.email,
    password: state.createForm.password,
    phone: state.createForm.phone,
    adminRole: state.createForm.adminRole,
  }
}

// 수정 폼 값을 백엔드 요청 DTO에 맞게 변환한다.
function buildUpdatePayload() {
  return {
    name: state.editForm.name,
    phone: state.editForm.phone,
    adminRole: state.editForm.adminRole,
    isActive: state.editForm.isActive,
  }
}

// 등록 ConfirmModal 확인 후 관리자/스태프 등록 API를 호출한다.
async function handleCreateAdmin() {
  if (!complexCode.value || state.createSubmitting) return

  state.modals.createConfirm = false
  state.createSubmitting = true
  state.createErrorMessage = ''

  try {
    await complexStore.createAdminForComplex(complexCode.value, buildCreatePayload())

    state.modals.create = false
    resetCreateForm()

    openResultModal({
      type: 'success',
      title: '관리자 계정이 등록되었습니다.',
      subtitle: '선택한 단지에 관리자 또는 스태프 계정이 추가되었습니다.',
      afterConfirm: async () => {
        await loadAdmins()
      },
    })
  } catch (error) {
    console.error(error)
    state.createErrorMessage = error?.message || '입력값을 확인한 뒤 다시 시도해주세요.'
    openResultModal({
      type: 'danger',
      title: '관리자 계정 등록에 실패했습니다.',
      subtitle: state.createErrorMessage,
    })
  } finally {
    state.createSubmitting = false
  }
}

// 수정 ConfirmModal 확인 후 관리자/스태프 수정 API를 호출한다.
async function handleUpdateAdmin() {
  if (!complexCode.value || !state.selectedAdmin?.userId || state.editSubmitting) return

  state.modals.editConfirm = false
  state.editSubmitting = true
  state.editErrorMessage = ''

  try {
    await complexStore.updateAdminForComplex(
      complexCode.value,
      state.selectedAdmin.userId,
      buildUpdatePayload(),
    )

    state.modals.edit = false
    resetEditForm()

    openResultModal({
      type: 'success',
      title: '관리자 계정 정보가 수정되었습니다.',
      subtitle: '권한과 활성 여부가 최신 상태로 반영되었습니다.',
      afterConfirm: async () => {
        await loadAdmins()
      },
    })
  } catch (error) {
    console.error(error)
    state.editErrorMessage = error?.message || '잠시 후 다시 시도해주세요.'
    openResultModal({
      type: 'danger',
      title: '관리자 계정 수정에 실패했습니다.',
      subtitle: state.editErrorMessage,
    })
  } finally {
    state.editSubmitting = false
  }
}

// 소속 해제 ConfirmModal 확인 후 관리자/스태프 삭제 API를 호출한다.
async function handleDeleteAdmin() {
  if (!complexCode.value || !state.selectedAdmin?.userId || state.deleteSubmitting) return

  state.modals.deleteConfirm = false
  state.deleteSubmitting = true
  state.editErrorMessage = ''

  try {
    await complexStore.deleteAdminFromComplex(complexCode.value, state.selectedAdmin.userId)
    resetEditForm()

    openResultModal({
      type: 'success',
      title: '관리자 계정이 소속 해제되었습니다.',
      subtitle: '해당 계정의 단지 소속 해제 요청이 처리되었습니다.',
      afterConfirm: async () => {
        await loadAdmins()
      },
    })
  } catch (error) {
    console.error(error)
    state.editErrorMessage = error?.message || '잠시 후 다시 시도해주세요.'
    openResultModal({
      type: 'danger',
      title: '관리자 계정 소속 해제에 실패했습니다.',
      subtitle: state.editErrorMessage,
    })
  } finally {
    state.deleteSubmitting = false
  }
}

// 날짜 값은 표와 요약 영역에서 간단히 잘라서 표시한다.
function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

// 화면 최초 진입 시 단지 컨텍스트를 복구하고 목록을 조회한다.
onMounted(async () => {
  const isReady = await restoreComplexContext()

  if (isReady) {
    await loadAdmins()
  }
})
</script>

<template>
  <!-- legacy AdminLayout 안에서 관리자 관리 화면을 구성한다. -->
  <AdminLayout
    title="관리자 관리"
    subtitle="선택한 단지의 매니저와 스태프 계정을 관리합니다."
    :nav-groups="navGroups"
    :profile-name="profileName"
    profile-role="MASTER"
  >
    <template #nav="{ group }">
      <RouterLink
        v-for="item in group.items || []"
        :key="item.to"
        :to="item.to"
        class="layout-nav-link"
        :class="{ 'is-active': isMenuActive(item.to) }"
      >
        {{ item.label }}
      </RouterLink>
    </template>

    <template #header-actions>
      <div class="page-header-actions">
        <button type="button" class="page-button page-button--ghost" @click="goToComplexList">
          단지 선택
        </button>
        <button type="button" class="page-button page-button--primary" @click="goToDashboard">
          대시보드
        </button>
      </div>
    </template>

    <!-- 선택 단지 요약 카드와 목록 영역을 순서대로 배치한다. -->
    <section class="manage-page">
      <div class="manage-page__context card-shell">
        <div class="manage-page__context-main">
          <p class="manage-page__eyebrow">SELECTED COMPLEX</p>
          <h2 class="manage-page__title">{{ currentComplex.name || '선택 단지 없음' }}</h2>
          <p class="manage-page__subtext">
            code: {{ currentComplex.code || complexCode || '-' }} · 상태:
            {{ getComplexStatusLabel(currentComplex.status) }}
          </p>
          <p v-if="state.detailWarning" class="manage-page__warning">
            {{ state.detailWarning }}
          </p>
        </div>
        <button type="button" class="page-button page-button--primary" @click="openCreateModal">
          신규 등록
        </button>
      </div>

      <!-- 운영 상태와 관리자 수를 요약 카드로 표시한다. -->
      <div class="summary-grid">
        <div v-for="item in summaryItems" :key="item.label" class="summary-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>

      <div class="card-shell">
        <!-- FilterBar 안에서 검색어와 권한/활성 필터를 제어한다. -->
        <AdminFilterBar @reset="resetFilters">
          <input
            v-model="state.filters.keyword"
            class="filter-input"
            type="text"
            placeholder="이름 또는 이메일 검색"
          />
          <select v-model="state.filters.role" class="filter-select">
            <option v-for="item in roleOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
          <select v-model="state.filters.active" class="filter-select">
            <option v-for="item in activeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </AdminFilterBar>

        <!-- AdminTable 영역에서는 loading, error, empty 상태를 분리해 표시한다. -->
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
          <template #action="{ row }">
            <div class="table-actions">
              <button type="button" class="table-action-button" @click.stop="openEditModal(row)">
                수정
              </button>
              <button
                type="button"
                class="table-action-button danger"
                @click.stop="openDeleteConfirm(row)"
              >
                소속 해제
              </button>
            </div>
          </template>
        </AdminTable>

        <!-- Pagination은 필터 결과 기준으로 로컬 페이지 이동을 처리한다. -->
        <AppPagination
          v-if="!state.listLoading && filteredAdmins.length > 0"
          :current-page="state.pagination.currentPage"
          :total-pages="totalPages"
          :total-all="adminList.length"
          :total-filtered="filteredAdmins.length"
          @change="handlePageChange"
        />
      </div>
    </section>

    <!-- 신규 등록 모달 영역이다. -->
    <BaseModal
      :visible="state.modals.create"
      title="관리자 계정 등록"
      subtitle="선택한 단지에 소속될 관리자 또는 스태프 계정을 생성합니다."
      @close="closeCreateModal"
    >
      <div class="form-grid">
        <label class="form-field">
          <span>이름</span>
          <input v-model="state.createForm.name" type="text" placeholder="이름" />
        </label>
        <label class="form-field">
          <span>이메일</span>
          <input v-model="state.createForm.email" type="email" placeholder="admin@example.com" />
        </label>
        <label class="form-field">
          <span>비밀번호</span>
          <input v-model="state.createForm.password" type="password" placeholder="초기 비밀번호" />
        </label>
        <label class="form-field">
          <span>연락처</span>
          <input v-model="state.createForm.phone" type="text" placeholder="010-0000-0000" />
        </label>
        <label class="form-field form-field--full">
          <span>권한</span>
          <select v-model="state.createForm.adminRole">
            <option value="01">매니저</option>
            <option value="02">스태프</option>
          </select>
        </label>
      </div>

      <p v-if="state.createErrorMessage" class="form-feedback error">{{ state.createErrorMessage }}</p>

      <template #footer>
        <button type="button" class="page-button page-button--ghost" @click="closeCreateModal">
          취소
        </button>
        <button
          type="button"
          class="page-button page-button--primary"
          :disabled="state.createSubmitting"
          @click="openCreateConfirm"
        >
          {{ state.createSubmitting ? '등록 중...' : '등록' }}
        </button>
      </template>
    </BaseModal>

    <!-- 수정 모달 영역이다. -->
    <BaseModal
      :visible="state.modals.edit"
      title="관리자 계정 수정"
      subtitle="선택한 단지 내 권한과 활성 상태를 수정합니다."
      @close="closeEditModal"
    >
      <div class="form-grid">
        <label class="form-field">
          <span>이름</span>
          <input v-model="state.editForm.name" type="text" placeholder="이름" />
        </label>
        <label class="form-field">
          <span>이메일</span>
          <input v-model="state.editForm.email" type="email" readonly />
        </label>
        <label class="form-field">
          <span>연락처</span>
          <input v-model="state.editForm.phone" type="text" placeholder="010-0000-0000" />
        </label>
        <label class="form-field">
          <span>권한</span>
          <select v-model="state.editForm.adminRole">
            <option value="01">매니저</option>
            <option value="02">스태프</option>
          </select>
        </label>
        <label class="form-field form-field--full">
          <span>활성 여부</span>
          <select v-model="state.editForm.isActive">
            <option :value="true">활성</option>
            <option :value="false">비활성</option>
          </select>
        </label>
      </div>

      <p class="form-help-text">비밀번호 수정은 별도 기능으로 분리 예정입니다.</p>
      <p v-if="state.editErrorMessage" class="form-feedback error">{{ state.editErrorMessage }}</p>

      <template #footer>
        <button type="button" class="page-button page-button--ghost" @click="closeEditModal">
          취소
        </button>
        <button
          type="button"
          class="page-button page-button--primary"
          :disabled="state.editSubmitting"
          @click="openEditConfirm"
        >
          {{ state.editSubmitting ? '저장 중...' : '수정' }}
        </button>
      </template>
    </BaseModal>

    <!-- 등록 확인 모달 영역이다. -->
    <ConfirmModal
      :visible="state.modals.createConfirm"
      title="관리자 계정을 등록할까요?"
      subtitle="선택한 단지에 새로운 관리자 또는 스태프 계정을 생성합니다."
      confirm-text="등록"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.createSubmitting"
      @confirm="handleCreateAdmin"
      @cancel="state.modals.createConfirm = false"
    />

    <!-- 수정 확인 모달 영역이다. -->
    <ConfirmModal
      :visible="state.modals.editConfirm"
      title="관리자 계정 정보를 수정할까요?"
      subtitle="이름, 연락처, 권한, 활성 상태 변경 내용을 저장합니다."
      confirm-text="수정"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.editSubmitting"
      @confirm="handleUpdateAdmin"
      @cancel="state.modals.editConfirm = false"
    />

    <!-- 소속 해제 확인 모달 영역이다. -->
    <ConfirmModal
      :visible="state.modals.deleteConfirm"
      title="관리자 계정 소속 해제"
      subtitle="해당 관리자 계정의 단지 소속을 해제하시겠습니까?"
      confirm-text="소속 해제"
      cancel-text="취소"
      confirm-type="danger"
      :loading="state.deleteSubmitting"
      @confirm="handleDeleteAdmin"
      @cancel="state.modals.deleteConfirm = false"
    />

    <!-- 명시적 사용자 액션 결과를 안내하는 결과 모달 영역이다. -->
    <ActionResultModal
      :visible="state.resultModal.visible"
      :type="state.resultModal.type"
      :title="state.resultModal.title"
      :subtitle="state.resultModal.subtitle"
      :desc="state.resultModal.desc"
      @close="handleResultConfirm"
    />
  </AdminLayout>
</template>

<style scoped>
.layout-nav-link {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 9px 10px;
  border-radius: 7px;
  color: #8B9AB0;
  font-size: 13px;
  text-decoration: none;
}

.layout-nav-link.is-active,
.layout-nav-link.router-link-active {
  background: #2B3A55;
  color: #FFFFFF;
}

.page-header-actions {
  display: flex;
  gap: 10px;
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
}

.manage-page__context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
}

.manage-page__eyebrow {
  margin: 0 0 8px;
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
  margin: 8px 0 0;
  color: #687282;
  font-size: 13px;
}

.manage-page__warning {
  margin: 8px 0 0;
  color: #C08B2D;
  font-size: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  background: #FFFFFF;
}

.summary-card span {
  color: #687282;
  font-size: 12px;
}

.summary-card strong {
  color: #1A202C;
  font-size: 18px;
  font-weight: 700;
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

.form-help-text,
.form-feedback {
  margin: 16px 0 0;
  color: #687282;
  font-size: 12px;
}

.form-feedback.error {
  color: #E53E3E;
}

@media (max-width: 1080px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .manage-page__context,
  .page-header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
