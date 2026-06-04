<script setup>
import {computed, ref, onMounted, onUnmounted} from 'vue'
import {useAuthStore} from '@/stores/useAuthStore'
import {useRouter} from 'vue-router'
import authApi from '@/api/authApi'

const authStore = useAuthStore()
const router = useRouter()

// 로그인한 사용자 정보
const userName = computed(() => authStore.name || '입주민')
const isRejected = computed(() => ['REJECTED'].includes(authStore.status))

// 승인 상태값 판별 — BE가 status를 enum name으로 통일해 영어 이름만 비교
const ACTIVE_STATUSES = ['ACTIVE']
const REJECTED_STATUSES = ['REJECTED']

// 폴링 설정 — 3초 간격, 최대 10회(약 30초)
const POLL_INTERVAL_MS = 3000
const MAX_POLL_COUNT = 10
let pollIntervalId = null
let pollCount = 0
// 폴링이 종료(이동/거절/시간초과)됐는지 표시 — 즉시 1회 호출 후 주기 폴링 시작 여부 판단에 사용
let pollingFinished = false

// 최대 횟수까지 대기 상태면 표시할 안내 (명부 불일치 등 수동 승인 케이스)
const pollTimedOut = ref(false)

// 최신 status를 store와 localStorage에 함께 반영 — 라우터 가드가 localStorage를 다시 읽으므로 둘 다 갱신
function applyStatus(status) {
  authStore.status = status
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    userInfo.status = status
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
  } catch (e) {
    // localStorage 파싱 실패 시 store 반영만으로 진행
  }
}

// 폴링 중단
function stopPolling() {
  pollingFinished = true
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId)
    pollIntervalId = null
  }
}

// 세대 자동매칭은 비동기라 로그인 직후 PENDING일 수 있어, 주기적으로 최신 status 조회
async function pollStatus() {
  pollCount += 1
  try {
    const info = await authApi.getMyInfo()
    const status = info?.status

    // 승인 완료 → 최신 status 반영 후 홈으로 이동
    if (ACTIVE_STATUSES.includes(status)) {
      applyStatus(status)
      stopPolling()
      router.push(`/resident/${authStore.complexId}/home`)
      return
    }

    // 승인 거절 → 최신 status 반영 후 폴링 중단(거절 화면 유지)
    if (REJECTED_STATUSES.includes(status)) {
      applyStatus(status)
      stopPolling()
      return
    }
  } catch (e) {
    // 일시적 조회 실패는 다음 주기에 재시도
  }

  // 최대 횟수까지 대기면 폴링 중단 + 안내 표시
  if (pollCount >= MAX_POLL_COUNT) {
    stopPolling()
    pollTimedOut.value = true
  }
}

onMounted(async () => {
  // 첫 조회는 즉시 1회 — 이미 승인 완료면 바로 홈으로 이동
  await pollStatus()
  // 즉시 호출에서 종료(이동/거절/시간초과)되지 않은 경우에만 주기 폴링 시작
  if (!pollingFinished) {
    pollIntervalId = setInterval(pollStatus, POLL_INTERVAL_MS)
  }
})

onUnmounted(() => {
  stopPolling()
})

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
      <h1 class="pending__title">{{ isRejected ? '승인 거절' : '승인 대기 중' }}</h1>
      <p class="pending__desc">
        <template v-if="isRejected">
          <strong>{{ userName }}</strong>님의 가입 신청이 승인 거절되었습니다.<br>
          정보를 확인한 뒤 다시 가입해 주세요.
        </template>
        <template v-else>
          <strong>{{ userName }}</strong>님의 가입 신청이 접수되었습니다.<br>
          관리자 승인 후 서비스를 이용하실 수 있습니다.
        </template>
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
        <span class="pending__info-badge" :class="{ 'is-rejected': isRejected }">
          {{ isRejected ? '승인 거절' : '승인 대기' }}
        </span>
      </div>
    </div>

    <!-- 안내 문구 -->
    <p class="pending__notice">
      <template v-if="isRejected">
        입력한 세대 정보와 승인 기준이 일치하지 않습니다.<br>
        다시 가입하거나 관리사무소로 문의해 주세요.
      </template>
      <template v-else>
        승인까지 1~2 영업일이 소요될 수 있습니다.<br>
        문의사항은 관리사무소로 연락해주세요.
      </template>
    </p>

    <!-- 폴링 시간 초과 안내 (자동승인 미완료 — 수동 승인 대기) -->
    <p v-if="pollTimedOut && !isRejected" class="pending__notice">
      관리자 승인을 기다리는 중입니다.<br>
      승인 완료 후 다시 로그인해 주세요.
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

.pending__info-badge.is-rejected {
  color: var(--color-danger);
  background: rgba(239, 68, 68, 0.12);
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
