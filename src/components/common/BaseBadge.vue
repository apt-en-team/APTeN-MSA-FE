<script setup>
// TODO: 공통 뱃지 컴포넌트의 표현용 스타일 구조를 제공합니다.
defineProps({
  variant: {
    type: String,
    default: 'neutral',
  },
})
</script>

<template>
  <span class="base-badge" :class="`base-badge--${variant}`">
    <slot>Badge</slot>
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px var(--space-8);
  border-radius: 999px;
  font-size: var(--font-size-badge);
  font-weight: 700;
  line-height: 1.4;
}

.base-badge--success {
  background-color: rgba(77, 139, 90, 0.14);
  color: var(--color-success);
}

.base-badge--warning {
  background-color: rgba(245, 166, 35, 0.14);
  color: var(--color-warning);
}

.base-badge--danger {
  background-color: rgba(231, 76, 60, 0.14);
  color: var(--color-danger);
}

.base-badge--neutral {
  background-color: var(--color-bg-muted);
  color: var(--color-neutral);
}
</style>
