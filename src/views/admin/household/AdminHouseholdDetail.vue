<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useHouseholdStore } from '@/stores/useHouseholdStore'
import AdminTable from '@/components/admin/AdminTable.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const householdId = Number(route.params.householdId)

const state = reactive({
  loading: false,
  errorMessage: '',
  modals: {
    edit: false,
    editConfirm: false,
    status: false,
    statusConfirm: false,
    addMember: false,
    addMemberConfirm: false,
    editMember: false,
    editMemberConfirm: false,
    deleteMemberConfirm: false,
    changeHead: false,
    changeHeadConfirm: false,
  },
  editForm: {
    building: '',
    unit: '',
    typeId: '',
  },
  statusForm: {
    status: '',
    reason: '',
  },
  addMemberForm: {
    userId: '',
    role: 'MEMBER',
  },
  editMemberForm: {
    householdMemberId: null,
    userId: null,
    role: '',
    isActive: true,
  },
  changeHeadForm: {
    userId: '',
  },
  selectedMember: null,
  editSubmitting: false,
  statusSubmitting: false,
  addMemberSubmitting: false,
  editMemberSubmitting: false,
  deleteMemberSubmitting: false,
  changeHeadSubmitting: false,
  formErrorMessage: '',
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

const household = computed(() => householdStore.householdDetail)

const members = computed(() => {
  const d = householdStore.householdMembers
  if (!d) return []
  if (Array.isArray(d)) return d
  if (Array.isArray(d.content)) return d.content
  return []
})

const memberColumns = computed(() => [
  { key: 'userId', label: '사용자 ID' },
  { key: 'roleLabel', label: '역할' },
  { key: 'activeLabel', label: '활성' },
  { key: 'createdAt', label: '등록일' },
])

const pagedMembers = computed(() =>
  members.value.map((m) => ({
    ...m,
    roleLabel: m.role === 'HEAD' ? '세대주' : '세대원',
    activeLabel: m.isActive ? '활성' : '비활성',
    createdAt: formatDate(m.createdAt),
  }))
)

const statusLabel = (s) => ({ OCCUPIED: '입주', VACANT: '공실', MOVED_OUT: '퇴거' }[s] ?? s ?? '-')
const statusVariant = (s) => ({ OCCUPIED: 'success', VACANT: 'neutral', MOVED_OUT: 'danger' }[s] ?? 'neutral')

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

function getCurrentTimeText() {
  return new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function getCurrentActorName() {
  return authStore.name || '관리자'
}

function getErrorMessage(error, fallback = '잠시 후 다시 시도해주세요.') {
  const data = error?.response?.data
  if (data?.message) return data.message
  if (data?.data?.message) return data.data.message
  if (error?.message && !error.message.startsWith('Request failed')) return error.message
  return fallback
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

async function load() {
  state.loading = true
  state.errorMessage = ''
  try {
    await householdStore.fetchAdminHouseholdDetail(householdId)
    await householdStore.fetchHouseholdMembers(householdId)
  } catch (error) {
    console.error(error)
    state.errorMessage = '세대 정보를 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

// 세대 정보 수정
function openEditModal() {
  state.editForm.building = household.value?.building ?? ''
  state.editForm.unit = household.value?.unit ?? ''
  state.editForm.typeId = String(household.value?.typeId ?? '')
  state.formErrorMessage = ''
  state.modals.edit = true
}

function closeEditModal() {
  state.modals.edit = false
  state.modals.editConfirm = false
  state.formErrorMessage = ''
}

async function handleEditHousehold() {
  if (state.editSubmitting) return
  state.modals.editConfirm = false
  state.editSubmitting = true
  state.formErrorMessage = ''
  try {
    await householdStore.updateHousehold(householdId, {
      building: state.editForm.building.trim(),
      unit: state.editForm.unit.trim(),
      typeId: state.editForm.typeId ? Number(state.editForm.typeId) : null,
    })
    closeEditModal()
    openResultModal({
      type: 'success',
      title: '세대 정보가 수정되었습니다.',
      itemName: `${state.editForm.building}동 ${state.editForm.unit}호`,
      actionLabel: '세대 수정',
      afterConfirm: async () => { await load() },
    })
  } catch (error) {
    console.error(error)
    state.formErrorMessage = getErrorMessage(error, '세대 수정에 실패했습니다.')
  } finally {
    state.editSubmitting = false
  }
}

// 세대 상태 변경
function openStatusModal() {
  state.statusForm.status = household.value?.status ?? ''
  state.statusForm.reason = ''
  state.formErrorMessage = ''
  state.modals.status = true
}

function closeStatusModal() {
  state.modals.status = false
  state.modals.statusConfirm = false
  state.formErrorMessage = ''
}

async function handleStatusChange() {
  if (state.statusSubmitting) return
  state.modals.statusConfirm = false
  state.statusSubmitting = true
  state.formErrorMessage = ''
  try {
    await householdStore.updateHouseholdStatus(householdId, {
      status: state.statusForm.status,
      reason: state.statusForm.reason.trim() || null,
    })
    closeStatusModal()
    openResultModal({
      type: 'success',
      title: '세대 상태가 변경되었습니다.',
      desc: `상태가 ${statusLabel(state.statusForm.status)}(으)로 변경되었습니다.`,
      itemName: `${household.value?.building}동 ${household.value?.unit}호`,
      actionLabel: '세대 상태 변경',
      afterConfirm: async () => { await load() },
    })
  } catch (error) {
    console.error(error)
    state.formErrorMessage = getErrorMessage(error, '상태 변경에 실패했습니다.')
  } finally {
    state.statusSubmitting = false
  }
}

// 세대원 추가
function openAddMemberModal() {
  state.addMemberForm.userId = ''
  state.addMemberForm.role = 'MEMBER'
  state.formErrorMessage = ''
  state.modals.addMember = true
}

function closeAddMemberModal() {
  state.modals.addMember = false
  state.modals.addMemberConfirm = false
  state.formErrorMessage = ''
}

async function handleAddMember() {
  if (state.addMemberSubmitting) return
  state.modals.addMemberConfirm = false
  state.addMemberSubmitting = true
  state.formErrorMessage = ''
  try {
    await householdStore.createHouseholdMember(householdId, {
      userId: Number(state.addMemberForm.userId),
      role: state.addMemberForm.role,
    })
    closeAddMemberModal()
    openResultModal({
      type: 'success',
      title: '세대원이 등록되었습니다.',
      itemName: `사용자 ID: ${state.addMemberForm.userId}`,
      actionLabel: '세대원 등록',
      afterConfirm: async () => { await householdStore.fetchHouseholdMembers(householdId) },
    })
  } catch (error) {
    console.error(error)
    state.formErrorMessage = getErrorMessage(error, '세대원 등록에 실패했습니다.')
  } finally {
    state.addMemberSubmitting = false
  }
}

// 세대원 수정
function openEditMemberModal(member) {
  state.selectedMember = member
  state.editMemberForm.householdMemberId = member.householdMemberId
  state.editMemberForm.userId = member.userId
  state.editMemberForm.role = member.role
  state.editMemberForm.isActive = member.isActive
  state.formErrorMessage = ''
  state.modals.editMember = true
}

function closeEditMemberModal() {
  state.modals.editMember = false
  state.modals.editMemberConfirm = false
  state.selectedMember = null
  state.formErrorMessage = ''
}

async function handleEditMember() {
  if (state.editMemberSubmitting) return
  state.modals.editMemberConfirm = false
  state.editMemberSubmitting = true
  state.formErrorMessage = ''
  try {
    await householdStore.updateHouseholdMember(state.editMemberForm.householdMemberId, {
      role: state.editMemberForm.role,
      isActive: state.editMemberForm.isActive,
    })
    closeEditMemberModal()
    openResultModal({
      type: 'success',
      title: '세대원 정보가 수정되었습니다.',
      itemName: `사용자 ID: ${state.editMemberForm.userId}`,
      actionLabel: '세대원 수정',
      afterConfirm: async () => { await householdStore.fetchHouseholdMembers(householdId) },
    })
  } catch (error) {
    console.error(error)
    state.formErrorMessage = getErrorMessage(error, '세대원 수정에 실패했습니다.')
  } finally {
    state.editMemberSubmitting = false
  }
}

// 세대원 삭제
function openDeleteMemberConfirm(member) {
  state.selectedMember = member
  state.modals.deleteMemberConfirm = true
}

async function handleDeleteMember() {
  if (state.deleteMemberSubmitting) return
  state.modals.deleteMemberConfirm = false
  state.deleteMemberSubmitting = true
  try {
    await householdStore.deleteHouseholdMember(state.selectedMember.householdMemberId)
    const deletedUserId = state.selectedMember.userId
    state.selectedMember = null
    openResultModal({
      type: 'success',
      title: '세대원이 삭제되었습니다.',
      itemName: `사용자 ID: ${deletedUserId}`,
      actionLabel: '세대원 삭제',
      afterConfirm: async () => { await householdStore.fetchHouseholdMembers(householdId) },
    })
  } catch (error) {
    console.error(error)
  } finally {
    state.deleteMemberSubmitting = false
  }
}

// 세대주 변경
function openChangeHeadModal() {
  state.changeHeadForm.userId = ''
  state.formErrorMessage = ''
  state.modals.changeHead = true
}

function closeChangeHeadModal() {
  state.modals.changeHead = false
  state.modals.changeHeadConfirm = false
  state.formErrorMessage = ''
}

async function handleChangeHead() {
  if (state.changeHeadSubmitting) return
  state.modals.changeHeadConfirm = false
  state.changeHeadSubmitting = true
  state.formErrorMessage = ''
  try {
    await householdStore.changeHouseholdHead(householdId, {
      userId: Number(state.changeHeadForm.userId),
    })
    closeChangeHeadModal()
    openResultModal({
      type: 'success',
      title: '세대주가 변경되었습니다.',
      itemName: `사용자 ID: ${state.changeHeadForm.userId}`,
      actionLabel: '세대주 변경',
      afterConfirm: async () => { await load() },
    })
  } catch (error) {
    console.error(error)
    state.formErrorMessage = getErrorMessage(error, '세대주 변경에 실패했습니다.')
  } finally {
    state.changeHeadSubmitting = false
  }
}

onMounted(async () => {
  await load()
})
</script>

<template>
  <section class="detail-page">
    <div class="detail-page__header">
      <button class="back-button" type="button" @click="router.push('/admin/households')">
        &larr; 목록으로
      </button>
      <h2 class="detail-page__title">세대 상세</h2>
    </div>

    <div v-if="state.loading" class="feedback-text">불러오는 중...</div>
    <div v-else-if="state.errorMessage" class="feedback-text error">{{ state.errorMessage }}</div>
    <template v-else-if="household">
      <!-- 세대 기본 정보 -->
      <div class="info-card">
        <div class="info-card__head">
          <span class="info-card__label">세대 정보</span>
          <div class="info-card__actions">
            <button class="action-btn" type="button" @click="openEditModal">수정</button>
            <button class="action-btn" type="button" @click="openStatusModal">상태 변경</button>
            <button class="action-btn" type="button" @click="openChangeHeadModal">세대주 변경</button>
          </div>
        </div>
        <dl class="info-grid">
          <div class="info-item">
            <dt>세대 ID</dt>
            <dd>#{{ household.householdId }}</dd>
          </div>
          <div class="info-item">
            <dt>단지 ID</dt>
            <dd>{{ household.complexId }}</dd>
          </div>
          <div class="info-item">
            <dt>동</dt>
            <dd>{{ household.building }}</dd>
          </div>
          <div class="info-item">
            <dt>호수</dt>
            <dd>{{ household.unit }}</dd>
          </div>
          <div class="info-item">
            <dt>세대 유형 ID</dt>
            <dd>{{ household.typeId ?? '-' }}</dd>
          </div>
          <div class="info-item">
            <dt>입주 상태</dt>
            <dd>
              <BaseBadge :variant="statusVariant(household.status)">
                {{ statusLabel(household.status) }}
              </BaseBadge>
            </dd>
          </div>
          <div class="info-item">
            <dt>등록일</dt>
            <dd>{{ formatDate(household.createdAt) }}</dd>
          </div>
          <div class="info-item">
            <dt>수정일</dt>
            <dd>{{ formatDate(household.updatedAt) }}</dd>
          </div>
        </dl>
      </div>

      <!-- 세대원 목록 -->
      <div class="info-card">
        <div class="info-card__head">
          <span class="info-card__label">세대원 목록</span>
          <button class="action-btn action-btn--primary" type="button" @click="openAddMemberModal">
            세대원 추가
          </button>
        </div>
        <div v-if="members.length === 0" class="feedback-text">등록된 세대원이 없습니다.</div>
        <AdminTable v-else :columns="memberColumns" :rows="pagedMembers">
          <template #cell-roleLabel="{ row }">
            <BaseBadge :variant="row.role === 'HEAD' ? 'info' : 'neutral'">
              {{ row.roleLabel }}
            </BaseBadge>
          </template>
          <template #cell-activeLabel="{ row }">
            <BaseBadge :variant="row.isActive ? 'success' : 'danger'">
              {{ row.activeLabel }}
            </BaseBadge>
          </template>
          <template #action="{ row }">
            <div class="table-actions">
              <button class="table-action-button" type="button" @click.stop="openEditMemberModal(row)">수정</button>
              <button class="table-action-button table-action-button--danger" type="button" @click.stop="openDeleteMemberConfirm(row)">삭제</button>
            </div>
          </template>
        </AdminTable>
      </div>
    </template>
    <div v-else class="feedback-text">세대 정보를 찾을 수 없습니다.</div>

    <!-- 세대 수정 모달 -->
    <BaseModal
      :visible="state.modals.edit"
      title="세대 수정"
      :subtitle="household ? `${household.building}동 ${household.unit}호` : ''"
      @close="closeEditModal"
    >
      <div class="form-grid">
        <label class="form-field">
          <span>동 <em class="required">*</em></span>
          <input v-model="state.editForm.building" type="text" placeholder="예) 101" />
        </label>
        <label class="form-field">
          <span>호수 <em class="required">*</em></span>
          <input v-model="state.editForm.unit" type="text" placeholder="예) 101호" />
        </label>
        <label class="form-field form-field--full">
          <span>세대 유형 ID</span>
          <input v-model="state.editForm.typeId" type="number" placeholder="선택" />
        </label>
      </div>
      <p v-if="state.formErrorMessage" class="form-feedback error">{{ state.formErrorMessage }}</p>
      <template #footer>
        <button class="page-button page-button--ghost" type="button" @click="closeEditModal">취소</button>
        <button
          class="page-button page-button--primary"
          type="button"
          :disabled="state.editSubmitting"
          @click="state.modals.editConfirm = true"
        >
          {{ state.editSubmitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </BaseModal>

    <ConfirmModal
      :visible="state.modals.editConfirm"
      title="세대 정보를 수정하시겠습니까?"
      subtitle="동, 호수, 세대 유형이 변경됩니다."
      item-label="세대"
      :item-name="`${state.editForm.building}동 ${state.editForm.unit}호`"
      action-text="세대 수정"
      confirm-text="저장"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.editSubmitting"
      @confirm="handleEditHousehold"
      @cancel="state.modals.editConfirm = false"
    />

    <!-- 상태 변경 모달 -->
    <BaseModal
      :visible="state.modals.status"
      title="세대 상태 변경"
      :subtitle="household ? `${household.building}동 ${household.unit}호` : ''"
      @close="closeStatusModal"
    >
      <div class="form-grid">
        <label class="form-field">
          <span>입주 상태 <em class="required">*</em></span>
          <select v-model="state.statusForm.status">
            <option value="OCCUPIED">입주</option>
            <option value="VACANT">공실</option>
            <option value="MOVED_OUT">퇴거</option>
          </select>
        </label>
        <label class="form-field">
          <span>변경 사유</span>
          <input v-model="state.statusForm.reason" type="text" placeholder="사유 입력 (선택)" />
        </label>
      </div>
      <p v-if="state.formErrorMessage" class="form-feedback error">{{ state.formErrorMessage }}</p>
      <template #footer>
        <button class="page-button page-button--ghost" type="button" @click="closeStatusModal">취소</button>
        <button
          class="page-button page-button--primary"
          type="button"
          :disabled="state.statusSubmitting"
          @click="state.modals.statusConfirm = true"
        >
          {{ state.statusSubmitting ? '변경 중...' : '변경' }}
        </button>
      </template>
    </BaseModal>

    <ConfirmModal
      :visible="state.modals.statusConfirm"
      title="세대 상태를 변경하시겠습니까?"
      subtitle="변경 이력이 자동으로 저장됩니다."
      item-label="세대"
      :item-name="household ? `${household.building}동 ${household.unit}호` : ''"
      action-text="세대 상태 변경"
      confirm-text="변경"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.statusSubmitting"
      @confirm="handleStatusChange"
      @cancel="state.modals.statusConfirm = false"
    />

    <!-- 세대원 추가 모달 -->
    <BaseModal :visible="state.modals.addMember" title="세대원 추가" @close="closeAddMemberModal">
      <div class="form-grid">
        <label class="form-field form-field--full">
          <span>사용자 ID <em class="required">*</em></span>
          <input v-model="state.addMemberForm.userId" type="number" placeholder="사용자 ID 입력" />
        </label>
        <label class="form-field form-field--full">
          <span>역할 <em class="required">*</em></span>
          <select v-model="state.addMemberForm.role">
            <option value="HEAD">세대주</option>
            <option value="MEMBER">세대원</option>
          </select>
        </label>
      </div>
      <p v-if="state.formErrorMessage" class="form-feedback error">{{ state.formErrorMessage }}</p>
      <template #footer>
        <button class="page-button page-button--ghost" type="button" @click="closeAddMemberModal">취소</button>
        <button
          class="page-button page-button--primary"
          type="button"
          :disabled="!state.addMemberForm.userId || state.addMemberSubmitting"
          @click="state.modals.addMemberConfirm = true"
        >
          {{ state.addMemberSubmitting ? '추가 중...' : '추가' }}
        </button>
      </template>
    </BaseModal>

    <ConfirmModal
      :visible="state.modals.addMemberConfirm"
      title="세대원을 추가하시겠습니까?"
      subtitle="입력한 사용자 ID로 세대원이 등록됩니다."
      item-label="사용자 ID"
      :item-name="String(state.addMemberForm.userId)"
      action-text="세대원 추가"
      confirm-text="추가"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.addMemberSubmitting"
      @confirm="handleAddMember"
      @cancel="state.modals.addMemberConfirm = false"
    />

    <!-- 세대원 수정 모달 -->
    <BaseModal
      :visible="state.modals.editMember"
      title="세대원 수정"
      :subtitle="state.selectedMember ? `사용자 ID: ${state.selectedMember.userId}` : ''"
      @close="closeEditMemberModal"
    >
      <div class="form-grid">
        <label class="form-field form-field--full">
          <span>역할 <em class="required">*</em></span>
          <select v-model="state.editMemberForm.role">
            <option value="HEAD">세대주</option>
            <option value="MEMBER">세대원</option>
          </select>
        </label>
        <label class="form-field form-field--full">
          <span>활성 여부 <em class="required">*</em></span>
          <select v-model="state.editMemberForm.isActive">
            <option :value="true">활성</option>
            <option :value="false">비활성</option>
          </select>
        </label>
      </div>
      <p v-if="state.formErrorMessage" class="form-feedback error">{{ state.formErrorMessage }}</p>
      <template #footer>
        <button class="page-button page-button--ghost" type="button" @click="closeEditMemberModal">취소</button>
        <button
          class="page-button page-button--primary"
          type="button"
          :disabled="state.editMemberSubmitting"
          @click="state.modals.editMemberConfirm = true"
        >
          {{ state.editMemberSubmitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </BaseModal>

    <ConfirmModal
      :visible="state.modals.editMemberConfirm"
      title="세대원 정보를 수정하시겠습니까?"
      subtitle="역할과 활성 여부가 변경됩니다."
      item-label="사용자 ID"
      :item-name="String(state.editMemberForm.userId ?? '')"
      action-text="세대원 수정"
      confirm-text="저장"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.editMemberSubmitting"
      @confirm="handleEditMember"
      @cancel="state.modals.editMemberConfirm = false"
    />

    <ConfirmModal
      :visible="state.modals.deleteMemberConfirm"
      title="세대원을 삭제하시겠습니까?"
      subtitle="삭제된 세대원은 비활성 처리됩니다."
      item-label="사용자 ID"
      :item-name="String(state.selectedMember?.userId ?? '')"
      action-text="세대원 삭제"
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      :loading="state.deleteMemberSubmitting"
      @confirm="handleDeleteMember"
      @cancel="state.modals.deleteMemberConfirm = false"
    />

    <!-- 세대주 변경 모달 -->
    <BaseModal
      :visible="state.modals.changeHead"
      title="세대주 변경"
      :subtitle="household ? `${household.building}동 ${household.unit}호` : ''"
      @close="closeChangeHeadModal"
    >
      <div class="form-grid">
        <label class="form-field form-field--full">
          <span>새 세대주 사용자 ID <em class="required">*</em></span>
          <input v-model="state.changeHeadForm.userId" type="number" placeholder="사용자 ID 입력" />
        </label>
      </div>
      <p class="form-feedback hint">* 해당 세대의 활성 세대원 중 세대주로 지정할 사용자 ID를 입력하세요.</p>
      <p v-if="state.formErrorMessage" class="form-feedback error">{{ state.formErrorMessage }}</p>
      <template #footer>
        <button class="page-button page-button--ghost" type="button" @click="closeChangeHeadModal">취소</button>
        <button
          class="page-button page-button--primary"
          type="button"
          :disabled="!state.changeHeadForm.userId || state.changeHeadSubmitting"
          @click="state.modals.changeHeadConfirm = true"
        >
          {{ state.changeHeadSubmitting ? '변경 중...' : '변경' }}
        </button>
      </template>
    </BaseModal>

    <ConfirmModal
      :visible="state.modals.changeHeadConfirm"
      title="세대주를 변경하시겠습니까?"
      subtitle="기존 세대주는 세대원으로 역할이 변경됩니다."
      item-label="새 세대주 사용자 ID"
      :item-name="String(state.changeHeadForm.userId)"
      action-text="세대주 변경"
      confirm-text="변경"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.changeHeadSubmitting"
      @confirm="handleChangeHead"
      @cancel="state.modals.changeHeadConfirm = false"
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
  </section>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.detail-page__header {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.detail-page__title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--admin-deep-text);
}

.back-button {
  height: 36px;
  padding: 0 var(--space-12);
  border: 1px solid var(--admin-light-gray);
  border-radius: var(--radius-8);
  background: var(--white);
  color: var(--admin-deep-text);
  font: inherit;
  font-size: var(--font-size-detail);
  cursor: pointer;
}

.feedback-text {
  padding: var(--space-32);
  color: var(--gray-600);
  font-size: var(--font-size-detail);
  text-align: center;
}

.feedback-text.error { color: var(--admin-danger); }

.info-card {
  border: 1px solid var(--admin-light-gray);
  border-radius: 14px;
  background: var(--white);
  overflow: hidden;
  box-shadow: var(--shadow-small);
}

.info-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-16) var(--space-20);
  border-bottom: 1px solid var(--admin-light-gray);
}

.info-card__label {
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  color: var(--admin-deep-text);
}

.info-card__actions {
  display: flex;
  gap: var(--space-8);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: var(--space-20);
}

.info-item {
  padding: var(--space-12);
}

.info-item dt {
  font-size: var(--font-size-label);
  color: var(--gray-600);
  margin-bottom: var(--space-4);
}

.info-item dd {
  font-size: var(--font-size-detail);
  font-weight: 600;
  color: var(--admin-deep-text);
}


.action-btn {
  height: 32px;
  padding: 0 var(--space-12);
  border: 1px solid var(--admin-light-gray);
  border-radius: var(--radius-8);
  background: var(--white);
  color: var(--admin-deep-text);
  font: inherit;
  font-size: var(--font-size-detail);
  cursor: pointer;
}

.action-btn--primary {
  border-color: var(--admin-sub-blue);
  background: var(--admin-sub-blue);
  color: var(--white);
}

.table-actions {
  display: inline-flex;
  gap: var(--space-8);
}

.table-action-button {
  min-width: 48px;
  height: 28px;
  padding: 0 var(--space-8);
  border: 1px solid var(--admin-light-gray);
  border-radius: var(--radius-8);
  background: var(--white);
  color: var(--admin-deep-text);
  font: inherit;
  font-size: var(--font-size-detail);
  cursor: pointer;
}

.table-action-button--danger {
  border-color: var(--admin-danger);
  color: var(--admin-danger);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-16);
}

.form-field {
  display: grid;
  gap: var(--space-8);
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field span {
  font-size: var(--font-size-label);
  color: var(--gray-600);
}

.form-field input,
.form-field select {
  height: 38px;
  padding: 0 var(--space-12);
  border: 1px solid var(--admin-light-gray);
  border-radius: var(--radius-8);
  background: var(--white);
  color: var(--admin-deep-text);
  font: inherit;
  font-size: var(--font-size-detail);
  outline: none;
}

.form-field input:focus,
.form-field select:focus {
  border-color: var(--admin-sub-blue);
}

.required {
  color: var(--admin-danger);
  font-style: normal;
}

.form-feedback {
  margin-top: var(--space-12);
  font-size: var(--font-size-label);
}

.form-feedback.error { color: var(--admin-danger); }
.form-feedback.hint  { color: var(--gray-400); }

.page-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  height: 40px;
  padding: 0 var(--space-16);
  border-radius: var(--radius-8);
  font: inherit;
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
}

.page-button:disabled { opacity: 0.5; cursor: not-allowed; }

.page-button--ghost {
  border: 1px solid var(--admin-light-gray);
  background: var(--white);
  color: var(--admin-deep-text);
}

.page-button--primary {
  border: none;
  background: var(--admin-sub-blue);
  color: var(--white);
}

.page-button--primary:hover:not(:disabled) {
  background: var(--admin-main-navy);
}
</style>
