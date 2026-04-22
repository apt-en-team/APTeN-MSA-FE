<script setup>
// TODO: 관리자 목록형 테이블 컴포넌트의 표현용 스타일 구조를 제공합니다.
</script>

<template>
  <div class="admin-table">
    <div class="admin-table__head">
      <span>Header 1</span>
      <span>Header 2</span>
      <span>Header 3</span>
    </div>
    <div class="admin-table__row">
      <span>Value</span>
      <span>Value</span>
      <span>Value</span>
    </div>
  </div>
</template>

<style scoped>
.admin-table {
  overflow: hidden;
  border: 1px solid var(--color-table-line);
  border-radius: var(--radius-12);
  background-color: var(--color-card-bg);
  font-size: var(--font-size-detail);
  box-shadow: var(--shadow-small);
}

.admin-table__head,
.admin-table__row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-12);
  padding: var(--space-16);
}

.admin-table__head {
  background-color: var(--color-table-head-bg);
  font-weight: 700;
  color: var(--color-text-secondary);
}

.admin-table__row {
  background-color: var(--color-card-bg);
  border-top: 1px solid var(--color-table-line);
}
</style>
