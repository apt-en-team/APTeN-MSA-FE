<script setup>
import { onMounted, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import ParkingTypeSelector from '@/components/admin/parking/ParkingTypeSelector.vue'
import { DEFAULT_COMPLEX_FEATURES, FEATURE_CODES } from '@/constants/complexFeatures'
import { codeToParkingTypeName } from '@/constants/parkingTypes'
import { normalizeFeatures } from '@/utils/featureGate'
import { useComplexStore } from '@/stores/useComplexStore'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()
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

// 로그인한 사용자 이름을 결과 모달 처리자로 표시한다.
function getErrorMessage(error, fallback = '잠시 후 다시 시도해주세요.') {
  const responseData = error?.response?.data
  if (responseData?.message) return responseData.message
  if (responseData?.data?.message) return responseData.data.message
  if (error?.data?.message) return error.data.message
  if (error?.message && !error.message.startsWith('Request failed with status code')) return error.message
  return fallback
}

function getCurrentActorName() {
  return authStore.userInfo?.name || authStore.name || '마스터 관리자'
}

// 수정 완료와 모달 닫기 이벤트를 부모 컴포넌트로 전달한다.
const emit = defineEmits(['close', 'updated'])

const state = reactive({
  form: {
    name: '',
    address: '',
    zipCode: '',
    description: '',
    status: '',
    code: '',
    createdAt: '',
    updatedAt: '',
    features: normalizeFeatures(DEFAULT_COMPLEX_FEATURES),
    // 주차 운영 타입, PARKING_STATUS 토글 OFF일 때 'NONE'
    parkingType: 'NONE',
    // 백엔드에 저장된 현재 코드, '현재' 뱃지 표시용
    parkingTypeCode: '',
  },
  loading: false,
  errorMessage: '',
  showUpdateConfirm: false,
  showDeleteConfirm: false,
})

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

// 수정 대상 단지 코드를 props 또는 현재 route에서 안전하게 찾는다.
function getTargetCode() {
  return props.complexCode || props.selectedComplex?.code || route.params.code || ''
}

// 수정 모달이 다시 열릴 때 이전 단지 정보가 남지 않도록 상태를 초기화한다.
function resetState() {
  state.form.name = ''
  state.form.address = ''
  state.form.zipCode = ''
  state.form.description = ''
  state.form.status = ''
  state.form.code = ''
  state.form.createdAt = ''
  state.form.updatedAt = ''
  state.form.features = normalizeFeatures(DEFAULT_COMPLEX_FEATURES)
  state.form.parkingType = 'NONE'
  state.form.parkingTypeCode = ''
  state.loading = false
  state.errorMessage = ''
  state.showUpdateConfirm = false
  state.showDeleteConfirm = false
  resultModal.show = false
  resultModal.type = 'success'
  resultModal.title = ''
  resultModal.subtitle = ''
  resultModal.desc = ''
  resultModal.itemName = ''
  resultModal.time = ''
  resultModal.actionLabel = ''
  resultModal.actor = ''
  resultModal.afterConfirm = null
}

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
} = {}) {
  state.showUpdateConfirm = false
  state.showDeleteConfirm = false
  Object.assign(resultModal, { show: true, type, title, subtitle, desc, itemName, time, actionLabel, actor, afterConfirm })
}

async function handleResultConfirm() {
  const callback = resultModal.afterConfirm
  resultModal.show = false
  resultModal.afterConfirm = null
  if (typeof callback === 'function') await callback()
}

// 부모가 모달을 닫을 때 내부 상태도 함께 초기화한다.
function handleClose() {
  resetState()
  emit('close')
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

// 선택된 단지 정보가 있으면 기본 폼 값을 먼저 채운다.
function syncForm(detail) {
  state.form.name = detail?.name || ''
  state.form.address = detail?.address || ''
  state.form.zipCode = detail?.zipCode || ''
  state.form.description = detail?.description || ''
  state.form.status = detail?.status || ''
  state.form.code = detail?.code || ''
  state.form.createdAt = detail?.createdAt || ''
  state.form.updatedAt = detail?.updatedAt || ''
  // 상세 응답의 기능 설정을 수정 폼 초기값으로 반영한다.
  state.form.features = normalizeFeatures(detail?.features)
  // 상세 응답의 parkingTypeCode를 셀렉터 name과 현재 코드로 매핑한다.
  state.form.parkingTypeCode = detail?.parkingTypeCode || ''
  state.form.parkingType = codeToParkingTypeName(state.form.parkingTypeCode)
}

// 모달이 열리면 선택 단지 상세를 조회해 최신 정보를 반영한다.
async function loadComplexDetail() {
  const code = getTargetCode()

  if (!code) {
    openResultModal({
      type: 'warning',
      title: '단지 정보를 확인할 수 없습니다.',
      subtitle: '수정할 단지를 다시 선택해주세요.',
      afterConfirm: () => emit('close'),
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
    state.errorMessage = getErrorMessage(error, '잠시 후 다시 시도해주세요.')
    openResultModal({
      type: 'danger',
      title: '단지 정보를 불러오지 못했습니다.',
      subtitle: state.errorMessage,
      time: getCurrentTimeText(),
      actionLabel: '단지 수정',
      actor: getCurrentActorName(),
      afterConfirm: () => emit('close'),
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
      // 단지 수정 요청에 기능 사용 여부를 함께 전달한다.
      features: normalizeFeatures(state.form.features),
      // 주차 운영 타입 enum name(NONE/BASIC/SENSOR) 전송
      parkingType: state.form.parkingType,
    })

    openResultModal({
      type: 'success',
      title: '수정이 완료되었습니다.',
      subtitle: '변경된 단지 정보가 저장되었습니다.',
      itemName: state.form.name || '선택 단지',
      time: getCurrentTimeText(),
      actionLabel: '단지 정보 수정',
      actor: getCurrentActorName(),
      afterConfirm: () => { emit('updated'); emit('close') },
    })
  } catch (error) {
    console.error(error)
    state.errorMessage = getErrorMessage(error, '잠시 후 다시 시도해주세요.')
    openResultModal({
      type: 'danger',
      title: '수정에 실패했습니다.',
      subtitle: state.errorMessage,
      itemName: state.form.name || '선택 단지',
      time: getCurrentTimeText(),
      actionLabel: '단지 정보 수정',
      actor: getCurrentActorName(),
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
      itemName: state.form.name || '선택 단지',
      time: getCurrentTimeText(),
      actionLabel: '단지 삭제',
      actor: getCurrentActorName(),
      afterConfirm: () => { emit('updated'); emit('close') },
    })
  } catch (error) {
    console.error(error)
    state.errorMessage = getErrorMessage(error, '잠시 후 다시 시도해주세요.')
    openResultModal({
      type: 'danger',
      title: '수정에 실패했습니다.',
      subtitle: state.errorMessage,
      itemName: state.form.name || '선택 단지',
      time: getCurrentTimeText(),
      actionLabel: '수정 실패',
      actor: getCurrentActorName(),
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
    <div class="master-complex-form master-complex-form--scrollable">
      <p v-if="state.loading" class="master-complex-form__feedback">단지 정보를 불러오는 중입니다.</p>

      <div class="master-complex-form__grid">
        <label class="master-complex-form__field">
          <span>단지명</span>
          <input v-model="state.form.name" type="text" placeholder="단지명을 입력해주세요." />
        </label>

        <label class="master-complex-form__field">
          <span>우편번호</span>
          <input v-model="state.form.zipCode" type="text" readonly />
        </label>
      </div>

      <label class="master-complex-form__field">
        <span>주소</span>
        <input v-model="state.form.address" type="text" readonly />
      </label>

      <label class="master-complex-form__field">
        <span>설명</span>
        <textarea
          v-model="state.form.description"
          rows="5"
          placeholder="단지 설명을 입력해주세요."
        />
      </label>

      <div class="master-complex-form__feature-section">
        <h3 class="master-complex-form__feature-title">사용 기능 설정</h3>

        <div class="master-complex-form__feature-box">
          <div class="master-complex-form__feature-options">
            <!-- 수정 화면에서도 단지별 기능 사용 여부를 compact 체크박스로 변경할 수 있다. -->
            <label class="master-complex-form__feature-toggle">
              <input v-model="state.form.features[FEATURE_CODES.FACILITY]" type="checkbox" />
              <span>시설/예약</span>
            </label>

            <label class="master-complex-form__feature-toggle">
              <input
                v-model="state.form.features[FEATURE_CODES.PARKING_STATUS]"
                type="checkbox"
              />
              <span>주차 현황</span>
            </label>

            <label class="master-complex-form__feature-toggle">
              <input v-model="state.form.features[FEATURE_CODES.VOTE]" type="checkbox" />
              <span>전자투표</span>
            </label>
          </div>

          <!-- PARKING_STATUS 켜진 경우에만 주차 운영 타입 선택 노출 -->
          <div
            v-if="state.form.features[FEATURE_CODES.PARKING_STATUS]"
            class="master-complex-form__parking-type"
          >
            <p class="master-complex-form__parking-type-label">주차 운영 타입</p>
            <ParkingTypeSelector
              v-model="state.form.parkingType"
              :current-code="state.form.parkingTypeCode"
              :disabled="state.loading"
            />
          </div>

          <p class="master-complex-form__feature-help">
            단지에서 사용할 기능만 선택해주세요. 선택하지 않은 기능은 입주민/관리자
            메뉴에서 숨겨집니다.
          </p>
        </div>
      </div>

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
        <div class="master-complex-form__footer-actions">
          <button
            type="button"
            class="master-complex-form__danger-button"
            :disabled="state.loading"
            @click="openDeleteConfirm"
          >
            단지 삭제
          </button>
          <button
            type="button"
            class="master-complex-form__primary-button"
            :disabled="state.loading"
            @click="openUpdateConfirm"
          >
            {{ state.loading ? '저장 중...' : '수정' }}
          </button>
        </div>
      </div>
    </template>
  </BaseModal>

  <ConfirmModal
    :visible="state.showUpdateConfirm"
    title="단지 정보를 수정하시겠습니까?"
    subtitle="변경된 단지명과 설명을 저장합니다."
    item-label="단지명"
    :item-name="state.form.name || '선택 단지'"
    action-label="수정"
    action-text="단지 정보 변경"
    :extra-value="state.form.code || '-'"
    extra-label="단지 코드"
    confirm-text="수정"
    cancel-text="취소"
    confirm-type="primary"
    :loading="state.loading"
    @confirm="handleUpdateConfirm"
    @cancel="state.showUpdateConfirm = false"
  />

  <ConfirmModal
    :visible="state.showDeleteConfirm"
    title="관리 단지를 삭제하시겠습니까?"
    subtitle="삭제된 단지는 운영 목록에서 제외됩니다."
    subtitle-color="#E53E3E"
    item-label="단지명"
    :item-name="state.form.name || '선택 단지'"
    action-label="삭제"
    action-text="상태를 삭제로 변경"
    :extra-value="state.form.code || '-'"
    extra-label="단지 코드"
    confirm-text="삭제"
    cancel-text="취소"
    confirm-type="danger"
    :loading="state.loading"
    @confirm="handleDeleteConfirm"
    @cancel="state.showDeleteConfirm = false"
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
    confirm-text="확인"
    @close="handleResultConfirm"
    @confirm="handleResultConfirm"
  />
</template>

<style scoped>
.master-complex-form {
  display: grid;
  gap: 16px;
}

.master-complex-form--scrollable {
  max-height: min(62vh, 620px);
  overflow-y: auto;
  padding-right: 4px;
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
  max-height: 80px;
  padding: 12px 14px;
  resize: vertical;
}

.master-complex-form__field input[readonly],
.master-complex-form__field textarea[readonly] {
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
}

.master-complex-form__feature-section {
  display: grid;
  gap: 12px;
}

.master-complex-form__feature-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 700;
}

.master-complex-form__feature-box {
  display: grid;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-card-bg);
}

.master-complex-form__feature-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
}

.master-complex-form__feature-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.master-complex-form__feature-toggle input {
  width: 14px;
  height: 14px;
  margin: 0;
}

.master-complex-form__feature-help {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.master-complex-form__parking-type {
  display: grid;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px dashed var(--color-border);
}

.master-complex-form__parking-type-label {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 600;
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
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

.master-complex-form__footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
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
  background: #1E2A3E;
  color: var(--color-card-bg);
}

.master-complex-form__danger-button {
  border: none;
  background: #E53E3E;
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
    align-items: stretch;
  }

  .master-complex-form__footer-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
