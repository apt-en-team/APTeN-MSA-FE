<script setup>
// 관리자 대시보드 대표 페이지입니다.
</script>

<template>
  <section class="admin-page">
    <header class="admin-page__header">
      <div>
        <h1 class="admin-page__title">대시보드</h1>
        <p class="admin-page__description">관리자 운영에 필요한 핵심 현황을 모아 보여줄 대표 대시보드를 준비하고 있습니다.</p>
      </div>
    </header>

    <section class="admin-page__card">
      <strong class="admin-page__card-title">준비 중</strong>
      <p class="admin-page__card-text">차량, 세대, 시설, 예약 요약 정보를 이 페이지에서 순차적으로 연결할 예정입니다.</p>
    </section>
  </section>
</template>

<style scoped>
.admin-page {
  display: grid;
  gap: 20px;
}

.admin-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-page__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
  font-weight: 700;
}

.admin-page__description {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.admin-page__card {
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-card-bg);
  box-shadow: var(--shadow-card);
}

.admin-page__card-title {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-primary);
  font-size: 18px;
}

.admin-page__card-text {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}
</style>
