<script setup>
import {ref, reactive, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import authApi from '@/api/authApi'
import {getPublicComplexes} from '@/api/apartmentComplexApi'

const router = useRouter()
const route = useRoute()

// 단지 목록
const complexes = ref([])
const complexesLoading = ref(false)

// 폼 입력값 — 소셜에서 받은 email, name 쿼리로 pre-fill
const form = reactive({
  apartmentComplexUid: '',
  email: route.query.email || '',
  name: route.query.name || '',
  phone: '',
  birthDate: '',
  dong: '',
  ho: '',
  authCode: '',
})

// 유효성 검사 에러
const errors = reactive({
  apartmentComplexUid: '',
  name: '',
  phone: '',
  birthDate: '',
  dong: '',
  ho: '',
  authCode: '',
})

// SMS 인증 상태
const smsLoading = ref(false)
const smsSent = ref(false)
const smsVerified = ref(false)
const smsError = ref('')

// 처리 상태
const loading = ref(false)
const serverError = ref('')

// 단지 목록 로드
async function loadComplexes() {
  complexesLoading.value = true
  try {
    const data = await getPublicComplexes()
    complexes.value = Array.isArray(data) ? data : data?.content ?? []
  } catch (e) {
    complexes.value = []
  } finally {
    complexesLoading.value = false
  }
}

onMounted(() => {
  loadComplexes()
  // 소셜 로그인 없이 직접 접근 시 로그인 페이지로
  if (!route.query.email) {
    router.replace('/login')
  }
})

// SMS 인증번호 발송
async function sendSms() {
  if (!form.phone) {
    errors.phone = '휴대폰 번호를 입력해주세요.'
    return
  }
  errors.phone = ''
  smsLoading.value = true
  smsError.value = ''
  try {
    await authApi.sendSmsCode({phone: form.phone})
    smsSent.value = true
  } catch (e) {
    smsError.value = e.response?.data?.resultMessage || 'SMS 발송에 실패했습니다.'
  } finally {
    smsLoading.value = false
  }
}

// SMS 인증번호 검증
async function verifySms() {
  if (!form.authCode) {
    errors.authCode = '인증번호를 입력해주세요.'
    return
  }
  errors.authCode = ''
  smsLoading.value = true
  smsError.value = ''
  try {
    await authApi.verifySmsCode({phone: form.phone, code: form.authCode})
    smsVerified.value = true
  } catch (e) {
    smsError.value = e.response?.data?.resultMessage || '인증에 실패했습니다.'
  } finally {
    smsLoading.value = false
  }
}

// 유효성 검사
function validate() {
  errors.apartmentComplexUid = ''
  errors.name = ''
  errors.phone = ''
  errors.birthDate = ''
  errors.dong = ''
  errors.ho = ''
  let valid = true

  if (!form.apartmentComplexUid) {
    errors.apartmentComplexUid = '단지를 선택해주세요.';
    valid = false
  }
  if (!form.name) {
    errors.name = '이름을 입력해주세요.';
    valid = false
  }
  if (!form.phone) {
    errors.phone = '휴대폰 번호를 입력해주세요.';
    valid = false
  }
  if (!form.birthDate) {
    errors.birthDate = '생년월일을 입력해주세요.';
    valid = false
  }
  if (!form.dong) {
    errors.dong = '동을 입력해주세요.';
    valid = false
  }
  if (!form.ho) {
    errors.ho = '호를 입력해주세요.';
    valid = false
  }
  if (!smsVerified.value) {
    smsError.value = '휴대폰 인증을 완료해주세요.';
    valid = false
  }

  return valid
}

// 소셜 회원가입 완료 제출
async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  serverError.value = ''
  try {
    await authApi.socialSignup({
      email: form.email,
      name: form.name,
      phone: form.phone,
      birthDate: form.birthDate,
      complexId: form.apartmentComplexUid,
      dong: form.dong,
      ho: form.ho,
      authCode: form.authCode,
    })
    router.push('/login')
  } catch (e) {
    serverError.value = e.response?.data?.resultMessage || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="social-signup">

    <!-- 로고 -->
    <div class="social-signup__logo">
      <svg viewBox="0 0 28 28" fill="none" class="social-signup__logo-icon">
        <rect width="28" height="28" rx="6" fill="var(--resident-primary)"/>
        <path d="M7 20V10l7-4 7 4v10" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <rect x="11" y="14" width="6" height="6" rx="1" fill="white"/>
      </svg>
      <span class="social-signup__logo-text">아파트엔</span>
    </div>

    <!-- 제목 -->
    <div class="social-signup__title-area">
      <h1 class="social-signup__title">추가 정보 입력</h1>
      <p class="social-signup__sub">서비스 이용을 위해 추가 정보를 입력해주세요.</p>
    </div>

    <!-- 이메일 (읽기 전용) -->
    <div class="social-signup__email-box">
      <span class="social-signup__email-label">소셜 계정</span>
      <span class="social-signup__email">{{ form.email }}</span>
    </div>

    <div class="social-signup__form">

      <!-- 단지 선택 -->
      <div class="field">
        <label class="field__label">아파트 단지 선택</label>
        <select
          v-model="form.apartmentComplexUid"
          class="field__input field__select"
          :class="{ 'field__input--error': errors.apartmentComplexUid }"
          :disabled="complexesLoading"
        >
          <option value="">단지를 선택해주세요</option>
          <option
            v-for="complex in complexes"
            :key="complex.complexId"
            :value="complex.complexId"
          >
            {{ complex.name }}
          </option>
        </select>
        <p v-if="errors.apartmentComplexUid" class="field__error">{{
            errors.apartmentComplexUid
          }}</p>
      </div>

      <!-- 이름 -->
      <div class="field">
        <label class="field__label">이름</label>
        <input
          v-model="form.name"
          type="text"
          class="field__input"
          :class="{ 'field__input--error': errors.name }"
          placeholder="홍길동"
          autocomplete="name"
        />
        <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
      </div>

      <!-- 휴대폰 번호 + SMS 발송 -->
      <div class="field">
        <label class="field__label">휴대폰 번호</label>
        <div class="field__row">
          <input
            v-model="form.phone"
            type="tel"
            class="field__input"
            :class="{ 'field__input--error': errors.phone }"
            placeholder="01012345678"
            :disabled="smsSent"
            autocomplete="tel"
          />
          <button type="button" class="btn-check" :disabled="smsLoading || smsSent"
                  @click="sendSms">
            {{ smsSent ? '발송완료' : '인증발송' }}
          </button>
        </div>
        <p v-if="errors.phone" class="field__error">{{ errors.phone }}</p>
      </div>

      <!-- 인증번호 입력 -->
      <div v-if="smsSent" class="field">
        <label class="field__label">인증번호</label>
        <input
          v-model="form.authCode"
          type="text"
          class="field__input"
          :class="{ 'field__input--error': errors.authCode }"
          placeholder="인증번호 6자리"
          maxlength="6"
          :disabled="smsVerified"
        />
        <p v-if="errors.authCode" class="field__error">{{ errors.authCode }}</p>
      </div>

      <!-- SMS 에러 / 인증 완료 -->
      <p v-if="smsError" class="social-signup__error">{{ smsError }}</p>
      <p v-if="smsVerified" class="social-signup__success">✓ 인증이 완료되었습니다.</p>

      <!-- 인증번호 확인 버튼 -->
      <button v-if="smsSent && !smsVerified" type="button" class="btn-primary"
              :disabled="smsLoading" @click="verifySms">
        <span v-if="!smsLoading">인증번호 확인</span>
        <span v-else class="btn-spinner"></span>
      </button>

      <!-- 생년월일 -->
      <div class="field">
        <label class="field__label">생년월일</label>
        <input
          v-model="form.birthDate"
          type="date"
          class="field__input"
          :class="{ 'field__input--error': errors.birthDate }"
        />
        <p v-if="errors.birthDate" class="field__error">{{ errors.birthDate }}</p>
      </div>

      <!-- 동 / 호 -->
      <div class="field__row">
        <div class="field">
          <label class="field__label">동</label>
          <input
            v-model="form.dong"
            type="text"
            class="field__input"
            :class="{ 'field__input--error': errors.dong }"
            placeholder="101"
          />
          <p v-if="errors.dong" class="field__error">{{ errors.dong }}</p>
        </div>
        <div class="field">
          <label class="field__label">호</label>
          <input
            v-model="form.ho"
            type="text"
            class="field__input"
            :class="{ 'field__input--error': errors.ho }"
            placeholder="1001"
          />
          <p v-if="errors.ho" class="field__error">{{ errors.ho }}</p>
        </div>
      </div>

      <!-- 서버 에러 -->
      <p v-if="serverError" class="social-signup__error">{{ serverError }}</p>

      <!-- 가입 완료 버튼 -->
      <button type="button" class="btn-primary" :disabled="!smsVerified || loading"
              @click="handleSubmit">
        <span v-if="!loading">가입 완료</span>
        <span v-else class="btn-spinner"></span>
      </button>

      <!-- 재발송 -->
      <button v-if="smsSent && !smsVerified" type="button" class="btn-text" :disabled="smsLoading"
              @click="sendSms">
        인증번호 재발송
      </button>

    </div>

  </div>
</template>

<style scoped>
.social-signup {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

/* 로고 */
.social-signup__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
}

.social-signup__logo-icon {
  width: 28px;
  height: 28px;
}

.social-signup__logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}

/* 제목 */
.social-signup__title-area {
  text-align: center;
}

.social-signup__title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}

.social-signup__sub {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* 소셜 이메일 표시 박스 */
.social-signup__email-box {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  background: var(--color-bg-muted);
  border-radius: var(--radius-8);
  padding: var(--space-12) var(--space-16);
}

.social-signup__email-label {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.social-signup__email {
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 폼 */
.social-signup__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

/* 필드 공통 */
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

.field__input:disabled {
  background: var(--color-bg-muted);
  cursor: not-allowed;
}

.field__input--error {
  border-color: var(--color-danger) !important;
}

.field__select {
  cursor: pointer;
}

.field__error {
  font-size: var(--font-size-label);
  color: var(--color-danger);
  margin: 0;
}

/* 가로 행 */
.field__row {
  display: flex;
  gap: var(--space-8);
}

.field__row .field {
  flex: 1;
  min-width: 0;
}

.field__row .field__input {
  width: 100%;
}

/* 인증 발송 버튼 */
.btn-check {
  height: 46px;
  padding: 0 var(--space-12);
  background: var(--color-bg-muted);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-8);
  font-size: var(--font-size-detail);
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn-check:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 에러/성공 메시지 */
.social-signup__error {
  font-size: var(--font-size-detail);
  color: var(--color-danger);
  background: rgba(231, 76, 60, 0.08);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-8);
  text-align: center;
  margin: 0;
}

.social-signup__success {
  font-size: var(--font-size-detail);
  color: var(--resident-success);
  text-align: center;
  font-weight: 600;
  margin: 0;
}

/* 버튼 */
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

.btn-text {
  height: 36px;
  background: none;
  border: none;
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  cursor: pointer;
  text-decoration: underline;
}

.btn-text:disabled {
  opacity: 0.5;
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
</style>
