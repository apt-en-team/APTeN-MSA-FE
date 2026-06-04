<script setup>
import {ref, reactive} from 'vue'
import {useAuthStore} from '@/stores/useAuthStore'

// 인증 상태 관리 store
// login() 호출 시 내부에서 역할별 리다이렉트 처리
const authStore = useAuthStore()

// 폼 입력값
const form = reactive({
  email: '',
  password: '',
})

// 클라이언트 유효성 검사 에러 메시지
const errors = reactive({
  email: '',
  password: '',
})

// 비밀번호 보이기/숨기기 토글 상태
const showPw = ref(false)

// 소셜 로그인 URL — 백엔드 OAuth2 엔드포인트로 직접 리다이렉트
const googleUrl = import.meta.env.VITE_GOOGLE_LOGIN_URL
const kakaoUrl  = import.meta.env.VITE_KAKAO_LOGIN_URL
const naverUrl  = import.meta.env.VITE_NAVER_LOGIN_URL

// 클라이언트 유효성 검사
// 서버 요청 전에 빈 값, 이메일 형식 체크
function validate() {
  errors.email = ''
  errors.password = ''
  let valid = true

  if (!form.email) {
    errors.email = '이메일을 입력해주세요.'
    valid = false
  }

  if (!form.password) {
    errors.password = '비밀번호를 입력해주세요.'
    valid = false
  }

  return valid
}


// 로그인 처리
// 유효성 검사 통과 시 authStore.login() 호출
// 성공 시 store 내부에서 역할(USER/ADMIN/MASTER)에 따라 페이지 이동
async function handleLogin() {
  if (!validate()) return
  await authStore.login({ email: form.email, password: form.password })
}
</script>

<template>
  <div class="resident-login">

    <!-- 로고 -->
    <div class="login-logo">
      <svg viewBox="0 0 28 28" fill="none" class="login-logo__icon">
        <rect width="28" height="28" rx="6" fill="var(--resident-primary)"/>
        <path d="M7 20V10l7-4 7 4v10" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <rect x="11" y="14" width="6" height="6" rx="1" fill="white"/>
      </svg>
      <span class="login-logo__text">아파트엔</span>
    </div>

    <!-- 제목 -->
    <div class="login-title-area">
      <h1 class="login-title">입주민 로그인</h1>
      <p class="login-sub">이메일과 비밀번호로 로그인하세요</p>
    </div>

    <!-- 폼 -->
    <form class="login-form" @submit.prevent="handleLogin">

      <!-- 이메일 -->
      <div class="field">
        <label class="field__label">이메일</label>
        <input
          v-model="form.email"
          type="email"
          class="field__input"
          :class="{ 'field__input--error': errors.email }"
          placeholder="example@email.com"
          autocomplete="email"
        />
        <p v-if="errors.email" class="field__error">{{ errors.email }}</p>
      </div>

      <!-- 비밀번호 -->
      <div class="field">
        <label class="field__label">비밀번호</label>
        <div class="field__pw-wrap">
          <input
            v-model="form.password"
            :type="showPw ? 'text' : 'password'"
            class="field__input field__input--pw"
            :class="{ 'field__input--error': errors.password }"
            placeholder="비밀번호를 입력하세요"
            autocomplete="current-password"
          />
          <button type="button" class="field__pw-toggle" @click="showPw = !showPw">
            <svg v-if="!showPw" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor"
                    stroke-width="1.8"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none">
              <path
                d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <p v-if="errors.password" class="field__error">{{ errors.password }}</p>
      </div>

      <!-- 비밀번호 찾기 -->
      <div class="login-forgot">
        <RouterLink to="/forgot-password" class="link">비밀번호를 잊으셨나요?</RouterLink>
      </div>

      <!-- 서버 에러 -->
      <p v-if="authStore.error" class="login-error">
        {{ authStore.error }}
      </p>

      <!-- 로그인 버튼 -->
      <button type="submit" class="btn-primary" :disabled="authStore.loading">
        <span v-if="!authStore.loading">로그인</span>
        <span v-else class="btn-spinner"></span>
      </button>

    </form>

    <!-- 소셜 구분선 -->
    <div class="divider"><span>또는 소셜 로그인</span></div>

    <!-- 소셜 버튼 -->
    <div class="social-list">
      <a :href="googleUrl" class="social-btn social-btn--google">
        <svg viewBox="0 0 24 24" class="social-btn__icon">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"/>
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"/>
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"/>
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"/>
        </svg>
        Google로 계속하기
      </a>
      <a :href="kakaoUrl" class="social-btn social-btn--kakao">
        <svg viewBox="0 0 24 24" class="social-btn__icon" fill="#3C1E1E">
          <path
            d="M12 3C6.48 3 2 6.48 2 10.8c0 2.74 1.64 5.16 4.14 6.6L5.2 21l4.54-2.4c.73.1 1.48.16 2.26.16 5.52 0 10-3.48 10-7.76S17.52 3 12 3z"/>
        </svg>
        카카오로 계속하기
      </a>
      <a :href="naverUrl" class="social-btn social-btn--naver">
        <svg viewBox="0 0 24 24" class="social-btn__icon" fill="white">
          <path d="M13.76 12.28L9.96 6H6v12h4.24V11.72L14.04 18H18V6h-4.24v6.28z"/>
        </svg>
        네이버로 계속하기
      </a>
    </div>

    <!-- 회원가입 링크 -->
    <p class="signup-link">
      아직 계정이 없으신가요?
      <RouterLink to="/register" class="link link--bold">회원가입</RouterLink>
    </p>

  </div>
</template>

<style scoped>
.resident-login {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.login-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
}

.login-logo__icon {
  width: 28px;
  height: 28px;
}

.login-logo__text {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.login-title-area {
  text-align: center;
}

.login-title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}

.login-sub {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field__label {
  font-size: var(--font-size-detail);
  font-weight: 600;
  color: var(--color-text-primary);
}

.field__input {
  height: 46px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-8);
  padding: 0 var(--space-12);
  font-size: var(--font-size-body);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field__input:focus {
  border-color: var(--resident-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.field__input--error {
  border-color: var(--color-danger) !important;
}

.field__input--pw {
  padding-right: 44px;
}

.field__pw-wrap {
  position: relative;
}

.field__pw-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
  display: flex;
}

.field__pw-toggle svg {
  width: 18px;
  height: 18px;
}

.field__error {
  font-size: var(--font-size-label);
  color: var(--color-danger);
  margin: 0;
}

.login-forgot {
  text-align: right;
}

.link {
  font-size: var(--font-size-detail);
  color: var(--resident-primary);
  text-decoration: none;
}

.link--bold {
  font-weight: 700;
}

.login-error {
  font-size: var(--font-size-detail);
  color: var(--color-danger);
  background: rgba(231, 76, 60, 0.08);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-8);
  text-align: center;
  margin: 0;
}

.btn-primary {
  height: 48px;
  background: var(--resident-primary);
  color: var(--white);
  border: none;
  border-radius: var(--radius-8);
  font-size: var(--font-size-body);
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.divider {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
}

.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.social-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.social-btn {
  height: 44px;
  border-radius: var(--radius-8);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;
}

.social-btn:hover {
  opacity: 0.88;
}

.social-btn__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.social-btn--google {
  background: white;
  border: 1.5px solid var(--color-border);
  color: #3c4043;
}

.social-btn--kakao {
  background: #FEE500;
  color: #3C1E1E;
}

.social-btn--naver {
  background: #03C75A;
  color: white;
}

.signup-link {
  text-align: center;
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
