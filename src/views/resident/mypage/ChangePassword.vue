<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/apiClient'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()
const router = useRouter()

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const errors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const showPw = ref({
  current: false,
  new: false,
  confirm: false,
})

const loading = ref(false)
const showSuccessModal = ref(false)

function validate() {
  errors.value.currentPassword = ''
  errors.value.newPassword = ''
  errors.value.confirmPassword = ''
  let valid = true

  if (!form.value.currentPassword) {
    errors.value.currentPassword = '현재 비밀번호를 입력해주세요.'
    valid = false
  }

  if (!form.value.newPassword) {
    errors.value.newPassword = '새 비밀번호를 입력해주세요.'
    valid = false
  } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(form.value.newPassword)) {
    errors.value.newPassword = '8자 이상, 영문·숫자·특수문자를 포함해야 합니다.'
    valid = false
  }

  if (!form.value.confirmPassword) {
    errors.value.confirmPassword = '비밀번호 확인을 입력해주세요.'
    valid = false
  } else if (form.value.newPassword !== form.value.confirmPassword) {
    errors.value.confirmPassword = '비밀번호가 일치하지 않습니다.'
    valid = false
  }

  return valid
}

// 비밀번호 변경 — PATCH /api/users/me/password
async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    await apiClient.patch('/users/me/password', {
      currentPassword: form.value.currentPassword,
      newPassword: form.value.newPassword,
    })
    showSuccessModal.value = true
  } catch (e) {
    const msg = e.response?.data?.message
    if (msg) {
      errors.value.currentPassword = msg
    }
  } finally {
    loading.value = false
  }
}

function handleSuccessClose() {
  showSuccessModal.value = false
  router.push(`/resident/${authStore.complexId}/mypage`)
}
</script>

<template>
  <div class="change-password">
    <div class="field">
      <label class="field__label">현재 비밀번호</label>
      <div class="field__pw-wrap">
        <input
          v-model="form.currentPassword"
          :type="showPw.current ? 'text' : 'password'"
          class="field__input"
          :class="{ 'field__input--error': errors.currentPassword }"
          placeholder="현재 비밀번호를 입력하세요"
          autocomplete="current-password"
        />
        <button type="button" class="field__pw-toggle" @click="showPw.current = !showPw.current">
          <svg v-if="!showPw.current" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.8"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <p v-if="errors.currentPassword" class="field__error">{{ errors.currentPassword }}</p>
    </div>

    <div class="field">
      <label class="field__label">새 비밀번호</label>
      <div class="field__pw-wrap">
        <input
          v-model="form.newPassword"
          :type="showPw.new ? 'text' : 'password'"
          class="field__input"
          :class="{ 'field__input--error': errors.newPassword }"
          placeholder="8자 이상, 영문·숫자·특수문자 포함"
          autocomplete="new-password"
        />
        <button type="button" class="field__pw-toggle" @click="showPw.new = !showPw.new">
          <svg v-if="!showPw.new" viewBox="0 0 24 24" fill="none">
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

    <div class="field">
      <label class="field__label">새 비밀번호 확인</label>
      <div class="field__pw-wrap">
        <input
          v-model="form.confirmPassword"
          :type="showPw.confirm ? 'text' : 'password'"
          class="field__input"
          :class="{ 'field__input--error': errors.confirmPassword }"
          placeholder="새 비밀번호를 다시 입력하세요"
          autocomplete="new-password"
        />
        <button type="button" class="field__pw-toggle" @click="showPw.confirm = !showPw.confirm">
          <svg v-if="!showPw.confirm" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.8"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <p v-if="errors.confirmPassword" class="field__error">{{ errors.confirmPassword }}</p>
    </div>

    <button class="btn-submit" :disabled="loading" @click="handleSubmit">
      <span v-if="!loading">변경 완료</span>
      <span v-else class="btn-spinner" />
    </button>
  </div>

  <!-- 변경 완료 모달 -->
  <ResidentModal
    :visible="showSuccessModal"
    type="success"
    title="비밀번호 변경 완료"
    subtitle="새 비밀번호로 변경되었습니다."
    confirm-text="확인"
    confirm-type="primary"
    @close="handleSuccessClose"
    @confirm="handleSuccessClose"
  />
</template>

<style scoped>
.change-password {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.field__input {
  height: 48px;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  padding: 0 44px 0 14px;
  font-size: 14px;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field__input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.field__input--error {
  border-color: var(--color-danger) !important;
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
  font-size: 12px;
  color: var(--color-danger);
  margin: 0;
}

.btn-submit {
  height: 52px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
  transition: opacity 0.15s;
}

.btn-submit:disabled {
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
  to { transform: rotate(360deg); }
}
</style>
