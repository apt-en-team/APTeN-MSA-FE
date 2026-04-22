<script setup>
// TODO: 입주민 상단 헤더 컴포넌트의 표현용 스타일 구조를 제공합니다.
defineProps({
  title: {
    type: String,
    default: 'APT-EN',
  },
})
</script>

<template>
  <header class="app-header">
    <strong class="app-header__title">{{ title }}</strong>
    <div class="app-header__action">
      <slot name="action">Action</slot>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-16);
  border-bottom: 1px solid rgba(73, 115, 229, 0.12);
  background-color: var(--color-header-bg);
  backdrop-filter: blur(12px);
}

.app-header__title {
  font-size: var(--font-size-body);
  font-weight: 700;
}

.app-header__action {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}
</style>
