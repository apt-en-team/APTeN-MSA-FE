<script setup>
// TODO: ADMIN과 MASTER가 함께 사용하는 데스크톱 관리자 레이아웃입니다.
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const authStore = useAuthStore()
const complexStore = useComplexStore()

// TODO: 관리자 공통 메뉴와 MASTER 추가 메뉴를 구분합니다.
const adminMenus = [
  { label: '대시보드', to: '/admin/dashboard' },
  { label: '세대 관리', to: '/admin/households' },
  { label: '세대 승인', to: '/admin/household-match' },
  { label: '관리비 관리', to: '/admin/bills' },
  { label: '차량 관리', to: '/admin/vehicles' },
  { label: '방문차량 관리', to: '/admin/visitor-vehicles' },
  { label: '주차 관리', to: '/admin/parking/dashboard' },
  { label: '게시판 관리', to: '/admin/boards/posts' },
  { label: '공지사항 관리', to: '/admin/notices' },
  { label: '투표 관리', to: '/admin/votes' },
  { label: '시설 관리', to: '/admin/facilities' },
  { label: '예약 관리', to: '/admin/reservations' },
  { label: 'GX 프로그램 관리', to: '/admin/gx-programs' },
  { label: '챗봇 관리', to: '/admin/chatbot/faqs' },
]

// TODO: MASTER 전용 단지 관리 메뉴를 별도로 노출합니다.
const masterMenus = [
  { label: '전체 단지 관리', to: '/admin/master/complexes' },
  { label: '단지 등록', to: '/admin/master/complexes/create' },
  { label: '단지 관리자 배정', to: '/admin/master/complexes' },
  { label: '현재 선택 단지 관리자 화면', to: '/admin/dashboard' },
]

// TODO: 사용자 권한과 표시용 이름을 계산합니다.
const isMaster = computed(() => authStore.role === 'MASTER')
const userName = computed(() => authStore.name || '관리자')
const userRole = computed(() => authStore.role || 'ADMIN')
const currentPageTitle = computed(() => route.meta?.title || '관리자 화면')

// TODO: 선택 단지 코드는 store와 localStorage에서 안전하게 읽습니다.
const selectedComplexCode = computed(() => {
  const selectedComplex = complexStore.selectedComplex

  if (selectedComplex?.code) {
    return selectedComplex.code
  }

  const storedCode = localStorage.getItem('selectedComplexCode')

  if (storedCode) {
    return storedCode
  }

  try {
    const storedComplex = JSON.parse(localStorage.getItem('selectedComplex') || 'null')
    return storedComplex?.code || null
  } catch (error) {
    console.error(error)
    return null
  }
})

// TODO: MASTER 전용 입주민 미리보기 이동 경로를 계산합니다.
const residentPreviewPath = computed(() => {
  if (!selectedComplexCode.value) {
    return ''
  }

  return `/admin/complexes/${selectedComplexCode.value}/resident-preview`
})

// TODO: 현재 경로와 메뉴 경로를 비교해 활성 상태를 표시합니다.
const isMenuActive = (targetPath) => route.path === targetPath || route.path.startsWith(`${targetPath}/`)

// TODO: 기존 store 액션을 사용해 로그아웃 버튼을 연결합니다.
const handleLogout = async () => {
  await authStore.logout()
}
</script>

<template>
  <div class="admin-layout theme-admin">
    <aside class="admin-layout__sidebar">
      <div class="admin-layout__brand-panel">
        <p class="admin-layout__brand-label">APT-EN</p>
        <h1 class="admin-layout__brand-title">Admin Console</h1>
      </div>

      <nav class="admin-layout__nav">
        <RouterLink
          v-for="menu in adminMenus"
          :key="menu.to"
          :to="menu.to"
          class="admin-layout__nav-link"
          :class="{ 'is-active': isMenuActive(menu.to) }"
        >
          {{ menu.label }}
        </RouterLink>
      </nav>

      <div v-if="isMaster" class="admin-layout__master-panel">
        <p class="admin-layout__section-label">MASTER MENU</p>
        <nav class="admin-layout__nav admin-layout__nav--compact">
          <RouterLink
            v-for="menu in masterMenus"
            :key="menu.to + menu.label"
            :to="menu.to"
            class="admin-layout__nav-link admin-layout__nav-link--sub"
            :class="{ 'is-active': isMenuActive(menu.to) }"
          >
            {{ menu.label }}
          </RouterLink>

          <RouterLink
            v-if="residentPreviewPath"
            :to="residentPreviewPath"
            class="admin-layout__nav-link admin-layout__nav-link--sub"
            :class="{ 'is-active': isMenuActive(residentPreviewPath) }"
          >
            입주민 미리보기
          </RouterLink>

          <span v-else class="admin-layout__nav-link admin-layout__nav-link--disabled">
            입주민 미리보기
          </span>
        </nav>
      </div>

      <div class="admin-layout__profile">
        <div class="admin-layout__profile-card">
          <p class="admin-layout__profile-name">{{ userName }}</p>
          <p class="admin-layout__profile-role">{{ userRole }}</p>
        </div>
        <button type="button" class="admin-layout__profile-action" @click="handleLogout">
          로그아웃
        </button>
      </div>
    </aside>

    <div class="admin-layout__shell">
      <header class="admin-layout__header">
        <div class="admin-layout__header-copy">
          <p class="admin-layout__header-kicker">ADMIN WORKSPACE</p>
          <h2 class="admin-layout__header-title">{{ currentPageTitle }}</h2>
        </div>

        <div class="admin-layout__header-actions">
          <button type="button" class="admin-layout__utility-button">알림</button>
          <div class="admin-layout__identity">
            <span class="admin-layout__identity-name">{{ userName }}</span>
            <span class="admin-layout__identity-role">{{ userRole }}</span>
          </div>
        </div>
      </header>

      <main class="admin-layout__main">
        <div class="page-container admin-layout__page-container">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 100vh;
  background-color: var(--color-bg-app);
  color: var(--color-text-primary);
}

.admin-layout__sidebar {
  position: sticky;
  top: 0;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-24);
  background: var(--color-sidebar-bg);
  color: var(--color-sidebar-text);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.08);
}

.admin-layout__brand-panel {
  padding: var(--space-20);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-12);
  background: rgba(255, 255, 255, 0.04);
}

.admin-layout__brand-label {
  margin: 0 0 var(--space-8);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
  opacity: 0.72;
}

.admin-layout__brand-title {
  margin: 0;
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  line-height: 1.3;
}

.admin-layout__nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-8);
  margin-top: var(--space-24);
}

.admin-layout__nav--compact {
  flex: 0;
  margin-top: var(--space-12);
}

.admin-layout__nav-link {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-16);
  border: 1px solid transparent;
  border-radius: var(--radius-8);
  color: rgba(255, 255, 255, 0.78);
  font-size: var(--font-size-body-sm);
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.admin-layout__nav-link:hover,
.admin-layout__nav-link.is-active {
  background: var(--color-primary);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--color-primary-contrast);
}

.admin-layout__nav-link--sub {
  min-height: 40px;
  font-size: var(--font-size-detail);
}

.admin-layout__nav-link--disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.admin-layout__master-panel {
  margin-top: var(--space-24);
  padding-top: var(--space-20);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-layout__section-label {
  margin: 0;
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
  opacity: 0.72;
}

.admin-layout__profile {
  margin-top: var(--space-24);
  padding-top: var(--space-20);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-layout__profile-card {
  padding: var(--space-16);
  border-radius: var(--radius-12);
  background: rgba(255, 255, 255, 0.08);
}

.admin-layout__profile-name {
  margin: 0;
  font-size: var(--font-size-body);
  font-weight: 700;
}

.admin-layout__profile-role {
  margin: var(--space-4) 0 0;
  font-size: var(--font-size-detail);
  opacity: 0.78;
}

.admin-layout__profile-action {
  width: 100%;
  margin-top: var(--space-12);
  padding: 12px var(--space-16);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-8);
  background: transparent;
  color: var(--color-sidebar-text);
  cursor: pointer;
  font: inherit;
}

.admin-layout__profile-action:hover {
  background: rgba(255, 255, 255, 0.08);
}

.admin-layout__shell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  background: var(--color-bg-app);
}

.admin-layout__header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88px;
  padding: 0 var(--space-32);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-header-bg);
  backdrop-filter: blur(10px);
}

.admin-layout__header-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-layout__header-kicker {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.admin-layout__header-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-page-title-admin);
  font-weight: 700;
  line-height: 1.2;
}

.admin-layout__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.admin-layout__utility-button {
  min-width: 88px;
  padding: 12px var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-small);
  color: var(--color-text-primary);
  cursor: pointer;
  font: inherit;
}

.admin-layout__identity {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: 12px var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-small);
}

.admin-layout__identity-name {
  font-size: var(--font-size-body-sm);
  font-weight: 700;
}

.admin-layout__identity-role {
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.admin-layout__main {
  flex: 1;
  background: var(--color-bg-app);
}

.admin-layout__page-container {
  min-height: calc(100vh - 88px);
}

@media (max-width: 1280px) {
  .admin-layout {
    grid-template-columns: 248px minmax(0, 1fr);
  }
}

@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 224px minmax(0, 1fr);
  }

  .admin-layout__header {
    padding: 0 var(--space-20);
  }
}
</style>
