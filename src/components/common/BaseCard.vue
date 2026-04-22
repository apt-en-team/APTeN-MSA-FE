<script setup>
// TODO: 공통 카드 컴포넌트의 표현용 스타일 구조를 제공합니다.
defineProps({
  padding: {
    type: String,
    default: 'md',
  },
})
</script>

<template>
  <div class="base-card" :class="`base-card--${padding}`">
    <slot>Card Content</slot>
  </div>
</template>

<style scoped>
.base-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background-color: var(--color-card-bg);
  box-shadow: var(--shadow-small);
}

.base-card--md {
  padding: var(--space-16);
}

.base-card--lg {
  padding: var(--space-20);
}
</style>
