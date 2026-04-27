<script setup>
// TODO: ADMIN과 MASTER가 함께 사용하는 관리자 레이아웃입니다.
import { computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()

const isMaster = computed(() => authStore.role === 'MASTER')
</script>

<template>
  <div class="admin-layout theme-admin theme-page-bg">
    <aside class="admin-layout__sidebar theme-sidebar">
      <div class="admin-layout__brand">APT-EN Admin</div>
      <ul class="admin-layout__nav">
        <li><RouterLink to="/admin/dashboard">대시보드</RouterLink></li>
        <li><RouterLink to="/admin/households">세대 관리</RouterLink></li>
        <li><RouterLink to="/admin/vehicles">차량 관리</RouterLink></li>
        <li><RouterLink to="/admin/visitor-vehicles">방문차량 관리</RouterLink></li>
        <li><RouterLink to="/admin/vehicle-policies">주차 관리</RouterLink></li>
        <li><RouterLink to="/admin/bills">관리비 관리</RouterLink></li>
        <li><RouterLink to="/admin/notices">게시판 관리</RouterLink></li>
        <li><RouterLink to="/admin/notices">공지사항 관리</RouterLink></li>
        <li><RouterLink to="/admin/votes">투표 관리</RouterLink></li>
        <li><RouterLink to="/admin/facilities">시설 관리</RouterLink></li>
        <li><RouterLink to="/admin/reservations">예약 관리</RouterLink></li>
        <li><RouterLink to="/admin/gx-programs">GX 프로그램 관리</RouterLink></li>
        <li><RouterLink to="/admin/chatbot/faqs">챗봇 관리</RouterLink></li>
        <li v-if="isMaster"><RouterLink to="/admin/master/complexes">전체 단지 관리</RouterLink></li>
        <li v-if="isMaster"><RouterLink to="/admin/master/complexes/create">단지 등록</RouterLink></li>
        <li v-if="isMaster"><RouterLink to="/admin/master/complexes">단지 관리자 배정</RouterLink></li>
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
