<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { FEATURE_CODES } from '@/constants/complexFeatures'
import { isFeatureEnabled, normalizeFeatures } from '@/utils/featureGate'
import NotificationBadge from '@/components/notification/NotificationBadge.vue'

defineProps({
  title: {
    type: String,
    default: 'APTeN',
  },
})

const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()

// TODO: 입주민용 단지 정보 API에 features가 연결되면 resident 메뉴도 features 기준으로 제어한다.
const residentFeatures = computed(() => {
  return normalizeFeatures(
    complexStore.residentComplex?.features,
  )
})

// 드로어 열림 상태
const drawerOpen = ref(false)

// 드로어 스크롤 시 자주쓰는 메뉴 숨김
const hideQuickMenu = ref(false)

function handleDrawerScroll(e) {
  hideQuickMenu.value = e.target.scrollTop > 10
}

// complexId 기반 경로 생성
const residentPath = (path) => `/resident/${authStore.complexId}/${path}`

function canUseResidentFeature(featureCode) {
  return isFeatureEnabled(residentFeatures.value, featureCode)
}

function navigate(path) {
  drawerOpen.value = false
  hideQuickMenu.value = false
  router.push(path)
}

// 자주 쓰는 메뉴 — complexId 포함 경로
const quickMenus = computed(() => [
  {
    label: '마이페이지',
    path: residentPath('mypage'),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  },
  {
    label: '관리비 조회',
    path: residentPath('bill'),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  },
  {
    label: '내 차량',
    path: residentPath('vehicles'),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>`,
  },
  canUseResidentFeature(FEATURE_CODES.VOTE) ? {
    label: '투표하기',
    path: residentPath('vote'),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  } : null,
].filter(Boolean))

// 전체 메뉴 — complexId 포함 경로
const menuGroups = computed(() => [
  {
    label: '메인',
    items: [
      { label: '마이페이지', path: residentPath('mypage'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>` },
      { label: '관리비 조회', path: residentPath('bill'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
    ],
  },
  {
    label: '차량',
    items: [
      { label: '내 차량', path: residentPath('vehicles'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>` },
      { label: '방문차량 등록', path: residentPath('visitor-vehicle/register'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>` },
      { label: '방문차량 목록', path: residentPath('visitor-vehicle'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 12h14"/></svg>` },
      { label: '고정 방문차량 목록', path: residentPath('visitor-vehicle/fixed'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 010 6H9"/></svg>` },
      canUseResidentFeature(FEATURE_CODES.PARKING_STATUS)
        ? { label: '주차 현황', path: residentPath('parking'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 010 6H9"/></svg>` }
        : null,
    ].filter(Boolean),
  },
  {
    label: '시설',
    items: [
      canUseResidentFeature(FEATURE_CODES.FACILITY)
        ? { label: '시설 목록', path: residentPath('facility'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>` }
        : null,
      canUseResidentFeature(FEATURE_CODES.FACILITY)
        ? { label: '내 예약', path: residentPath('reservations'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>` }
        : null,
      // 구독형 시설 이용 내역 직접 접근 경로
      canUseResidentFeature(FEATURE_CODES.FACILITY)
        ? { label: '나의 구독', path: residentPath('facility/subscriptions'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>` }
        : null,
    ].filter(Boolean),
  },
  {
    label: '커뮤니티',
    items: [
      { label: '공지사항', path: residentPath('notice'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>` },
      { label: '자유게시판', path: residentPath('board'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>` },
      { label: '내가 쓴 글', path: residentPath('my-posts'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>` },
      canUseResidentFeature(FEATURE_CODES.VOTE)
        ? { label: '모바일 투표', path: residentPath('vote'), icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>` }
        : null,
    ].filter(Boolean),
  },
].filter((group) => group.items.length > 0))
</script>

<template>
  <header class="app-header">
    <!-- 로고 클릭 시 홈으로 이동 -->
    <div class="app-header__logo" style="cursor: pointer;" @click="navigate(residentPath('home'))">
      <div class="app-header__logo-icon">
        <span class="app-header__logo-letter">A</span>
      </div>
      <strong class="app-header__title">{{ title }}</strong>
    </div>

    <!-- 우측 액션 버튼 -->
    <div class="app-header__actions">
      <!-- 알림 버튼: 배지 position 기준을 위해 relative 적용 -->
      <button class="app-header__btn app-header__btn--notif" @click="navigate(residentPath('notifications'))">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <NotificationBadge />
      </button>
      <button class="app-header__btn" @click="drawerOpen = true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- 드로어 -->
  <Transition name="drawer">
    <div v-if="drawerOpen" class="drawer">
      <!-- 오버레이 -->
      <div class="drawer__overlay" @click="drawerOpen = false; hideQuickMenu = false" />

      <!-- 드로어 본체 -->
      <div class="drawer__panel">
        <!-- 사용자 정보 헤더 -->
        <div class="drawer__header">
          <div class="drawer__avatar">{{ authStore.name?.charAt(0) }}</div>
          <div class="drawer__user">
            <p class="drawer__user-name">{{ authStore.name }}</p>
            <p class="drawer__user-unit">{{ authStore.building }}동 {{ authStore.unit }}호</p>
          </div>
          <button class="drawer__close" @click="drawerOpen = false; hideQuickMenu = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- 스크롤 가능한 본문 -->
        <div class="drawer__body" @scroll="handleDrawerScroll">
          <!-- 자주 쓰는 메뉴 — 스크롤 시 숨김 -->
          <Transition name="fade">
            <div v-if="!hideQuickMenu" class="drawer__quick">
              <p class="drawer__section-label">자주 쓰는 메뉴</p>
              <div class="drawer__quick-grid">
                <button
                  v-for="menu in quickMenus"
                  :key="menu.label"
                  class="drawer__quick-item"
                  @click="navigate(menu.path)"
                >
                  <span class="drawer__quick-icon" v-html="menu.icon" />
                  <span class="drawer__quick-label">{{ menu.label }}</span>
                </button>
              </div>
            </div>
          </Transition>

          <!-- 전체 메뉴 -->
          <div class="drawer__menu">
            <p class="drawer__section-label">전체 메뉴보기</p>
            <div v-for="group in menuGroups" :key="group.label" class="drawer__group">
              <p class="drawer__group-label">{{ group.label }}</p>
              <button
                v-for="item in group.items"
                :key="item.label"
                class="drawer__menu-item"
                @click="navigate(item.path)"
              >
                <span class="drawer__menu-icon" v-html="item.icon" />
                <span class="drawer__menu-label">{{ item.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 헤더 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-12) var(--space-16);
  border-bottom: 1px solid rgba(73, 115, 229, 0.12);
  background-color: var(--color-header-bg);
  backdrop-filter: blur(12px);
}

.app-header__logo {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.app-header__logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--resident-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-header__logo-letter {
  color: white;
  font-size: 15px;
  font-weight: 700;
}

.app-header__title {
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--color-text-primary);
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.app-header__btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s;
}

/* 배지를 absolute로 붙이려면 position: relative가 필요 */
.app-header__btn--notif {
  position: relative;
}

.app-header__btn:hover {
  background: var(--color-bg-muted);
}

.app-header__btn svg {
  width: 20px;
  height: 20px;
}

/* 드로어 */
.drawer {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  justify-content: flex-end;
}

.drawer__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

.drawer__panel {
  position: relative;
  width: 80%;
  max-width: 320px;
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 드로어 헤더 */
.drawer__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid #f0f4fd;
  flex-shrink: 0;
}

.drawer__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--resident-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.drawer__user {
  flex: 1;
}

.drawer__user-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 2px;
}

.drawer__user-unit {
  font-size: 12px;
  color: #718096;
  margin: 0;
}

.drawer__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #718096;
}

.drawer__close svg {
  width: 18px;
  height: 18px;
}

/* 드로어 본문 */
.drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 자주 쓰는 메뉴 */
.drawer__section-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.drawer__quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.drawer__quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px;
  background: #f8faff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.drawer__quick-item:hover {
  background: #eef3fb;
}

.drawer__quick-icon {
  width: 24px;
  height: 24px;
  color: var(--resident-primary);
  display: flex;
  align-items: center;
}

.drawer__quick-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.drawer__quick-label {
  font-size: 10px;
  color: #4a5568;
  text-align: center;
  line-height: 1.3;
}

/* 전체 메뉴 */
.drawer__menu {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer__group {
  display: flex;
  flex-direction: column;
}

.drawer__group-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  margin: 0 0 4px 4px;
  letter-spacing: 0.03em;
}

.drawer__menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  background: none;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.15s, color 0.15s;
  color: #2d3748;
}

/* 호버 시 파란 하이라이트 */
.drawer__menu-item:hover {
  background: #eef3fb;
  color: var(--resident-primary);
}

.drawer__menu-item:hover .drawer__menu-icon {
  color: var(--resident-primary);
}

.drawer__menu-icon {
  width: 20px;
  height: 20px;
  color: #718096;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.15s;
}

.drawer__menu-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.drawer__menu-label {
  font-size: 14px;
  font-weight: 500;
}

/* 트랜지션 */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s;
}

.drawer-enter-active .drawer__panel,
.drawer-leave-active .drawer__panel {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer__panel,
.drawer-leave-to .drawer__panel {
  transform: translateX(100%);
}

/* 자주쓰는 메뉴 페이드 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, max-height 0.3s;
  max-height: 200px;
  overflow: hidden;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
