<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

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

// 클라이언트 유효성 검사
// 서버 요청 전에 빈 값 체크
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
// 성공 시 store 내부에서 역할(ADMIN/MASTER)에 따라 페이지 이동
async function handleLogin() {
  if (!validate()) return
  await authStore.login({ email: form.email, password: form.password })
}
</script>

<template>
  <div class="admin-login">

    <!-- 로고 -->
    <div class="admin-login__logo">
      <svg viewBox="0 0 28 28" fill="none" class="admin-login__logo-icon">
        <rect width="28" height="28" rx="6" fill="var(--admin-sub-blue)"/>
        <path d="M7 20V10l7-4 7 4v10" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <rect x="11" y="14" width="6" height="6" rx="1" fill="white"/>
      </svg>
      <span class="admin-login__logo-text">아파트엔</span>
    </div>

    <!-- 제목 -->
    <div class="admin-login__title-area">
      <h1 class="admin-login__title">관리자 로그인</h1>
      <p class="admin-login__sub">관리자 계정으로 로그인하세요</p>
    </div>

    <!-- 폼 -->
    <form class="admin-login__form" @submit.prevent="handleLogin">

      <!-- 이메일 -->
      <div class="field">
        <label class="field__label">이메일</label>
        <input
          v-model="form.email"
          type="email"
          class="field__input"
          :class="{ 'field__input--error': errors.email }"
          placeholder="admin@example.com"
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <p v-if="errors.password" class="field__error">{{ errors.password }}</p>
      </div>

      <!-- 서버 에러 -->
      <p v-if="authStore.error" class="admin-login__error">
        {{ authStore.error }}
      </p>

      <!-- 로그인 버튼 -->
      <button type="submit" class="admin-login__btn" :disabled="authStore.loading">
        <span v-if="!authStore.loading">로그인</span>
        <span v-else class="btn-spinner"></span>
      </button>

    </form>

    <!-- 뒤로가기 -->
    <p class="admin-login__back">
      <RouterLink to="/" class="link">← 메인으로 돌아가기</RouterLink>
    </p>

  </div>
</template>

<style scoped>
.admin-login {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

/* 로고 */
.admin-login__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
}
.admin-login__logo-icon { width: 28px; height: 28px; }
.admin-login__logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}

/* 제목 */
.admin-login__title-area { text-align: center; }
.admin-login__title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}
.admin-login__sub {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* 폼 */
.admin-login__form { display: flex; flex-direction: column; gap: var(--space-16); }

.field { display: flex; flex-direction: column; gap: var(--space-4); }
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
  border-color: var(--admin-sub-blue);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}
.field__input--error { border-color: var(--color-danger) !important; }
.field__input--pw { padding-right: 44px; }

.field__pw-wrap { position: relative; }
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
.field__pw-toggle svg { width: 18px; height: 18px; }
.field__error {
  font-size: var(--font-size-label);
  color: var(--color-danger);
  margin: 0;
}

/* 서버 에러 */
.admin-login__error {
  font-size: var(--font-size-detail);
  color: var(--color-danger);
  background: rgba(229, 62, 62, 0.08);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-8);
  text-align: center;
  margin: 0;
}

/* 버튼 */
.admin-login__btn {
  height: 48px;
  background: var(--admin-sub-blue);
  color: var(--white);
  border: none;
  border-radius: var(--radius-8);
  font-size: var(--font-size-body);
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}
.admin-login__btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-spinner {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 뒤로가기 */
.admin-login__back {
  text-align: center;
  margin: 0;
}
.link {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.15s;
}
.link:hover { color: var(--color-text-primary); }
</style>
