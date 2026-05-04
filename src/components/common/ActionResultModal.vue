<script setup>
// 1차 결과 안내 스타일을 2차 BaseModal 위에 맞춘 결과 모달이다.
import BaseModal from '@/components/common/BaseModal.vue'

// 처리 결과 상태와 안내 문구를 props로 받는다.
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  desc: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'success',
  },
  itemName: {
    type: String,
    default: '',
  },
  time: {
    type: String,
    default: '',
  },
  actionLabel: {
    type: String,
    default: '',
  },
  actor: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: '확인',
  },
})

// 결과 모달 닫기 이벤트를 부모 컴포넌트로 전달한다.
defineEmits(['close'])
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="title"
    :subtitle="subtitle"
    :hide-header="true"
    @close="$emit('close')"
  >
    <!-- 처리 결과 타입에 따라 아이콘과 안내 문구를 표시한다. -->
    <div class="result-modal">
      <div
        class="result-modal__icon"
        :class="{
          'is-success': type === 'success',
          'is-danger': type === 'danger',
          'is-warning': type === 'warning',
        }"
      >
        <svg v-if="type === 'success'" width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M5 13L9 17L19 7" stroke="#4D8B5A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else-if="type === 'danger'" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="#E53E3E" stroke-width="2.2" stroke-linecap="round" />
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V12" stroke="#C08B2D" stroke-width="2.2" stroke-linecap="round" />
          <circle cx="12" cy="16" r="1" fill="#C08B2D" />
          <circle cx="12" cy="12" r="9" stroke="#C08B2D" stroke-width="2" />
        </svg>
      </div>

      <h3 class="result-modal__title">{{ title }}</h3>
      <p v-if="subtitle" class="result-modal__subtitle">{{ subtitle }}</p>
      <p v-if="desc" class="result-modal__desc">{{ desc }}</p>

      <div v-if="itemName || time || actionLabel || actor" class="result-modal__info-box">
        <div v-if="itemName" class="result-modal__info-row">
          <span class="result-modal__info-label">처리 항목</span>
          <span class="result-modal__info-value">{{ itemName }}</span>
        </div>
        <div v-if="time" class="result-modal__info-row">
          <span class="result-modal__info-label">처리 시각</span>
          <span class="result-modal__info-value">{{ time }}</span>
        </div>
        <div v-if="actionLabel" class="result-modal__info-row">
          <span class="result-modal__info-label">처리 내용</span>
          <span class="result-modal__info-value">{{ actionLabel }}</span>
        </div>
        <div v-if="actor" class="result-modal__info-row">
          <span class="result-modal__info-label">처리자</span>
          <span class="result-modal__info-value">{{ actor }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <!-- 결과 확인 버튼만 단순하게 제공한다. -->
      <button class="result-modal__confirm" @click="$emit('close')">{{ confirmText }}</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.result-modal {
  text-align: center;
}

.result-modal__icon {
  display: flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  border-radius: 999px;
}

.result-modal__icon.is-success {
  background: rgba(77, 139, 90, 0.14);
}

.result-modal__icon.is-danger {
  background: rgba(229, 62, 62, 0.12);
}

.result-modal__icon.is-warning {
  background: rgba(192, 139, 45, 0.14);
}

.result-modal__title {
  margin: 0 0 6px;
  color: #1A202C;
  font-size: 17px;
  font-weight: 700;
}

.result-modal__subtitle {
  margin: 0 0 4px;
  color: #757575;
  font-size: 13px;
}

.result-modal__desc {
  margin: 0 0 16px;
  color: #BDBDBD;
  font-size: 12px;
}

.result-modal__info-box {
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #F8FAFC;
  overflow: hidden;
  text-align: left;
}

.result-modal__info-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #E2E8F0;
}

.result-modal__info-row:last-child {
  border-bottom: none;
}

.result-modal__info-label {
  color: #94A3B8;
  font-size: 12px;
}

.result-modal__info-value {
  color: #1A202C;
  font-size: 13px;
  font-weight: 600;
  text-align: right;
}

.result-modal__confirm {
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 7px;
  background: #2B3A55;
  color: #FFFFFF;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>
