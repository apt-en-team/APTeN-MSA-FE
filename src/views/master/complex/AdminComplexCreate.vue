<script setup>
import { reactive, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import { useComplexStore } from '@/stores/useComplexStore'

const complexStore = useComplexStore()

// 부모 컴포넌트에서 모달 열림 여부를 제어한다.
const props = defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
})

// 모달 닫기와 등록 완료 이벤트를 부모 컴포넌트로 전달한다.
const emit = defineEmits(['close', 'created'])

const state = reactive({
  form: {
    name: '',
    address: '',
    zipCode: '',
    description: '',
    managerEmail: '',
    managerPassword: '',
    managerName: '',
    managerPhone: '',
  },
  addressKeyword: '',
  addressResults: [],
  addressPage: 0,
  addressSize: 6,
  addressTotalPages: 0,
  addressTotalElements: 0,
  addressHasNext: false,
  loading: false,
  errorMessage: '',
  showAddressModal: false,
  showConfirmModal: false,
resultModal: {
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
  desc: '',
  itemName: '',
  time: '',
  actionLabel: '',
  actor: '',
  shouldEmitCreated: false,
  shouldCloseParent: false,
},
})

// 등록 모달이 다시 열릴 때 이전 입력 상태가 남지 않도록 초기화한다.
function resetState() {
  state.form.name = ''
  state.form.address = ''
  state.form.zipCode = ''
  state.form.description = ''
  state.form.managerEmail = ''
  state.form.managerPassword = ''
  state.form.managerName = ''
  state.form.managerPhone = ''
  state.addressKeyword = ''
  state.addressResults = []
  state.addressPage = 0
  state.addressSize = 6
  state.addressTotalPages = 0
  state.addressTotalElements = 0
  state.addressHasNext = false
  state.loading = false
  state.errorMessage = ''
  state.showAddressModal = false
  state.showConfirmModal = false
  state.resultModal.show = false
  state.resultModal.type = 'success'
  state.resultModal.title = ''
  state.resultModal.subtitle = ''
  state.resultModal.desc = ''
  state.resultModal.itemName = ''
  state.resultModal.time = ''
  state.resultModal.actionLabel = ''
  state.resultModal.actor = ''
  state.resultModal.shouldEmitCreated = false
  state.resultModal.shouldCloseParent = false
}

// 결과 모달을 열어 등록 처리 결과를 안내한다.
function openResultModal({
  type = 'success',
  title,
  subtitle = '',
  desc = '',
  itemName = '',
  time = '',
  actionLabel = '',
  actor = '',
  shouldEmitCreated = false,
  shouldCloseParent = false,
}) {
  state.showConfirmModal = false
  state.resultModal.show = true
  state.resultModal.type = type
  state.resultModal.title = title
  state.resultModal.subtitle = subtitle
  state.resultModal.desc = desc
  state.resultModal.itemName = itemName
  state.resultModal.time = time
  state.resultModal.actionLabel = actionLabel
  state.resultModal.actor = actor
  state.resultModal.shouldEmitCreated = shouldEmitCreated
  state.resultModal.shouldCloseParent = shouldCloseParent
}

// 결과 모달 확인 시 부모에 완료 이벤트를 전달하고 모달을 닫는다.
function handleResultConfirm() {
  const shouldEmitCreated = state.resultModal.shouldEmitCreated
  const shouldCloseParent = state.resultModal.shouldCloseParent

  state.resultModal.show = false
  state.resultModal.shouldEmitCreated = false
  state.resultModal.shouldCloseParent = false

  if (shouldEmitCreated) {
    emit('created')
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

// 주소 검색을 위해 백엔드 단지 주소 API만 호출한다.
async function loadAddressResults(page = 0) {
  if (state.loading) return

  if (!state.addressKeyword.trim()) {
    openResultModal({
      type: 'warning',
      title: '주소 검색어를 입력해주세요.',
      subtitle: '단지 주소를 찾으려면 검색어를 먼저 입력해야 합니다.',
    })
    return
  }

  state.loading = true

  try {
    const results = await complexStore.searchComplexAddress({
      keyword: state.addressKeyword.trim(),
      page,
      size: state.addressSize,
    })
    // 주소 검색 응답에서 현재 페이지 결과만 목록에 반영한다.
    state.addressResults = Array.isArray(results?.content)
      ? results.content
      : Array.isArray(results)
        ? results
        : []
    state.addressPage = results?.page ?? page
    state.addressTotalPages = results?.totalPages ?? (state.addressResults.length > 0 ? 1 : 0)
    state.addressTotalElements = results?.totalElements ?? state.addressResults.length
    state.addressHasNext = results?.hasNext ?? false
    state.errorMessage = ''
    state.showAddressModal = true
  } catch (error) {
    console.error(error)
    state.addressResults = []
    state.addressPage = page
    state.addressTotalPages = 0
    state.addressTotalElements = 0
    state.addressHasNext = false
    state.errorMessage = error?.message || '주소 검색에 실패했습니다.'
    openResultModal({
      type: 'danger',
      title: '주소 검색에 실패했습니다.',
      subtitle: state.errorMessage || '잠시 후 다시 시도해주세요.',
    })
  } finally {
    state.loading = false
  }
}

// 주소 검색 버튼을 누르면 첫 페이지부터 다시 조회한다.
async function handleSearchAddress() {
  await loadAddressResults(0)
}

// 이전 페이지 주소 검색 결과를 다시 조회한다.
async function handlePrevAddressPage() {
  if (state.loading || state.addressPage === 0) return
  await loadAddressResults(state.addressPage - 1)
}

// 다음 페이지 주소 검색 결과를 다시 조회한다.
async function handleNextAddressPage() {
  if (state.loading || !state.addressHasNext) return
  await loadAddressResults(state.addressPage + 1)
}

// 주소 검색 결과를 선택하면 폼 값에 반영한다.
function handleSelectAddress(address) {
  // 주소 검색 결과에서 단지명, 주소, 우편번호를 폼에 반영한다.
  state.form.name = address?.apartmentName || state.form.name
  state.form.address = address?.address || ''
  state.form.zipCode = address?.zipCode || ''
  state.showAddressModal = false
}

// 등록 전 확인 모달을 연다.
function openCreateConfirm() {
  if (state.loading) return
  state.showConfirmModal = true
}

// 단지 등록 요청을 보내고 성공 시 결과 모달을 표시한다.
async function handleCreateConfirm() {
  if (state.loading) return

  state.showConfirmModal = false
  state.loading = true
  state.errorMessage = ''

  try {
    // 단지 등록 시 최초 관리자 정보 포함
    await complexStore.createMasterComplex({
      name: state.form.name,
      address: state.form.address,
      zipCode: state.form.zipCode,
      description: state.form.description,
      managerEmail: state.form.managerEmail,
      managerPassword: state.form.managerPassword,
      managerName: state.form.managerName,
      managerPhone: state.form.managerPhone,
    })

    const createdAt = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

    // 관리자 계정 생성은 단지 API를 호출하면 백엔드가 Auth Service 내부 호출로 처리한다.
    openResultModal({
      type: 'success',
      title: '단지 생성이 완료되었습니다.',
      subtitle: '목록을 갱신해 새로 등록된 단지를 확인합니다.',
      itemName: state.form.name || '새 단지',
      time: createdAt,
      actionLabel: '단지 등록',
      actor: state.form.managerName || '마스터',
      shouldEmitCreated: true,
      shouldCloseParent: true,
    })
  } catch (error) {
    console.error(error)
    state.errorMessage = error?.message || '입력값을 확인한 뒤 다시 시도해주세요.'
    openResultModal({
      type: 'danger',
      title: '단지 생성에 실패했습니다.',
      subtitle: state.errorMessage,
    })
  } finally {
    state.loading = false
  }
}

// 모달이 다시 열릴 때 이전 입력 상태가 남지 않도록 초기화한다.
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetState()
    }
  },
  { immediate: true },
)
</script>

<template>
  <BaseModal
    :visible="props.visible"
    title="새 단지 추가"
    subtitle="새 아파트 단지 등록"
    @close="handleClose"
  >
  <div class="master-complex-form__section-divider"></div>
    <div class="master-complex-form">
      <div class="master-complex-form__section">
        
        <h2 class="master-complex-form__section-title">단지 정보</h2>

        <div class="master-complex-form__field">
          <span>주소 찾기</span>
          <div class="master-complex-form__inline">
            <input
              v-model="state.addressKeyword"
              type="text"
              placeholder="주소 또는 아파트명을 검색해주세요."
            />
            <button
              type="button"
              class="master-complex-form__secondary-button"
              :disabled="state.loading"
              @click="handleSearchAddress"
            >
              주소 검색
            </button>
          </div>
        </div>

        <label class="master-complex-form__field">
          <span>단지명</span>
          <input v-model="state.form.name" type="text" >
        </label>

        <div class="master-complex-form__juso">
          <label class="master-complex-form__field">
            <span>주소</span>
            <input v-model="state.form.address" type="text" >
          </label>
          <label class="master-complex-form__field">
            <span>우편번호</span>
            <input v-model="state.form.zipCode" type="text" >
          </label>
        </div>

        <label class="master-complex-form__field">
          <span>설명</span>
          <textarea
            v-model="state.form.description"
            rows="4"
            placeholder="단지 설명을 입력해주세요."
          />
        </label>
      </div>

      <div class="master-complex-form__section">
        <h2 class="master-complex-form__section-title">초기 관리자 계정</h2>

        <label class="master-complex-form__field">
          <span>이메일</span>
          <input v-model="state.form.managerEmail" type="email" placeholder="admin@example.com" />
        </label>

        <label class="master-complex-form__field">
          <span>비밀번호</span>
          <input
            v-model="state.form.managerPassword"
            type="password"
            placeholder="초기 비밀번호를 입력해주세요."
          />
        </label>

        <div class="master-complex-form__grid">
          <label class="master-complex-form__field">
            <span>관리자 이름</span>
            <input v-model="state.form.managerName" type="text" placeholder="이름" />
          </label>
          <label class="master-complex-form__field">
            <span>연락처</span>
            <input v-model="state.form.managerPhone" type="text" placeholder="010-0000-0000" />
          </label>
        </div>
      </div>

      <p v-if="state.errorMessage" class="master-complex-form__feedback is-error">
        {{ state.errorMessage }}
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="master-complex-form__primary-button"
        :disabled="state.loading"
        @click="openCreateConfirm"
      >
        {{ state.loading ? '등록 중...' : '등록' }}
      </button>
    </template>
  </BaseModal>

  <BaseModal
    :visible="state.showAddressModal"
    title="주소 검색 결과"
    @close="state.showAddressModal = false"
  >
    <div v-if="state.addressResults.length === 0" class="master-complex-form__modal-empty">
      검색 결과가 없습니다.
    </div>
    <div v-else class="master-complex-form__address-list">
      <button
        v-for="address in state.addressResults"
        :key="`${address.address}-${address.zipCode}`"
        type="button"
        class="master-complex-form__address-item"
        @click="handleSelectAddress(address)"
      >
        <strong>{{ address.apartmentName || '주소 결과' }}</strong>
        <span>{{ address.address }}</span>
        <span>{{ address.zipCode || '-' }}</span>
      </button>
    </div>
    <div v-if="state.addressTotalElements > 0" class="master-complex-form__address-meta">
      총 {{ state.addressTotalElements }}건
    </div>
    <div class="master-complex-form__pagination">
      <button
        type="button"
        class="master-complex-form__pagination-button"
        :disabled="state.loading || state.addressPage === 0"
        @click="handlePrevAddressPage"
      >
        이전
      </button>
      <span class="master-complex-form__pagination-text">
        {{ state.addressTotalPages === 0 ? 0 : state.addressPage + 1 }} / {{ state.addressTotalPages }}
      </span>
      <button
        type="button"
        class="master-complex-form__pagination-button"
        :disabled="state.loading || !state.addressHasNext"
        @click="handleNextAddressPage"
      >
        다음
      </button>
    </div>
  </BaseModal>

<ConfirmModal
  :visible="state.showConfirmModal"
  title="단지를 등록하시겠습니까?"
  subtitle="입력한 단지 정보와 최초 관리자 계정을 생성합니다."
  item-label="단지명"
  :item-name="state.form.name || '새 단지'"
  action-text="관리자 계정 생성"
  :extra-value="state.form.managerEmail"
  extra-label="이메일"
  confirm-text="등록"
  cancel-text="취소"
  confirm-type="primary"
  :loading="state.loading"
  @confirm="handleCreateConfirm"
  @cancel="state.showConfirmModal = false"
/>

  <ActionResultModal
    :visible="state.resultModal.show"
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
</template>

<style scoped>
.master-complex-form {
  display: grid;
}

.master-complex-form__section {
  display: grid;
  gap: 16px;
}

.master-complex-form__section-title {
  margin: 0;
  padding-top: 16px;
  color: var(--color-text-primary);
  font-size: var(--font-size-modal-title);
  font-weight: 700;
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
  max-height: 45px;
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

.master-complex-form__juso {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(160px, 0.8fr);
  gap: 8px;
}

.master-complex-form__inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.master-complex-form__ghost-button,
.master-complex-form__secondary-button,
.master-complex-form__primary-button {
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.master-complex-form__ghost-button,
.master-complex-form__secondary-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
}

.master-complex-form__primary-button {
  border: none;
  background: #1E2A3E;
  color: var(--color-card-bg);
}

.master-complex-form__primary-button:disabled,
.master-complex-form__secondary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.master-complex-form__modal-empty {
  color: var(--color-text-secondary);
  font-size: 13px;
  text-align: center;
}

.master-complex-form__feedback {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.master-complex-form__feedback.is-error {
  color: var(--color-danger);
}

.master-complex-form__address-list {
  display: grid;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
}

.master-complex-form__address-item {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
}

.master-complex-form__address-item strong {
  font-size: 13px;
}

.master-complex-form__address-item span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.master-complex-form__address-meta {
  margin-top: 12px;
  color: var(--color-text-secondary);
  font-size: 12px;
  text-align: right;
}

.master-complex-form__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.master-complex-form__pagination-button {
  min-width: 72px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.master-complex-form__pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.master-complex-form__pagination-text {
  min-width: 72px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.master-complex-form__section-divider {
  width: 100%;
  height: 1px;
  background: var(--color-border);
  opacity: 0.8;
}

@media (max-width: 720px) {
  .master-complex-form__grid,
  .master-complex-form__juso {
    grid-template-columns: 1fr;
  }

  .master-complex-form__inline {
    grid-template-columns: 1fr;
  }
}
</style>
