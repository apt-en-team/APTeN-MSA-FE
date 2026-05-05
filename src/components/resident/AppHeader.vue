<script setup>
import {useRouter} from 'vue-router'

// TODO: 알림, 메뉴 기능 구현 시 연결
defineProps({
  title: {
    type: String,
    default: '아파트엔',
  },
})

const router = useRouter()
</script>

<template>
  <header class="app-header">
    <!-- 로고 -->
    <div class="app-header__logo">
      <div class="app-header__logo-icon">
        <span class="app-header__logo-letter">A</span>
      </div>
      <strong class="app-header__title">{{ title }}</strong>
    </div>

    <!-- 우측 액션 버튼 -->
    <div class="app-header__actions">
      <!-- 알림 버튼 -->
      <button class="app-header__btn" @click="router.push('/resident/notifications')">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor"
                stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round"/>
        </svg>
      </button>
      <!-- 메뉴 버튼 -->
      <button class="app-header__btn">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
/* 헤더 전체 레이아웃 — 로고(좌) / 액션버튼(우) 양끝 배치 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-12) var(--space-16);
  border-bottom: 1px solid rgba(73, 115, 229, 0.12);
  background-color: var(--color-header-bg);
  backdrop-filter: blur(12px);
}

/* 로고 영역 — 아이콘 + 서비스명 가로 배치 */
.app-header__logo {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

/* 로고 아이콘 박스 — 파란 배경에 A 글자 */
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

/* 로고 아이콘 글자 */
.app-header__logo-letter {
  color: white;
  font-size: 15px;
  font-weight: 700;
}

/* 서비스명 텍스트 */
.app-header__title {
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--color-text-primary);
}

/* 우측 버튼 묶음 — 알림 + 메뉴 */
.app-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* 개별 아이콘 버튼 공통 스타일 */
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

/* 호버 시 배경 살짝 표시 */
.app-header__btn:hover {
  background: var(--color-bg-muted);
}

.app-header__btn svg {
  width: 20px;
  height: 20px;
}
</style>
