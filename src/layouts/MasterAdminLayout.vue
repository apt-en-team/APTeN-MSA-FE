<script setup>
// TODO: 사이드바 있는 마스터 관리 레이아웃은 선택 단지 대시보드와 관리자 계정 화면에서만 사용합니다.
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()

const complexCode = computed(() => route.params.code)
const selectedComplex = computed(() => complexStore.selectedComplex)

// 선택 단지 복구
onMounted(() => {
  complexStore.restoreSelectedComplex()
})

// 현재 선택 단지명을 관리자형 MASTER 레이아웃에 표시합니다.
const selectedComplexName = computed(() => {
  if (selectedComplex.value?.code === complexCode.value) {
    return selectedComplex.value?.name || '선택 단지'
  }

  return selectedComplex.value?.name || route.params.code || '선택 단지'
})

// 사이드바 있는 마스터 관리 레이아웃과 사이드바 없는 마스터 홈 레이아웃을 구분한다.
const masterAdminMenus = computed(() => {
  if (!complexCode.value) {
    return []
  }

  return [
    { label: '단지 대시보드', to: `/admin/master/complexes/${complexCode.value}/dashboard` },
    { label: '관리자 계정', to: `/admin/master/complexes/${complexCode.value}/admins` },
  ]
})

const isMenuActive = (targetPath) => route.path === targetPath || route.path.startsWith(`${targetPath}/`)

// 로그아웃 후 로그인 화면으로 이동합니다.
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// 마스터 홈으로 이동합니다.
const goToMasterHome = () => {
  router.push('/admin/master')
}

// 입주민 미리보기 이동
const goToResidentPreview = () => {
  if (!complexCode.value) {
    return
  }

  router.push(`/admin/complexes/${complexCode.value}/resident-preview`)
}
</script>

<template>
  <div class="master-admin-layout theme-admin">
    <aside class="master-admin-layout__sidebar">
      <div class="master-admin-layout__brand">
        <p class="master-admin-layout__brand-label">MASTER</p>
        <h1 class="master-admin-layout__brand-title">{{ selectedComplexName }}</h1>
      </div>

      <nav class="master-admin-layout__nav">
        <RouterLink
          v-for="item in masterAdminMenus"
          :key="item.to"
          :to="item.to"
          class="master-admin-layout__nav-link"
          :class="{ 'is-active': isMenuActive(item.to) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="master-admin-layout__sidebar-actions">
        <button type="button" class="master-admin-layout__ghost-button" @click="goToMasterHome">
          단지 선택 홈
        </button>
        <button type="button" class="master-admin-layout__primary-button" @click="goToResidentPreview">
          입주민 미리보기
        </button>
      </div>
    </aside>

    <div class="master-admin-layout__content">
      <header class="master-admin-layout__header">
        <div>
          <p class="master-admin-layout__header-kicker">MASTER MANAGEMENT</p>
          <h2 class="master-admin-layout__header-title">{{ selectedComplexName }}</h2>
        </div>

        <button type="button" class="master-admin-layout__header-button" @click="handleLogout">
          로그아웃
        </button>
      </header>

      <main class="master-admin-layout__main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.master-admin-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.master-admin-layout__sidebar {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 20px;
  background: var(--color-sidebar-bg);
  color: var(--color-sidebar-text);
}

.master-admin-layout__brand {
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.master-admin-layout__brand-label {
  margin: 0 0 8px;
  color: rgba(255, 255, 255, 0.56);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.master-admin-layout__brand-title {
  margin: 0;
  font-size: var(--font-size-heading-3);
}

.master-admin-layout__nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.master-admin-layout__nav-link {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: var(--radius-8);
  color: var(--color-sidebar-text);
  opacity: 0.78;
  text-decoration: none;
}

.master-admin-layout__nav-link.router-link-active,
.master-admin-layout__nav-link.is-active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  opacity: 1;
}

.master-admin-layout__sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.master-admin-layout__content {
  display: flex;
  flex-direction: column;
}

.master-admin-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  padding: 0 32px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-app);
}

.master-admin-layout__header-kicker {
  margin: 0 0 4px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.master-admin-layout__header-title {
  margin: 0;
  font-size: var(--font-size-heading-3);
}

.master-admin-layout__main {
  flex: 1;
  padding: 20px 32px;
}

.master-admin-layout__primary-button,
.master-admin-layout__ghost-button,
.master-admin-layout__header-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-8);
  font: inherit;
  cursor: pointer;
}

.master-admin-layout__primary-button {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.master-admin-layout__ghost-button {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: var(--color-sidebar-text);
}

.master-admin-layout__header-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}
</style>
