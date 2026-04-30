<script setup>
// TODO: MASTER 전용 단지 관리 레이아웃입니다.
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 선택 단지 상태를 표시하기 위해 단지 store를 사용합니다.
const complexStore = useComplexStore()

// 현재 선택 단지 상태를 화면에 표시합니다.
const selectedComplex = computed(() => complexStore.selectedComplex)

// 선택 단지 존재 여부에 따라 안내 문구와 버튼을 분기합니다.
const hasSelectedComplex = computed(() => !!selectedComplex.value?.code)

// MasterLayout에서 MASTER 전용 네비게이션 처리를 담당합니다.
const masterNavItems = computed(() => {
  const items = [
    { label: '전체 단지 관리', to: '/admin/master/complexes' },
    { label: '단지 등록', to: '/admin/master/complexes/create' },
  ]

  if (selectedComplex.value?.code) {
    items.push({
      label: '선택 단지 대시보드',
      to: `/admin/master/complexes/${selectedComplex.value.code}/dashboard`,
    })
  }

  return items
})

// 선택 단지 기준 MASTER 전용 대시보드 경로를 계산합니다.
const selectedDashboardPath = computed(() => {
  if (!selectedComplex.value?.code) {
    return ''
  }

  return `/admin/master/complexes/${selectedComplex.value.code}/dashboard`
})

// 현재 네비게이션 활성 상태를 비교합니다.
const isNavActive = (targetPath) => {
  return route.path === targetPath || route.path.startsWith(`${targetPath}/`)
}

// 선택 단지 없음 안내는 MASTER 허브에서 책임집니다.
const selectedComplexMessage = computed(() => {
  if (!hasSelectedComplex.value) {
    return '관리할 단지를 먼저 선택해주세요.'
  }

  return `${selectedComplex.value.name} 단지의 MASTER 관리 화면입니다.`
})

// MASTER 전용 대시보드 진입
const goSelectedDashboard = () => {
  if (!selectedDashboardPath.value) {
    router.push('/admin/master/complexes')
    return
  }

  router.push(selectedDashboardPath.value)
}

// 로그아웃 후 로그인 화면으로 이동합니다.
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// 선택 단지 복원
onMounted(() => {
  complexStore.restoreSelectedComplex()
})
</script>

<template>
  <div class="master-layout theme-admin">
    <!-- MASTER 전용 사이드바 영역 -->
    <aside class="master-layout__sidebar">
      <div class="master-layout__brand">
        <p class="master-layout__brand-label">MASTER</p>
        <h1 class="master-layout__brand-title">전체 단지 관리</h1>
      </div>

      <nav class="master-layout__nav">
        <RouterLink
          v-for="item in masterNavItems"
          :key="item.to"
          :to="item.to"
          class="master-layout__nav-link"
          :class="{ 'is-active': isNavActive(item.to) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <!-- MASTER 콘텐츠 영역 -->
    <div class="master-layout__content">
      <!-- MASTER 상단 상태 영역 -->
      <header class="master-layout__header">
        <div>
          <p class="master-layout__header-kicker">MASTER</p>
          <h2 class="master-layout__header-title">
            {{ selectedComplex?.name || '선택된 단지 없음' }}
          </h2>
          <p class="master-layout__empty-message">{{ selectedComplexMessage }}</p>
        </div>

        <div class="master-layout__header-actions">
          <button
            v-if="hasSelectedComplex"
            class="master-layout__action-button"
            type="button"
            @click="goSelectedDashboard"
          >
            선택 단지 대시보드
          </button>
          <button type="button" class="master-layout__ghost-button" @click="handleLogout">
            로그아웃
          </button>
        </div>
      </header>

      <!-- MASTER 본문 영역 -->
      <main class="master-layout__main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.master-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--color-bg-app);
  color: var(--color-text-primary);
}

.master-layout__sidebar {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  padding: 24px 20px;
  background: var(--color-sidebar-bg);
  color: var(--color-sidebar-text);
}

.master-layout__brand {
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.master-layout__brand-label {
  margin: 0 0 8px;
  color: rgba(255, 255, 255, 0.56);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.master-layout__brand-title {
  margin: 0;
  font-size: var(--font-size-heading-3);
}

.master-layout__nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.master-layout__nav-link {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: var(--radius-8);
  color: var(--color-sidebar-text);
  opacity: 0.78;
  text-decoration: none;
}

.master-layout__nav-link.router-link-active,
.master-layout__nav-link.is-active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  opacity: 1;
}

.master-layout__content {
  display: flex;
  flex-direction: column;
}

.master-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 88px;
  padding: 0 32px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-app);
}

.master-layout__header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.master-layout__header-kicker {
  margin: 0 0 4px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.master-layout__header-title {
  margin: 0;
  font-size: var(--font-size-heading-3);
}

.master-layout__empty-message {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-layout__action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: var(--radius-8);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  cursor: pointer;
  text-decoration: none;
}

.master-layout__ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  cursor: pointer;
}

.master-layout__main {
  flex: 1;
  padding: 20px 32px;
}
</style>
