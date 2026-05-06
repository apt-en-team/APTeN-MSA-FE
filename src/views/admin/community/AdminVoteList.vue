<script setup>
// 투표 관리 대표 페이지입니다.
</script>

<template>
  <section class="admin-page">
    <header class="admin-page__header">
      <div>
        <h1 class="admin-page__title">투표 관리</h1>
        <p class="admin-page__description">투표 생성, 진행 현황, 결과 정리 기능을 이 페이지에서 다시 단계적으로 구현할 예정입니다.</p>
      </div>
    </header>

    <section class="admin-page__card">
      <strong class="admin-page__card-title">준비 중</strong>
      <p class="admin-page__card-text">대표 투표 관리 페이지를 기준으로 목록과 운영 기능을 다시 연결할 예정입니다.</p>
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
