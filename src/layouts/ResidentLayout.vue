<script setup>
// TODO: USER 전용 모바일 레이아웃입니다.
import { onMounted, onUnmounted, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import AppHeader from '@/components/resident/AppHeader.vue'
import BottomNav from '@/components/resident/BottomNav.vue'
import { useRoute } from 'vue-router'
import notificationSocketService from '@/services/notificationSocketService'
import { startForegroundMessageListener } from '@/services/fcmService'

const route = useRoute()

const hideBottomNav = computed(() => {
  return route.path.includes('/board/') && route.params.postId
})

const mainPaddingBottom = computed(() => {
  return hideBottomNav.value ? '0px' : 'calc(88px + env(safe-area-inset-bottom, 0px))'
})

const authStore = useAuthStore()
const complexStore = useComplexStore()


const notificationStore = useNotificationStore()

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

  // 미읽음 수 조회 및 WebSocket 연결
  notificationStore.fetchUnreadCount()
  notificationSocketService.connect()
  // 이미 푸시 토큰을 등록한 사용자는 설정 화면을 다시 열지 않아도 foreground 수신을 준비한다.
  startForegroundMessageListener().catch((error) => console.error('[FCM] foreground listener 초기화 실패', error))
})

onUnmounted(() => {
  // 레이아웃 해제 시 WebSocket 연결 종료
  notificationSocketService.disconnect()
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
      <main class="resident-layout__main" :style="{ paddingBottom: mainPaddingBottom }">
        <div class="page-container resident-layout__page">
          <RouterView />
        </div>
      </main>
      <BottomNav v-if="!hideBottomNav" />
    </div>
  </div>
</template>

<style scoped>
.preview-banner {
  position: sticky;
  top: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #1a202c;
  color: #fff;
  font-size: 12px;
  font-family: 'Noto Sans KR', sans-serif;
}

.preview-banner__label {
  font-weight: 700;
}

.preview-banner__complex {
  flex: 1;
  color: #a0aec0;
}

.preview-banner__exit {
  padding: 4px 12px;
  border: 1px solid #4a5568;
  border-radius: 6px;
  background: transparent;
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
}

.preview-banner__exit:hover {
  background: #2d3748;
}

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
