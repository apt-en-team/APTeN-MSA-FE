<script setup>
// TODO: 공통 페이지네이션 컴포넌트의 표현용 스타일 구조를 제공합니다.
defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 3,
  },
})
</script>

<template>
  <nav class="base-pagination" aria-label="Pagination">
    <button type="button" class="base-pagination__button">Prev</button>
    <div class="base-pagination__pages">
      <span class="base-pagination__page is-active">{{ currentPage }}</span>
      <span class="base-pagination__page">{{ totalPages }}</span>
    </div>
    <button type="button" class="base-pagination__button">Next</button>
  </nav>
</template>

<style scoped>
.base-pagination {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
}

.base-pagination__button,
.base-pagination__page {
  display: inline-flex;
  min-width: 36px;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background-color: var(--color-bg-surface);
  color: var(--color-text-secondary);
}

.base-pagination__pages {
  display: inline-flex;
  gap: var(--space-8);
}

.is-active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 700;
}
</style>
