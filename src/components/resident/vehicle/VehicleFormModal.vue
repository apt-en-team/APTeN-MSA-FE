<script setup>
// 입주민 차량 등록/수정 폼 모달입니다.
import { reactive, computed, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseInput from '@/components/common/BaseInput.vue'

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

// 폼 입력값
const form = reactive({
  licensePlate: '',
  modelName: '',
  isPrimary: false,
})

// 로컬 필수값 검증 상태
const localError = reactive({
  licensePlate: false,
  modelName: false,
})

// 모달이 열릴 때 폼을 초기화한다.
watch(
  () => props.visible,
  (open) => {
    if (!open) return
    form.licensePlate = props.vehicle?.licensePlate ?? ''
    form.modelName = props.vehicle?.modelName ?? ''
    form.isPrimary = props.vehicle?.isPrimary ?? false
    localError.licensePlate = false
    localError.modelName = false
  },
)

// 모달 제목
const modalTitle = computed(() => (isCreate.value ? '내 차량 등록' : '내 차량 수정'))

// 모달 안내 문구
const modalSubtitle = computed(() =>
  isCreate.value ? '새 차량 정보를 입력해주세요.' : '수정할 차량 정보를 입력해주세요.',
)

// 제출 버튼 라벨
const submitLabel = computed(() => (isCreate.value ? '등록하기' : '저장'))

// 필수값 검증 후 제출 이벤트 전달
const handleSubmit = () => {
  localError.licensePlate = isCreate.value && !form.licensePlate.trim()
  localError.modelName = !form.modelName.trim()
  if (localError.licensePlate || localError.modelName) return
  emit('submit', {
    licensePlate: form.licensePlate.trim(),
    modelName: form.modelName.trim(),
    isPrimary: form.isPrimary,
  })
}
</script>

<template>
  <BaseModal :visible="visible" :title="modalTitle" :subtitle="modalSubtitle" @close="emit('close')">
    <div class="vehicle-form">
      <!-- 차량번호 -->
      <div class="vehicle-form__field">
        <label class="vehicle-form__label">
          차량번호 <span class="vehicle-form__required">*</span>
        </label>
        <BaseInput
          v-model="form.licensePlate"
          placeholder="예: 12가 3456"
          :disabled="!isCreate"
          :error="localError.licensePlate || !!errorMessage"
        />
        <p v-if="localError.licensePlate" class="vehicle-form__error">차량번호를 입력해주세요.</p>
        <p v-else-if="errorMessage" class="vehicle-form__error">{{ errorMessage }}</p>
        <p v-else-if="!isCreate" class="vehicle-form__hint">차량번호는 수정할 수 없습니다.</p>
      </div>

      <!-- 차종 -->
      <div class="vehicle-form__field">
        <label class="vehicle-form__label">
          차종 <span class="vehicle-form__required">*</span>
        </label>
        <BaseInput
          v-model="form.modelName"
          placeholder="예: 소나타"
          :error="localError.modelName"
        />
        <p v-if="localError.modelName" class="vehicle-form__error">차종을 입력해주세요.</p>
      </div>

      <!-- 대표 차량 여부 -->
      <label class="vehicle-form__checkbox">
        <input v-model="form.isPrimary" type="checkbox" />
        <span>대표 차량으로 설정</span>
      </label>

      <!-- 필수 항목 안내 -->
      <p class="vehicle-form__required-note">
        <span class="vehicle-form__required">*</span> 표시는 필수 입력 항목입니다.
      </p>
    </div>

    <template #footer>
      <button type="button" class="vehicle-form__cancel" @click="emit('close')">취소</button>
      <button
        type="button"
        class="vehicle-form__submit"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '처리 중...' : submitLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.vehicle-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 4px;
  padding: 16px 0 8px;
  border-top: 1px solid var(--color-border);
}

.vehicle-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vehicle-form__label {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.vehicle-form__required {
  color: var(--color-danger);
}

.vehicle-form__error {
  margin: 0;
  font-size: 12px;
  color: var(--color-danger);
}

.vehicle-form__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.vehicle-form__checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.vehicle-form__checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.vehicle-form__required-note {
  margin: 4px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.vehicle-form__cancel,
.vehicle-form__submit {
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.vehicle-form__cancel {
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #718096;
}

.vehicle-form__cancel:hover {
  background: #F8FAFC;
}

.vehicle-form__submit {
  border: none;
  background: var(--resident-primary);
  color: #FFFFFF;
}

.vehicle-form__submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
