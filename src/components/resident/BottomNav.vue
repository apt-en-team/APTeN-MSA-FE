<script setup>
import { computed } from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { FEATURE_CODES } from '@/constants/complexFeatures'
import { isFeatureEnabled, normalizeFeatures } from '@/utils/featureGate'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()

// TODO: 입주민용 단지 정보 API에 features가 연결되면 resident 하단 탭도 features 기준으로 제어한다.
const residentFeatures = computed(() => {
  return normalizeFeatures(
    complexStore.residentComplex?.features,
  )
})

// complexId 기반 경로 생성
const residentPath = (path) => `/resident/${authStore.complexId}/${path}`
const showParkingTab = computed(() => {
  return isFeatureEnabled(residentFeatures.value, FEATURE_CODES.PARKING_STATUS)
})

// 현재 경로 기준으로 활성 탭 판단
const isActive = (path) => route.path.includes(path)
</script>

<template>
  <nav class="bottom-nav">

    <!-- 주차 탭 -->
    <button
      v-if="showParkingTab"
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': isActive('parking') }"
      @click="router.push(residentPath('parking'))"
    >
      <svg class="bottom-nav__icon" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/>
        <path d="M7 19v2M17 19v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M3 10h18" stroke="currentColor" stroke-width="1.8"/>
      </svg>
      <span class="bottom-nav__label">주차</span>
    </button>

    <!-- 차량 탭 -->
    <button
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': isActive('vehicles') }"
      @click="router.push(residentPath('vehicles'))"
    >
      <svg class="bottom-nav__icon" viewBox="0 0 24 24" fill="none">
        <path d="M5 17H3v-5l2-5h14l2 5v5h-2" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="7" cy="17" r="2" stroke="currentColor" stroke-width="1.8"/>
        <circle cx="17" cy="17" r="2" stroke="currentColor" stroke-width="1.8"/>
        <path d="M9 17h6" stroke="currentColor" stroke-width="1.8"/>
      </svg>
      <span class="bottom-nav__label">차량</span>
    </button>

    <!-- 홈 탭 -->
    <button
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': isActive('home') }"
      @click="router.push(residentPath('home'))"
    >
      <svg class="bottom-nav__icon" viewBox="0 0 24 24" fill="none">
        <path d="M3 12L12 3l9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="bottom-nav__label">홈</span>
    </button>

    <!-- 관리비 탭 -->
    <button
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': isActive('management-fee') }"
      @click="router.push(residentPath('management-fee'))"
    >
      <svg class="bottom-nav__icon" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="bottom-nav__label">관리비</span>
    </button>

    <!-- MY 탭 -->
    <button
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': isActive('mypage') }"
      @click="router.push(residentPath('mypage'))"
    >
      <svg class="bottom-nav__icon" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round"/>
      </svg>
      <span class="bottom-nav__label">MY</span>
    </button>

  </nav>
</template>

<style scoped>
/* 하단 네비게이션 — 5탭 고정 배치 */
.bottom-nav {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: var(--space-4) var(--space-8) calc(var(--space-4) + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(73, 115, 229, 0.12);
  background-color: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
}

/* 개별 탭 버튼 공통 스타일 */
.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: var(--space-8) 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.15s;
}

/* 활성 탭 — 파란색 강조 */
.bottom-nav__item--active {
  color: var(--resident-primary);
}

/* 탭 아이콘 크기 */
.bottom-nav__icon {
  width: 24px;
  height: 24px;
}

/* 탭 라벨 텍스트 */
.bottom-nav__label {
  font-size: 10px;
  font-weight: 500;
}

/* 활성 탭 라벨 굵게 */
.bottom-nav__item--active .bottom-nav__label {
  font-weight: 700;
}
</style>
