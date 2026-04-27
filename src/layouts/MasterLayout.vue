<script setup>
// TODO: MASTER 전용 단지 관리 레이아웃입니다.
</script>

<template>
  <div class="master-layout theme-admin theme-page-bg">
    <aside class="master-layout__sidebar theme-sidebar">
      <div class="master-layout__brand">APT-EN Master</div>
      <ul class="master-layout__nav">
        <li><RouterLink to="/admin/master/complexes">전체 단지 관리</RouterLink></li>
        <li><RouterLink to="/admin/master/complexes/create">단지 등록</RouterLink></li>
        <li><RouterLink to="/admin/master/complexes">단지 관리자 배정</RouterLink></li>
      </ul>
    </aside>
    <div class="master-layout__content">
      <header class="master-layout__header">MASTER Complex Management</header>
      <main class="master-layout__main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.master-layout {
  display: flex;
  min-height: 100vh;
}

.master-layout__sidebar {
  width: 280px;
  padding: var(--space-24);
}

.master-layout__brand {
  margin-bottom: var(--space-20);
  font-weight: 700;
}

.master-layout__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.master-layout__content {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.master-layout__header {
  padding: var(--space-20) var(--space-32);
  border-bottom: 1px solid var(--color-border);
  font-weight: 700;
}

.master-layout__main {
  flex: 1;
  padding: var(--space-20) var(--space-32);
}
</style>
