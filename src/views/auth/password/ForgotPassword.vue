<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import authApi from '@/api/authApi'

const router = useRouter()

// 이메일 입력 후 재설정 링크 발송
const form = reactive({ email: '' })
const errors = reactive({ email: '' })
const loading = ref(false)
const serverError = ref('')
const sent = ref(false) // 발송 완료 여부

async function handleSubmit() {
  errors.email = ''
  if (!form.email) {
    errors.email = '이메일을 입력해주세요.'
    return
  }
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(form.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
    return
  }
  loading.value = true
  serverError.value = ''
  try {
    await authApi.sendPasswordResetMail({ email: form.email })
    sent.value = true
  } catch (e) {
    serverError.value = e.response?.data?.message || '이메일 발송에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="forgot">

    <!-- 로고 -->
    <div class="forgot__logo">
      <svg viewBox="0 0 28 28" fill="none" class="forgot__logo-icon">
        <rect width="28" height="28" rx="6" fill="var(--resident-primary)"/>
        <path d="M7 20V10l7-4 7 4v10" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <rect x="11" y="14" width="6" height="6" rx="1" fill="white"/>
      </svg>
      <span class="forgot__logo-text">아파트엔</span>
    </div>

    <!-- 발송 완료 화면 -->
    <template v-if="sent">
      <div class="forgot__title-area">
        <h1 class="forgot__title">이메일을 확인하세요</h1>
        <p class="forgot__sub">비밀번호 재설정 링크를 이메일로 발송했습니다.</p>
      </div>
      <div class="forgot__complete">
        <p class="forgot__complete-email">{{ form.email }}</p>
        <p class="forgot__complete-desc">메일이 오지 않았다면 스팸함을 확인해주세요.</p>
      </div>
      <button type="button" class="btn-primary" @click="router.push('/login')">
        로그인으로 돌아가기
      </button>
    </template>

    <!-- 이메일 입력 화면 -->
    <template v-else>
      <div class="forgot__title-area">
        <h1 class="forgot__title">비밀번호 재설정</h1>
        <p class="forgot__sub">가입한 이메일로 재설정 링크를 발송합니다.</p>
      </div>

      <div class="forgot__form">
        <div class="field">
          <label class="field__label">이메일</label>
          <input
            v-model="form.email"
            type="email"
            class="field__input"
            :class="{ 'field__input--error': errors.email }"
            placeholder="가입한 이메일을 입력하세요"
            autocomplete="email"
          />
          <p v-if="errors.email" class="field__error">{{ errors.email }}</p>
        </div>

        <p v-if="serverError" class="forgot__error">{{ serverError }}</p>

        <button type="button" class="btn-primary" :disabled="loading" @click="handleSubmit">
          <span v-if="!loading">재설정 링크 발송</span>
          <span v-else class="btn-spinner"></span>
        </button>
      </div>
    </template>

  </div>
</template>

<style scoped>
.forgot {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.forgot__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
}
.forgot__logo-icon { width: 28px; height: 28px; }
.forgot__logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.forgot__title-area { text-align: center; }
.forgot__title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}
.forgot__sub {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.forgot__form { display: flex; flex-direction: column; gap: var(--space-16); }

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
.field__error {
  font-size: var(--font-size-label);
  color: var(--color-danger);
  margin: 0;
}

.forgot__error {
  font-size: var(--font-size-detail);
  color: var(--color-danger);
  background: rgba(231, 76, 60, 0.08);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-8);
  text-align: center;
  margin: 0;
}

/* 발송 완료 화면 */
.forgot__complete {
  text-align: center;
  padding: var(--space-24);
  background: var(--color-bg-surface);
  border-radius: var(--radius-12);
  box-shadow: var(--shadow-small);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
.forgot__complete-email {
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}
.forgot__complete-desc {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
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

.forgot__login-link {
  text-align: center;
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  margin: 0;
}
.link {
  color: var(--resident-primary);
  text-decoration: none;
  font-weight: 700;
}
</style>
