<script setup>
// 입주민 고정방문차량 등록/수정 폼 모달입니다.
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
    default: 'create', // create | edit
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
  startDate: '',
  endDate: '',
})

// 로컬 필수값 검증 상태
const localError = reactive({
  licensePlate: false,
  startDate: false,
  endDate: false,
  period: false,
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
    form.startDate = props.vehicle?.startDate?.slice(0, 10) ?? ''
    form.endDate = props.vehicle?.endDate?.slice(0, 10) ?? ''
    applyPurpose(props.vehicle?.visitPurpose)
    localError.licensePlate = false
    localError.startDate = false
    localError.endDate = false
    localError.period = false
  },
)

// 모달 제목
const modalTitle = computed(() => (isCreate.value ? '고정방문차량 등록' : '고정방문차량 수정'))

// 모달 안내 문구
const modalSubtitle = computed(() =>
  isCreate.value ? '고정방문 차량 정보를 입력해주세요.' : '수정할 고정방문 차량 정보를 입력해주세요.',
)

// 제출 버튼 라벨
const submitLabel = computed(() => (isCreate.value ? '등록하기' : '저장'))

// 선택 또는 직접 입력값으로 최종 방문 목적 문자열 해석
const resolveVisitPurpose = () => {
  if (form.purposeSelect === VISIT_PURPOSE_CUSTOM) return form.purposeCustom.trim()
  return form.purposeSelect
}

// 필수값과 기간 순서를 검증 후 제출 이벤트 전달
const handleSubmit = () => {
  localError.licensePlate = isCreate.value && !form.licensePlate.trim()
  localError.startDate = !form.startDate
  localError.endDate = !form.endDate
  localError.period = !!form.startDate && !!form.endDate && form.endDate < form.startDate
  if (localError.licensePlate || localError.startDate || localError.endDate || localError.period) return
  emit('submit', {
    licensePlate: form.licensePlate.trim(),
    visitorName: form.visitorName.trim(),
    phone: form.phone.trim(),
    visitPurpose: resolveVisitPurpose(),
    startDate: form.startDate,
    endDate: form.endDate,
  })
}
</script>

<template>
  <BaseModal :visible="visible" :title="modalTitle" :subtitle="modalSubtitle" @close="emit('close')">
    <div class="regular-form">
      <!-- 차량번호 -->
      <div class="regular-form__field">
        <label class="regular-form__label">
          차량번호 <span class="regular-form__required">*</span>
        </label>
        <BaseInput
          v-model="form.licensePlate"
          placeholder="예: 12가 3456"
          :disabled="!isCreate"
          :error="localError.licensePlate"
        />
        <p v-if="localError.licensePlate" class="regular-form__error">차량번호를 입력해주세요.</p>
        <p v-else-if="!isCreate" class="regular-form__hint">차량번호는 수정할 수 없습니다.</p>
      </div>

      <!-- 방문자 이름 -->
      <div class="regular-form__field">
        <label class="regular-form__label">방문자 이름</label>
        <BaseInput v-model="form.visitorName" placeholder="예: 홍길동" />
      </div>

      <!-- 연락처 -->
      <div class="regular-form__field">
        <label class="regular-form__label">연락처</label>
        <BaseInput v-model="form.phone" placeholder="예: 010-1234-5678" />
      </div>

      <!-- 방문목적 -->
      <div class="regular-form__field">
        <label class="regular-form__label">방문목적</label>
        <select v-model="form.purposeSelect" class="regular-form__select">
          <option value="">방문목적 선택</option>
          <option v-for="purpose in purposePresets" :key="purpose" :value="purpose">{{ purpose }}</option>
          <option :value="purposeCustomValue">직접 입력</option>
        </select>
        <BaseInput
          v-if="form.purposeSelect === purposeCustomValue"
          v-model="form.purposeCustom"
          placeholder="방문 목적을 입력하세요"
        />
      </div>

      <!-- 시작일 -->
      <div class="regular-form__field">
        <label class="regular-form__label">
          시작일 <span class="regular-form__required">*</span>
        </label>
        <BaseInput v-model="form.startDate" type="date" :error="localError.startDate || localError.period" />
        <p v-if="localError.startDate" class="regular-form__error">시작일을 선택해주세요.</p>
      </div>

      <!-- 종료일 -->
      <div class="regular-form__field">
        <label class="regular-form__label">
          종료일 <span class="regular-form__required">*</span>
        </label>
        <BaseInput v-model="form.endDate" type="date" :error="localError.endDate || localError.period" />
        <p v-if="localError.endDate" class="regular-form__error">종료일을 선택해주세요.</p>
        <p v-else-if="localError.period" class="regular-form__error">종료일은 시작일과 같거나 이후여야 합니다.</p>
      </div>

      <!-- 서버 오류 안내 -->
      <p v-if="errorMessage" class="regular-form__error">{{ errorMessage }}</p>

      <!-- 필수 항목 안내 -->
      <p class="regular-form__required-note">
        <span class="regular-form__required">*</span> 표시는 필수 입력 항목입니다.
      </p>
    </div>

    <template #footer>
      <button type="button" class="regular-form__cancel" @click="emit('close')">취소</button>
      <button
        type="button"
        class="regular-form__submit"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '처리 중...' : submitLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.regular-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 4px;
  padding: 16px 0 8px;
  border-top: 1px solid var(--color-border);
}

.regular-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.regular-form__label {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.regular-form__required {
  color: var(--color-danger);
}

.regular-form__select {
  width: 100%;
  min-height: 44px;
  padding: 0 var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
}

.regular-form__error {
  margin: 0;
  font-size: 12px;
  color: var(--color-danger);
}

.regular-form__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.regular-form__required-note {
  margin: 4px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.regular-form__cancel,
.regular-form__submit {
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.regular-form__cancel {
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #718096;
}

.regular-form__cancel:hover {
  background: #F8FAFC;
}

.regular-form__submit {
  border: none;
  background: var(--resident-primary);
  color: #FFFFFF;
}

.regular-form__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
