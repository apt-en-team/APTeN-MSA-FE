<script setup>
import { computed, inject, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { useHouseholdStore } from '@/stores/useHouseholdStore'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()
const householdStore = useHouseholdStore()
const registerOpenModal = inject('registerOpenModal', null)
const registerCreateModal = inject('registerCreateModal', null)

const state = reactive({
  listLoading: false,
  errorMessage: '',
  activeTab: 'households',
  typeManageTab: 'lineType',
  filters: {
    keyword: '',
    building: '',
    status: '',
  },
  matchFilters: {
    keyword: '',
    status: '',
  },
  buildingOptions: [],
  pagination: {
    currentPage: 1,
    pageSize: 10,
  },
  modals: {
    create: false,
    detail: false,
    edit: false,
    editConfirm: false,
    statusConfirm: false,
    matchProcess: false,
    approveConfirm: false,
    rejectConfirm: false,
    typeManage: false,
    lineDeleteConfirm: false,
    bulkDeleteConfirm: false,
    memberDeleteConfirm: false,
    residentDeleteConfirm: false,
  },
  createForm: {
    building: '',
    unit: '',
    moveInDate: '',
    resolvedType: null,
    residents: [],
    loadedAddressKey: '',
    loadingResidents: false,
    showResidentForm: false,
    residentInput: { name: '', phone: '', birthDate: '', householdRole: 'HEAD' },
  },
  createSubmitting: false,
  createErrorMessage: '',
  selectedMember: null,
  memberActionSubmitting: false,
  memberActionError: '',
  editingMemberId: null,
  editingMemberRole: '',
  editingResidentId: null,
  editResidentForm: {
    name: '',
    phone: '',
    birthDate: '',
    householdRole: 'MEMBER',
    moveInDate: '',
  },
  residentEditSubmitting: false,
  residentDeleteTarget: null,
  detailLoading: false,
  lineForm: {
    building: '',
    lineStart: '',
    lineEnd: '',
    typeId: '',
  },
  typeDropdownOpen: false,
  editingLineId: null,
  editLineForm: {
    building: '',
    lineStart: '',
    lineEnd: '',
    typeId: '',
  },
  selectedLineForDelete: null,
  lineFormSubmitting: false,
  lineFormError: '',
  editLineSubmitting: false,
  editLineError: '',
  bulkForm: {
    building: '',
    floorStart: '',
    floorEnd: '',
    lineStart: '',
    lineEnd: '',
  },
  bulkSubmitting: false,
  bulkError: '',
  bulkRanges: [],
  bulkHouseholdsLoading: false,
  bulkHouseholds: [],
  bulkEditingId: null,
  bulkEditForm: { building: '', floorStart: '', floorEnd: '', lineStart: '', lineEnd: '' },
  bulkEditSubmitting: false,
  bulkEditError: '',
  bulkDeleteTarget: null,
  editForm: {
    householdId: null,
    building: '',
    unit: '',
    typeId: '',
    status: '',
    reason: '',
  },
  matchForm: {
    rejectReason: '',
    rejectPreset: '',
    rejectReasonCode: '',
  },
  selectedHousehold: null,
  selectedMatch: null,
  editSubmitting: false,
  statusSubmitting: false,
  approveSubmitting: false,
  rejectSubmitting: false,
  editErrorMessage: '',
  resultModal: {
    visible: false,
    type: 'success',
    title: '',
    subtitle: '',
    desc: '',
    itemName: '',
    time: '',
    actionLabel: '',
    actor: '',
    afterConfirm: null,
  },
})

// 세대 목록 테이블 컬럼
const householdColumns = computed(() => [
  { key: 'number', label: 'ID' },
  { key: 'building', label: '동' },
  { key: 'unit', label: '호수' },
  { key: 'typeName', label: '평형' },
  { key: 'headName', label: '세대주' },
  { key: 'memberCountLabel', label: '세대원' },
  { key: 'createdAt', label: '등록일' },
  { key: 'status', label: '입주상태' },
  { key: 'carCount', label: '차량' },
])

// 매칭 요청 테이블 컬럼
const matchColumns = computed(() => [
  { key: 'number', label: '#' },
  { key: 'inputName', label: '이름' },
  { key: 'address', label: '신청 세대' },
  { key: 'createdAt', label: '요청일' },
  { key: 'matchStatus', label: '상태' },
])

const households = computed(() => {
  const d = householdStore.households
  if (!d) return []
  if (Array.isArray(d)) return d
  if (Array.isArray(d.content)) return d.content
  return []
})

const totalElements = computed(() => householdStore.households?.totalElements ?? households.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalElements.value / state.pagination.pageSize)))

const matchRequests = computed(() => {
  const d = householdStore.matchRequests
  if (!d) return []
  if (Array.isArray(d)) return d
  if (Array.isArray(d.content)) return d.content
  return []
})

const pendingCount = computed(() => matchRequests.value.filter((m) => normalizeMatchStatus(m.matchStatus) === 'PENDING').length)

// 세대 상세·이력·세대원 스토어 데이터
const householdDetail = computed(() => householdStore.householdDetail)
const householdHistory = computed(() => {
  const h = householdStore.householdHistory
  return Array.isArray(h) ? h : []
})
const detailMembers = computed(() => {
  const d = householdStore.householdMembers
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.content)) return d.content
  return []
})
const detailExpectedResidents = computed(() => {
  const d = householdStore.expectedResidents
  const list = Array.isArray(d) ? d : (Array.isArray(d?.content) ? d.content : [])
  const householdId = householdDetail.value?.householdId ?? state.selectedHousehold?.householdId
  const activeList = list.filter((resident) => !isDisabledExpectedResident(resident))
  if (!householdId) return activeList
  return activeList.filter((resident) => String(resident.householdId) === String(householdId))
})

// 평형·동 라인 평형 스토어 데이터
const householdTypes = computed(() => householdStore.householdTypes)
const buildingLineTypes = computed(() => householdStore.buildingLineTypes)

// 현재 선택된 평형 표시 텍스트
const selectedTypeName = computed(() => {
  if (!state.lineForm.typeId) return ''
  const t = householdTypes.value.find((t) => String(t.typeId) === state.lineForm.typeId)
  return t ? t.typeName : ''
})

const buildingOptions = computed(() => {
  const source = state.buildingOptions.length > 0
    ? state.buildingOptions
    : households.value.map((h) => h.building)
  const set = new Set(source.filter(Boolean))
  return [...set].sort()
})

const matchRejectPresets = [
  { code: 'INFO_MISMATCH', label: '입력한 세대 정보가 일치하지 않습니다.' },
  { code: 'HOUSEHOLD_NOT_FOUND', label: '신청 세대를 찾을 수 없습니다.' },
  { code: 'ADMIN_REJECTED', label: '관리자 확인 결과 승인이 어렵습니다.' },
]

// 통계 카드 — BE summary 값 사용 (단지 전체 기준)
const summaryItems = computed(() => {
  const summary = householdStore.households?.summary
  const total = summary?.totalHouseholds ?? 0
  const occupied = summary?.occupiedHouseholds ?? 0
  const vacant = summary?.vacantHouseholds ?? 0
  const thisMonth = summary?.currentMonthMoveIns ?? 0
  const occupiedRatio = total ? Math.round((occupied / total) * 100) : 0

  return [
    { label: '전체 세대', value: total, unit: '세대', desc: '단지 전체 기준', descClass: '' },
    { label: '입주 세대', value: occupied, unit: '세대', desc: `전체 대비 ${occupiedRatio}%`, descClass: 'success' },
    { label: '공실 세대', value: vacant, unit: '세대', desc: `관리 필요 ${vacant}세대`, descClass: 'warning' },
    {
      label: '이번 달 입주',
      value: thisMonth > 0 ? `+${thisMonth}` : '-',
      unit: '세대',
      desc: '이번 달 입주 처리 기준',
      descClass: '',
    },
  ]
})

// typeId → typeName 맵 (householdTypes 기준)
const typeNameMap = computed(() => {
  const map = {}
  householdTypes.value.forEach((t) => { map[t.typeId] = t.typeName })
  return map
})

// 세대 typeId 해석: buildingLineTypes에서 building+unit 매칭 후 typeName 반환
// 호수에서 라인 번호 추출: "101" → 1, "204" → 4, "1502" → 2
function resolveTypeName(building, unit) {
  const unitNum = parseInt(String(unit ?? '0'), 10)
  const unitLine = unitNum % 100
  const matched = buildingLineTypes.value.find(
    (lt) => lt.building === building && lt.lineStart <= unitLine && unitLine <= lt.lineEnd,
  )
  if (!matched) return '-'
  return typeNameMap.value[matched.typeId] ?? '-'
}

// 테이블 행 가공
const pagedHouseholds = computed(() =>
  households.value.map((h, index) => ({
    ...h,
    number: (state.pagination.currentPage - 1) * state.pagination.pageSize + index + 1,
    typeName: resolveTypeName(h.building, h.unit),
    headName: h.headName ?? '-',
    memberCountLabel: h.memberCount != null ? h.memberCount + '명' : '-',
    carCount: toStatusCode(h.status) === 'VACANT' ? '-' : (h.carCount ?? 0) + '대',
    createdAt: formatDate(h.createdAt),
  })),
)

const filteredMatchRequests = computed(() => {
  const kw = state.matchFilters.keyword.trim()
  const st = state.matchFilters.status
  return matchRequests.value.filter((m) => {
    const nameMatch = !kw || (m.inputName ?? '').includes(kw)
    const statusMatch = !st || normalizeMatchStatus(m.matchStatus) === st
    return nameMatch && statusMatch
  })
})

const pagedMatchRequests = computed(() =>
  filteredMatchRequests.value.map((m, i) => ({
    ...m,
    number: i + 1,
    address: `${m.inputBuilding ?? '-'}동 ${m.inputUnit ?? '-'}호`,
    createdAt: formatDate(m.createdAt),
    matchStatusLabel: matchStatusLabel(m.matchStatus),
  })),
)

// BE가 @JsonValue로 한글을 응답하므로 한글 → 영문 코드로 정규화한다.
const toStatusCode = (s) =>
  ({ '입주': 'OCCUPIED', '공실': 'VACANT', '퇴거': 'MOVED_OUT', '전출예정': 'MOVING_OUT' })[s] ?? s

// 상태 레이블 / 배지 클래스 (전출예정 추가)
const statusLabel = (s) =>
  ({ OCCUPIED: '입주', VACANT: '공실', MOVED_OUT: '퇴거', MOVING_OUT: '전출예정' })[toStatusCode(s)] ?? s ?? '-'
const statusClass = (s) =>
  ({ OCCUPIED: 'is-success', VACANT: 'is-gray', MOVED_OUT: 'is-danger', MOVING_OUT: 'is-warning' })[toStatusCode(s)] ?? 'is-gray'
const normalizeMatchStatus = (s) =>
  ({ '01': 'PENDING', '02': 'APPROVED', '03': 'REJECTED', '승인대기': 'PENDING', '승인완료': 'APPROVED', '승인거절': 'REJECTED' })[s] ?? s
const matchStatusLabel = (s) =>
  ({ PENDING: '승인대기', APPROVED: '승인완료', REJECTED: '승인거절' })[normalizeMatchStatus(s)] ?? s ?? '-'
const matchStatusClass = (s) =>
  ({ PENDING: 'is-gray', APPROVED: 'is-success', REJECTED: 'is-danger' })[normalizeMatchStatus(s)] ?? 'is-gray'
const webServiceLabel = (s) =>
  ({ NOT_SIGNED_UP: '미가입', COMPLETED: '가입', PENDING: '대기', REJECTED: '반려', DELETED: '탈퇴' })[s] ?? s ?? '-'
const webServiceClass = (s) =>
  ({ NOT_SIGNED_UP: 'is-gray', COMPLETED: 'is-success', PENDING: 'is-warning', REJECTED: 'is-danger', DELETED: 'is-danger' })[s] ?? 'is-gray'

function normalizeHouseholdRole(role) {
  return ({ '세대주': 'HEAD', '세대원': 'MEMBER' })[role] ?? role ?? 'MEMBER'
}

function isDisabledExpectedResident(resident) {
  const status = resident?.status ?? resident?.expectedResidentStatus
  return status === 'DISABLED' || status === '비활성'
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

function getErrorMessage(error, fallback = '잠시 후 다시 시도해주세요.') {
  const responseData = error?.response?.data
  if (responseData?.message) return responseData.message
  if (responseData?.data?.message) return responseData.data.message
  if (error?.message && !error.message.startsWith('Request failed with status code')) return error.message
  return fallback
}

function getCurrentTimeText() {
  return new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCurrentActorName() {
  return authStore.userInfo?.name || authStore.user?.name || authStore.name || '관리자'
}

function openResultModal({ type = 'success', title, subtitle = '', desc = '', itemName = '', actionLabel = '', afterConfirm = null }) {
  state.resultModal.visible = true
  state.resultModal.type = type
  state.resultModal.title = title
  state.resultModal.subtitle = subtitle
  state.resultModal.desc = desc
  state.resultModal.itemName = itemName
  state.resultModal.time = getCurrentTimeText()
  state.resultModal.actionLabel = actionLabel
  state.resultModal.actor = getCurrentActorName()
  state.resultModal.afterConfirm = afterConfirm
}

async function handleResultConfirm() {
  const callback = state.resultModal.afterConfirm
  state.resultModal.visible = false
  state.resultModal.afterConfirm = null
  if (typeof callback === 'function') await callback()
}

function resetEditForm() {
  state.editForm.householdId = null
  state.editForm.building = ''
  state.editForm.unit = ''
  state.editForm.typeId = ''
  state.editForm.status = ''
  state.editForm.reason = ''
  state.selectedHousehold = null
  state.editErrorMessage = ''
  state.editSubmitting = false
  state.statusSubmitting = false
}

// 키워드에 숫자가 포함되면 호수(unit), 한글만이면 세대주(headName) 검색
function buildSearchParams() {
  const kw = state.filters.keyword.trim()
  const unitKeyword = kw.replace(/\D/g, '')
  const isUnitSearch = unitKeyword.length > 0
  return {
    building: state.filters.building || undefined,
    unit: isUnitSearch ? unitKeyword : undefined,
    headName: !isUnitSearch && kw ? kw : undefined,
    status: state.filters.status || undefined,
  }
}

async function loadHouseholds() {
  state.listLoading = true
  state.errorMessage = ''
  try {
    await householdStore.fetchAdminHouseholds({
      ...buildSearchParams(),
      page: state.pagination.currentPage - 1,
      size: state.pagination.pageSize,
    })
  } catch (error) {
    console.error(error)
    state.errorMessage = '세대 목록을 불러오지 못했습니다.'
  } finally {
    state.listLoading = false
  }
}

async function loadMatchRequests() {
  try {
    await householdStore.fetchMatchRequests({ page: 0, size: 50 })
  } catch (error) {
    console.error(error)
  }
}

async function loadBuildingOptions() {
  try {
    state.buildingOptions = await householdStore.fetchBuildingOptions()
  } catch (error) {
    console.error(error)
  }
}

function doSearch() {
  state.pagination.currentPage = 1
  loadHouseholds()
}

function resetFilters() {
  state.filters.keyword = ''
  state.filters.building = ''
  state.filters.status = ''
  state.pagination.currentPage = 1
  loadHouseholds()
}

function resetMatchFilters() {
  state.matchFilters.keyword = ''
  state.matchFilters.status = ''
}

function handlePageChange(page) {
  state.pagination.currentPage = page
  loadHouseholds()
}

function switchTab(tab) {
  state.activeTab = tab
  if (tab === 'match') loadMatchRequests()
}

function handleRowClick(row) {
  openDetailModal(row)
}

async function openDetailModal(row) {
  state.selectedHousehold = row
  state.modals.detail = true
  state.detailLoading = true
  householdStore.householdDetail = null
  householdStore.householdHistory = []
  householdStore.householdMembers = []
  householdStore.expectedResidents = []
  try {
    await Promise.all([
      householdStore.fetchAdminHouseholdDetail(row.householdId),
      householdStore.fetchHouseholdHistory(row.householdId),
      householdStore.fetchHouseholdMembers(row.householdId),
      householdStore.fetchExpectedResidents({ householdId: row.householdId, page: 0, size: 100 }),
    ])
  } catch (e) {
    console.error(e)
  } finally {
    state.detailLoading = false
  }
}

function nameInitial(member) {
  return String(member.name ?? member.userId ?? '?').slice(0, 1)
}

function startMemberEdit(member) {
  state.editingMemberId = member.householdMemberId
  state.editingMemberRole = member.role
  state.memberActionError = ''
}

function cancelMemberEdit() {
  state.editingMemberId = null
  state.editingMemberRole = ''
  state.memberActionError = ''
}

async function saveMemberRole(member) {
  if (state.memberActionSubmitting) return
  const newRole = state.editingMemberRole
  if (newRole === member.role) {
    cancelMemberEdit()
    return
  }
  state.memberActionError = ''

  if (newRole === 'HEAD') {
    const currentHead = detailMembers.value.find((m) => m.role === 'HEAD')
    if (!currentHead) {
      state.memberActionError = '현재 세대주가 없으면 역할을 변경할 수 없습니다.'
      return
    }
  }

  state.memberActionSubmitting = true
  try {
    const householdId = householdDetail.value?.householdId
    if (newRole === 'HEAD') {
      await householdStore.changeHouseholdHead(householdId, { userId: member.userId })
    } else {
      await householdStore.updateHouseholdMember(member.householdMemberId, { role: newRole })
    }
    state.editingMemberId = null
    if (householdId) await householdStore.fetchHouseholdMembers(householdId)
  } catch (e) {
    state.memberActionError = getErrorMessage(e, '역할 변경에 실패했습니다.')
  } finally {
    state.memberActionSubmitting = false
  }
}

function openMemberDeleteConfirm(member) {
  state.selectedMember = member
  state.memberActionError = ''
  state.modals.memberDeleteConfirm = true
}

async function handleMemberDelete() {
  if (!state.selectedMember || state.memberActionSubmitting) return
  state.modals.memberDeleteConfirm = false
  state.memberActionSubmitting = true
  state.memberActionError = ''
  try {
    await householdStore.deleteHouseholdMember(state.selectedMember.householdMemberId)
    state.editingMemberId = null
    const householdId = householdDetail.value?.householdId
    if (householdId) await householdStore.fetchHouseholdMembers(householdId)
    await loadHouseholds()
  } catch (e) {
    state.memberActionError = getErrorMessage(e, '삭제에 실패했습니다.')
  } finally {
    state.memberActionSubmitting = false
    state.selectedMember = null
  }
}

function historyContent(h) {
  if (h.reason) return h.reason
  if (!h.fromStatus) return '세대 등록'
  const from = statusLabel(h.fromStatus)
  const to = statusLabel(h.toStatus)
  return `세대 상태 변경 (${from} → ${to})`
}

function openEditModal(household) {
  state.selectedHousehold = household
  state.editForm.householdId = household.householdId
  state.editForm.building = household.building ?? ''
  state.editForm.unit = household.unit ?? ''
  state.editForm.typeId = String(household.typeId ?? '')
  state.editForm.status = toStatusCode(household.status ?? '')
  state.editForm.reason = ''
  state.editErrorMessage = ''
  state.editingResidentId = null
  state.modals.edit = true
  if (household.householdId) {
    householdStore.fetchExpectedResidents({ householdId: household.householdId, page: 0, size: 100 }).catch(() => {})
    if (!householdStore.householdDetail || householdStore.householdDetail.householdId !== household.householdId) {
      householdStore.fetchAdminHouseholdDetail(household.householdId).catch(() => {})
    }
  }
}

function closeEditModal() {
  state.modals.edit = false
  state.modals.editConfirm = false
  state.modals.statusConfirm = false
  state.editingResidentId = null
  resetEditForm()
}

function isHeadRole(role) {
  return role === 'HEAD' || role === '세대주'
}
function toApiHouseholdRole(role) {
  return isHeadRole(role) ? '세대주' : '세대원'
}

function openResidentEdit(resident) {
  state.editingResidentId = resident.expectedResidentId
  state.editResidentForm = {
    name: resident.name ?? '',
    phone: resident.phone ?? '',
    birthDate: resident.birthDate ?? '',
    householdRole: isHeadRole(resident.householdRole) ? 'HEAD' : 'MEMBER',
    moveInDate: resident.moveInDate ?? '',
  }
}

function cancelResidentEdit() {
  state.editingResidentId = null
}

async function handleResidentEdit() {
  if (state.residentEditSubmitting) return
  state.residentEditSubmitting = true
  state.editErrorMessage = ''

  const currentResident = detailExpectedResidents.value.find(
    (r) => r.expectedResidentId === state.editingResidentId,
  )
  const oldRole = currentResident?.householdRole
  const newRole = state.editResidentForm.householdRole

  // 세대주 → 세대원: 다른 세대주 없으면 에러
  if (isHeadRole(oldRole) && newRole === 'MEMBER') {
    const otherHeads = detailExpectedResidents.value.filter(
      (r) => isHeadRole(r.householdRole) && r.expectedResidentId !== state.editingResidentId,
    )
    if (otherHeads.length === 0) {
      state.editErrorMessage = '세대주는 최소 1명이어야 합니다. 다른 세대원을 먼저 세대주로 변경해주세요.'
      state.residentEditSubmitting = false
      return
    }
  }

  try {
    // 세대원 → 세대주: 기존 세대주를 세대원으로 자동 변경
    if (newRole === 'HEAD' && !isHeadRole(oldRole)) {
      const existingHeads = detailExpectedResidents.value.filter(
        (r) => isHeadRole(r.householdRole) && r.expectedResidentId !== state.editingResidentId,
      )
      await Promise.all(
        existingHeads.map((head) =>
          householdStore.updateExpectedResident(head.expectedResidentId, { householdRole: '세대원' }),
        ),
      )
    }

    await householdStore.updateExpectedResident(state.editingResidentId, {
      name: state.editResidentForm.name.trim(),
      phone: state.editResidentForm.phone.trim(),
      birthDate: state.editResidentForm.birthDate || null,
      householdRole: toApiHouseholdRole(newRole),
      moveInDate: state.editResidentForm.moveInDate || null,
    })
    state.editingResidentId = null
    await householdStore.fetchExpectedResidents({ householdId: state.editForm.householdId, page: 0, size: 100 })
  } catch (e) {
    state.editErrorMessage = getErrorMessage(e, '세대원 수정에 실패했습니다.')
  } finally {
    state.residentEditSubmitting = false
  }
}

function openResidentDeleteConfirm(resident) {
  state.residentDeleteTarget = resident
  state.modals.residentDeleteConfirm = true
}

async function handleResidentDelete() {
  if (!state.residentDeleteTarget) return
  try {
    await householdStore.disableExpectedResident(state.residentDeleteTarget.expectedResidentId)
    state.residentDeleteTarget = null
    state.modals.residentDeleteConfirm = false
  } catch (e) {
    console.error(e)
  }
}

async function handleEditHousehold() {
  if (state.editSubmitting) return
  state.modals.editConfirm = false
  state.editSubmitting = true
  state.editErrorMessage = ''
  try {
    await householdStore.updateHousehold(state.editForm.householdId, {
      building: state.editForm.building.trim(),
      unit: state.editForm.unit.trim(),
      typeId: state.editForm.typeId ? Number(state.editForm.typeId) : null,
    })
    if (state.editForm.status && state.editForm.status !== toStatusCode(state.selectedHousehold?.status)) {
      await householdStore.updateHouseholdStatus(state.editForm.householdId, {
        status: state.editForm.status,
        reason: state.editForm.reason.trim() || null,
      })
    }
    const itemName = `${state.editForm.building}동 ${state.editForm.unit}호`
    closeEditModal()
    openResultModal({
      type: 'success',
      title: '세대 정보가 수정되었습니다.',
      itemName,
      actionLabel: '세대 수정',
      afterConfirm: async () => { await loadHouseholds() },
    })
  } catch (error) {
    console.error(error)
    state.editErrorMessage = getErrorMessage(error, '세대 수정에 실패했습니다.')
  } finally {
    state.editSubmitting = false
  }
}

function openMatchModal(row) {
  state.selectedMatch = row
  state.matchForm.rejectReason = ''
  state.matchForm.rejectPreset = ''
  state.matchForm.rejectReasonCode = ''
  state.modals.matchProcess = true
}

function selectMatchRejectPreset(reason) {
  state.matchForm.rejectPreset = reason.code
  state.matchForm.rejectReasonCode = reason.code
  state.matchForm.rejectReason = reason.label
}

async function handleApprove() {
  if (state.approveSubmitting) return
  state.modals.approveConfirm = false
  state.approveSubmitting = true
  try {
    await householdStore.approveMatchRequest(state.selectedMatch.matchRequestId)
    await loadMatchRequests()
    await loadHouseholds()
    state.modals.matchProcess = false
    openResultModal({
      type: 'success',
      title: '매칭 요청이 승인되었습니다.',
      desc: '입주민에게 승인 안내가 반영됩니다.',
      itemName: state.selectedMatch.inputName,
      actionLabel: '세대 매칭 승인',
      afterConfirm: async () => {
        await loadMatchRequests()
        await loadHouseholds()
      },
    })
  } catch (error) {
    console.error(error)
  } finally {
    state.approveSubmitting = false
  }
}

async function handleReject() {
  if (!state.matchForm.rejectReason || state.rejectSubmitting) return
  state.modals.rejectConfirm = false
  state.rejectSubmitting = true
  try {
    await householdStore.rejectMatchRequest(state.selectedMatch.matchRequestId, {
      reason: state.matchForm.rejectReasonCode || 'ADMIN_REJECTED',
    })
    await loadMatchRequests()
    state.modals.matchProcess = false
    openResultModal({
      type: 'danger',
      title: '매칭 요청이 거절되었습니다.',
      desc: '입주민에게 거절 안내가 반영됩니다.',
      itemName: state.selectedMatch.inputName,
      actionLabel: '세대 매칭 거절',
      afterConfirm: async () => {
        await loadMatchRequests()
      },
    })
  } catch (error) {
    console.error(error)
  } finally {
    state.rejectSubmitting = false
  }
}

// 세대 등록 모달 열기 (topbar 버튼과 연결)
function openHouseholdCreateModal() {
  state.createForm.building = ''
  state.createForm.unit = ''
  state.createForm.moveInDate = ''
  state.createForm.resolvedType = null
  state.createForm.residents = []
  state.createForm.loadedAddressKey = ''
  state.createForm.loadingResidents = false
  state.createForm.showResidentForm = false
  state.createForm.residentInput = { name: '', phone: '', birthDate: '', householdRole: 'HEAD' }
  state.createErrorMessage = ''
  state.modals.create = true
}

function openResidentForm() {
  state.createForm.residentInput = { name: '', phone: '', birthDate: '', householdRole: 'HEAD' }
  state.createForm.showResidentForm = true
}

function cancelResidentForm() {
  state.createForm.showResidentForm = false
}

async function resolveTypeFromAddress() {
  const { building, unit } = state.createForm
  if (!building || !unit) {
    state.createForm.resolvedType = null
    return
  }
  try {
    const res = await householdStore.resolveBuildingLineType({ building, unit })
    state.createForm.resolvedType = res ?? null
  } catch {
    state.createForm.resolvedType = null
  }
}

async function loadExistingResidentsForAddress() {
  const building = state.createForm.building.trim()
  const unit = state.createForm.unit.trim()
  const addressKey = `${building}-${unit}`

  if (!building || !unit) {
    state.createForm.loadedAddressKey = ''
    state.createForm.residents = []
    return
  }
  if (state.createForm.loadedAddressKey === addressKey) return

  state.createForm.loadingResidents = true
  try {
    const existingHousehold = await findExistingHousehold(building, unit)
    if (!existingHousehold?.householdId) {
      state.createForm.loadedAddressKey = addressKey
      state.createForm.residents = []
      return
    }

    await householdStore.fetchExpectedResidents({
      householdId: existingHousehold.householdId,
      page: 0,
      size: 100,
    })

    const source = Array.isArray(householdStore.expectedResidents)
      ? householdStore.expectedResidents
      : (Array.isArray(householdStore.expectedResidents?.content) ? householdStore.expectedResidents.content : [])

    state.createForm.residents = source
      .filter((resident) => String(resident.householdId) === String(existingHousehold.householdId))
      .filter((resident) => !isDisabledExpectedResident(resident))
      .map((resident) => ({
        expectedResidentId: resident.expectedResidentId,
        name: resident.name ?? '',
        phone: resident.phone ?? '',
        birthDate: resident.birthDate ?? '',
        moveInDate: resident.moveInDate ?? '',
        householdRole: normalizeHouseholdRole(resident.householdRole ?? resident.role),
      }))
    state.createForm.loadedAddressKey = addressKey
  } catch (error) {
    state.createErrorMessage = getErrorMessage(error, '등록된 세대원 명부를 불러오지 못했습니다.')
  } finally {
    state.createForm.loadingResidents = false
  }
}

async function handleCreateAddressChanged() {
  await resolveTypeFromAddress()
  await loadExistingResidentsForAddress()
}

function registerResidentInput() {
  const { name, phone, birthDate, householdRole } = state.createForm.residentInput
  if (!name.trim()) {
    state.createErrorMessage = '입주민 이름을 입력해주세요.'
    return
  }
  if (!phone.trim()) {
    state.createErrorMessage = '입주민 연락처를 입력해주세요.'
    return
  }
  if (!birthDate) {
    state.createErrorMessage = '입주민 생년월일을 입력해주세요.'
    return
  }

  state.createForm.residents.push({
    name: name.trim(),
    phone: phone.trim(),
    birthDate,
    householdRole,
  })
  state.createErrorMessage = ''
  state.createForm.showResidentForm = false
}

async function removeResident(index) {
  const resident = state.createForm.residents[index]
  if (!resident) return

  if (resident.expectedResidentId) {
    try {
      await householdStore.disableExpectedResident(resident.expectedResidentId)
    } catch (error) {
      state.createErrorMessage = getErrorMessage(error, '등록된 세대원 삭제에 실패했습니다.')
      return
    }
  }

  state.createForm.residents.splice(index, 1)
}

async function handleHouseholdCreate() {
  if (state.createSubmitting) return
  state.createErrorMessage = ''

  const building = state.createForm.building.trim()
  const unit = state.createForm.unit.trim()
  if (!building) {
    state.createErrorMessage = '동을 입력해주세요.'
    return
  }
  if (!unit) {
    state.createErrorMessage = '호수를 입력해주세요.'
    return
  }
  if (!state.createForm.moveInDate) {
    state.createErrorMessage = '입주일자를 입력해주세요.'
    return
  }
  if (state.createForm.showResidentForm) {
    state.createErrorMessage = '입력 중인 세대원을 먼저 등록하거나 취소해주세요.'
    return
  }
  if (state.createForm.residents.length === 0) {
    state.createErrorMessage = '자동매칭을 위해 세대원을 1명 이상 등록해주세요.'
    return
  }
  if (!state.createForm.residents.some((resident) => resident.householdRole === 'HEAD')) {
    state.createErrorMessage = '세대주를 1명 이상 등록해주세요.'
    return
  }

  state.createSubmitting = true
  try {
    const existingHousehold = await findExistingHousehold(building, unit)
    let householdId = existingHousehold?.householdId

    if (!householdId) {
      const created = await householdStore.createHousehold({
        building,
        unit,
        typeId: state.createForm.resolvedType?.typeId ?? null,
      })
      householdId = created?.householdId
    }

    if (!householdId) throw new Error('세대 등록에 실패했습니다.')
    const newResidents = state.createForm.residents.filter((resident) => !resident.expectedResidentId)
    if (newResidents.length > 0) {
      await Promise.all(
        newResidents.map((r) =>
          householdStore.createExpectedResident({
            householdId,
            name: r.name.trim(),
            phone: r.phone.trim(),
            birthDate: r.birthDate,
            moveInDate: r.moveInDate || state.createForm.moveInDate,
            householdRole: r.householdRole,
          }),
        ),
      )
    }
    state.modals.create = false
    await loadHouseholds()
  } catch (e) {
    state.createErrorMessage = getErrorMessage(e, '세대 등록에 실패했습니다.')
  } finally {
    state.createSubmitting = false
  }
}

async function findExistingHousehold(building, unit) {
  return householdStore.findHouseholdByAddress(building, unit)
}

let createAddressTimer = null
watch(
  () => [state.createForm.building, state.createForm.unit],
  () => {
    state.createForm.loadedAddressKey = ''
    if (createAddressTimer) window.clearTimeout(createAddressTimer)
    createAddressTimer = window.setTimeout(() => {
      handleCreateAddressChanged()
    }, 300)
  },
)

// 평형 관리 모달 열기 (topbar 버튼과 연결)
async function openHouseholdTypeModal() {
  state.typeManageTab = 'lineType'
  state.lineForm = { building: '', lineStart: '', lineEnd: '', typeId: '' }
  state.lineFormError = ''
  state.typeDropdownOpen = false
  state.editingLineId = null
  state.bulkForm = { building: '', floorStart: '', floorEnd: '', lineStart: '', lineEnd: '' }
  state.bulkError = ''
  state.bulkRanges = []
  state.bulkHouseholds = []
  state.bulkEditingId = null
  state.bulkEditError = ''
  state.modals.typeManage = true
  loadBulkHouseholds()
  await Promise.all([loadHouseholdTypes(), loadBuildingLineTypes()])
}

async function loadHouseholdTypes() {
  try {
    await householdStore.fetchHouseholdTypes()
  } catch (e) {
    console.error(e)
  }
}

async function loadBuildingLineTypes() {
  try {
    await householdStore.fetchBuildingLineTypes()
  } catch (e) {
    console.error(e)
  }
}

function resetHouseholdPageState() {
  state.filters.keyword = ''
  state.filters.building = ''
  state.filters.status = ''
  state.buildingOptions = []
  state.pagination.currentPage = 1
  state.modals.detail = false
  state.modals.edit = false
  state.modals.matchProcess = false
  state.selectedHousehold = null
  state.selectedMatch = null
  householdStore.householdDetail = null
  householdStore.householdMembers = []
  householdStore.expectedResidents = []
  householdStore.householdHistory = []
}

async function reloadComplexScopedData() {
  await Promise.all([
    loadHouseholds(),
    loadMatchRequests(),
    loadBuildingOptions(),
    loadBuildingLineTypes(),
  ])
}

// 평형 선택 드롭다운
function selectType(type) {
  state.lineForm.typeId = String(type.typeId)
  state.typeDropdownOpen = false
}

// 동 라인 평형 등록 (폼 상단)
async function handleLineCreate() {
  if (state.lineFormSubmitting) return

  const building = state.lineForm.building.trim()
  const lineStart = parseInt(state.lineForm.lineStart)
  const lineEnd = parseInt(state.lineForm.lineEnd)

  if (!building) {
    state.lineFormError = '동을 입력해주세요.'
    return
  }
  if (!state.lineForm.lineStart || isNaN(lineStart) || lineStart < 1) {
    state.lineFormError = '시작 라인을 입력해주세요.'
    return
  }
  if (!state.lineForm.lineEnd || isNaN(lineEnd) || lineEnd < 1) {
    state.lineFormError = '종료 라인을 입력해주세요.'
    return
  }
  if (lineStart > lineEnd) {
    state.lineFormError = '종료 라인은 시작 라인보다 크거나 같아야 합니다.'
    return
  }
  if (!state.lineForm.typeId) {
    state.lineFormError = '평형을 선택해주세요.'
    return
  }

  state.lineFormSubmitting = true
  state.lineFormError = ''
  try {
    await householdStore.createBuildingLineType({
      building,
      lineStart,
      lineEnd,
      typeId: state.lineForm.typeId,
    })
    state.lineForm = { building: '', lineStart: '', lineEnd: '', typeId: '' }
    state.typeDropdownOpen = false
    await loadBuildingLineTypes()
  } catch (e) {
    state.lineFormError = getErrorMessage(e, '등록에 실패했습니다.')
  } finally {
    state.lineFormSubmitting = false
  }
}

// 인라인 수정
function startLineEdit(line) {
  state.editingLineId = line.lineTypeId
  state.editLineForm = {
    building: line.building,
    lineStart: String(line.lineStart ?? ''),
    lineEnd: String(line.lineEnd ?? ''),
    typeId: String(line.typeId ?? ''),
  }
  state.editLineError = ''
}

function cancelLineEdit() {
  state.editingLineId = null
  state.editLineError = ''
}

async function handleLineUpdate() {
  if (state.editLineSubmitting) return
  state.editLineSubmitting = true
  state.editLineError = ''
  try {
    await householdStore.updateBuildingLineType(state.editingLineId, {
      building: state.editLineForm.building.trim(),
      lineStart: parseInt(state.editLineForm.lineStart),
      lineEnd: parseInt(state.editLineForm.lineEnd),
      typeId: state.editLineForm.typeId,
    })
    state.editingLineId = null
    await loadBuildingLineTypes()
  } catch (e) {
    state.editLineError = getErrorMessage(e, '수정에 실패했습니다.')
  } finally {
    state.editLineSubmitting = false
  }
}

async function loadBulkHouseholds() {
  state.bulkHouseholdsLoading = true
  try {
    state.bulkHouseholds = await householdStore.fetchHouseholdsAll({ page: 0, size: 200 })
    state.bulkRanges = buildBulkRangesFromHouseholds(state.bulkHouseholds)
  } catch (e) {
    console.error(e)
  } finally {
    state.bulkHouseholdsLoading = false
  }
}

function parseUnitToFloorLine(unit) {
  const unitNumber = Number(String(unit ?? '').replace(/\D/g, ''))
  if (!Number.isFinite(unitNumber) || unitNumber < 100) return null
  const floor = Math.floor(unitNumber / 100)
  const line = unitNumber % 100
  if (floor < 1 || line < 1) return null
  return { floor, line }
}

function buildBulkRangesFromHouseholds(list) {
  const lineMap = new Map()

  list.forEach((household) => {
    const parsed = parseUnitToFloorLine(household.unit)
    if (!household.building || !parsed) return

    const key = `${household.building}__${parsed.line}`
    const current = lineMap.get(key) || {
      building: String(household.building),
      line: parsed.line,
      floors: new Set(),
    }
    current.floors.add(parsed.floor)
    lineMap.set(key, current)
  })

  const lineRanges = [...lineMap.values()]
    .map((item) => {
      const floors = [...item.floors].sort((a, b) => a - b)
      return {
        building: item.building,
        lineStart: item.line,
        lineEnd: item.line,
        floorStart: floors[0],
        floorEnd: floors[floors.length - 1],
      }
    })
    .sort((a, b) =>
      String(a.building).localeCompare(String(b.building), 'ko', { numeric: true }) ||
      a.floorStart - b.floorStart ||
      a.floorEnd - b.floorEnd ||
      a.lineStart - b.lineStart
    )

  const grouped = []
  lineRanges.forEach((range) => {
    const prev = grouped[grouped.length - 1]
    if (
      prev &&
      prev.building === range.building &&
      prev.floorStart === range.floorStart &&
      prev.floorEnd === range.floorEnd &&
      prev.lineEnd + 1 === range.lineStart
    ) {
      prev.lineEnd = range.lineEnd
      return
    }

    grouped.push({
      id: `${range.building}-${range.floorStart}-${range.floorEnd}-${range.lineStart}-${range.lineEnd}`,
      ...range,
    })
  })

  return grouped
}

function startBulkEdit(h) {
  state.bulkEditingId = h.householdId
  state.bulkEditForm = { building: h.building, unit: h.unit }
  state.bulkEditError = ''
}

function cancelBulkEdit() {
  state.bulkEditingId = null
  state.bulkEditError = ''
}

async function handleBulkHouseholdUpdate() {
  if (state.bulkEditSubmitting) return
  state.bulkEditSubmitting = true
  state.bulkEditError = ''
  try {
    await householdStore.updateHousehold(state.bulkEditingId, {
      building: state.bulkEditForm.building.trim(),
      unit: state.bulkEditForm.unit.trim(),
    })
    state.bulkEditingId = null
    await loadBulkHouseholds()
  } catch (e) {
    state.bulkEditError = getErrorMessage(e, '수정에 실패했습니다.')
  } finally {
    state.bulkEditSubmitting = false
  }
}

function openBulkDeleteConfirm(h) {
  state.bulkDeleteTarget = h
  state.modals.bulkDeleteConfirm = true
}

async function handleBulkHouseholdDelete() {
  if (!state.bulkDeleteTarget) return
  state.modals.bulkDeleteConfirm = false
  try {
    await householdStore.deleteHousehold(state.bulkDeleteTarget.householdId)
    state.bulkDeleteTarget = null
    await Promise.all([loadBulkHouseholds(), loadHouseholds()])
  } catch (e) {
    console.error(e)
  }
}

async function handleBulkCreate() {
  if (state.bulkSubmitting) return
  state.bulkError = ''
  const { building, floorStart, floorEnd, lineStart, lineEnd } = state.bulkForm
  if (!building || !floorEnd || !lineStart || !lineEnd) {
    state.bulkError = '동, 종료층, 시작라인, 종료라인은 필수입니다.'
    return
  }
  state.bulkSubmitting = true
  try {
    const res = await householdStore.createHouseholdsBulk({
      building: building.trim(),
      floorStart: floorStart ? Number(floorStart) : null,
      floorEnd: Number(floorEnd),
      lineStart: Number(lineStart),
      lineEnd: Number(lineEnd),
    })
    state.bulkRanges.unshift({
      id: Date.now(),
      building: building.trim(),
      floorStart: floorStart ? Number(floorStart) : 1,
      floorEnd: Number(floorEnd),
      lineStart: Number(lineStart),
      lineEnd: Number(lineEnd),
      createdCount: res.createdCount,
      skippedCount: res.skippedCount,
    })
    state.bulkForm = { building: '', floorStart: '', floorEnd: '', lineStart: '', lineEnd: '' }
    await Promise.all([loadBulkHouseholds(), loadHouseholds()])
  } catch (e) {
    state.bulkError = getErrorMessage(e, '동호수 등록에 실패했습니다.')
  } finally {
    state.bulkSubmitting = false
  }
}

function startBulkRangeEdit(range) {
  state.bulkEditingId = range.id
  state.bulkEditError = ''
  state.bulkEditForm = {
    building: range.building,
    floorStart: String(range.floorStart),
    floorEnd: String(range.floorEnd),
    lineStart: String(range.lineStart),
    lineEnd: String(range.lineEnd),
  }
}

function cancelBulkRangeEdit() {
  state.bulkEditingId = null
  state.bulkEditError = ''
  state.bulkEditForm = { building: '', floorStart: '', floorEnd: '', lineStart: '', lineEnd: '' }
}

function saveBulkRangeEdit(rangeId) {
  const { building, floorStart, floorEnd, lineStart, lineEnd } = state.bulkEditForm
  if (!building || !floorEnd || !lineStart || !lineEnd) {
    state.bulkEditError = '동, 종료층, 시작라인, 종료라인은 필수입니다.'
    return
  }

  const nextFloorStart = floorStart ? Number(floorStart) : 1
  const nextFloorEnd = Number(floorEnd)
  const nextLineStart = Number(lineStart)
  const nextLineEnd = Number(lineEnd)

  if (
    nextFloorStart < 1 ||
    nextFloorEnd < 1 ||
    nextFloorStart > nextFloorEnd ||
    nextLineStart < 1 ||
    nextLineEnd < 1 ||
    nextLineStart > nextLineEnd
  ) {
    state.bulkEditError = '층/라인 범위를 확인해주세요.'
    return
  }

  state.bulkRanges = state.bulkRanges.map((range) =>
    range.id === rangeId
      ? {
          ...range,
          building: building.trim(),
          floorStart: nextFloorStart,
          floorEnd: nextFloorEnd,
          lineStart: nextLineStart,
          lineEnd: nextLineEnd,
        }
      : range,
  )
  cancelBulkRangeEdit()
}

async function removeBulkRange(rangeId) {
  const range = state.bulkRanges.find((item) => item.id === rangeId)
  if (!range) return

  const targets = state.bulkHouseholds.filter((household) => {
    if (String(household.building) !== String(range.building)) return false
    const parsed = parseUnitToFloorLine(household.unit)
    if (!parsed) return false
    return parsed.floor >= range.floorStart
      && parsed.floor <= range.floorEnd
      && parsed.line >= range.lineStart
      && parsed.line <= range.lineEnd
  })

  try {
    await Promise.all(targets.map((household) => householdStore.deleteHousehold(household.householdId)))
    const deletedIds = new Set(targets.map((household) => household.householdId))
    state.bulkHouseholds = state.bulkHouseholds.filter((household) => !deletedIds.has(household.householdId))
    state.bulkRanges = buildBulkRangesFromHouseholds(state.bulkHouseholds)
    await loadHouseholds()
  } catch (e) {
    state.bulkError = getErrorMessage(e, '동호수 삭제에 실패했습니다.')
  }
}

// 삭제 확인
function openLineDeleteConfirm(line) {
  state.selectedLineForDelete = line
  state.modals.lineDeleteConfirm = true
}

async function handleLineDelete() {
  if (!state.selectedLineForDelete) return
  state.modals.lineDeleteConfirm = false
  try {
    await householdStore.deleteBuildingLineType(state.selectedLineForDelete.lineTypeId)
    state.selectedLineForDelete = null
    await loadBuildingLineTypes()
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  if (registerOpenModal) registerOpenModal(openHouseholdTypeModal)
  if (registerCreateModal) registerCreateModal(openHouseholdCreateModal)
  await Promise.all([
    loadHouseholds(),
    loadMatchRequests(),
    loadBuildingOptions(),
    householdStore.fetchHouseholdTypes(),
    loadBuildingLineTypes(),
  ])
})

watch(
  () => complexStore.selectedComplex?.complexId,
  async (nextComplexId, prevComplexId) => {
    if (authStore.role !== 'MASTER' || !nextComplexId || nextComplexId === prevComplexId) return
    resetHouseholdPageState()
    await reloadComplexScopedData()
  },
)
</script>

<template>
  <section class="manage-page">
    <StatsCards :stats="summaryItems" />

    <!-- 탭 -->
    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ 'is-active': state.activeTab === 'households' }"
        @click="switchTab('households')"
      >
        세대 목록
      </button>
      <button
        class="tab-btn"
        :class="{ 'is-active': state.activeTab === 'match' }"
        @click="switchTab('match')"
      >
        승인 대기
        <span v-if="pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
      </button>
    </div>

    <!-- 세대 목록 탭 -->
    <div v-if="state.activeTab === 'households'" class="card-shell">
      <AdminFilterBar @search="doSearch" @reset="resetFilters">
        <!-- 검색 입력 (호수·세대주) -->
        <div class="search-input-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="state.filters.keyword"
            class="filter-input"
            type="text"
            placeholder="호수, 세대주 검색"
            @keyup.enter="doSearch"
          />
        </div>

        <!-- 동 드롭다운 -->
        <select v-model="state.filters.building" class="filter-select" @change="doSearch">
          <option value="">전체 동</option>
          <option v-for="b in buildingOptions" :key="b" :value="b">{{ b }}</option>
        </select>

        <!-- 입주 상태 드롭다운 -->
        <select v-model="state.filters.status" class="filter-select" @change="doSearch">
          <option value="">전체 상태</option>
          <option value="OCCUPIED">입주</option>
          <option value="VACANT">공실</option>
          <option value="MOVED_OUT">퇴실</option>
        </select>

      </AdminFilterBar>

      <div class="manage-page__table-shell">
        <div v-if="state.listLoading" class="table-feedback">세대 목록을 불러오는 중입니다.</div>
        <div v-else-if="state.errorMessage" class="table-feedback error">{{ state.errorMessage }}</div>
        <div v-else-if="households.length === 0" class="table-feedback">등록된 세대가 없습니다.</div>
        <AdminTable
          v-else
          :columns="householdColumns"
          :rows="pagedHouseholds"
          @row-click="handleRowClick"
        >
          <template #cell-status="{ row }">
            <span :class="['status-badge', statusClass(row.status)]">{{ statusLabel(row.status) }}</span>
          </template>
        </AdminTable>
      </div>

      <div class="manage-page__pagination">
        <AppPagination
          v-if="!state.listLoading && households.length > 0"
          :current-page="state.pagination.currentPage"
          :total-pages="totalPages"
          :total-all="totalElements"
          :total-filtered="households.length"
          unit="세대"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 매칭 승인 대기 탭 -->
    <div v-if="state.activeTab === 'match'" class="card-shell">
      <AdminFilterBar @reset="resetMatchFilters">
        <div class="search-input-wrap">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="state.matchFilters.keyword"
            class="filter-input"
            type="text"
            placeholder="이름으로 검색"
          />
        </div>
        <select v-model="state.matchFilters.status" class="filter-select">
          <option value="">전체 상태</option>
          <option value="PENDING">승인대기</option>
          <option value="APPROVED">승인완료</option>
          <option value="REJECTED">승인거절</option>
        </select>
      </AdminFilterBar>

      <div v-if="pagedMatchRequests.length === 0" class="table-feedback">조건에 맞는 매칭 요청이 없습니다.</div>
      <AdminTable
        v-else
        :columns="matchColumns"
        :rows="pagedMatchRequests"
      >
        <template #cell-matchStatus="{ row }">
          <span :class="['status-badge', matchStatusClass(row.matchStatus)]">{{ row.matchStatusLabel }}</span>
        </template>
        <template #action="{ row }">
          <div class="table-actions">
            <button
              v-if="normalizeMatchStatus(row.matchStatus) === 'PENDING'"
              type="button"
              class="table-action-button"
              @click.stop="openMatchModal(row)"
            >
              처리
            </button>
            <span v-else class="table-action-text">완료</span>
          </div>
        </template>
      </AdminTable>
    </div>

    <!-- 세대 등록 모달 -->
    <BaseModal
      class="household-modal"
      :visible="state.modals.create"
      title="세대 정보 등록"
      subtitle="새 세대 정보를 등록합니다."
      @close="state.modals.create = false"
    >
      <div class="create-section-label" style="margin-bottom: 10px;">세대 정보</div>
      <div class="form-grid form-grid--3col">
        <label class="form-field">
          <span>동 *</span>
          <input
            v-model="state.createForm.building"
            type="text"
            placeholder="예) 101"
            @blur="resolveTypeFromAddress"
          />
        </label>
        <label class="form-field">
          <span>호수 *</span>
          <input
            v-model="state.createForm.unit"
            type="text"
            placeholder="예) 1201"
            @blur="resolveTypeFromAddress"
          />
        </label>
        <label class="form-field">
          <span>평형</span>
          <input
            :value="state.createForm.resolvedType ? state.createForm.resolvedType.typeName : '-'"
            disabled
          />
        </label>
      </div>
      <label class="form-field" style="margin-top: 12px;">
        <span>입주일자</span>
        <input
          v-model="state.createForm.moveInDate"
          type="date"
        />
      </label>

      <div class="create-section-header">
        <span class="create-section-label">세대구성원</span>
        <button type="button" class="create-add-button" @click="openResidentForm">
          + 세대원 추가
        </button>
      </div>

      <div class="resident-list">
        <div class="resident-list__header">
          <span>이름</span>
          <span>연락처</span>
          <span>생년월일</span>
          <span>세대역할</span>
          <span></span>
        </div>
        <div v-if="state.createForm.residents.length === 0" class="resident-list__row resident-list__row--empty">
          <span>-</span>
          <span>-</span>
          <span>-</span>
          <span>-</span>
          <span></span>
        </div>
        <div
          v-for="(r, index) in state.createForm.residents"
          :key="index"
          class="resident-list__row"
        >
          <span>{{ r.name }}</span>
          <span>{{ r.phone }}</span>
          <span>{{ r.birthDate || '-' }}</span>
          <span>{{ r.householdRole === 'HEAD' ? '세대주' : '세대원' }}</span>
          <button type="button" class="resident-list__remove" @click="removeResident(index)">삭제</button>
        </div>
      </div>

      <div v-if="state.createForm.showResidentForm" class="resident-form-box">
        <div class="form-grid">
          <label class="form-field">
            <span>이름 *</span>
            <input v-model="state.createForm.residentInput.name" type="text" placeholder="이름을 입력하세요." />
          </label>
          <label class="form-field">
            <span>연락처 *</span>
            <input v-model="state.createForm.residentInput.phone" type="text" placeholder="010-0000-0000" />
          </label>
          <label class="form-field">
            <span>생년월일</span>
            <input v-model="state.createForm.residentInput.birthDate" type="date" />
          </label>
          <label class="form-field">
            <span>세대역할 *</span>
            <select v-model="state.createForm.residentInput.householdRole">
              <option value="HEAD">세대주</option>
              <option value="MEMBER">세대원</option>
            </select>
          </label>
        </div>
        <div class="resident-form-box__actions">
          <button type="button" class="page-button page-button--ghost page-button--sm" @click="cancelResidentForm">취소</button>
          <button type="button" class="page-button page-button--primary page-button--sm" @click="registerResidentInput">세대원 등록</button>
        </div>
      </div>

      <p v-if="state.createErrorMessage" class="form-feedback error">{{ state.createErrorMessage }}</p>

      <template #footer>
        <button type="button" class="page-button page-button--ghost" @click="state.modals.create = false">취소</button>
        <button
          type="button"
          class="page-button page-button--primary"
          :disabled="state.createSubmitting"
          @click="handleHouseholdCreate"
        >
          {{ state.createSubmitting ? '처리 중...' : '등록' }}
        </button>
      </template>
    </BaseModal>

    <!-- 세대 수정 모달 -->
    <BaseModal
      class="household-modal"
      :visible="state.modals.edit"
      title="세대 정보 수정"
      :subtitle="state.selectedHousehold ? `#${state.selectedHousehold.number}` : ''"
      @close="closeEditModal"
    >
      <!-- 주소 헤더 (read-only) -->
      <div class="detail-hero">
        <div class="detail-address-row">
          <h2 class="detail-address">{{ state.selectedHousehold?.building }}동 {{ state.selectedHousehold?.unit }}호</h2>
        </div>
        <p class="detail-sub">세대 정보</p>
      </div>

      <div class="detail-divider" />

      <!-- 기본 정보 그리드 (read-only) -->
      <div class="detail-grid edit-info-grid">
        <div class="detail-cell">
          <span class="detail-cell-label">동</span>
          <span class="detail-cell-value">{{ state.selectedHousehold?.building ?? '-' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">호수</span>
          <span class="detail-cell-value">{{ state.selectedHousehold?.unit ?? '-' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">등록 차량 수</span>
          <span class="detail-cell-value">{{ state.selectedHousehold?.carCount != null ? state.selectedHousehold.carCount + '' : '-' }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-cell-label">등록일</span>
          <span class="detail-cell-value">{{ formatDate(state.selectedHousehold?.createdAt) }}</span>
        </div>
      </div>

      <div class="detail-divider" />

      <!-- 입주 상태 (editable) -->
      <div class="edit-status-field">
        <span class="detail-cell-label">입주 상태</span>
        <select v-model="state.editForm.status" class="edit-status-select">
          <option value="OCCUPIED">입주</option>
          <option value="VACANT">공실</option>
          <option value="MOVED_OUT">퇴거</option>
        </select>
      </div>

      <div class="detail-divider" />

      <!-- 등록 입주민 -->
      <div class="detail-section-title">등록 입주민</div>
      <div v-if="detailExpectedResidents.length === 0" class="detail-empty">등록된 입주민이 없습니다.</div>
      <div v-else class="expected-resident-table-wrap">
        <table class="expected-resident-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>연락처</th>
              <th>생년월일</th>
              <th>역할</th>
              <th>입주일</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="m in detailExpectedResidents" :key="m.expectedResidentId">
              <tr>
                <td>{{ m.name || '-' }}</td>
                <td>{{ m.phone || '-' }}</td>
                <td>{{ m.birthDate ? formatDate(m.birthDate) : '-' }}</td>
                <td>{{ isHeadRole(m.householdRole) ? '세대주' : '세대원' }}</td>
                <td>{{ m.moveInDate ? formatDate(m.moveInDate) : '-' }}</td>
                <td>
                  <div class="table-actions">
                    <button type="button" class="table-action-button" @click="openResidentEdit(m)">수정</button>
                    <button type="button" class="table-action-button table-action-button--danger" @click="openResidentDeleteConfirm(m)">삭제</button>
                  </div>
                </td>
              </tr>
              <!-- 인라인 수정 폼 -->
              <tr v-if="state.editingResidentId === m.expectedResidentId" class="resident-inline-edit-row">
                <td colspan="6">
                  <div class="resident-inline-edit-form">
                    <div class="form-grid">
                      <label class="form-field">
                        <span>이름</span>
                        <input v-model="state.editResidentForm.name" type="text" placeholder="이름" />
                      </label>
                      <label class="form-field">
                        <span>연락처</span>
                        <input v-model="state.editResidentForm.phone" type="text" placeholder="010-0000-0000" />
                      </label>
                      <label class="form-field">
                        <span>생년월일</span>
                        <input v-model="state.editResidentForm.birthDate" type="date" />
                      </label>
                      <label class="form-field">
                        <span>세대 역할</span>
                        <select v-model="state.editResidentForm.householdRole">
                          <option value="HEAD">세대주</option>
                          <option value="MEMBER">세대원</option>
                        </select>
                      </label>
                      <label class="form-field">
                        <span>입주일</span>
                        <input v-model="state.editResidentForm.moveInDate" type="date" />
                      </label>
                    </div>
                    <div class="resident-form-box__actions">
                      <button type="button" class="page-button page-button--ghost page-button--sm" @click="cancelResidentEdit">취소</button>
                      <button type="button" class="page-button page-button--primary page-button--sm" :disabled="state.residentEditSubmitting" @click="handleResidentEdit">
                        {{ state.residentEditSubmitting ? '저장 중...' : '저장' }}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <p v-if="state.editErrorMessage" class="form-feedback error" style="margin-top: 12px;">{{ state.editErrorMessage }}</p>

      <template #footer>
        <button type="button" class="page-button page-button--ghost" @click="closeEditModal">닫기</button>
        <button
          type="button"
          class="page-button page-button--primary"
          :disabled="state.editSubmitting"
          @click="state.modals.editConfirm = true"
        >
          {{ state.editSubmitting ? '처리 중...' : '수정 완료' }}
        </button>
      </template>
    </BaseModal>

    <!-- 수정 확인 모달 -->
    <ConfirmModal
      :visible="state.modals.editConfirm"
      title="세대 정보를 수정하시겠습니까?"
      subtitle="수정 내역은 이력에 자동 기록됩니다."
      item-label="세대"
      :item-name="`${state.editForm.building}동 ${state.editForm.unit}호`"
      action-text="세대 수정"
      confirm-text="수정 완료"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.editSubmitting"
      @confirm="handleEditHousehold"
      @cancel="state.modals.editConfirm = false"
    />

    <!-- 세대원 삭제 확인 모달 -->
    <ConfirmModal
      :visible="state.modals.residentDeleteConfirm"
      title="입주민을 삭제하시겠습니까?"
      subtitle="삭제된 입주민은 비활성 처리됩니다."
      item-label="입주민"
      :item-name="state.residentDeleteTarget?.name ?? ''"
      action-text="입주민 삭제"
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      @confirm="handleResidentDelete"
      @cancel="state.modals.residentDeleteConfirm = false"
    />

    <!-- 매칭 처리 모달 -->
    <BaseModal
      class="household-modal"
      :visible="state.modals.matchProcess"
      title="매칭 승인 처리"
      @close="state.modals.matchProcess = false"
    >
      <div v-if="state.selectedMatch" class="match-review">
        <div class="match-review__person">
          <strong>{{ state.selectedMatch.inputName }}</strong>
          <span>{{ state.selectedMatch.address }}</span>
        </div>
        <dl class="match-review__meta">
          <div>
            <dt>요청일</dt>
            <dd>{{ state.selectedMatch.createdAt }}</dd>
          </div>
          <div>
            <dt>생년월일</dt>
            <dd>{{ formatDate(state.selectedMatch.inputBirthDate) }}</dd>
          </div>
          <div>
            <dt>연락처</dt>
            <dd>{{ state.selectedMatch.inputPhone ?? '-' }}</dd>
          </div>
        </dl>
      </div>
      <div class="form-grid match-reject-section">
        <div class="form-field form-field--full">
          <span>거절 사유 <em class="required">*</em></span>
          <div class="reject-preset-group">
            <button
              v-for="reason in matchRejectPresets"
              :key="reason.code"
              type="button"
              :class="['reject-preset-button', { 'is-selected': state.matchForm.rejectPreset === reason.code }]"
              @click="selectMatchRejectPreset(reason)"
            >
              {{ reason.label }}
            </button>
          </div>
        </div>
        <label class="form-field form-field--full">
          <span>직접 입력</span>
          <input
            v-model="state.matchForm.rejectReason"
            type="text"
            placeholder="필요 시 사유를 직접 입력하세요"
          />
        </label>
      </div>
      <p class="form-feedback hint">승인은 사유 없이 바로 처리됩니다.</p>
      <template #footer>
        <button type="button" class="page-button page-button--ghost" @click="state.modals.matchProcess = false">닫기</button>
        <button
          type="button"
          class="page-button page-button--danger"
          :disabled="!state.matchForm.rejectReason"
          @click="state.modals.rejectConfirm = true"
        >
          거절
        </button>
        <button
          type="button"
          class="page-button page-button--primary"
          :disabled="state.approveSubmitting"
          @click="state.modals.approveConfirm = true"
        >
          {{ state.approveSubmitting ? '처리 중...' : '승인' }}
        </button>
      </template>
    </BaseModal>

    <!-- 승인 확인 모달 -->
    <ConfirmModal
      :visible="state.modals.approveConfirm"
      title="매칭 요청을 승인하시겠습니까?"
      subtitle="승인 시 세대원으로 즉시 등록됩니다."
      item-label="입주민"
      :item-name="state.selectedMatch?.inputName ?? ''"
      action-text="세대 매칭 승인"
      confirm-text="승인"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.approveSubmitting"
      @confirm="handleApprove"
      @cancel="state.modals.approveConfirm = false"
    />

    <!-- 거절 확인 모달 -->
    <ConfirmModal
      :visible="state.modals.rejectConfirm"
      title="매칭 요청을 거절하시겠습니까?"
      subtitle="거절 사유가 입주민에게 전달됩니다."
      item-label="입주민"
      :item-name="state.selectedMatch?.inputName ?? ''"
      action-text="세대 매칭 거절"
      confirm-text="거절"
      cancel-text="취소"
      confirm-type="danger"
      :loading="state.rejectSubmitting"
      @confirm="handleReject"
      @cancel="state.modals.rejectConfirm = false"
    />

    <!-- 결과 모달 -->
    <ActionResultModal
      :visible="state.resultModal.visible"
      :type="state.resultModal.type"
      :title="state.resultModal.title"
      :subtitle="state.resultModal.subtitle"
      :desc="state.resultModal.desc"
      :item-name="state.resultModal.itemName"
      :time="state.resultModal.time"
      :action-label="state.resultModal.actionLabel"
      :actor="state.resultModal.actor"
      @close="handleResultConfirm"
    />

    <!-- 세대 상세 모달 -->
    <BaseModal
      class="household-modal"
      :visible="state.modals.detail"
      title="세대 상세 정보"
      :subtitle="state.selectedHousehold ? `#${state.selectedHousehold.number}` : ''"
      @close="state.modals.detail = false"
    >
      <div v-if="state.detailLoading" class="table-feedback">불러오는 중...</div>
      <template v-else-if="householdDetail">
        <!-- 히어로: 주소 + 상태 배지 한 줄 -->
        <div class="detail-hero">
          <div class="detail-address-row">
            <h2 class="detail-address">{{ householdDetail.building }}동 {{ householdDetail.unit }}호</h2>
            <span :class="['detail-status-badge', statusClass(householdDetail.status)]">
              {{ statusLabel(householdDetail.status) }}
            </span>
          </div>
          <p class="detail-sub">세대 정보</p>
        </div>

        <div class="detail-divider" />

        <!-- 기본 정보 그리드 (6칸) -->
        <div class="detail-grid">
          <div class="detail-cell">
            <span class="detail-cell-label">세대 ID</span>
            <span class="detail-cell-value">#{{ state.selectedHousehold?.number ?? householdDetail.householdId }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">등록일</span>
            <span class="detail-cell-value">{{ formatDate(householdDetail.createdAt) }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">동</span>
            <span class="detail-cell-value">{{ householdDetail.building }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">호수</span>
            <span class="detail-cell-value">{{ householdDetail.unit }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">입주 상태</span>
            <span class="detail-cell-value">{{ statusLabel(householdDetail.status) }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">등록 차량 수</span>
            <span class="detail-cell-value">{{ householdDetail.carCount != null ? householdDetail.carCount + '대' : '-' }}</span>
          </div>
        </div>

        <div class="detail-divider" />

        <!-- 등록 입주민 -->
        <div class="detail-section-title">등록 입주민</div>
        <div v-if="detailExpectedResidents.length === 0" class="detail-empty">등록된 입주민 명부가 없습니다.</div>
        <div v-else class="expected-resident-table-wrap">
          <table class="expected-resident-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>연락처</th>
                <th>생년월일</th>
                <th>역할</th>
                <th>입주일</th>
                <th>웹서비스</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in detailExpectedResidents" :key="m.expectedResidentId">
                <td>{{ m.name || '-' }}</td>
                <td>{{ m.phone || '-' }}</td>
                <td>{{ m.birthDate ? formatDate(m.birthDate) : '-' }}</td>
                <td>{{ isHeadRole(m.householdRole) ? '세대주' : '세대원' }}</td>
                <td>{{ m.moveInDate ? formatDate(m.moveInDate) : '-' }}</td>
                <td>
                  <span :class="['web-service-badge', webServiceClass(m.webServiceStatus)]">
                    {{ webServiceLabel(m.webServiceStatus) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="detail-divider" />

        <!-- 처리 이력 -->
        <div class="detail-section-title">처리 이력</div>
        <div v-if="householdHistory.length === 0" class="detail-empty">이력이 없습니다.</div>
        <ul v-else class="detail-history-list history-scroll-area">
          <li v-for="h in householdHistory" :key="h.historyId" class="detail-history-item">
            <span class="history-date">{{ formatDate(h.changedAt) }}</span>
            <span class="history-content">{{ historyContent(h) }}</span>
          </li>
        </ul>
      </template>
      <div v-else class="table-feedback">세대 정보를 불러오지 못했습니다.</div>
      <template #footer>
        <button
          type="button"
          class="page-button page-button--ghost"
          @click="() => { state.modals.detail = false; openEditModal(state.selectedHousehold) }"
        >
          수정
        </button>
        <button type="button" class="page-button page-button--primary" @click="state.modals.detail = false">닫기</button>
      </template>
    </BaseModal>

    <!-- 세대원 삭제 확인 모달 -->
    <ConfirmModal
      :visible="state.modals.memberDeleteConfirm"
      title="세대원을 삭제하시겠습니까?"
      subtitle="삭제 후 복구할 수 없습니다."
      item-label="입주민"
      :item-name="state.selectedMember?.name || `사용자 #${state.selectedMember?.userId}`"
      action-text="세대원 삭제"
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      :loading="state.memberActionSubmitting"
      @confirm="handleMemberDelete"
      @cancel="state.modals.memberDeleteConfirm = false"
    />

    <!-- 평형/라인 관리 모달 -->
    <BaseModal
      class="household-modal"
      :visible="state.modals.typeManage"
      title="평형/라인 관리"
      subtitle="동 라인별 평형을 등록하고 관리합니다."
      @close="state.modals.typeManage = false"
    >
      <!-- 내부 탭 -->
      <div class="modal-tab-bar">
        <button
          type="button"
          class="modal-tab-btn"
          :class="{ 'is-active': state.typeManageTab === 'lineType' }"
          @click="state.typeManageTab = 'lineType'"
        >평형관리</button>
        <button
          type="button"
          class="modal-tab-btn"
          :class="{ 'is-active': state.typeManageTab === 'bulk' }"
          @click="state.typeManageTab = 'bulk'"
        >동호수관리</button>
      </div>

      <!-- 평형관리 탭 -->
      <template v-if="state.typeManageTab === 'lineType'">
      <!-- 1행: 동 / 시작라인 / 종료라인 -->
      <div class="type-create-row">
        <div class="type-field">
          <span class="type-field-label">동 <em class="required">*</em></span>
          <input
            v-model="state.lineForm.building"
            class="type-input"
            type="text"
            placeholder="예) 101"
          />
        </div>
        <div class="type-field">
          <span class="type-field-label">시작 라인 <em class="required">*</em></span>
          <input
            v-model="state.lineForm.lineStart"
            class="type-input"
            type="number"
            min="1"
            placeholder="예) 1"
          />
        </div>
        <div class="type-field">
          <span class="type-field-label">종료 라인 <em class="required">*</em></span>
          <input
            v-model="state.lineForm.lineEnd"
            class="type-input"
            type="number"
            min="1"
            placeholder="예) 4"
          />
        </div>
      </div>

      <!-- 2행: 평형 선택 (클릭 시 펼침) -->
      <div class="type-selector-wrap">
        <span class="type-field-label type-field-label--block">평형선택 <em class="required">*</em></span>
        <button
          type="button"
          class="type-selector-btn"
          :class="{ 'is-selected': state.lineForm.typeId }"
          @click="state.typeDropdownOpen = !state.typeDropdownOpen"
        >
          <span>{{ selectedTypeName || '평형을 선택하세요' }}</span>
          <svg
            class="type-selector-chevron"
            :class="{ 'is-open': state.typeDropdownOpen }"
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div v-if="state.typeDropdownOpen" class="type-dropdown">
          <div v-if="householdTypes.length === 0" class="type-dropdown-empty">등록된 평형이 없습니다.</div>
          <button
            v-for="t in householdTypes"
            :key="t.typeId"
            type="button"
            class="type-dropdown-item"
            :class="{ 'is-active': String(t.typeId) === state.lineForm.typeId }"
            @click="selectType(t)"
          >
            <span class="type-dropdown-name">{{ t.typeName }}</span>
          </button>
        </div>
      </div>

      <p v-if="state.lineFormError" class="form-feedback error">{{ state.lineFormError }}</p>
      <p class="form-feedback hint">라인: 호수 끝 두 자리 기준 (101호 → 라인 1, 1101호 → 라인 1)</p>

      <!-- 3행: 등록된 라인 목록 -->
      <div class="form-divider" />
      <div v-if="buildingLineTypes.length === 0" class="type-empty">등록된 동 라인 평형이 없습니다.</div>
      <div v-else class="type-table-frame">
      <table class="type-table type-table--head">
          <colgroup>
          <col style="width: 46px" />
          <col style="width: 58px" />
          <col style="width: 58px" />
          <col style="width: 150px" />
          <col style="width: 128px" />
        </colgroup>
        <thead>
          <tr>
            <th>동</th>
            <th>시작 라인</th>
            <th>종료 라인</th>
            <th>평형</th>
            <th></th>
          </tr>
        </thead>
      </table>
      <div class="type-table-scroll">
      <table class="type-table type-table--body">
          <colgroup>
          <col style="width: 46px" />
          <col style="width: 58px" />
          <col style="width: 58px" />
          <col style="width: 150px" />
          <col style="width: 128px" />
        </colgroup>
        <tbody>
          <tr v-for="line in buildingLineTypes" :key="line.lineTypeId">
            <!-- 인라인 수정 중인 행 -->
            <template v-if="state.editingLineId === line.lineTypeId">
              <td><input v-model="state.editLineForm.building" class="inline-input" type="text" /></td>
              <td><input v-model="state.editLineForm.lineStart" class="inline-input inline-input--sm" type="number" min="1" /></td>
              <td><input v-model="state.editLineForm.lineEnd" class="inline-input inline-input--sm" type="number" min="1" /></td>
              <td>
                <select v-model="state.editLineForm.typeId" class="inline-select">
                  <option v-for="t in householdTypes" :key="t.typeId" :value="String(t.typeId)">{{ t.typeName }}</option>
                </select>
              </td>
              <td>
                <div class="table-actions">
                  <button type="button" class="table-action-button table-action-button--primary" :disabled="state.editLineSubmitting" @click="handleLineUpdate">
                    {{ state.editLineSubmitting ? '...' : '저장' }}
                  </button>
                  <button type="button" class="table-action-button" @click="cancelLineEdit">취소</button>
                </div>
                <p v-if="state.editLineError" class="inline-error">{{ state.editLineError }}</p>
              </td>
            </template>
            <!-- 일반 행 -->
            <template v-else>
              <td>{{ line.building }}</td>
              <td>{{ line.lineStart }}</td>
              <td>{{ line.lineEnd }}</td>
              <td>{{ line.typeName ?? '-' }}</td>
              <td>
                <div class="table-actions">
                  <button type="button" class="table-action-button" @click="startLineEdit(line)">수정</button>
                  <button type="button" class="table-action-button table-action-button--danger" @click="openLineDeleteConfirm(line)">삭제</button>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
      </div>
      </div>
      </template>

      <!-- 동호수 등록 탭 -->
      <template v-if="state.typeManageTab === 'bulk'">
        <!-- 1행: 동 / 시작라인 / 종료라인 -->
        <div class="type-create-row">
          <div class="type-field">
            <span class="type-field-label">동 <em class="required">*</em></span>
            <input v-model="state.bulkForm.building" class="type-input" type="text" placeholder="예) 101" />
          </div>
          <div class="type-field">
            <span class="type-field-label">시작 라인 <em class="required">*</em></span>
            <input v-model="state.bulkForm.lineStart" class="type-input" type="number" min="1" placeholder="예) 1" />
          </div>
          <div class="type-field">
            <span class="type-field-label">종료 라인 <em class="required">*</em></span>
            <input v-model="state.bulkForm.lineEnd" class="type-input" type="number" min="1" placeholder="예) 2" />
          </div>
        </div>
        <!-- 2행: 시작층 / 종료층 -->
        <div class="type-create-row">
          <div class="type-field">
            <span class="type-field-label">시작층</span>
            <input v-model="state.bulkForm.floorStart" class="type-input" type="number" min="1" placeholder="예) 1" />
          </div>
          <div class="type-field">
            <span class="type-field-label">종료층 <em class="required">*</em></span>
            <input v-model="state.bulkForm.floorEnd" class="type-input" type="number" min="1" placeholder="예) 20" />
          </div>
        </div>
        <p v-if="state.bulkError" class="form-feedback error">{{ state.bulkError }}</p>
        <div class="form-divider" />
        <div v-if="state.bulkHouseholdsLoading" class="type-empty">목록을 불러오는 중...</div>
        <div v-else-if="state.bulkRanges.length === 0" class="type-empty">등록된 동/호수가 없습니다.</div>
        <div v-else class="type-table-frame">
        <table class="type-table type-table--head">
          <colgroup>
            <col style="width: 52px" />
            <col style="width: 66px" />
            <col style="width: 66px" />
            <col style="width: 62px" />
            <col style="width: 62px" />
            <col style="width: 112px" />
          </colgroup>
          <thead>
            <tr>
              <th>동</th>
              <th>시작 라인</th>
              <th>종료 라인</th>
              <th>시작층</th>
              <th>종료층</th>
              <th></th>
            </tr>
          </thead>
        </table>
        <div class="type-table-scroll">
        <table class="type-table type-table--body">
          <colgroup>
            <col style="width: 52px" />
            <col style="width: 66px" />
            <col style="width: 66px" />
            <col style="width: 62px" />
            <col style="width: 62px" />
            <col style="width: 112px" />
          </colgroup>
          <tbody>
            <tr v-for="range in state.bulkRanges" :key="range.id">
              <template v-if="state.bulkEditingId === range.id">
                <td><input v-model="state.bulkEditForm.building" class="inline-input inline-input--sm" type="text" /></td>
                <td><input v-model="state.bulkEditForm.lineStart" class="inline-input inline-input--sm" type="number" min="1" /></td>
                <td><input v-model="state.bulkEditForm.lineEnd" class="inline-input inline-input--sm" type="number" min="1" /></td>
                <td><input v-model="state.bulkEditForm.floorStart" class="inline-input inline-input--sm" type="number" min="1" /></td>
                <td><input v-model="state.bulkEditForm.floorEnd" class="inline-input inline-input--sm" type="number" min="1" /></td>
                <td>
                  <div class="table-actions">
                    <button type="button" class="table-action-button table-action-button--primary" @click="saveBulkRangeEdit(range.id)">저장</button>
                    <button type="button" class="table-action-button" @click="cancelBulkRangeEdit">취소</button>
                  </div>
                  <p v-if="state.bulkEditError" class="inline-error">{{ state.bulkEditError }}</p>
                </td>
              </template>
              <template v-else>
                <td>{{ range.building }}동</td>
                <td>{{ range.lineStart }}라인</td>
                <td>{{ range.lineEnd }}라인</td>
                <td>{{ range.floorStart }}층</td>
                <td>{{ range.floorEnd }}층</td>
                <td>
                  <div class="table-actions">
                    <button type="button" class="table-action-button" @click="startBulkRangeEdit(range)">수정</button>
                    <button type="button" class="table-action-button table-action-button--danger" @click="removeBulkRange(range.id)">삭제</button>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
        </div>
        </div>
      </template>

      <template #footer>
        <button type="button" class="page-button page-button--ghost" @click="state.modals.typeManage = false">닫기</button>
        <button
          v-if="state.typeManageTab === 'lineType'"
          type="button"
          class="page-button page-button--primary"
          :disabled="state.lineFormSubmitting"
          @click="handleLineCreate"
        >{{ state.lineFormSubmitting ? '등록 중...' : '등록' }}</button>
        <button
          v-else
          type="button"
          class="page-button page-button--primary"
          :disabled="state.bulkSubmitting"
          @click="handleBulkCreate"
        >{{ state.bulkSubmitting ? '등록 중...' : '동호수 등록' }}</button>
      </template>
    </BaseModal>

    <!-- 동 라인 평형 삭제 확인 -->
    <ConfirmModal
      :visible="state.modals.lineDeleteConfirm"
      title="동 라인 평형을 삭제하시겠습니까?"
      subtitle="사용 중인 라인은 삭제할 수 없습니다."
      item-label="동 라인 평형"
      :item-name="state.selectedLineForDelete ? `${state.selectedLineForDelete.building}동 ${state.selectedLineForDelete.lineStart}~${state.selectedLineForDelete.lineEnd}호 (${state.selectedLineForDelete.typeName ?? ''})` : ''"
      action-text="동 라인 평형 삭제"
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      @confirm="handleLineDelete"
      @cancel="state.modals.lineDeleteConfirm = false"
    />

    <!-- 동호수 삭제 확인 -->
    <ConfirmModal
      :visible="state.modals.bulkDeleteConfirm"
      title="세대를 삭제하시겠습니까?"
      subtitle="삭제한 세대는 복구할 수 없습니다."
      item-label="세대"
      :item-name="state.bulkDeleteTarget ? `${state.bulkDeleteTarget.building}동 ${state.bulkDeleteTarget.unit}호` : ''"
      action-text="세대 삭제"
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      @confirm="handleBulkHouseholdDelete"
      @cancel="state.modals.bulkDeleteConfirm = false"
    />
  </section>
</template>

<style scoped>
.manage-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 탭 */
.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #E2E8F0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #687282;
  cursor: pointer;
  margin-bottom: -1px;
}

.tab-btn.is-active {
  color: #2B3A55;
  border-bottom-color: #2B3A55;
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 99px;
  background: #E53E3E;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

/* 카드 쉘 */
.card-shell {
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  background: #FFFFFF;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.manage-page__table-shell {
  background: #FFFFFF;
}

.manage-page__pagination {
  padding: 0 20px 20px;
}

/* 테이블 피드백 */
.table-feedback {
  padding: 32px 20px;
  color: #687282;
  font-size: 13px;
  text-align: center;
}

.table-feedback.error {
  color: #E53E3E;
}

/* 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.is-success { background: #d1fae5; color: #065f46; }
.status-badge.is-danger  { background: #fee2e2; color: #b91c1c; }
.status-badge.is-warning { background: #fef3c7; color: #92400e; }
.status-badge.is-gray    { background: #f1f5f9; color: #64748b; }

/* 테이블 액션 */
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

.table-action-text {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  color: #718096;
  font-size: 12px;
}

/* 공실 세대 등록 버튼 */
.table-action-button--register {
  border-color: #2B3A55;
  background: #2B3A55;
  color: #FFFFFF;
  font-weight: 600;
}

.table-action-button--register:hover {
  background: #1E2A3E;
  border-color: #1E2A3E;
}

/* 필터 검색 인풋 (아이콘 포함) */
.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #A0AEC0;
  pointer-events: none;
  flex-shrink: 0;
}

.filter-input {
  min-width: 180px;
  height: 38px;
  padding: 0 12px 0 32px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #FFFFFF;
  color: #1A202C;
  font: inherit;
  font-size: 13px;
}

.filter-input::placeholder {
  color: #A0AEC0;
}

.filter-select {
  min-width: 110px;
  height: 38px;
  padding: 0 28px 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #FFFFFF;
  color: #1A202C;
  font: inherit;
  font-size: 13px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A0AEC0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
}

.filter-select:disabled {
  color: #A0AEC0;
  cursor: not-allowed;
  background-color: #F5F6F8;
}

/* 버튼 */
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

.page-button:disabled { opacity: 0.5; cursor: not-allowed; }

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

.page-button--primary:hover:not(:disabled) { background: #1E2A3E; }

.page-button--secondary {
  border: 1px solid #CBD5E0;
  background: #FFFFFF;
  color: #2B3A55;
  font-weight: 600;
}

.page-button--danger {
  border: none;
  background: #E53E3E;
  color: #FFFFFF;
}

/* 폼 */
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

.form-field input,
.form-field select {
  box-sizing: border-box;
  height: 38px;
  width: 100%;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #FFFFFF;
  color: #1A202C;
  font: inherit;
  font-size: 13px;
  outline: none;
}

.form-field input:focus,
.form-field select:focus {
  border-color: #2B3A55;
}

.form-field input:disabled {
  height: 38px;
  background: #F5F6F8;
  color: #687282;
  cursor: default;
}

.form-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 16px 0;
}

.required {
  color: #E53E3E;
  font-style: normal;
}

.form-feedback {
  margin: 12px 0 0;
  font-size: 12px;
  color: #687282;
}

.form-feedback.error { color: #E53E3E; }
.form-feedback.hint  { color: #A0AEC0; }

/* 세대 상세 모달 X 버튼 */
.match-review {
  display: grid;
  gap: 14px;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid #EDF2F7;
}

.match-review__person {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.match-review__person strong {
  color: #111827;
  font-size: 22px;
  font-weight: 800;
}

.match-review__person span {
  color: #2B3A55;
  font-size: 16px;
  font-weight: 700;
}

.match-review__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.match-review__meta div {
  padding: 10px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  background: #F8FAFC;
}

.match-review__meta dt {
  margin-bottom: 4px;
  color: #718096;
  font-size: 11px;
}

.match-review__meta dd {
  margin: 0;
  color: #1A202C;
  font-size: 13px;
  font-weight: 600;
}

.match-reject-section {
  gap: 12px;
}

.reject-preset-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reject-preset-button {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 7px;
  background: #FFFFFF;
  color: #2D3748;
  font-size: 12px;
  cursor: pointer;
}

.reject-preset-button.is-selected {
  border-color: #2B3A55;
  background: #2B3A55;
  color: #FFFFFF;
}

.household-modal :deep(.base-modal__close) {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  color: transparent;
  font-size: 0;
  position: relative;
}

.household-modal :deep(.base-modal__close::before),
.household-modal :deep(.base-modal__close::after) {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: #64748b;
}

.household-modal :deep(.base-modal__close::before) {
  transform: translate(-50%, -50%) rotate(45deg);
}

.household-modal :deep(.base-modal__close::after) {
  transform: translate(-50%, -50%) rotate(-45deg);
}

/* 세대 상세 모달 */
.detail-hero {
  margin: -14px 0 14px;
}

.detail-address-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 2px;
}

.detail-status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.detail-status-badge.is-success { background: #d1fae5; color: #065f46; }
.detail-status-badge.is-danger  { background: #fee2e2; color: #b91c1c; }
.detail-status-badge.is-warning { background: #fef3c7; color: #92400e; }
.detail-status-badge.is-gray    { background: #f1f5f9; color: #64748b; }

.detail-address {
  font-size: 26px;
  font-weight: 700;
  color: #1A202C;
  margin: 0;
}

.detail-sub {
  font-size: 13px;
  color: #687282;
}

.detail-divider {
  height: 1px;
  background: #E2E8F0;
  margin: 14px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 7px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-cell:nth-last-child(-n+2) {
  border-bottom: none;
}

.detail-cell-label {
  font-size: 12px;
  color: #687282;
}

.detail-cell-value {
  font-size: 14px;
  font-weight: 500;
  color: #1A202C;
}

.detail-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #687282;
  margin-bottom: 10px;
}

.edit-info-grid {
  grid-template-columns: repeat(2, 1fr);
}

.edit-status-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.edit-status-select {
  width: 100%;
  max-width: 180px;
  height: 36px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 13px;
  color: #2B3A55;
  cursor: pointer;
}

.resident-inline-edit-row td {
  padding: 0;
}

.resident-inline-edit-form {
  padding: 16px;
  border-top: 1px solid #E2E8F0;
}

.resident-inline-edit-form .form-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.resident-inline-edit-form .form-field span {
  text-align: left;
}

.detail-empty {
  font-size: 13px;
  color: #687282;
  text-align: center;
  padding: 12px 0;
}

.resident-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8faff;
  margin-bottom: 6px;
}

.resident-row:last-child {
  margin-bottom: 0;
}

.resident-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2B3A55;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}

.resident-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.resident-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.resident-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A202C;
}

.resident-phone {
  font-size: 12px;
  color: #687282;
}

.resident-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.resident-tag.is-head   { background: #c6f6d5; color: #276749; }
.resident-tag.is-member { background: #EDF2F7; color: #687282; }

.web-service-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.web-service-badge.is-success { background: #d1fae5; color: #065f46; }
.web-service-badge.is-warning { background: #fef3c7; color: #92400e; }
.web-service-badge.is-danger { background: #fee2e2; color: #b91c1c; }
.web-service-badge.is-gray { background: #f1f5f9; color: #64748b; }

/* 수정 트리거 버튼 */
.resident-edit-trigger {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: #2B3A55;
  color: #FFFFFF;
  flex-shrink: 0;
  margin-top: 2px;
  white-space: nowrap;
}

/* 인라인 편집 영역 */
.resident-edit-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.resident-role-select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid #CBD5E0;
  border-radius: 6px;
  font-size: 12px;
  background: #fff;
  color: #2D3748;
  cursor: pointer;
}

.resident-edit-btn {
  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
}

.resident-edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.resident-edit-btn--save {
  background: #2B3A55;
  color: #fff;
  border-color: #2B3A55;
}

.resident-edit-btn--danger {
  background: #FFF5F5;
  color: #E53E3E;
  border-color: #FEB2B2;
}

.resident-edit-btn--end {
  margin-left: auto;
}

.resident-edit-btn--cancel {
  background: #F7FAFC;
  color: #718096;
  border-color: #CBD5E0;
}

.member-action-error {
  font-size: 12px;
  color: #E53E3E;
  margin: 0 0 8px;
}

/* 등록 입주민 테이블 */
.expected-resident-table-wrap {
  overflow-y: visible;
}

.expected-resident-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.expected-resident-table th {
  text-align: center;
  padding: 6px 6px;
  font-size: 12px;
  font-weight: 600;
  color: #687282;
  border-bottom: 1px solid #E2E8F0;
  white-space: nowrap;
}

.expected-resident-table th:last-child,
.expected-resident-table td:last-child {
  text-align: right;
}

.expected-resident-table td {
  padding: 6px 6px;
  color: #1A202C;
  border-bottom: 1px solid #F1F5F9;
  white-space: nowrap;
  text-align: center;
}

.expected-resident-table tbody tr:last-child td {
  border-bottom: none;
}

.expected-resident-table .table-action-button {
  min-width: 48px;
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

.expected-resident-table .table-actions {
  gap: 6px;
  justify-content: flex-end;
}

.detail-history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.detail-history-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 0;
  font-size: 13px;
  color: #687282;
}

/* 처리 이력 스크롤 영역 — 3건(약 90px) 초과 시 스크롤 */
.history-scroll-area {
  max-height: 96px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #CBD5E0 transparent;
}

.history-scroll-area::-webkit-scrollbar {
  width: 4px;
}

.history-scroll-area::-webkit-scrollbar-thumb {
  background: #CBD5E0;
  border-radius: 4px;
}

.history-date {
  flex-shrink: 0;
  min-width: 78px;
}

.history-content {
  color: #687282;
}

/* 평형/라인 관리 모달 내부 탭 */
.modal-tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #E2E8F0;
  margin-bottom: 16px;
}

.modal-tab-btn {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  color: #A0AEC0;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}

.modal-tab-btn.is-active {
  color: #2B3A55;
  border-bottom-color: #2B3A55;
}

/* 평형 관리 모달 - 등록 폼 */
.type-create-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.type-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.type-field-label {
  font-size: 12px;
  color: #687282;
  font-weight: 600;
}

.type-field-label--block {
  display: block;
  margin-bottom: 6px;
}

.type-input {
  width: 100%;
  box-sizing: border-box;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  cursor: text;
  background: #FFFFFF;
  color: #1A202C;
  font: inherit;
  font-size: 13px;
  outline: none;
  min-width: 0;
}

.type-input:focus {
  border-color: #2B3A55;
}

select.type-input {
  cursor: pointer;
  appearance: auto;
}

/* 평형 선택 커스텀 드롭다운 */
.type-selector-wrap {
  position: relative;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.type-selector-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #FFFFFF;
  color: #A0AEC0;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.type-selector-btn.is-selected {
  color: #1A202C;
  border-color: #2B3A55;
}

.type-selector-chevron {
  flex-shrink: 0;
  color: #A0AEC0;
  transition: transform 0.15s;
}

.type-selector-chevron.is-open {
  transform: rotate(180deg);
}

.type-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.10);
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.type-dropdown-empty {
  padding: 12px 16px;
  font-size: 13px;
  color: #A0AEC0;
  text-align: center;
}

.type-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 7px;
  background: transparent;
  font: inherit;
  cursor: pointer;
  text-align: left;
}

.type-dropdown-item:hover {
  background: #F5F6F8;
}

.type-dropdown-item.is-active {
  background: #EEF2FF;
}

.type-dropdown-name {
  font-size: 13px;
  font-weight: 600;
  color: #1A202C;
}

.type-dropdown-sub {
  font-size: 12px;
  color: #687282;
}

/* 평형 관리 테이블 */
.type-table-frame {
  margin-top: 4px;
}

.type-table-scroll {
  max-height: 240px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #CBD5E0 transparent;
  border-bottom: 1px solid #F5F6F8;
}

.type-table-scroll::-webkit-scrollbar {
  width: 4px;
}

.type-table-scroll::-webkit-scrollbar-thumb {
  background: #CBD5E0;
  border-radius: 4px;
}

.type-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.type-table th {
  background: #FFFFFF;
  padding: 10px 5px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  color: #687282;
  border-bottom: 1px solid #E2E8F0;
  white-space: nowrap;
}

.type-table th,
.type-table td {
  white-space: nowrap;
}

.type-table td {
  padding: 8px 5px;
  text-align: center;
  border-bottom: 1px solid #F5F6F8;
  color: #1A202C;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-empty {
  padding: 24px;
  text-align: center;
  color: #A0AEC0;
  font-size: 13px;
}

/* 인라인 수정 입력 */
.inline-input {
  width: 100%;
  min-width: 60px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #CBD5E0;
  border-radius: 6px;
  background: #FFFFFF;
  color: #1A202C;
  font: inherit;
  font-size: 13px;
  outline: none;
}

.inline-input--sm {
  min-width: 56px;
  max-width: 80px;
}

.inline-input:focus {
  border-color: #2B3A55;
}

.inline-select {
  width: 100%;
  min-width: 80px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #CBD5E0;
  border-radius: 6px;
  background: #FFFFFF;
  color: #1A202C;
  font: inherit;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.inline-error {
  margin: 4px 0 0;
  font-size: 11px;
  color: #E53E3E;
}

/* 액션 버튼 변형 */
.table-action-button--primary {
  border-color: #2B3A55;
  background: #2B3A55;
  color: #FFFFFF;
  font-weight: 600;
}

.table-action-button--primary:hover:not(:disabled) {
  background: #1E2A3E;
}

.table-action-button--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.table-action-button--danger {
  border-color: #FED7D7;
  color: #E53E3E;
}

.table-action-button--danger:hover {
  background: #FFF5F5;
  border-color: #FC8181;
}

.form-grid--3col {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.create-section-label {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.create-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0 10px;
}

.create-add-button {
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.create-add-button:hover {
  opacity: 0.88;
}

.resident-list {
  margin-bottom: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  overflow: hidden;
}

.resident-list__header {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1.1fr 0.8fr 52px;
  padding: 8px 12px;
  background: #F5F6F8;
  font-size: 12px;
  font-weight: 600;
  color: #687282;
  text-align: center;
}

.resident-list__row--empty span {
  color: #A0AEC0;
  text-align: center;
}

.resident-list__row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1.1fr 0.8fr 52px;
  align-items: center;
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-text-primary);
  text-align: center;
}

.resident-list__remove {
  padding: 3px 8px;
  border: 1px solid #FED7D7;
  border-radius: 5px;
  background: transparent;
  color: #E53E3E;
  font-size: 11px;
  cursor: pointer;
}

.resident-list__remove:hover {
  background: #FFF5F5;
}

.resident-form-box {
  margin-top: 10px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
}

.resident-form-box__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.page-button--sm {
  height: 32px;
  padding: 0 14px;
  font-size: 12px;
}
</style>
