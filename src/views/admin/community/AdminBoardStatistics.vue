<script setup>
// 게시판 통계 대표 페이지입니다.
</script>

<template>
  <section class="admin-page">
    <header class="admin-page__header">
      <div>
        <h1 class="admin-page__title">게시판 통계</h1>
        <p class="admin-page__description">공지, 투표, 게시판 이용 지표를 보여줄 통계 대시보드를 이 페이지에서 준비하고 있습니다.</p>
      </div>
    </header>

    <section class="admin-page__card">
      <strong class="admin-page__card-title">준비 중</strong>
      <p class="admin-page__card-text">게시글 수, 참여율, 공지 노출 현황 같은 핵심 지표를 여기에 연결할 예정입니다.</p>
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
