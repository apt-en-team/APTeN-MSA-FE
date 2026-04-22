<script setup>
// TODO: 관리자 통계 카드 컴포넌트의 표현용 스타일 구조를 제공합니다.
</script>

<template>
  <div class="admin-stats-card">
    <span class="admin-stats-card__label">Stats Label</span>
    <strong class="admin-stats-card__value">00</strong>
    <span class="admin-stats-card__meta">Summary</span>
  </div>
</template>

<style scoped>
.admin-stats-card {
  display: flex;
  width: 273px;
  height: 139px;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: var(--space-20);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background-color: var(--color-card-bg);
  box-shadow: var(--shadow-small);
}

.admin-stats-card__label {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

.admin-stats-card__value {
  font-size: var(--font-size-heading-2);
  color: var(--color-text-primary);
}

.admin-stats-card__meta {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}
</style>
