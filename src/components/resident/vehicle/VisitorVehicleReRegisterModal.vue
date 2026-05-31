<script setup>
// 입주민 방문차량 재등록 바텀시트 모달입니다.
import { reactive, watch } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
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

// 폼 입력값
const form = reactive({
  visitDate: '',
})

// 방문일 필수 검증 상태
const localError = reactive({
  visitDate: false,
})

// 날짜 문자열을 yyyy.MM.dd 형태로 변환
const formatDate = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

// 모달이 열릴 때 방문일을 초기화한다.
watch(
  () => props.visible,
  (open) => {
    if (!open) return
    form.visitDate = ''
    localError.visitDate = false
  },
)

// 방문일 검증 후 제출 이벤트 전달
const handleSubmit = () => {
  localError.visitDate = !form.visitDate
  if (localError.visitDate) return
  emit('submit', { visitDate: form.visitDate })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="visible" class="rereg-modal">
        <!-- 오버레이 -->
        <div class="rereg-modal__overlay" @click="emit('close')" />

        <!-- 바텀시트 본체 -->
        <div class="rereg-modal__sheet" role="dialog" aria-modal="true">
          <!-- 핸들 바 -->
          <div class="rereg-modal__handle" />

          <!-- 제목 / 안내 -->
          <h2 class="rereg-modal__title">방문차량 재등록</h2>
          <p class="rereg-modal__subtitle">기존 정보를 그대로 사용하고 방문일만 다시 입력해주세요.</p>

          <!-- 원본 차량 정보 읽기전용 -->
          <div class="rereg-modal__info">
            <div class="rereg-modal__info-row">
              <span class="rereg-modal__info-label">차량번호</span>
              <span class="rereg-modal__info-value">{{ vehicle?.licensePlate || '-' }}</span>
            </div>
            <div class="rereg-modal__info-row">
              <span class="rereg-modal__info-label">방문자</span>
              <span class="rereg-modal__info-value">{{ vehicle?.visitorName || '-' }}</span>
            </div>
            <div class="rereg-modal__info-row">
              <span class="rereg-modal__info-label">연락처</span>
              <span class="rereg-modal__info-value">{{ vehicle?.phone || '-' }}</span>
            </div>
            <div class="rereg-modal__info-row">
              <span class="rereg-modal__info-label">방문목적</span>
              <span class="rereg-modal__info-value">{{ vehicle?.visitPurpose || '-' }}</span>
            </div>
            <div class="rereg-modal__info-row">
              <span class="rereg-modal__info-label">이전 방문일</span>
              <span class="rereg-modal__info-value">{{ formatDate(vehicle?.visitDate) }}</span>
            </div>
          </div>

          <!-- 방문예정일 입력 -->
          <div class="rereg-modal__field">
            <label class="rereg-modal__field-label">
              방문예정일 <span class="rereg-modal__required">*</span>
            </label>
            <BaseInput v-model="form.visitDate" type="date" :error="localError.visitDate" />
            <p v-if="localError.visitDate" class="rereg-modal__error">방문예정일을 선택해주세요.</p>
          </div>

          <!-- 서버 오류 안내 -->
          <p v-if="errorMessage" class="rereg-modal__error">{{ errorMessage }}</p>

          <!-- 재등록 버튼 -->
          <button class="rereg-modal__btn" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? '처리 중...' : '재등록하기' }}
          </button>

          <!-- 취소 버튼 -->
          <button class="rereg-modal__cancel" @click="emit('close')">취소</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.rereg-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* 오버레이 */
.rereg-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

/* 바텀시트 */
.rereg-modal__sheet {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  padding: 12px 24px 40px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

/* 핸들 */
.rereg-modal__handle {
  width: 36px;
  height: 4px;
  border-radius: 99px;
  background: #e2e8f0;
  margin: 0 auto 8px;
}

/* 텍스트 */
.rereg-modal__title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  text-align: center;
  margin: 0;
}

.rereg-modal__subtitle {
  font-size: 13px;
  color: #718096;
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

/* 원본 정보 */
.rereg-modal__info {
  width: 100%;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 8px;
}

.rereg-modal__info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 16px;
  border-bottom: 1px solid #e8edf5;
}

.rereg-modal__info-row:last-child {
  border-bottom: none;
}

.rereg-modal__info-label {
  font-size: 13px;
  color: #94a3b8;
}

.rereg-modal__info-value {
  font-size: 13px;
  font-weight: 600;
  color: #1a202c;
}

/* 방문일 입력 */
.rereg-modal__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.rereg-modal__field-label {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
}

.rereg-modal__required {
  color: var(--color-danger);
}

.rereg-modal__error {
  margin: 0;
  font-size: 12px;
  color: #e53e3e;
}

/* 재등록 버튼 */
.rereg-modal__btn {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  background: var(--resident-primary);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  margin-top: 8px;
}

.rereg-modal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 취소 버튼 */
.rereg-modal__cancel {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #718096;
  font-size: 14px;
  cursor: pointer;
}

/* 트랜지션 */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s;
}

.sheet-enter-active .rereg-modal__sheet,
.sheet-leave-active .rereg-modal__sheet {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .rereg-modal__sheet,
.sheet-leave-to .rereg-modal__sheet {
  transform: translateY(100%);
}
</style>
