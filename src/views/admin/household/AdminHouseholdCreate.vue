<script setup>
import { computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useHouseholdStore } from '@/stores/useHouseholdStore'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const householdStore = useHouseholdStore()
let resolveTimer = null

const state = reactive({
  form: {
    building: '',
    unit: '',
    typeId: '',
  },
  resolvedLineType: null,
  resolvingType: false,
  typeResolveMessage: '',
  submitting: false,
  errorMessage: '',
  confirmVisible: false,
  resultModal: {
    visible: false,
    type: 'success',
    title: '',
    itemName: '',
    time: '',
    actionLabel: '',
    actor: '',
  },
})

const resolvedTypeText = computed(() => {
  const type = state.resolvedLineType
  if (!type) return ''
  const area = type.exclusiveAreaM2 ? ` · ${type.exclusiveAreaM2}m²` : ''
  return `${type.typeName ?? '-'} (${type.typeCode ?? '-'})${area}`
})

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

async function handleCreate() {
  if (state.submitting) return
  state.confirmVisible = false
  state.submitting = true
  state.errorMessage = ''
  try {
    await householdStore.createHousehold({
      building: state.form.building.trim(),
      unit: state.form.unit.trim(),
      typeId: state.form.typeId ? Number(state.form.typeId) : null,
    })
    state.resultModal.visible = true
    state.resultModal.type = 'success'
    state.resultModal.title = '세대가 등록되었습니다.'
    state.resultModal.itemName = `${state.form.building}동 ${state.form.unit}호`
    state.resultModal.time = getCurrentTimeText()
    state.resultModal.actionLabel = '세대 등록'
    state.resultModal.actor = getCurrentActorName()
  } catch (error) {
    console.error(error)
    state.errorMessage = getErrorMessage(error, '세대 등록에 실패했습니다.')
  } finally {
    state.submitting = false
  }
}

async function resolveHouseholdType() {
  const building = state.form.building.trim()
  const unit = state.form.unit.trim()

  state.form.typeId = ''
  state.resolvedLineType = null
  state.typeResolveMessage = ''

  if (!building || !unit) return

  state.resolvingType = true
  try {
    const res = await householdStore.resolveBuildingLineType({ building, unit })
    if (res?.typeId) {
      state.resolvedLineType = res
      state.form.typeId = String(res.typeId)
      return
    }
    state.typeResolveMessage = '등록된 평형이 없습니다. 세대는 평형 없이 등록됩니다.'
  } catch (error) {
    console.error(error)
    state.typeResolveMessage = getErrorMessage(error, '평형을 조회하지 못했습니다. 세대는 평형 없이 등록됩니다.')
  } finally {
    state.resolvingType = false
  }
}

watch(
  () => [state.form.building, state.form.unit],
  () => {
    if (resolveTimer) clearTimeout(resolveTimer)
    resolveTimer = setTimeout(resolveHouseholdType, 300)
  },
)

function handleResultConfirm() {
  state.resultModal.visible = false
  router.push('/admin/households')
}
</script>

<template>
  <section class="create-page">
    <div class="create-page__header">
      <button class="back-button" type="button" @click="router.push('/admin/households')">
        &larr; 목록으로
      </button>
      <h2 class="create-page__title">세대 등록</h2>
    </div>

    <div class="create-card">
      <div class="form-grid">
        <label class="form-field">
          <span>동 <em class="required">*</em></span>
          <input
            v-model="state.form.building"
            type="text"
            placeholder="예) 101"
            @keyup.enter="state.confirmVisible = true"
          />
        </label>
        <label class="form-field">
          <span>호수 <em class="required">*</em></span>
          <input
            v-model="state.form.unit"
            type="text"
            placeholder="예) 101호"
            @keyup.enter="state.confirmVisible = true"
          />
        </label>
        <label class="form-field form-field--full">
          <span>평형</span>
          <input
            :value="state.resolvingType ? '조회 중...' : (resolvedTypeText || '등록된 평형 없음')"
            type="text"
            disabled
          />
        </label>
      </div>

      <p v-if="state.typeResolveMessage" class="form-feedback hint">{{ state.typeResolveMessage }}</p>
      <p v-if="state.errorMessage" class="form-feedback error">{{ state.errorMessage }}</p>

      <div class="create-card__footer">
        <button class="page-button page-button--ghost" type="button" @click="router.push('/admin/households')">
          취소
        </button>
        <button
          class="page-button page-button--primary"
          type="button"
          :disabled="!state.form.building || !state.form.unit || state.submitting"
          @click="state.confirmVisible = true"
        >
          {{ state.submitting ? '등록 중...' : '등록' }}
        </button>
      </div>
    </div>

    <ConfirmModal
      :visible="state.confirmVisible"
      title="세대를 등록하시겠습니까?"
      subtitle="입력한 동/호 기준으로 세대 마스터가 생성됩니다."
      item-label="세대"
      :item-name="`${state.form.building}동 ${state.form.unit}호`"
      action-text="세대 등록"
      confirm-text="등록"
      cancel-text="취소"
      confirm-type="primary"
      :loading="state.submitting"
      @confirm="handleCreate"
      @cancel="state.confirmVisible = false"
    />

    <ActionResultModal
      :visible="state.resultModal.visible"
      :type="state.resultModal.type"
      :title="state.resultModal.title"
      :item-name="state.resultModal.itemName"
      :time="state.resultModal.time"
      :action-label="state.resultModal.actionLabel"
      :actor="state.resultModal.actor"
      @close="handleResultConfirm"
    />
  </section>
</template>

<style scoped>
.create-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.create-page__header {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.create-page__title {
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

.create-card {
  border: 1px solid var(--admin-light-gray);
  border-radius: 14px;
  background: var(--white);
  padding: var(--space-24);
  box-shadow: var(--shadow-small);
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

.form-field input {
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

.form-field input:focus {
  border-color: var(--admin-sub-blue);
}

.form-field input:disabled {
  color: var(--gray-600);
  background: var(--gray-50);
  cursor: not-allowed;
}

.required {
  color: var(--admin-danger);
  font-style: normal;
}

.form-feedback {
  margin-top: var(--space-12);
  font-size: var(--font-size-label);
}

.form-feedback.error {
  color: var(--admin-danger);
}

.form-feedback.hint {
  color: var(--gray-600);
}

.create-card__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-8);
  margin-top: var(--space-24);
  padding-top: var(--space-16);
  border-top: 1px solid var(--admin-light-gray);
}

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

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
