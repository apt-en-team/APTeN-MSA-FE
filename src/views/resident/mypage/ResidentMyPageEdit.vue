<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import authApi from '@/api/authApi'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  name: '',
  phone: '',
})

const errors = ref({
  name: '',
  phone: '',
})

const loading = ref(false)
const showSuccessModal = ref(false)
const serverError = ref('')

// 기존 내 정보 불러오기 — GET /api/users/me
async function fetchUserInfo() {
  try {
    const data = await authApi.getMyInfo()
    form.value.name = data.name || ''
    form.value.phone = data.phone || ''
  } catch (e) {
    console.error('내 정보 조회 실패', e)
  }
}

function validate() {
  errors.value.name = ''
  errors.value.phone = ''
  let valid = true

  if (!form.value.name) {
    errors.value.name = '이름을 입력해주세요.'
    valid = false
  }

  if (!form.value.phone) {
    errors.value.phone = '휴대폰 번호를 입력해주세요.'
    valid = false
  } else if (!/^01[0-9]{8,9}$/.test(form.value.phone)) {
    errors.value.phone = '올바른 휴대폰 번호를 입력해주세요.'
    valid = false
  }

  return valid
}

// 내 정보 수정 — PATCH /api/users/me
async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  serverError.value = ''
  try {
    await authApi.updateMyInfo({
      name: form.value.name,
      phone: form.value.phone,
    })
    // authStore 이름도 즉시 반영
    authStore.name = form.value.name
    showSuccessModal.value = true
  } catch (e) {
    serverError.value = e.response?.data?.resultMessage || '수정 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

function handleSuccessClose() {
  showSuccessModal.value = false
  router.push(`/resident/${authStore.complexId}/mypage`)
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<template>
  <div class="edit-page">

    <!-- 안내 문구 -->
    <p class="edit-page__desc">이름과 휴대폰 번호를 수정할 수 있습니다.</p>

    <!-- 이름 -->
    <div class="field">
      <label class="field__label">이름</label>
      <input
        v-model="form.name"
        type="text"
        class="field__input"
        :class="{ 'field__input--error': errors.name }"
        placeholder="이름을 입력하세요"
      />
      <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
    </div>

    <!-- 휴대폰 번호 -->
    <div class="field">
      <label class="field__label">휴대폰 번호</label>
      <input
        v-model="form.phone"
        type="tel"
        class="field__input"
        :class="{ 'field__input--error': errors.phone }"
        placeholder="01012345678"
      />
      <p v-if="errors.phone" class="field__error">{{ errors.phone }}</p>
    </div>

    <!-- 서버 에러 -->
    <p v-if="serverError" class="edit-page__error">{{ serverError }}</p>

    <!-- 저장 버튼 -->
    <button class="btn-submit" :disabled="loading" @click="handleSubmit">
      <span v-if="!loading">수정 완료</span>
      <span v-else class="btn-spinner" />
    </button>

  </div>

  <!-- 수정 완료 모달 -->
  <ResidentModal
    :visible="showSuccessModal"
    type="success"
    title="수정 완료"
    subtitle="내 정보가 수정되었습니다."
    confirm-text="확인"
    confirm-type="primary"
    @close="handleSuccessClose"
    @confirm="handleSuccessClose"
  />
</template>

<style scoped>
.edit-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  padding: var(--space-16);
}

.edit-page__desc {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  margin: 0;
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
  height: 48px;
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

.field__error {
  font-size: var(--font-size-label);
  color: var(--color-danger);
  margin: 0;
}

.edit-page__error {
  font-size: var(--font-size-detail);
  color: var(--color-danger);
  background: rgba(231, 76, 60, 0.08);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-8);
  text-align: center;
  margin: 0;
}

.btn-submit {
  height: 52px;
  background: var(--resident-primary);
  color: white;
  border: none;
  border-radius: var(--radius-8);
  font-size: var(--font-size-body);
  font-weight: 700;
  cursor: pointer;
  margin-top: var(--space-8);
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
