<script setup>
// TODO: 관리자 웹 전용 사이드바와 헤더 레이아웃을 구성합니다.
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-layout__sidebar">
      <div>Admin Sidebar</div>
    </aside>
    <div class="admin-layout__content">
      <header class="admin-layout__header">
        <div>Admin Header</div>
      </header>
      <main class="admin-layout__main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-layout__sidebar {
  width: 240px;
  padding: 16px;
  border-right: 1px solid #e5e7eb;
}

.admin-layout__content {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.admin-layout__header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.admin-layout__main {
  flex: 1;
  padding: 16px;
}
</style>
