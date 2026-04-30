<script setup>
// TODO: MASTER가 단지 소속 관리자 계정을 조회하고 관리하는 화면입니다.
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import { getComplexAdminRoleLabel, getComplexStatusLabel } from '@/constants/complexCodes'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const router = useRouter()
const complexStore = useComplexStore()

const state = reactive({
  loading: false,
  filters: {
    keyword: '',
    role: '',
    status: '',
  },
  pagination: {
    currentPage: 1,
    pageSize: 10,
  },
  createForm: {
    email: '',
    password: '',
    name: '',
    phone: '',
    adminRole: '01',
  },
  editForm: {
    userId: '',
    name: '',
    adminRole: '01',
    isActive: true,
  },
  selectedAdmin: null,
  modals: {
    create: false,
    edit: false,
    delete: false,
    result: false,
    unavailable: false,
  },
  result: {
    title: '',
    subtitle: '',
    confirmText: '확인',
    onConfirm: null,
  },
})

const adminRoleOptions = [
  { code: '', label: '전체' },
  { code: '01', label: '매니저' },
  { code: '02', label: '스태프' },
]

const activeStatusOptions = [
  { code: '', label: '전체' },
  { code: 'active', label: '활성' },
  { code: 'inactive', label: '비활성' },
]

// 현재 라우트의 단지 코드를 기준으로 화면을 구성합니다.
const complexCode = computed(() => route.params.code)

// 선택 단지 또는 상세 정보를 우선순위에 맞게 표시합니다.
const currentComplex = computed(() => {
  if (complexStore.selectedComplex?.code === complexCode.value) {
    return {
      ...complexStore.complexDetail,
      ...complexStore.selectedComplex,
    }
  }

  return complexStore.complexDetail || complexStore.selectedComplex || {}
})

// route code 기준으로 관리자 목록을 조회한다.
const adminRows = computed(() => {
  const source = Array.isArray(complexStore.complexAdmins) ? complexStore.complexAdmins : []

  // 검색/필터 처리
  return source.filter((admin) => {
    const keyword = state.filters.keyword.trim().toLowerCase()
    const roleMatched = !state.filters.role || String(admin?.adminRole) === state.filters.role
    const statusMatched =
      !state.filters.status ||
      (state.filters.status === 'active' ? !!admin?.isActive : !admin?.isActive)

    const keywordMatched =
      !keyword ||
      String(admin?.name || '')
        .toLowerCase()
        .includes(keyword) ||
      String(admin?.userId || '')
        .toLowerCase()
        .includes(keyword)

    return roleMatched && statusMatched && keywordMatched
  })
})

// 필터된 목록 기준 페이지 slice 처리
const pagedAdminRows = computed(() => {
  const startIndex = (state.pagination.currentPage - 1) * state.pagination.pageSize
  const endIndex = startIndex + state.pagination.pageSize

  return adminRows.value.slice(startIndex, endIndex)
})

// 로컬 페이지네이션 계산
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(adminRows.value.length / state.pagination.pageSize))
})

// 현재 날짜를 요약 카드에 표시합니다.
const todayStr = computed(() => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dayOfWeek = days[date.getDay()]

  return `${year}.${month}.${day} (${dayOfWeek})`
})

// 요약 카드 데이터를 현재 목록 기준으로 정리합니다.
const summaryCards = computed(() => {
  return [
    {
      label: '운영 상태',
      value: getComplexStatusLabel(currentComplex.value?.status),
    },
    {
      label: '총 관리자 인원',
      value: `${complexStore.complexAdmins?.length || 0}명`,
    },
    {
      label: '마지막 갱신일',
      value: currentComplex.value?.updatedAt || todayStr.value,
    },
    {
      label: '선택 단지',
      value: currentComplex.value?.name || '-',
    },
  ]
})

// alert 대신 BaseModal로 처리 결과를 안내한다.
const openResultModal = ({ title, subtitle, confirmText = '확인', onConfirm = null }) => {
  state.result.title = title
  state.result.subtitle = subtitle
  state.result.confirmText = confirmText
  state.result.onConfirm = onConfirm
  state.modals.result = true
}

// 결과 모달의 확인 버튼 동작을 공통 처리합니다.
const handleResultConfirm = () => {
  const callback = state.result.onConfirm

  state.modals.result = false
  state.result.onConfirm = null

  if (typeof callback === 'function') {
    callback()
  }
}

// 선택 단지 정보가 없으면 localStorage에서 복구를 시도한다.
const restoreComplexContext = async () => {
  complexStore.restoreSelectedComplex()

  if (!complexCode.value) {
    state.modals.unavailable = true
    return
  }

  if (complexStore.selectedComplex?.code === complexCode.value && complexStore.complexDetail?.code === complexCode.value) {
    return
  }

  try {
    const detail = await complexStore.fetchMasterComplexDetail(complexCode.value)
    complexStore.setSelectedComplex(detail)
  } catch (error) {
    console.error(error)
    state.modals.unavailable = true
  }
}

// route code 기준으로 관리자 목록을 조회한다.
const loadAdmins = async () => {
  if (!complexCode.value) {
    state.modals.unavailable = true
    return
  }

  state.loading = true

  try {
    await complexStore.fetchComplexAdmins(complexCode.value)
  } catch (error) {
    console.error(error)
    openResultModal({
      title: '관리자 목록을 불러오지 못했습니다.',
      subtitle: error?.message || '잠시 후 다시 시도해주세요.',
    })
  } finally {
    state.loading = false
  }
}

// 검색/필터 처리 초기화
const resetFilters = () => {
  state.filters.keyword = ''
  state.filters.role = ''
  state.filters.status = ''
  state.pagination.currentPage = 1
}

// 페이지 변경 처리
const handlePageChange = (page) => {
  state.pagination.currentPage = page
}

// 신규 등록 모달 열기
const openCreateModal = () => {
  state.createForm.email = ''
  state.createForm.password = ''
  state.createForm.name = ''
  state.createForm.phone = ''
  state.createForm.adminRole = '01'
  state.modals.create = true
}

// 관리자 계정 생성 요청
const handleCreateAdmin = async () => {
  if (!complexCode.value) {
    state.modals.create = false
    state.modals.unavailable = true
    return
  }

  state.loading = true

  try {
    // 관리자 계정 생성은 단지 API를 호출하면 백엔드가 Auth Service 내부 호출로 처리한다.
    await complexStore.createAdminForComplex(complexCode.value, {
      email: state.createForm.email,
      password: state.createForm.password,
      name: state.createForm.name,
      phone: state.createForm.phone,
      adminRole: state.createForm.adminRole,
    })

    state.modals.create = false

    // 관리자 계정 생성 성공 후 목록 재조회
    await loadAdmins()

    openResultModal({
      title: '관리자 계정이 등록되었습니다.',
      subtitle: '선택한 단지에 관리자 계정이 정상적으로 추가되었습니다.',
    })
  } catch (error) {
    console.error(error)
    openResultModal({
      title: '관리자 계정 등록에 실패했습니다.',
      subtitle: error?.message || '입력값을 확인한 뒤 다시 시도해주세요.',
    })
  } finally {
    state.loading = false
  }
}

// 수정 모달 열기
const openEditModal = (admin) => {
  state.selectedAdmin = admin
  state.editForm.userId = admin?.userId || ''
  state.editForm.name = admin?.name || ''
  state.editForm.adminRole = admin?.adminRole || '01'
  state.editForm.isActive = !!admin?.isActive
  state.modals.edit = true
}

// 관리자 권한/활성 여부 수정 요청
const handleUpdateAdmin = async () => {
  if (!complexCode.value || !state.selectedAdmin?.userId) {
    state.modals.edit = false
    state.modals.unavailable = true
    return
  }

  state.loading = true

  try {
    await complexStore.updateAdminForComplex(complexCode.value, state.selectedAdmin.userId, {
      adminRole: state.editForm.adminRole,
      isActive: state.editForm.isActive,
    })

    state.modals.edit = false
    await loadAdmins()

    openResultModal({
      title: '관리자 계정 정보가 수정되었습니다.',
      subtitle: '단지 내 권한과 활성 여부가 반영되었습니다.',
    })
  } catch (error) {
    console.error(error)
    openResultModal({
      title: '관리자 계정 수정에 실패했습니다.',
      subtitle: error?.message || '잠시 후 다시 시도해주세요.',
    })
  } finally {
    state.loading = false
  }
}

// 삭제 확인 모달 열기
const openDeleteModal = (admin) => {
  state.selectedAdmin = admin
  state.modals.delete = true
}

// 관리자 삭제 요청
const handleDeleteAdmin = async () => {
  if (!complexCode.value || !state.selectedAdmin?.userId) {
    state.modals.delete = false
    state.modals.unavailable = true
    return
  }

  state.loading = true

  try {
    // 관리자 삭제는 백엔드에서 소속 해제와 계정 소프트 삭제를 함께 처리한다는 설명
    await complexStore.deleteAdminFromComplex(complexCode.value, state.selectedAdmin.userId)
    state.modals.delete = false
    await loadAdmins()

    openResultModal({
      title: '관리자 계정이 삭제되었습니다.',
      subtitle: '단지 소속 해제와 계정 비활성화 처리가 요청되었습니다.',
    })
  } catch (error) {
    console.error(error)
    openResultModal({
      title: '관리자 계정 삭제에 실패했습니다.',
      subtitle: error?.message || '잠시 후 다시 시도해주세요.',
    })
  } finally {
    state.loading = false
  }
}

// 단지 선택 화면으로 이동합니다.
const goToComplexList = () => {
  router.push('/admin/master/complexes')
}

// 선택 단지 대시보드로 이동합니다.
const goToDashboard = () => {
  if (!complexCode.value) {
    state.modals.unavailable = true
    return
  }

  router.push(`/admin/master/complexes/${complexCode.value}/dashboard`)
}

// 날짜 값은 표에서 간단히 잘라서 표시합니다.
const formatDate = (value) => {
  if (!value) {
    return '-'
  }

  return String(value).slice(0, 10)
}

// 활성 여부를 사용자 친화적인 라벨로 표시합니다.
const formatActiveLabel = (isActive) => {
  return isActive ? '활성' : '비활성'
}

// 선택 단지 복구와 관리자 목록 초기 조회를 함께 처리합니다.
onMounted(async () => {
  await restoreComplexContext()
  await loadAdmins()
})
</script>

<template>
  <section class="master-admin page-container">
    <div class="master-admin__header">
      <div>
        <h1 class="page-title">관리자 계정 관리</h1>
        <p class="master-admin__description">선택한 단지의 관리자와 스태프 계정을 관리합니다.</p>
        <p class="master-admin__subtext">
          {{ todayStr }} · {{ currentComplex.name || '선택 단지 없음' }}
        </p>
      </div>
      <div class="master-admin__header-actions">
        <button type="button" class="master-admin__secondary-button" @click="goToComplexList">
          단지 선택
        </button>
        <button type="button" class="master-admin__primary-button" @click="openCreateModal">
          신규 등록
        </button>
      </div>
    </div>

    <div class="master-admin__summary-grid">
      <div
        v-for="card in summaryCards"
        :key="card.label"
        class="card-section master-admin__summary-card"
      >
        <span class="master-admin__summary-label">{{ card.label }}</span>
        <strong class="master-admin__summary-value">{{ card.value || '-' }}</strong>
      </div>
    </div>

    <div class="card-section master-admin__filter-shell">
      <AdminFilterBar @reset="resetFilters">
        <input
          v-model="state.filters.keyword"
          type="text"
          class="master-admin__input"
          placeholder="이름 또는 userId 검색"
        />

        <select v-model="state.filters.role" class="master-admin__select">
          <option
            v-for="option in adminRoleOptions"
            :key="option.code || 'all-role'"
            :value="option.code"
          >
            {{ option.label }}
          </option>
        </select>

        <select v-model="state.filters.status" class="master-admin__select">
          <option
            v-for="option in activeStatusOptions"
            :key="option.code || 'all-status'"
            :value="option.code"
          >
            {{ option.label }}
          </option>
        </select>

        <button type="button" class="master-admin__ghost-button" @click="goToDashboard">
          뒤로
        </button>
      </AdminFilterBar>
    </div>

    <div class="card-section">
      <p v-if="state.loading" class="master-admin__feedback">관리자 계정 목록을 불러오는 중입니다.</p>
      <div v-else class="master-admin__table-wrap">
        <table class="master-admin__table">
          <thead>
            <tr>
              <th>번호</th>
              <th>userId</th>
              <th>이름</th>
              <th>권한</th>
              <th>상태</th>
              <th>배정일</th>
              <th>해제일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pagedAdminRows.length === 0">
              <td colspan="8" class="master-admin__empty">등록된 관리자 계정이 없습니다.</td>
            </tr>
            <tr v-for="(admin, index) in pagedAdminRows" :key="admin.userId || index">
              <td>{{ (state.pagination.currentPage - 1) * state.pagination.pageSize + index + 1 }}</td>
              <td>{{ admin.userId || '-' }}</td>
              <td>{{ admin.name || '-' }}</td>
              <td>{{ getComplexAdminRoleLabel(admin.adminRole) }}</td>
              <td>
                <span
                  class="master-admin__status-badge"
                  :class="{ 'is-inactive': !admin.isActive }"
                >
                  {{ formatActiveLabel(admin.isActive) }}
                </span>
              </td>
              <td>{{ formatDate(admin.assignedAt) }}</td>
              <td>{{ formatDate(admin.unassignedAt) }}</td>
              <td>
                <div class="master-admin__row-actions">
                  <button type="button" class="master-admin__text-button" @click="openEditModal(admin)">
                    수정
                  </button>
                  <button
                    type="button"
                    class="master-admin__text-button master-admin__text-button--danger"
                    @click="openDeleteModal(admin)"
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <BasePagination
        :current-page="state.pagination.currentPage"
        :total-pages="totalPages"
        :total-all="complexStore.complexAdmins.length"
        :total-filtered="adminRows.length"
        @change="handlePageChange"
      />
    </div>

    <BaseModal
      :visible="state.modals.create"
      title="관리자 계정 등록"
      subtitle="선택한 단지에 소속될 관리자 또는 스태프 계정을 생성합니다."
      @close="state.modals.create = false"
    >
      <div class="master-admin__modal-form">
        <label class="master-admin__field">
          <span>이메일</span>
          <input v-model="state.createForm.email" type="email" placeholder="admin@example.com" />
        </label>
        <label class="master-admin__field">
          <span>비밀번호</span>
          <input v-model="state.createForm.password" type="password" placeholder="초기 비밀번호" />
        </label>
        <div class="master-admin__modal-grid">
          <label class="master-admin__field">
            <span>이름</span>
            <input v-model="state.createForm.name" type="text" placeholder="이름" />
          </label>
          <label class="master-admin__field">
            <span>연락처</span>
            <input v-model="state.createForm.phone" type="text" placeholder="010-0000-0000" />
          </label>
        </div>
        <label class="master-admin__field">
          <span>권한</span>
          <select v-model="state.createForm.adminRole" class="master-admin__select master-admin__select--full">
            <option value="01">매니저</option>
            <option value="02">스태프</option>
          </select>
        </label>
      </div>
      <template #footer>
        <button type="button" class="master-admin__secondary-button" @click="state.modals.create = false">
          취소
        </button>
        <button type="button" class="master-admin__primary-button" @click="handleCreateAdmin">
          등록
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :visible="state.modals.edit"
      title="관리자 계정 수정"
      subtitle="단지 내 관리자 권한과 활성 여부를 수정합니다."
      @close="state.modals.edit = false"
    >
      <div class="master-admin__modal-form">
        <div class="master-admin__modal-grid">
          <label class="master-admin__field">
            <span>이름</span>
            <input :value="state.editForm.name" type="text" readonly />
          </label>
          <label class="master-admin__field">
            <span>userId</span>
            <input :value="state.editForm.userId" type="text" readonly />
          </label>
        </div>
        <div class="master-admin__modal-grid">
          <label class="master-admin__field">
            <span>권한</span>
            <select v-model="state.editForm.adminRole" class="master-admin__select master-admin__select--full">
              <option value="01">매니저</option>
              <option value="02">스태프</option>
            </select>
          </label>
          <label class="master-admin__field">
            <span>활성 여부</span>
            <select v-model="state.editForm.isActive" class="master-admin__select master-admin__select--full">
              <option :value="true">활성</option>
              <option :value="false">비활성</option>
            </select>
          </label>
        </div>
      </div>
      <template #footer>
        <button type="button" class="master-admin__secondary-button" @click="state.modals.edit = false">
          취소
        </button>
        <button type="button" class="master-admin__primary-button" @click="handleUpdateAdmin">
          저장
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :visible="state.modals.delete"
      title="관리자 계정 삭제"
      subtitle="관리자를 삭제하면 해당 단지 소속이 해제되고 계정이 비활성화됩니다. 삭제하시겠습니까?"
      @close="state.modals.delete = false"
    >
      <template #footer>
        <button type="button" class="master-admin__secondary-button" @click="state.modals.delete = false">
          취소
        </button>
        <button type="button" class="master-admin__danger-button" @click="handleDeleteAdmin">
          삭제
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :visible="state.modals.result"
      :title="state.result.title"
      :subtitle="state.result.subtitle"
      @close="handleResultConfirm"
    >
      <template #footer>
        <button type="button" class="master-admin__primary-button" @click="handleResultConfirm">
          {{ state.result.confirmText }}
        </button>
      </template>
    </BaseModal>

    <BaseModal
      :visible="state.modals.unavailable"
      title="단지 정보를 불러올 수 없습니다."
      subtitle="선택 단지를 다시 확인한 뒤 관리자 계정 관리 화면에 진입해주세요."
      @close="state.modals.unavailable = false"
    >
      <template #footer>
        <button type="button" class="master-admin__primary-button" @click="goToComplexList">
          단지 목록으로 이동
        </button>
      </template>
    </BaseModal>
  </section>
</template>

<style scoped>
.master-admin {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.master-admin__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.master-admin__description {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-admin__subtext {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.master-admin__header-actions {
  display: flex;
  gap: 10px;
}

.master-admin__summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.master-admin__summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.master-admin__summary-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.master-admin__summary-value {
  color: var(--color-text-primary);
  font-size: var(--font-size-heading-3);
}

.master-admin__filter {
  display: flex;
  gap: 12px;
  align-items: center;
}

.master-admin__filter-shell {
  padding: 0;
  overflow: hidden;
}

.master-admin__input,
.master-admin__select,
.master-admin__field input {
  height: 40px;
}

.master-admin__input,
.master-admin__select,
.master-admin__field input,
.master-admin__field textarea {
  width: 100%;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  font: inherit;
}

.master-admin__select {
  min-width: 140px;
}

.master-admin__select--full {
  width: 100%;
}

.master-admin__table-wrap {
  overflow-x: auto;
}

.master-admin__table {
  width: 100%;
  border-collapse: collapse;
}

.master-admin__table th,
.master-admin__table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--color-table-line);
  text-align: left;
  font-size: var(--font-size-detail);
}

.master-admin__table th {
  background: var(--color-table-head-bg);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.master-admin__status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-12);
  background: rgba(77, 139, 90, 0.12);
  color: var(--color-success);
  font-size: var(--font-size-badge);
  font-weight: 600;
}

.master-admin__status-badge.is-inactive {
  background: rgba(192, 139, 45, 0.12);
  color: var(--color-warning);
}

.master-admin__row-actions {
  display: flex;
  gap: 8px;
}

.master-admin__text-button {
  border: none;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font: inherit;
}

.master-admin__text-button--danger {
  color: var(--color-danger);
}

.master-admin__feedback,
.master-admin__empty {
  color: var(--color-text-secondary);
  text-align: center;
}

.master-admin__modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.master-admin__modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.master-admin__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.master-admin__field span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-admin__field input[readonly] {
  background: var(--color-bg-app);
}

.master-admin__primary-button,
.master-admin__secondary-button,
.master-admin__ghost-button,
.master-admin__danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-8);
  font: inherit;
  cursor: pointer;
}

.master-admin__primary-button {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.master-admin__secondary-button,
.master-admin__ghost-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}

.master-admin__danger-button {
  border: none;
  background: var(--color-danger);
  color: var(--color-white);
}

@media (max-width: 1080px) {
  .master-admin__summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .master-admin__header,
  .master-admin__filter {
    flex-direction: column;
    align-items: stretch;
  }

  .master-admin__header-actions {
    justify-content: stretch;
  }

  .master-admin__summary-grid,
  .master-admin__modal-grid {
    grid-template-columns: 1fr;
  }
}
</style>
