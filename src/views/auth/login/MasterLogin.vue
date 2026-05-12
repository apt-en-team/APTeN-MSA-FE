<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

// 인증 상태 관리 store
// 관리자 로그인과 동일하게 login() 호출 시 내부에서 로그인 요청/응답을 처리한다.
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

// 마스터 로그인 처리
// authStore.login() 내부에서 MASTER 역할이면 /admin/master/complexes로 이동 처리한다.
async function handleLogin() {
  if (!validate()) return
  await authStore.login({ email: form.email, password: form.password }, { skipRedirect: true })

  // 로그인 성공했는데 MASTER가 아니면 접근 차단
  if (authStore.isAuthenticated && authStore.role !== 'MASTER') {
    await authStore.logout()
    authStore.error = '마스터 계정으로만 로그인할 수 있습니다.'
    return
  }

  // MASTER면 마스터 페이지로 이동
  if (authStore.isAuthenticated && authStore.role === 'MASTER') {
    window.location.href = '/admin/master'
  }
}
</script>

<template>
  <main class="master-login-page">
    <!-- 상단 마스터 바 -->
    <header class="master-login-header">
      <RouterLink to="/" class="master-login-header__brand">
        <img
          src="/APTeNLOGO.png"
          alt="아파트엔 로고"
          class="master-login-header__logo"
        />
        <span>아파트엔 마스터</span>
      </RouterLink>
    </header>

    <!-- 중앙 로그인 영역 -->
    <section class="master-login-content">
      <div class="master-login-card">
        <RouterLink to="/" class="master-login-card__close" aria-label="닫기">
          ×
        </RouterLink>

        <!-- 카드 타이틀 -->
        <div class="master-login-card__title">
          <img
            src="/APTeNLOGO.png"
            alt="아파트엔 로고"
            class="master-login-card__logo"
          />
          <h1>마스터 로그인</h1>
        </div>

        <!-- 폼 -->
        <form class="master-login-form" @submit.prevent="handleLogin">
          <!-- 이메일 -->
          <div class="field">
            <label class="field__label">이메일</label>
            <input
              v-model="form.email"
              type="email"
              class="field__input"
              :class="{ 'field__input--error': errors.email }"
              placeholder="이메일을 입력해주세요."
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
                placeholder="비밀번호를 입력해주세요."
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
          <p v-if="authStore.error" class="master-login__error">
            {{ authStore.error }}
          </p>

          <!-- 로그인 버튼 -->
          <button type="submit" class="master-login__btn" :disabled="authStore.loading">
            <span v-if="!authStore.loading">이메일로 로그인</span>
            <span v-else class="btn-spinner"></span>
          </button>
        </form>

        <!-- 하단 링크 -->
        <div class="master-login__links">
          <RouterLink to="/forgot-password" class="link">비밀번호 찾기</RouterLink>
          <span class="master-login__divider">|</span>
          <RouterLink to="/" class="link">메인으로 돌아가기</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.master-login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #eaeaec 0%, #fff 50%, #d6d6d7 100%);
  color: #1a202c;
}

/* 상단 바 */
.master-login-header {
  height: 64px;
  padding: 0 56px;
  display: flex;
  align-items: center;
  background: #0F1923;
}

.master-login-header__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ffffff;
  text-decoration: none;
}

.master-login-header__logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.master-login-header__brand span {
  font-size: 14px;
  font-weight: 700;
}

/* 중앙 영역 */
.master-login-content {
  min-height: calc(100vh - 64px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 20px;
}

/* 로그인 카드 */
.master-login-card {
  position: relative;
  width: 100%;
  max-width: 460px;
  padding: 48px 34px 34px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(30, 42, 62, 0.08);
  box-sizing: border-box;
}

.master-login-card__close {
  position: absolute;
  top: 18px;
  right: 20px;
  color: #4a5568;
  font-size: 22px;
  line-height: 1;
  text-decoration: none;
}

.master-login-card__title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 32px;
}

.master-login-card__logo {
  width: 76px;
  height: 76px;
  object-fit: contain;
}

.master-login-card__title h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #1a202c;
}

/* 폼 */
.master-login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field__label {
  font-size: 13px;
  font-weight: 700;
  color: #2d3748;
}

.field__input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #d9dee8;
  border-radius: 8px;
  font-size: 14px;
  color: #1a202c;
  outline: none;
  box-sizing: border-box;
}

.field__input:focus {
  border-color: #2b3a55;
  box-shadow: 0 0 0 3px rgba(43, 58, 85, 0.12);
}

.field__input::placeholder {
  color: #a0aec0;
}

.field__input--error {
  border-color: #e53e3e;
}

.field__pw-wrap {
  position: relative;
}

.field__input--pw {
  padding-right: 44px;
}

.field__pw-toggle {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  display: flex;
  padding: 0;
  border: 0;
  background: transparent;
  color: #8a94a6;
  cursor: pointer;
}

.field__pw-toggle svg {
  width: 18px;
  height: 18px;
}

.field__error {
  margin: 0;
  font-size: 12px;
  color: #e53e3e;
}

/* 에러 */
.master-login__error {
  margin: 0;
  padding: 9px 12px;
  border-radius: 8px;
  background: rgba(229, 62, 62, 0.08);
  color: #e53e3e;
  font-size: 13px;
  text-align: center;
}

/* 버튼 */
.master-login__btn {
  width: 100%;
  height: 46px;
  margin-top: 6px;
  border: 0;
  border-radius: 8px;
  background: #2D3142;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.master-login__btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 하단 링크 */
.master-login__links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 22px;
}

.master-login__divider {
  font-size: 12px;
  color: #b8c2d2;
}

.link {
  color: #8a94a6;
  font-size: 12px;
  text-decoration: none;
}

.link:hover {
  color: #2b3a55;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .master-login-header {
    padding: 0 20px;
  }

  .master-login-card {
    max-width: 100%;
    padding: 42px 24px 30px;
  }

  .master-login-card__logo {
    width: 64px;
    height: 64px;
  }

  .master-login-card__title h1 {
    font-size: 24px;
  }
}
</style>
