<script setup>
// TODO: 관리자 검색 및 필터 바 컴포넌트의 표현용 스타일 구조를 제공합니다.
</script>

<template>
  <div class="admin-filter-bar">
    <div class="admin-filter-bar__control">Search</div>
    <div class="admin-filter-bar__control">Select</div>
    <div class="admin-filter-bar__action">Action</div>
  </div>
</template>

<style scoped>
.admin-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-12);
  margin-bottom: var(--space-20);
}

.admin-filter-bar__control,
.admin-filter-bar__action {
  display: inline-flex;
  min-height: 44px;
  min-width: 120px;
  align-items: center;
  padding: 0 var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background-color: var(--color-card-bg);
  color: var(--color-text-secondary);
}

.admin-filter-bar__action {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
}
</style>
