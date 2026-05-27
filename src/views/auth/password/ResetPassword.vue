<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import authApi from '@/api/authApi'

const router = useRouter()
const route = useRoute()

// URL 쿼리에서 토큰 추출 — 이메일 링크에 ?token=xxx 형식으로 전달됨
const token = ref(route.query.token || '')

// 폼 입력값
const form = reactive({
  newPassword: '',
  newPasswordConfirm: '',
})

// 유효성 검사 에러
const errors = reactive({
  newPassword: '',
  newPasswordConfirm: '',
})

// 비밀번호 보이기/숨기기
const showNew = ref(false)
const showConfirm = ref(false)

// 처리 상태
const loading = ref(false)
const serverError = ref('')
const success = ref(false)

// 토큰 없으면 로그인 페이지로
onMounted(() => {
  if (!token.value) {
    router.replace('/login')
  }
})

// 유효성 검사
function validate() {
  errors.newPassword = ''
  errors.newPasswordConfirm = ''
  let valid = true

  if (!form.newPassword) {
    errors.newPassword = '새 비밀번호를 입력해주세요.'
    valid = false
  } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(form.newPassword)) {
    errors.newPassword = '8자 이상, 영문·숫자·특수문자를 포함해야 합니다.'
    valid = false
  }

  if (!form.newPasswordConfirm) {
    errors.newPasswordConfirm = '비밀번호 확인을 입력해주세요.'
    valid = false
  } else if (form.newPassword !== form.newPasswordConfirm) {
    errors.newPasswordConfirm = '비밀번호가 일치하지 않습니다.'
    valid = false
  }

  return valid
}

// 비밀번호 재설정 제출
async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  serverError.value = ''
  try {
    await authApi.resetPassword({
      token: token.value,
      newPassword: form.newPassword,
    })
    success.value = true
  } catch (e) {
    serverError.value = e.response?.data?.message || '비밀번호 재설정에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="reset">

    <!-- 로고 -->
    <div class="reset__logo">
      <svg viewBox="0 0 28 28" fill="none" class="reset__logo-icon">
        <rect width="28" height="28" rx="6" fill="var(--resident-primary)"/>
        <path d="M7 20V10l7-4 7 4v10" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <rect x="11" y="14" width="6" height="6" rx="1" fill="white"/>
      </svg>
      <span class="reset__logo-text">아파트엔</span>
    </div>

    <!-- 완료 화면 -->
    <template v-if="success">
      <div class="reset__title-area">
        <h1 class="reset__title">비밀번호 재설정 완료</h1>
        <p class="reset__sub">새 비밀번호로 로그인해주세요.</p>
      </div>
      <button type="button" class="btn-primary" @click="router.push('/login')">
        로그인하러 가기
      </button>
    </template>

    <!-- 재설정 폼 -->
    <template v-else>
      <div class="reset__title-area">
        <h1 class="reset__title">새 비밀번호 설정</h1>
        <p class="reset__sub">새로 사용할 비밀번호를 입력해주세요.</p>
      </div>

      <div class="reset__form">

        <!-- 새 비밀번호 -->
        <div class="field">
          <label class="field__label">새 비밀번호</label>
          <div class="field__pw-wrap">
            <input
              v-model="form.newPassword"
              :type="showNew ? 'text' : 'password'"
              class="field__input field__input--pw"
              :class="{ 'field__input--error': errors.newPassword }"
              placeholder="8자 이상, 영문·숫자·특수문자 포함"
              autocomplete="new-password"
            />
            <button type="button" class="field__pw-toggle" @click="showNew = !showNew">
              <svg v-if="!showNew" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.8"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <p v-if="errors.newPassword" class="field__error">{{ errors.newPassword }}</p>
        </div>

        <!-- 새 비밀번호 확인 -->
        <div class="field">
          <label class="field__label">새 비밀번호 확인</label>
          <div class="field__pw-wrap">
            <input
              v-model="form.newPasswordConfirm"
              :type="showConfirm ? 'text' : 'password'"
              class="field__input field__input--pw"
              :class="{ 'field__input--error': errors.newPasswordConfirm }"
              placeholder="새 비밀번호를 다시 입력하세요"
              autocomplete="new-password"
            />
            <button type="button" class="field__pw-toggle" @click="showConfirm = !showConfirm">
              <svg v-if="!showConfirm" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.8"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <p v-if="errors.newPasswordConfirm" class="field__error">{{ errors.newPasswordConfirm }}</p>
        </div>

        <!-- 서버 에러 -->
        <p v-if="serverError" class="reset__error">{{ serverError }}</p>

        <!-- 변경 버튼 -->
        <button type="button" class="btn-primary" :disabled="loading" @click="handleSubmit">
          <span v-if="!loading">비밀번호 재설정</span>
          <span v-else class="btn-spinner"></span>
        </button>

      </div>
    </template>

  </div>
</template>

<style scoped>
.reset {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.reset__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
}
.reset__logo-icon { width: 28px; height: 28px; }
.reset__logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.reset__title-area { text-align: center; }
.reset__title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}
.reset__sub {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.reset__form { display: flex; flex-direction: column; gap: var(--space-16); }

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
  border-color: var(--resident-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}
.field__input--error { border-color: var(--color-danger) !important; }
.field__input--pw { padding-right: 44px; }
.field__error {
  font-size: var(--font-size-label);
  color: var(--color-danger);
  margin: 0;
}

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

.reset__error {
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
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-spinner {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
