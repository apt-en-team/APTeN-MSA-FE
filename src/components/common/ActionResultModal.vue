<script setup>
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
    <div class="result-modal">
      <!-- 처리 결과 타입에 따라 아이콘 색상을 다르게 표시한다. -->
      <div
        class="result-modal__icon"
        :class="{
          'is-success': type === 'success',
          'is-danger': type === 'danger',
          'is-warning': type === 'warning',
        }"
      >
        <svg v-if="type === 'success'" width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13L9 17L19 7"
            stroke="#4D8B5A"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <svg v-else-if="type === 'danger'" width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="#E53E3E"
            stroke-width="2.2"
            stroke-linecap="round"
          />
        </svg>

        <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 8V12"
            stroke="#C08B2D"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <circle cx="12" cy="16" r="1" fill="#C08B2D" />
          <circle cx="12" cy="12" r="9" stroke="#C08B2D" stroke-width="2" />
        </svg>
      </div>

      <!-- 결과 안내 문구 -->
      <h3 class="result-modal__title">{{ title }}</h3>
      <p v-if="subtitle" class="result-modal__subtitle">{{ subtitle }}</p>
      <p v-if="desc" class="result-modal__desc">{{ desc }}</p>

      <!-- 처리 상세 정보 -->
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
      <div class="result-modal__footer">
        <button class="result-modal__confirm" type="button" @click="$emit('close')">
          {{ confirmText }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.result-modal {
  width: 360px;
  max-width: 100%;
  margin: 0 auto;
  padding: 8px 0 4px;
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
}

.result-modal__icon {
  display: flex;
  width: 64px;
  height: 64px;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  border-radius: 999px;
}

.result-modal__icon.is-success {
  background: rgba(80, 200, 120, 0.18);
}

.result-modal__icon.is-danger {
  background: rgba(229, 62, 62, 0.12);
}

.result-modal__icon.is-warning {
  background: rgba(245, 166, 35, 0.16);
}

.result-modal__title {
  margin: 0 0 8px;
  color: #1A202C;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.result-modal__subtitle {
  margin: 0;
  color: #757575;
  font-size: 13px;
  line-height: 1.5;
}

.result-modal__desc {
  margin: 4px 0 0;
  color: #A0AEC0;
  font-size: 12px;
  line-height: 1.5;
}

.result-modal__info-box {
  width: 100%;
  margin-top: 18px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  background: #F8FAFC;
  overflow: hidden;
  text-align: left;
}

.result-modal__info-row {
  display: grid;
  grid-template-columns: 86px 1fr;
  gap: 10px;
  min-height: 38px;
  padding: 10px 14px;
  border-bottom: 1px solid #E2E8F0;
  align-items: center;
}

.result-modal__info-row:last-child {
  border-bottom: none;
}

.result-modal__info-label {
  color: #94A3B8;
  font-size: 12px;
  font-weight: 500;
}

.result-modal__info-value {
  color: #1A202C;
  font-size: 13px;
  font-weight: 700;
  text-align: right;
  word-break: keep-all;
}

.result-modal__footer {
  display: flex;
  justify-content: center;
  width: 100%;
}

.result-modal__confirm {
  min-width: 88px;
  height: 36px;
  padding: 0 22px;
  border: none;
  border-radius: 7px;
  background: #2B3A55;
  color: #FFFFFF;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.result-modal__confirm:hover {
  background: #1E2A3E;
}

@media (max-width: 480px) {
  .result-modal {
    width: 100%;
  }

  .result-modal__title {
    font-size: 17px;
  }

  .result-modal__info-row {
    grid-template-columns: 76px 1fr;
    padding: 9px 12px;
  }
}
</style>