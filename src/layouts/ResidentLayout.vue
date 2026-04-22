<script setup>
// TODO: 입주민 모바일 전용 테마 레이아웃 구조를 구성합니다.
import AppHeader from '@/components/resident/AppHeader.vue'
import BottomNav from '@/components/resident/BottomNav.vue'
</script>

<template>
  <div class="resident-layout theme-resident theme-page-bg">
    <div class="resident-layout__shell">
      <AppHeader />
      <main class="resident-layout__main">
        <div class="page-container resident-layout__page">
          <RouterView />
        </div>
      </main>
      <BottomNav />
    </div>
  </div>
</template>

<style scoped>
.resident-layout {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 0;
  background: inherit;
}

.resident-layout__shell {
  display: flex;
  width: 100%;
  max-width: 430px;
  min-height: 100vh;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.56);
  box-shadow: 0 0 0 1px rgba(73, 115, 229, 0.08);
}

.resident-layout__main {
  flex: 1;
  padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
}

.resident-layout__page {
  padding-top: var(--space-16);
  padding-bottom: var(--space-16);
}

@media (min-width: 431px) {
  .resident-layout {
    padding: var(--space-24);
  }

  .resident-layout__shell {
    border-radius: 28px;
    overflow: hidden;
    box-shadow: var(--shadow-large);
  }
}
</style>
