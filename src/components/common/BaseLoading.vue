<script setup>
// TODO: 공통 로딩 컴포넌트의 표현용 스타일 구조를 제공합니다.
</script>

<template>
  <div class="base-loading">
    <span class="base-loading__dot" />
    <span>Loading...</span>
  </div>
</template>

<style scoped>
.base-loading {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-16);
  color: var(--color-text-secondary);
}

.base-loading__dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
}
</style>
