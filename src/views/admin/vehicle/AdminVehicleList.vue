<script setup>
// 입주민 차량 목록 대표 페이지입니다.
</script>

<template>
  <section class="admin-page">
    <header class="admin-page__header">
      <div>
        <h1 class="admin-page__title">입주민 차량 목록</h1>
        <p class="admin-page__description">등록 차량과 승인 상태를 보여줄 대표 차량 관리 페이지를 준비하고 있습니다.</p>
      </div>
    </header>

    <section class="admin-page__card">
      <strong class="admin-page__card-title">준비 중</strong>
      <p class="admin-page__card-text">차량 목록, 승인, 정책 기능은 이후 실제 흐름 기준으로 다시 연결할 예정입니다.</p>
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
