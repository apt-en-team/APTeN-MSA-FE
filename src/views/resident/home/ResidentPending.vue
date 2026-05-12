<script setup>
import {computed} from 'vue'
import {useAuthStore} from '@/stores/useAuthStore'
import {useRouter} from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// 로그인한 사용자 정보
const userName = computed(() => authStore.name || '입주민')

// 로그아웃 후 로그인 페이지로 이동
async function handleLogout() {
  await authStore.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="pending">

    <!-- 로고 -->
    <div class="pending__logo">
      <svg viewBox="0 0 28 28" fill="none" class="pending__logo-icon">
        <rect width="28" height="28" rx="6" fill="var(--resident-primary)"/>
        <path d="M7 20V10l7-4 7 4v10" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <rect x="11" y="14" width="6" height="6" rx="1" fill="white"/>
      </svg>
      <span class="pending__logo-text">아파트엔</span>
    </div>

    <!-- 대기 아이콘 -->
    <div class="pending__icon-wrap">
      <svg viewBox="0 0 64 64" fill="none" class="pending__icon">
        <circle cx="32" cy="32" r="30" stroke="var(--resident-primary)" stroke-width="2.5"
                stroke-dasharray="6 4" opacity="0.4"/>
        <circle cx="32" cy="32" r="22" fill="rgba(73,115,229,0.08)"/>
        <path d="M32 20v12l7 4" stroke="var(--resident-primary)" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <!-- 안내 메시지 -->
    <div class="pending__content">
      <h1 class="pending__title">승인 대기 중</h1>
      <p class="pending__desc">
        <strong>{{ userName }}</strong>님의 가입 신청이 접수되었습니다.<br>
        관리자 승인 후 서비스를 이용하실 수 있습니다.
      </p>
    </div>

    <!-- 내 정보 카드 -->
    <div class="pending__info-card">
      <div class="pending__info-row">
        <span class="pending__info-label">이름</span>
        <span class="pending__info-value">{{ userName }}</span>
      </div>
      <div class="pending__info-row">
        <span class="pending__info-label">동/호</span>
        <span class="pending__info-value">{{ authStore.building }}동 {{ authStore.unit }}호</span>
      </div>
      <div class="pending__info-row">
        <span class="pending__info-label">상태</span>
        <span class="pending__info-badge">승인 대기</span>
      </div>
    </div>

    <!-- 안내 문구 -->
    <p class="pending__notice">
      승인까지 1~2 영업일이 소요될 수 있습니다.<br>
      문의사항은 관리사무소로 연락해주세요.
    </p>

    <!-- 로그아웃 버튼 -->
    <button class="pending__logout" @click="handleLogout">
      로그아웃
    </button>

  </div>
</template>

<style scoped>
.pending {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-24);
  padding: var(--space-32) var(--space-20);
  background: var(--resident-bg-1);
}

/* 로고 */
.pending__logo {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.pending__logo-icon {
  width: 28px;
  height: 28px;
}

.pending__logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}

/* 대기 아이콘 */
.pending__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pending__icon {
  width: 80px;
  height: 80px;
  animation: rotate 6s linear infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

/* 안내 메시지 */
.pending__content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.pending__title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.pending__desc {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin: 0;
}

/* 내 정보 카드 */
.pending__info-card {
  width: 100%;
  max-width: 320px;
  background: var(--resident-bg-2);
  border-radius: var(--radius-12);
  padding: var(--space-4) 0;
  box-shadow: var(--shadow-small);
}

.pending__info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-12) var(--space-16);
  border-bottom: 1px solid var(--color-border);
}

.pending__info-row:last-child {
  border-bottom: none;
}

.pending__info-label {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.pending__info-value {
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.pending__info-badge {
  font-size: var(--font-size-label);
  font-weight: 600;
  color: var(--color-warning);
  background: rgba(230, 162, 60, 0.12);
  padding: 3px 10px;
  border-radius: 20px;
}

/* 하단 안내 */
.pending__notice {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.7;
  margin: 0;
}

/* 로그아웃 */
.pending__logout {
  background: none;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-8);
  padding: var(--space-8) var(--space-24);
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.pending__logout:hover {
  border-color: var(--color-text-secondary);
  color: var(--color-text-primary);
}
</style>
