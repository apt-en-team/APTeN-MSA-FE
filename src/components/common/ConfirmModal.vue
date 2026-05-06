<script setup>
// 1차 확인 모달 스타일을 2차 BaseModal 위에 맞춘 확인 모달이다.
import BaseModal from '@/components/common/BaseModal.vue'

// 확인 모달에 표시할 문구와 버튼 상태를 props로 받는다.
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '확인하시겠습니까?',
  },
  subtitle: {
    type: String,
    default: '',
  },
  subtitleColor: {
    type: String,
    default: '#757575',
  },
  itemName: {
    type: String,
    default: '',
  },
  itemLabel: {
    type: String,
    default: '',
  },
  actionLabel: {
    type: String,
    default: '',
  },
  actionText: {
    type: String,
    default: '',
  },
  extraValue: {
    type: String,
    default: '',
  },
  extraLabel: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: '확인',
  },
  cancelText: {
    type: String,
    default: '취소',
  },
  confirmType: {
    type: String,
    default: 'danger',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

// 확인, 취소 동작을 부모 컴포넌트로 전달한다.
defineEmits(['confirm', 'cancel'])
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="title"
    @close="$emit('cancel')"
  >
    <!-- 경고 아이콘과 확인 대상 정보를 묶어서 보여준다. -->
    <div class="confirm-modal">
      <div class="confirm-modal__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V12" stroke="#C08B2D" stroke-width="2.2" stroke-linecap="round" />
          <circle cx="12" cy="16" r="1" fill="#C08B2D" />
          <circle cx="12" cy="12" r="9" stroke="#C08B2D" stroke-width="2" />
        </svg>
      </div>

      <p v-if="subtitle" class="confirm-modal__subtitle" :style="{ color: subtitleColor }">
        {{ subtitle }}
      </p>

      <div v-if="itemName || actionLabel || extraValue" class="confirm-modal__info-box">
        <div v-if="itemName" class="confirm-modal__info-row">
          <span class="confirm-modal__info-label">{{ itemLabel }}</span>
          <span class="confirm-modal__info-value">{{ itemName }}</span>
        </div>
        <div v-if="actionLabel" class="confirm-modal__info-row">
          <span class="confirm-modal__info-label">{{ actionText }}</span>
          <span class="confirm-modal__info-value">{{ actionLabel }}</span>
        </div>
        <div v-if="extraValue" class="confirm-modal__info-row">
          <span class="confirm-modal__info-label">{{ extraLabel }}</span>
          <span class="confirm-modal__info-value">{{ extraValue }}</span>
        </div>
      </div>

      <slot />
    </div>

    <template #footer>
      <!-- 확인과 취소 버튼은 footer slot으로 구성한다. -->
      <button class="confirm-modal__cancel" @click="$emit('cancel')">{{ cancelText }}</button>
      <button
        class="confirm-modal__confirm"
        :class="`is-${confirmType}`"
        :disabled="loading"
        @click="$emit('confirm')"
      >
        {{ loading ? '처리 중...' : confirmText }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-modal {
  text-align: center;
}

.confirm-modal__icon {
  display: flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  border-radius: 999px;
  background: rgba(192, 139, 45, 0.14);
}

.confirm-modal__subtitle {
  margin: 0 0 20px;
  font-size: 13px;
}

.confirm-modal__info-box {
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #F8FAFC;
  overflow: hidden;
  text-align: left;
}

.confirm-modal__info-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #E2E8F0;
}

.confirm-modal__info-row:last-child {
  border-bottom: none;
}

.confirm-modal__info-label {
  color: #94A3B8;
  font-size: 12px;
}

.confirm-modal__info-value {
  color: #1A202C;
  font-size: 13px;
  font-weight: 600;
  text-align: right;
}

.confirm-modal__cancel,
.confirm-modal__confirm {
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border-radius: 7px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.confirm-modal__cancel {
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #718096;
}

.confirm-modal__confirm {
  border: none;
  color: #FFFFFF;
}

.confirm-modal__confirm.is-danger {
  background: #E53E3E;
}

.confirm-modal__confirm.is-success {
  background: #4D8B5A;
}

.confirm-modal__confirm.is-primary {
  background: #2B3A55;
}

.confirm-modal__confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
