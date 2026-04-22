<script setup>
// TODO: 관리자 웹 전용 테마 레이아웃 구조를 구성합니다.
</script>

<template>
  <div class="admin-layout theme-admin theme-page-bg">
    <aside class="admin-layout__sidebar theme-sidebar">
      <div class="admin-layout__brand">APT-EN Admin</div>
      <ul class="admin-layout__nav">
        <li>Dashboard</li>
        <li>Management</li>
        <li>Settings</li>
      </ul>
    </aside>
    <div class="admin-layout__content">
      <header class="admin-layout__header">
        <div class="admin-layout__header-title">Admin Workspace</div>
      </header>
      <main class="admin-layout__main">
        <div class="page-container">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg-app);
}

.admin-layout__sidebar {
  width: 240px;
  padding: var(--space-24) var(--space-20);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.08);
}

.admin-layout__brand {
  margin-bottom: var(--space-24);
  font-size: var(--font-size-body);
  font-weight: 700;
}

.admin-layout__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  color: rgba(255, 255, 255, 0.82);
}

.admin-layout__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.admin-layout__header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  min-height: 72px;
  padding: 0 var(--space-32);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-header-bg);
  backdrop-filter: blur(10px);
}

.admin-layout__header-title {
  font-size: var(--font-size-body);
  font-weight: 700;
}

.admin-layout__main {
  flex: 1;
}

@media (max-width: 1024px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-layout__sidebar {
    width: 100%;
  }
}
</style>
