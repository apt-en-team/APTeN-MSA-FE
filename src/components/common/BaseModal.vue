<script setup>
// TODO: 공통 모달 컴포넌트의 표현용 스타일 구조를 제공합니다.
defineProps({
  visible: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: 'Modal Title',
  },
})

const emit = defineEmits(['close'])
</script>

<template>
  <div v-if="visible" class="base-modal">
    <div class="base-modal__overlay" @click="emit('close')" />
    <div class="base-modal__content" role="dialog" aria-modal="true">
      <div class="base-modal__header">
        <strong class="base-modal__title">{{ title }}</strong>
        <button type="button" class="base-modal__close" @click="emit('close')">Close</button>
      </div>
      <div class="base-modal__body modal-section">
        <slot>Modal Content</slot>
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
  width: min(100%, 480px);
  border-radius: var(--radius-12);
  background-color: var(--color-card-bg);
  box-shadow: var(--shadow-large);
}

.base-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  padding: var(--space-20) var(--space-20) 0;
}

.base-modal__title {
  font-size: var(--font-size-modal-title);
  color: var(--color-text-primary);
}

.base-modal__close {
  color: var(--color-text-secondary);
  cursor: pointer;
}

.base-modal__body {
  padding-inline: var(--space-20);
  padding-top: 0;
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}
</style>
