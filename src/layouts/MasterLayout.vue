<script setup>
// TODO: 사이드바 없는 마스터 레이아웃은 단지 선택 홈, 등록, 수정 화면에서 사용합니다.
import { onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'

const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()

// 선택 단지 복구
onMounted(() => {
  complexStore.restoreSelectedComplex()
})

// 로그아웃 후 로그인 화면으로 이동합니다.
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// 마스터 홈으로 이동합니다.
const goHome = () => {
  router.push('/admin/master')
}
</script>

<template>
  <div class="master-layout theme-admin">
    <header class="master-layout__header">
      <button type="button" class="master-layout__brand" @click="goHome">
        <span class="master-layout__brand-icon">A</span>
        <span class="master-layout__brand-copy">
          <strong>아파트엔 마스터</strong>
          <span>MASTER CONSOLE</span>
        </span>
      </button>

      <button type="button" class="master-layout__logout" @click="handleLogout">
        로그아웃
      </button>
    </header>

    <main class="master-layout__main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.master-layout {
  min-height: 100vh;
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.master-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88px;
  padding: 0 32px;
  background: #141E29;
  color: var(--color-white);
}

.master-layout__brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.master-layout__brand-icon {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  font-weight: 700;
}

.master-layout__brand-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.master-layout__brand-copy strong {
  font-size: 18px;
}

.master-layout__brand-copy span {
  color: rgba(255, 255, 255, 0.68);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.master-layout__logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--color-white);
  cursor: pointer;
}

.master-layout__main {
  display: flex;
  justify-content: center;
  padding: 40px 24px 64px;
}
</style>
