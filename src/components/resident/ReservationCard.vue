<script setup>
// TODO: 입주민 예약 카드 컴포넌트의 표현용 스타일 구조를 제공합니다.
</script>

<template>
  <div class="reservation-card">
    <div class="reservation-card__top">
      <strong class="reservation-card__title">Reservation Title</strong>
      <span class="reservation-card__status status-success">Confirmed</span>
    </div>
    <div class="reservation-card__time">00:00 - 00:00</div>
    <div class="reservation-card__meta">Reservation Summary</div>
  </div>
</template>

<style scoped>
.reservation-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: var(--space-16);
  border: 1px solid rgba(73, 115, 229, 0.12);
  border-radius: var(--radius-12);
  background-color: var(--color-card-bg);
  box-shadow: var(--shadow-small);
}

.reservation-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
}

.reservation-card__title {
  font-size: var(--font-size-body-sm);
}

.reservation-card__time {
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--color-text-primary);
}

.reservation-card__meta,
.reservation-card__status {
  font-size: var(--font-size-detail);
}
</style>
