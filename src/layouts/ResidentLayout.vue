<script setup>
// TODO: USER 전용 모바일 레이아웃입니다.
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'
import AppHeader from '@/components/resident/AppHeader.vue'
import BottomNav from '@/components/resident/BottomNav.vue'

const authStore = useAuthStore()
const complexStore = useComplexStore()

// 입주민 레이아웃 진입 시 내 단지 정보를 조회해 features source를 준비한다.
async function ensureResidentComplex() {
  if (!authStore.complexId) return

  const currentComplexId = String(complexStore.residentComplex?.complexId || '')
  const authComplexId = String(authStore.complexId || '')
  const shouldReload =
    !complexStore.residentComplexLoaded || !currentComplexId || currentComplexId !== authComplexId

  if (!shouldReload) return

  try {
    await complexStore.fetchResidentMyComplex()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  ensureResidentComplex()
})

watch(
  () => authStore.complexId,
  () => {
    ensureResidentComplex()
  },
)
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
  background: #EEF3FB; /* 입주민 배경색 */
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
