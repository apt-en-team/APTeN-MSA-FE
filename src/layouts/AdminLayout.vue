<script setup>
// TODO: ADMIN과 MASTER가 함께 사용하는 데스크톱 관리자 레이아웃입니다.
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'

// 사이드바와 헤더에서 사용할 현재 라우트 정보를 가져옵니다.
const route = useRoute()
// 로그인 사용자 정보를 표시하기 위해 인증 store를 사용합니다.
const authStore = useAuthStore()
// MASTER의 선택 단지 정보를 표시하기 위해 단지 store를 사용합니다.
const complexStore = useComplexStore()

// 사이드바의 메인 관리자 메뉴를 그룹 단위로 정리합니다.
const adminMenuGroups = [
  {
    label: 'MAIN',
    items: [
      { label: '대시보드', to: '/admin/dashboard' },
      { label: '세대 관리', to: '/admin/households' },
      { label: '세대 승인', to: '/admin/household-match' },
      { label: '관리비 관리', to: '/admin/bills' },
    ],
  },
  {
    label: 'VEHICLE',
    items: [
      { label: '차량 관리', to: '/admin/vehicles' },
      { label: '방문차량 관리', to: '/admin/visitor-vehicles' },
      { label: '주차 관리', to: '/admin/parking/dashboard' },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { label: '게시판 관리', to: '/admin/boards/posts' },
      { label: '공지사항 관리', to: '/admin/notices' },
      { label: '투표 관리', to: '/admin/votes' },
      { label: '챗봇 관리', to: '/admin/chatbot/faqs' },
    ],
  },
  {
    label: 'FACILITY / RESERVATION',
    items: [
      { label: '시설 관리', to: '/admin/facilities' },
      { label: '예약 관리', to: '/admin/reservations' },
      { label: 'GX 프로그램 관리', to: '/admin/gx-programs' },
    ],
  },
]

// MASTER 전용 단지 관리 메뉴를 별도로 노출합니다.
const masterMenus = [
  { label: '전체 단지 관리', to: '/admin/master/complexes' },
  { label: '단지 등록', to: '/admin/master/complexes/create' },
  { label: '단지 관리자 배정', to: '/admin/master/complexes' },
  { label: '현재 선택 단지 관리자 화면', to: '/admin/dashboard' },
]

// 사용자 권한과 표시용 이름을 계산합니다.
const isMaster = computed(() => authStore.role === 'MASTER')
const userName = computed(() => authStore.name || '관리자')
const userRole = computed(() => authStore.role || 'ADMIN')
const currentPageTitle = computed(() => route.meta?.title || '관리자 화면')

// 상단 헤더에 표시할 오늘 날짜 문자열을 계산합니다.
const todayStr = computed(() => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dayOfWeek = days[date.getDay()]

  return `${year}.${month}.${day} (${dayOfWeek})`
})

// 선택 단지 코드는 store와 localStorage에서 안전하게 읽습니다.
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

// MASTER 전용 입주민 미리보기 이동 경로를 계산합니다.
const residentPreviewPath = computed(() => {
  if (!selectedComplexCode.value) {
    return ''
  }

  return `/admin/complexes/${selectedComplexCode.value}/resident-preview`
})

// 현재 경로와 메뉴 경로를 비교해 활성 상태를 표시합니다.
const isMenuActive = (targetPath) => route.path === targetPath || route.path.startsWith(`${targetPath}/`)

// 기존 store 액션을 사용해 로그아웃 버튼을 연결합니다.
const handleLogout = async () => {
  await authStore.logout()
}
</script>

<template>
  <div class="admin-layout theme-admin">
    <!-- 사이드바 영역 -->
    <aside class="admin-layout__sidebar">
      <div class="admin-layout__brand-panel">
        <div class="admin-layout__brand-icon">A</div>
        <div class="admin-layout__brand-copy">
          <p class="admin-layout__brand-title">아파트엔</p>
          <p class="admin-layout__brand-role">관리자</p>
        </div>
      </div>

      <div class="admin-layout__nav-scroll">
        <div
          v-for="group in adminMenuGroups"
          :key="group.label"
          class="admin-layout__nav-group"
        >
          <p class="admin-layout__section-label">{{ group.label }}</p>
          <nav class="admin-layout__nav">
            <RouterLink
              v-for="menu in group.items"
              :key="menu.to"
              :to="menu.to"
              class="admin-layout__nav-link"
              :class="{ 'is-active': isMenuActive(menu.to) }"
            >
              {{ menu.label }}
            </RouterLink>
          </nav>
        </div>

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
      </div>

      <!-- 하단 프로필 영역 -->
      <div class="admin-layout__profile">
        <div class="admin-layout__profile-avatar">관</div>
        <div class="admin-layout__profile-card">
          <p class="admin-layout__profile-name">{{ userName }}</p>
          <p class="admin-layout__profile-role">{{ userRole }}</p>
        </div>
        <button type="button" class="admin-layout__profile-action" @click="handleLogout">로그아웃</button>
      </div>
    </aside>

    <!-- 메인 콘텐츠 래퍼 영역 -->
    <div class="admin-layout__shell">
      <!-- 상단 헤더 영역 -->
      <header class="admin-layout__header">
        <div class="admin-layout__header-copy">
          <p class="admin-layout__header-kicker">{{ todayStr }} · APT-EN 아파트</p>
          <h2 class="admin-layout__header-title">{{ currentPageTitle }}</h2>
        </div>

        <div class="admin-layout__header-actions">
          <button type="button" class="admin-layout__utility-button">알림</button>
          <button
            v-if="residentPreviewPath"
            type="button"
            class="admin-layout__primary-button"
            @click="$router.push(residentPreviewPath)"
          >
            입주민 미리보기
          </button>
          <div class="admin-layout__identity">
            <span class="admin-layout__identity-name">{{ userName }}</span>
            <span class="admin-layout__identity-role">{{ userRole }}</span>
          </div>
        </div>
      </header>

      <!-- 메인 콘텐츠 영역 -->
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
  grid-template-columns: 240px minmax(0, 1fr);
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
  width: 240px;
  background: var(--color-sidebar-bg);
  color: var(--color-sidebar-text);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.08);
}

.admin-layout__brand-panel {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-24) var(--space-20);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.admin-layout__brand-icon {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-8);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-size: var(--font-size-body);
  font-weight: 700;
}

.admin-layout__brand-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.admin-layout__brand-role {
  margin: 2px 0 0;
  color: rgba(255, 255, 255, 0.48);
  font-size: var(--font-size-badge);
}

.admin-layout__nav-scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-12);
}

.admin-layout__nav-group + .admin-layout__nav-group,
.admin-layout__master-panel {
  margin-top: var(--space-8);
}

.admin-layout__nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.admin-layout__nav--compact {
  margin-top: var(--space-8);
}

.admin-layout__nav-link {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: 7px;
  color: var(--color-sidebar-text);
  font-size: var(--font-size-detail);
  font-weight: 500;
  opacity: 0.68;
  text-decoration: none;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.admin-layout__nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-sidebar-text);
  opacity: 0.88;
}

.admin-layout__nav-link.is-active {
  background: var(--color-primary);
  border-color: transparent;
  color: var(--color-primary-contrast);
  opacity: 1;
  font-weight: 600;
}

.admin-layout__nav-link--sub {
  min-height: 34px;
  font-size: var(--font-size-detail);
}

.admin-layout__nav-link--disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.admin-layout__master-panel {
  padding-top: var(--space-12);
}

.admin-layout__section-label {
  margin: 0 0 5px;
  padding: 14px 10px 5px;
  color: rgba(255, 255, 255, 0.36);
  font-size: var(--font-size-caption-sm);
  letter-spacing: 0.08em;
  font-weight: 600;
}

.admin-layout__profile {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-16) var(--space-20);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-layout__profile-avatar {
  display: flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-label);
  font-weight: 700;
}

.admin-layout__profile-card {
  flex: 1;
  min-width: 0;
}

.admin-layout__profile-name {
  margin: 0;
  font-size: var(--font-size-detail);
  font-weight: 600;
}

.admin-layout__profile-role {
  margin: 2px 0 0;
  color: rgba(255, 255, 255, 0.48);
  font-size: var(--font-size-badge);
}

.admin-layout__profile-action {
  display: flex;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: transparent;
  color: var(--color-sidebar-text);
  cursor: pointer;
  font-size: var(--font-size-caption-sm);
  font-weight: 600;
}

.admin-layout__profile-action:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
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
  padding: 0 48px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-app);
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
}

.admin-layout__header-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.admin-layout__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.admin-layout__utility-button {
  display: flex;
  height: 36px;
  align-items: center;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--font-size-detail);
}

.admin-layout__primary-button {
  display: flex;
  height: 36px;
  align-items: center;
  padding: 0 18px;
  border: none;
  border-radius: 7px;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  cursor: pointer;
  font-size: var(--font-size-detail);
  font-weight: 600;
}

.admin-layout__primary-button:hover {
  filter: brightness(0.92);
}

.admin-layout__identity {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: 0 2px 0 var(--space-4);
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
  padding-left: 64px;
  padding-right: 64px;
}

@media (max-width: 1280px) {
  .admin-layout {
    grid-template-columns: 240px minmax(0, 1fr);
  }
}

@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 224px minmax(0, 1fr);
  }

  .admin-layout__header {
    padding: 0 var(--space-20);
  }

  .admin-layout__page-container {
    padding-left: var(--space-24);
    padding-right: var(--space-24);
  }
}
</style>
