<script setup>
// TODO: 입주민 차량 카드 컴포넌트의 표현용 스타일 구조를 제공합니다.
</script>

<template>
  <div class="vehicle-card">
    <div class="vehicle-card__top">
      <strong class="vehicle-card__number">12가 3456</strong>
      <span class="vehicle-card__status status-neutral">Pending</span>
    </div>
    <div class="vehicle-card__meta">Vehicle Info</div>
  </div>
</template>

<style scoped>
.vehicle-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: var(--space-16);
  border: 1px solid rgba(73, 115, 229, 0.12);
  border-radius: var(--radius-12);
  background-color: var(--color-card-bg);
  box-shadow: var(--shadow-small);
}

.vehicle-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
}

.vehicle-card__number {
  font-size: var(--font-size-body);
}

.vehicle-card__meta,
.vehicle-card__status {
  font-size: var(--font-size-detail);
}
</style>
