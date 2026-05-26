<script setup>
// TODO: 공통 모달 컴포넌트의 표현용 스타일 구조를 제공합니다.
const props = defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: 'Modal Title',
  },
  subtitle: {
    type: String,
    default: '',
  },
  hideHeader: {
    type: Boolean,
    default: false,
  },
  hideFooter: {
    type: Boolean,
    default: false,
  },
  closeOnOverlay: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])

// 오버레이 클릭 시 필요할 때만 모달을 닫습니다.
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    emit('close')
  }
}
</script>

<template>
  <div v-if="visible" class="base-modal">
    <div class="base-modal__overlay" @click="handleOverlayClick" />
    <div class="base-modal__content" role="dialog" aria-modal="true">
      <div v-if="!hideHeader" class="base-modal__header">
        <div class="base-modal__header-copy">
          <strong class="base-modal__title">{{ title }}</strong>
          <p v-if="subtitle" class="base-modal__subtitle">{{ subtitle }}</p>
        </div>
        <button type="button" class="base-modal__close" @click="emit('close')">X</button>
      </div>
      <div class="base-modal__body modal-section">
        <slot>Modal Content</slot>
      </div>
      <div v-if="!hideFooter" class="base-modal__footer">
        <slot name="footer">
          <button type="button" class="base-modal__action" @click="emit('close')">확인</button>
        </slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.base-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-20);
}

.base-modal__overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.44);
}

.base-modal__content {
  position: relative;
  width: min(100%, 560px);
  border-radius: var(--radius-12);
  background-color: var(--color-card-bg);
  box-shadow: var(--shadow-large);
}

.base-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-12);
  padding: var(--space-16) var(--space-20) ;
}

.base-modal__header-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.base-modal__title {
  font-size: 24px;
  color: var(--color-text-primary);
}

.base-modal__subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.base-modal__close {
  color: var(--color-text-secondary);
  cursor: pointer;
}

.base-modal__body {
  padding-inline: var(--space-20);
  padding-top: 10px;
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.base-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-8);
  padding: 0 var(--space-20) var(--space-20);
}

.base-modal__action {
  min-width: 88px;
  height: 40px;
  padding: 0 var(--space-16);
  border-radius: var(--radius-8);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  cursor: pointer;
}
</style>
