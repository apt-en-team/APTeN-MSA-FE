<script setup>
// TODO: 공통 버튼 컴포넌트의 표현용 스타일 구조를 제공합니다.
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
  size: {
    type: String,
    default: 'md',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'button',
  },
})

const buttonClass = computed(() => [
  'base-button',
  `base-button--${props.variant}`,
  `base-button--${props.size}`,
  {
    'is-disabled': props.disabled,
  },
])
</script>

<template>
  <button :type="type" :class="buttonClass" :disabled="disabled">
    <slot>Button</slot>
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  min-width: 88px;
  border: 1px solid transparent;
  border-radius: var(--radius-8);
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  line-height: 1;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease;
  cursor: pointer;
}

.base-button--sm {
  min-height: 36px;
  padding: 0 var(--space-12);
}

.base-button--md {
  min-height: 44px;
  padding: 0 var(--space-16);
}

.base-button--lg {
  min-height: 52px;
  padding: 0 var(--space-20);
}

.base-button--primary {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
  box-shadow: var(--shadow-small);
}

.base-button--secondary {
  border-color: var(--color-border);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
}

.base-button--danger {
  background-color: var(--color-danger);
  color: var(--white);
}

.base-button--ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
}

.base-button:focus-visible {
  outline: 0;
  box-shadow: 0 0 0 4px var(--color-focus-ring);
}

.is-disabled,
.base-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: none;
}
</style>
