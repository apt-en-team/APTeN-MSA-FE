<script setup>
// 입주민 방문차량 등록/수정/재등록 폼 모달입니다.
import { reactive, computed, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import { VISIT_PURPOSE_PRESETS, VISIT_PURPOSE_CUSTOM } from '@/constants/visitPurpose'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'create', // create | edit | re-register
  },
  vehicle: {
    type: Object,
    default: null,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'submit'])

// 등록 모드 여부
const isCreate = computed(() => props.mode === 'create')

// 재등록 모드 여부
const isReRegister = computed(() => props.mode === 're-register')

// 재등록 시 방문일 외 필드 잠금 여부
const fieldsLocked = computed(() => isReRegister.value)

// 방문 목적 프리셋 목록 (템플릿 노출용)
const purposePresets = VISIT_PURPOSE_PRESETS

// 직접 입력 식별값 (템플릿 노출용)
const purposeCustomValue = VISIT_PURPOSE_CUSTOM

// 폼 입력값
const form = reactive({
  licensePlate: '',
  visitorName: '',
  phone: '',
  purposeSelect: '',
  purposeCustom: '',
  visitDate: '',
})

// 로컬 필수값 검증 상태
const localError = reactive({
  licensePlate: false,
  visitDate: false,
})

// 방문 목적 원본값을 드롭다운 선택값과 직접 입력값으로 분해
const applyPurpose = (purpose) => {
  const value = purpose ?? ''
  if (value && VISIT_PURPOSE_PRESETS.includes(value)) {
    form.purposeSelect = value
    form.purposeCustom = ''
  } else if (value) {
    form.purposeSelect = VISIT_PURPOSE_CUSTOM
    form.purposeCustom = value
  } else {
    form.purposeSelect = ''
    form.purposeCustom = ''
  }
}

// 모달이 열릴 때 폼을 초기화한다.
watch(
  () => props.visible,
  (open) => {
    if (!open) return
    form.licensePlate = props.vehicle?.licensePlate ?? ''
    form.visitorName = props.vehicle?.visitorName ?? ''
    form.phone = props.vehicle?.phone ?? ''
    form.visitDate = isReRegister.value ? '' : props.vehicle?.visitDate?.slice(0, 10) ?? ''
    applyPurpose(props.vehicle?.visitPurpose)
    localError.licensePlate = false
    localError.visitDate = false
  },
)

// 모달 제목
const modalTitle = computed(() => {
  if (isCreate.value) return '방문차량 등록'
  if (isReRegister.value) return '방문차량 재등록'
  return '방문차량 수정'
})

// 모달 안내 문구
const modalSubtitle = computed(() => {
  if (isCreate.value) return '방문 예정 차량 정보를 입력해주세요.'
  if (isReRegister.value) return '기존 정보를 그대로 사용하고 방문일만 다시 입력해주세요.'
  return '수정할 방문차량 정보를 입력해주세요.'
})

// 제출 버튼 라벨
const submitLabel = computed(() => {
  if (isCreate.value) return '등록하기'
  if (isReRegister.value) return '재등록하기'
  return '저장'
})

// 선택 또는 직접 입력값으로 최종 방문 목적 문자열 해석
const resolveVisitPurpose = () => {
  if (form.purposeSelect === VISIT_PURPOSE_CUSTOM) return form.purposeCustom.trim()
  return form.purposeSelect
}

// 필수값 검증 후 제출 이벤트 전달
const handleSubmit = () => {
  localError.licensePlate = !fieldsLocked.value && !form.licensePlate.trim()
  localError.visitDate = !form.visitDate
  if (localError.licensePlate || localError.visitDate) return
  emit('submit', {
    licensePlate: form.licensePlate.trim(),
    visitorName: form.visitorName.trim(),
    phone: form.phone.trim(),
    visitPurpose: resolveVisitPurpose(),
    visitDate: form.visitDate,
  })
}
</script>

<template>
  <BaseModal :visible="visible" :title="modalTitle" :subtitle="modalSubtitle" @close="emit('close')">
    <div class="visitor-form">
      <!-- 차량번호 -->
      <div class="visitor-form__field">
        <label class="visitor-form__label">
          차량번호 <span class="visitor-form__required">*</span>
        </label>
        <BaseInput
          v-model="form.licensePlate"
          placeholder="예: 12가 3456"
          :disabled="fieldsLocked"
          :error="localError.licensePlate"
        />
        <p v-if="localError.licensePlate" class="visitor-form__error">차량번호를 입력해주세요.</p>
        <p v-else-if="fieldsLocked" class="visitor-form__hint">재등록 시 차량번호는 변경할 수 없습니다.</p>
      </div>

      <!-- 방문자 이름 -->
      <div class="visitor-form__field">
        <label class="visitor-form__label">방문자 이름</label>
        <BaseInput
          v-model="form.visitorName"
          placeholder="예: 홍길동"
          :disabled="fieldsLocked"
        />
      </div>

      <!-- 연락처 -->
      <div class="visitor-form__field">
        <label class="visitor-form__label">연락처</label>
        <BaseInput
          v-model="form.phone"
          placeholder="예: 010-1234-5678"
          :disabled="fieldsLocked"
        />
      </div>

      <!-- 방문목적 -->
      <div class="visitor-form__field">
        <label class="visitor-form__label">방문목적</label>
        <select
          v-model="form.purposeSelect"
          class="visitor-form__select"
          :disabled="fieldsLocked"
        >
          <option value="">방문목적 선택</option>
          <option v-for="purpose in purposePresets" :key="purpose" :value="purpose">{{ purpose }}</option>
          <option :value="purposeCustomValue">직접 입력</option>
        </select>
        <BaseInput
          v-if="form.purposeSelect === purposeCustomValue"
          v-model="form.purposeCustom"
          placeholder="방문 목적을 입력하세요"
          :disabled="fieldsLocked"
        />
      </div>

      <!-- 방문예정일 -->
      <div class="visitor-form__field">
        <label class="visitor-form__label">
          방문예정일 <span class="visitor-form__required">*</span>
        </label>
        <BaseInput
          v-model="form.visitDate"
          type="date"
          :error="localError.visitDate"
        />
        <p v-if="localError.visitDate" class="visitor-form__error">방문예정일을 선택해주세요.</p>
      </div>

      <!-- 서버 오류 안내 -->
      <p v-if="errorMessage" class="visitor-form__error">{{ errorMessage }}</p>

      <!-- 필수 항목 안내 -->
      <p class="visitor-form__required-note">
        <span class="visitor-form__required">*</span> 표시는 필수 입력 항목입니다.
      </p>
    </div>

    <template #footer>
      <button type="button" class="visitor-form__cancel" @click="emit('close')">취소</button>
      <button
        type="button"
        class="visitor-form__submit"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '처리 중...' : submitLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.visitor-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 4px;
  padding: 16px 0 8px;
  border-top: 1px solid var(--color-border);
}

.visitor-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visitor-form__label {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.visitor-form__required {
  color: var(--color-danger);
}

.visitor-form__select {
  width: 100%;
  min-height: 44px;
  padding: 0 var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
}

.visitor-form__select:disabled {
  background-color: var(--color-bg-muted);
  color: var(--text-disabled);
}

.visitor-form__error {
  margin: 0;
  font-size: 12px;
  color: var(--color-danger);
}

.visitor-form__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.visitor-form__required-note {
  margin: 4px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.visitor-form__cancel,
.visitor-form__submit {
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.visitor-form__cancel {
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #718096;
}

.visitor-form__cancel:hover {
  background: #F8FAFC;
}

.visitor-form__submit {
  border: none;
  background: var(--resident-primary);
  color: #FFFFFF;
}

.visitor-form__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
