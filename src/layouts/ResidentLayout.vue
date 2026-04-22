<script setup>
// TODO: 입주민 모바일 전용 헤더와 하단 내비게이션 레이아웃을 구성합니다.
import AppHeader from '@/components/resident/AppHeader.vue'
import BottomNav from '@/components/resident/BottomNav.vue'
</script>

<template>
  <div class="resident-layout">
    <AppHeader />
    <main class="resident-layout__main">
      <RouterView />
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.resident-layout {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.resident-layout__main {
  flex: 1;
  padding: 16px;
}
</style>
