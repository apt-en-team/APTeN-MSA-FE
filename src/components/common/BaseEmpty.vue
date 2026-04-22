<script setup>
// TODO: 공통 빈 상태 컴포넌트의 표현용 스타일 구조를 제공합니다.
</script>

<template>
  <div class="base-empty">
    <slot>No Data</slot>
  </div>
</template>

<style scoped>
.base-empty {
  display: flex;
  min-height: 160px;
  align-items: center;
  justify-content: center;
  padding: var(--space-20);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-12);
  color: var(--color-text-secondary);
  text-align: center;
}
</style>
