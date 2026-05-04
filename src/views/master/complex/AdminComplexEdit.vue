<script setup>
import { onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import { getComplexStatusLabel } from '@/constants/complexCodes'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const complexStore = useComplexStore()

// 부모 컴포넌트가 선택 단지 정보와 열림 여부를 전달할 수 있다.
const props = defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
  selectedComplex: {
    type: Object,
    default: null,
  },
  complexCode: {
    type: String,
    default: '',
  },
})

// 수정 완료와 모달 닫기 이벤트를 부모 컴포넌트로 전달한다.
const emit = defineEmits(['close', 'updated'])

const state = reactive({
  form: {
    name: '',
    address: '',
    addressDetail: '',
    zipCode: '',
    description: '',
    status: '',
    code: '',
    createdAt: '',
    updatedAt: '',
  },
  loading: false,
  errorMessage: '',
  showUpdateConfirm: false,
  showDeleteConfirm: false,
  resultModal: {
    show: false,
    type: 'success',
    title: '',
    subtitle: '',
    desc: '',
    shouldEmitUpdated: false,
    shouldCloseParent: false,
  },
})

// 수정 대상 단지 코드를 props 또는 현재 route에서 안전하게 찾는다.
function getTargetCode() {
  return props.complexCode || props.selectedComplex?.code || route.params.code || ''
}

// 수정 모달이 다시 열릴 때 이전 단지 정보가 남지 않도록 상태를 초기화한다.
function resetState() {
  state.form.name = ''
  state.form.address = ''
  state.form.addressDetail = ''
  state.form.zipCode = ''
  state.form.description = ''
  state.form.status = ''
  state.form.code = ''
  state.form.createdAt = ''
  state.form.updatedAt = ''
  state.loading = false
  state.errorMessage = ''
  state.showUpdateConfirm = false
  state.showDeleteConfirm = false
  state.resultModal.show = false
  state.resultModal.type = 'success'
  state.resultModal.title = ''
  state.resultModal.subtitle = ''
  state.resultModal.desc = ''
  state.resultModal.shouldEmitUpdated = false
  state.resultModal.shouldCloseParent = false
}

// 결과 모달을 열어 수정 또는 삭제 처리 결과를 안내한다.
function openResultModal({
  type = 'success',
  title,
  subtitle = '',
  desc = '',
  shouldEmitUpdated = false,
  shouldCloseParent = false,
}) {
  state.showUpdateConfirm = false
  state.showDeleteConfirm = false
  state.resultModal.show = true
  state.resultModal.type = type
  state.resultModal.title = title
  state.resultModal.subtitle = subtitle
  state.resultModal.desc = desc
  state.resultModal.shouldEmitUpdated = shouldEmitUpdated
  state.resultModal.shouldCloseParent = shouldCloseParent
}

// 결과 모달 확인 시 부모에 완료 이벤트를 전달하고 모달을 닫는다.
function handleResultConfirm() {
  const shouldEmitUpdated = state.resultModal.shouldEmitUpdated
  const shouldCloseParent = state.resultModal.shouldCloseParent

  state.resultModal.show = false
  state.resultModal.shouldEmitUpdated = false
  state.resultModal.shouldCloseParent = false

  if (shouldEmitUpdated) {
    emit('updated')
  }

  if (shouldCloseParent) {
    emit('close')
  }
}

// 부모가 모달을 닫을 때 내부 상태도 함께 초기화한다.
function handleClose() {
  resetState()
  emit('close')
}

// 단지 상태 라벨을 화면에 표시하기 쉬운 문자열로 변환한다.
function formatStatus(status) {
  return getComplexStatusLabel(status)
}

// 선택된 단지 정보가 있으면 기본 폼 값을 먼저 채운다.
function syncForm(detail) {
  state.form.name = detail?.name || ''
  state.form.address = detail?.address || ''
  state.form.addressDetail = detail?.addressDetail || ''
  state.form.zipCode = detail?.zipCode || ''
  state.form.description = detail?.description || ''
  state.form.status = detail?.status || ''
  state.form.code = detail?.code || ''
  state.form.createdAt = detail?.createdAt || ''
  state.form.updatedAt = detail?.updatedAt || ''
}

// 모달이 열리면 선택 단지 상세를 조회해 최신 정보를 반영한다.
async function loadComplexDetail() {
  const code = getTargetCode()

  if (!code) {
    openResultModal({
      type: 'warning',
      title: '단지 정보를 확인할 수 없습니다.',
      subtitle: '수정할 단지를 다시 선택해주세요.',
      shouldCloseParent: true,
    })
    return
  }

  if (props.selectedComplex) {
    syncForm(props.selectedComplex)
  }

  state.loading = true

  try {
    const detail = await complexStore.fetchMasterComplexDetail(code)
    state.errorMessage = ''
    syncForm(detail)
  } catch (error) {
    console.error(error)
    state.errorMessage = error?.message || '잠시 후 다시 시도해주세요.'
    openResultModal({
      type: 'danger',
      title: '단지 정보를 불러오지 못했습니다.',
      subtitle: state.errorMessage,
      shouldCloseParent: true,
    })
  } finally {
    state.loading = false
  }
}

// 수정 전 확인 모달을 연다.
function openUpdateConfirm() {
  if (state.loading) return
  state.showUpdateConfirm = true
}

// 관리자 이름이 아닌 단지명과 설명만 수정 요청으로 보낸다.
async function handleUpdateConfirm() {
  const code = getTargetCode()

  if (!code) return

  if (state.loading) return

  state.showUpdateConfirm = false
  state.loading = true
  state.errorMessage = ''

  try {
    // 단지 수정 요청
    await complexStore.updateMasterComplex(code, {
      name: state.form.name,
      description: state.form.description,
    })

    openResultModal({
      type: 'success',
      title: '수정이 완료되었습니다.',
      subtitle: '변경된 단지 정보가 저장되었습니다.',
      shouldEmitUpdated: true,
      shouldCloseParent: true,
    })
  } catch (error) {
    console.error(error)
    state.errorMessage = error?.message || '잠시 후 다시 시도해주세요.'
    openResultModal({
      type: 'danger',
      title: '수정에 실패했습니다.',
      subtitle: state.errorMessage,
    })
  } finally {
    state.loading = false
  }
}

// 삭제 전 확인 모달을 연다.
function openDeleteConfirm() {
  if (state.loading) return
  state.showDeleteConfirm = true
}

// 단지 삭제는 실제 삭제가 아니라 status=03으로 변경하는 소프트 삭제이다.
async function handleDeleteConfirm() {
  const code = getTargetCode()

  if (!code) return

  if (state.loading) return

  state.showDeleteConfirm = false
  state.loading = true
  state.errorMessage = ''

  try {
    await complexStore.updateMasterComplexStatus(code, '03')

    // 관리자 삭제 성공 후 부모 목록이 재조회되면 선택 단지가 남지 않도록 store 선택값을 먼저 정리한다.
    complexStore.clearSelectedComplex?.()

    openResultModal({
      type: 'success',
      title: '삭제가 완료되었습니다.',
      subtitle: '단지 상태가 삭제로 변경되었습니다.',
      shouldEmitUpdated: true,
      shouldCloseParent: true,
    })
  } catch (error) {
    console.error(error)
    state.errorMessage = error?.message || '잠시 후 다시 시도해주세요.'
    openResultModal({
      type: 'danger',
      title: '삭제 처리에 실패했습니다.',
      subtitle: state.errorMessage,
    })
  } finally {
    state.loading = false
  }
}

// 모달이 다시 열리거나 대상 단지가 바뀌면 상세 정보를 새로 불러온다.
watch(
  () => [props.visible, props.complexCode, props.selectedComplex?.code],
  ([visible]) => {
    if (!visible) return

    resetState()
    loadComplexDetail()
  },
  { immediate: false },
)

onMounted(loadComplexDetail)
</script>

<template>
  <BaseModal
    :visible="props.visible"
    title="단지 수정"
    subtitle="단지명과 설명만 수정할 수 있으며 주소 정보는 등록 이후 변경할 수 없습니다."
    @close="handleClose"
  >
    <div class="master-complex-form">
      <p v-if="state.loading" class="master-complex-form__feedback">단지 정보를 불러오는 중입니다.</p>

      <div class="master-complex-form__grid">
        <label class="master-complex-form__field">
          <span>단지명</span>
          <input v-model="state.form.name" type="text" placeholder="단지명을 입력해주세요." />
        </label>

        <label class="master-complex-form__field">
          <span>상태</span>
          <input :value="formatStatus(state.form.status)" type="text" readonly />
        </label>
      </div>

      <label class="master-complex-form__field">
        <span>주소</span>
        <input v-model="state.form.address" type="text" readonly />
      </label>

      <div class="master-complex-form__grid">
        <label class="master-complex-form__field">
          <span>상세주소</span>
          <input v-model="state.form.addressDetail" type="text" readonly />
        </label>

        <label class="master-complex-form__field">
          <span>우편번호</span>
          <input v-model="state.form.zipCode" type="text" readonly />
        </label>
      </div>

      <label class="master-complex-form__field">
        <span>설명</span>
        <textarea
          v-model="state.form.description"
          rows="5"
          placeholder="단지 설명을 입력해주세요."
        />
      </label>

      <div class="master-complex-form__meta">
        <p>코드: {{ state.form.code || '-' }}</p>
        <p>등록일: {{ state.form.createdAt || '-' }}</p>
        <p>수정일: {{ state.form.updatedAt || '-' }}</p>
      </div>

      <p v-if="state.errorMessage" class="master-complex-form__feedback is-error">
        {{ state.errorMessage }}
      </p>
    </div>

    <template #footer>
      <div class="master-complex-form__footer">
        <button
          type="button"
          class="master-complex-form__danger-button"
          :disabled="state.loading"
          @click="openDeleteConfirm"
        >
          삭제
        </button>
        <div class="master-complex-form__footer-actions">
          <button type="button" class="master-complex-form__ghost-button" @click="handleClose">
            취소
          </button>
          <button
            type="button"
            class="master-complex-form__primary-button"
            :disabled="state.loading"
            @click="openUpdateConfirm"
          >
            {{ state.loading ? '저장 중...' : '수정 저장' }}
          </button>
        </div>
      </div>
    </template>
  </BaseModal>

  <ConfirmModal
    :visible="state.showUpdateConfirm"
    title="단지 정보를 수정할까요?"
    subtitle="변경된 단지명과 설명을 저장합니다."
    confirm-text="수정"
    cancel-text="취소"
    confirm-type="primary"
    :loading="state.loading"
    @confirm="handleUpdateConfirm"
    @cancel="state.showUpdateConfirm = false"
  />

  <ConfirmModal
    :visible="state.showDeleteConfirm"
    title="관리 단지를 삭제할까요?"
    subtitle="삭제는 실제 제거가 아니라 status=03으로 변경하는 소프트 삭제입니다."
    confirm-text="삭제"
    cancel-text="취소"
    confirm-type="danger"
    :loading="state.loading"
    @confirm="handleDeleteConfirm"
    @cancel="state.showDeleteConfirm = false"
  />

  <ActionResultModal
    :visible="state.resultModal.show"
    :type="state.resultModal.type"
    :title="state.resultModal.title"
    :subtitle="state.resultModal.subtitle"
    :desc="state.resultModal.desc"
    @close="handleResultConfirm"
  />
</template>

<style scoped>
.master-complex-form {
  display: grid;
  gap: 16px;
}

.master-complex-form__field {
  display: grid;
  gap: 8px;
}

.master-complex-form__field span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
}

.master-complex-form__field input,
.master-complex-form__field textarea {
  width: 100%;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  font: inherit;
}

.master-complex-form__field textarea {
  min-height: 120px;
  padding: 12px 14px;
  resize: vertical;
}

.master-complex-form__field input[readonly],
.master-complex-form__field textarea[readonly] {
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
}

.master-complex-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.master-complex-form__meta {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--color-bg-muted);
}

.master-complex-form__meta p,
.master-complex-form__feedback {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.master-complex-form__feedback.is-error {
  color: var(--color-danger);
}

.master-complex-form__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.master-complex-form__footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.master-complex-form__ghost-button,
.master-complex-form__primary-button,
.master-complex-form__danger-button {
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.master-complex-form__ghost-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
}

.master-complex-form__primary-button {
  border: none;
  background: var(--color-primary);
  color: var(--color-card-bg);
}

.master-complex-form__danger-button {
  border: none;
  background: var(--color-danger);
  color: var(--color-card-bg);
}

.master-complex-form__primary-button:disabled,
.master-complex-form__danger-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .master-complex-form__grid {
    grid-template-columns: 1fr;
  }

  .master-complex-form__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .master-complex-form__footer-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
