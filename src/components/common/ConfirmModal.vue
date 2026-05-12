<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

// 확인 모달에 표시할 문구와 버튼 상태를 props로 받는다.
const props = defineProps({
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

// 확인 타입에 따라 모달 아이콘 스타일을 결정한다.
const modalType = computed(() => {
  if (props.confirmType === 'danger') return 'danger'
  if (props.confirmType === 'success') return 'success'
  return 'primary'
})

// 정보 카드 표시 여부를 결정한다.
const hasInfo = computed(() => {
  return props.itemName || props.actionLabel || props.extraValue
})
</script>

<template>
  <BaseModal
    :visible="visible"
    :title="title"
    :hide-header="true"
    @close="$emit('cancel')"
  >
    <div class="confirm-modal">
      <!-- 타입별 아이콘 -->
      <div
        class="confirm-modal__icon"
        :class="{
          'is-primary': modalType === 'primary',
          'is-success': modalType === 'success',
          'is-danger': modalType === 'danger',
        }"
      >
        <svg v-if="modalType === 'success'" width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13L9 17L19 7"
            stroke="#2FBF71"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <svg v-else-if="modalType === 'danger'" width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 7V13"
            stroke="#E53E3E"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <circle cx="12" cy="17" r="1.2" fill="#E53E3E" />
        </svg>

        <svg v-else width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 7V13"
            stroke="#C08B2D"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <circle cx="12" cy="17" r="1.2" fill="#C08B2D" />
        </svg>
      </div>

      <!-- 제목/설명 -->
      <h3 class="confirm-modal__title">{{ title }}</h3>
      <p
        v-if="subtitle"
        class="confirm-modal__subtitle"
        :style="{ color: subtitleColor }"
      >
        {{ subtitle }}
      </p>

      <!-- 확인 대상 카드 -->
      <div
        v-if="hasInfo"
        class="confirm-modal__info-card"
        :class="{
          'is-primary': modalType === 'primary',
          'is-success': modalType === 'success',
          'is-danger': modalType === 'danger',
        }"
      >
        <div class="confirm-modal__info-main">
          <span
            class="confirm-modal__info-icon"
            :class="{
              'is-primary': modalType === 'primary',
              'is-success': modalType === 'success',
              'is-danger': modalType === 'danger',
            }"
          >
            <svg v-if="modalType === 'danger'" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 7H18" stroke="#E53E3E" stroke-width="2" stroke-linecap="round" />
              <path d="M9 7V5H15V7" stroke="#E53E3E" stroke-width="2" stroke-linecap="round" />
              <path d="M9 10V18M15 10V18" stroke="#E53E3E" stroke-width="1.8" stroke-linecap="round" />
              <path d="M7 7L8 20H16L17 7" stroke="#E53E3E" stroke-width="1.8" stroke-linejoin="round" />
            </svg>

            <svg v-else-if="modalType === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 13L9 17L19 7" stroke="#2FBF71" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 7V13" stroke="#C08B2D" stroke-width="2" stroke-linecap="round" />
              <circle cx="12" cy="17" r="1.1" fill="#C08B2D" />
            </svg>
          </span>

          <div class="confirm-modal__info-copy">
            <div class="confirm-modal__info-title-row">
              <span v-if="itemLabel" class="confirm-modal__info-label">{{ itemLabel }}</span>
              <strong v-if="itemName" class="confirm-modal__info-title">{{ itemName }}</strong>
              <span
                v-if="actionLabel"
                class="confirm-modal__badge"
                :class="{
                  'is-primary': modalType === 'primary',
                  'is-success': modalType === 'success',
                  'is-danger': modalType === 'danger',
                }"
              >
                {{ actionLabel }}
              </span>
            </div>

            <p v-if="actionText || extraValue" class="confirm-modal__info-desc">
              <span v-if="actionText">{{ actionText }}</span>
              <span v-if="actionText && extraValue"> · </span>
              <span v-if="extraValue">
                <template v-if="extraLabel">{{ extraLabel }} </template>{{ extraValue }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <slot />
    </div>

    <template #footer>
      <!-- BaseModal footer의 우측 정렬을 그대로 사용한다. -->
      <button class="confirm-modal__cancel" type="button" @click="$emit('cancel')">
        {{ cancelText }}
      </button>
      <button
        class="confirm-modal__confirm"
        type="button"
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
  padding: 8px 0 4px;
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
}

.confirm-modal__icon {
  display: flex;
  width: 68px;
  height: 68px;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  border-radius: 999px;
}

.confirm-modal__icon.is-primary {
  background: rgba(192, 139, 45, 0.14);
}

.confirm-modal__icon.is-success {
  background: rgba(47, 191, 113, 0.16);
}

.confirm-modal__icon.is-danger {
  background: rgba(229, 62, 62, 0.12);
}

.confirm-modal__title {
  margin: 0;
  color: #1A202C;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: -0.02em;
}

.confirm-modal__subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.5;
}

.confirm-modal__info-card {
  margin-top: 20px;
  padding: 16px;
  border-radius: 10px;
  background: #F8FAFC;
  text-align: left;
  border-left: 4px solid #C08B2D;
}

.confirm-modal__info-card.is-primary {
  background: rgba(192, 139, 45, 0.08);
  border-left-color: #C08B2D;
}

.confirm-modal__info-card.is-success {
  background: rgba(47, 191, 113, 0.08);
  border-left-color: #2FBF71;
}

.confirm-modal__info-card.is-danger {
  background: rgba(229, 62, 62, 0.07);
  border-left-color: #E53E3E;
}

.confirm-modal__info-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.confirm-modal__info-icon {
  display: flex;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.confirm-modal__info-icon.is-primary {
  background: rgba(192, 139, 45, 0.14);
}

.confirm-modal__info-icon.is-success {
  background: rgba(47, 191, 113, 0.14);
}

.confirm-modal__info-icon.is-danger {
  background: rgba(229, 62, 62, 0.12);
}

.confirm-modal__info-copy {
  min-width: 0;
  flex: 1;
}

.confirm-modal__info-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.confirm-modal__info-label {
  flex-shrink: 0;
  color: #94A3B8;
  font-size: 12px;
  font-weight: 600;
}

.confirm-modal__info-title {
  color: #1A202C;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.confirm-modal__badge {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.confirm-modal__badge.is-primary {
  background: rgba(192, 139, 45, 0.16);
  color: #A66E13;
}

.confirm-modal__badge.is-success {
  background: rgba(47, 191, 113, 0.16);
  color: #2F855A;
}

.confirm-modal__badge.is-danger {
  background: rgba(229, 62, 62, 0.12);
  color: #E53E3E;
}

.confirm-modal__info-desc {
  margin: 4px 0 0;
  color: #718096;
  font-size: 12px;
  line-height: 1.5;
}

.confirm-modal__cancel,
.confirm-modal__confirm {
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border-radius: 7px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.confirm-modal__cancel {
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #718096;
}

.confirm-modal__cancel:hover {
  background: #F8FAFC;
}

.confirm-modal__confirm {
  border: none;
  color: #FFFFFF;
  background: #1A202C;
}

.confirm-modal__confirm.is-danger {
  background: #E53E3E;
}

.confirm-modal__confirm.is-danger:hover {
  background: #C53030;
}

.confirm-modal__confirm.is-success {
  background: #4D8B5A;
}

.confirm-modal__confirm.is-success:hover {
  background: #3D7449;
}

.confirm-modal__confirm.is-primary {
  background: #1E2A3E;
}

.confirm-modal__confirm.is-primary:hover {
  background: #152130;
}

.confirm-modal__confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>