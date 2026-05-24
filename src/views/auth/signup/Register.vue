<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import authApi from '@/api/authApi'
import { getPublicComplexes } from '@/api/apartmentComplexApi'
import ResidentModal from '@/components/resident/ResidentModal.vue' // 회원가입 성공 모달

const router = useRouter()

// 회원가입 단계
// 1: 기본 정보 입력
// 2: SMS 인증
const step = ref(1)

// 단지 목록 (getPublicComplexes로 로드)
const complexes = ref([])
const complexesLoading = ref(false)

// 폼 입력값
const form = reactive({
  apartmentComplexUid: '', // 선택한 단지 UID
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  phone: '',
  birthDate: '',           // yyyy-MM-dd 형식
  dong: '',
  ho: '',
  authCode: '',            // SMS 인증코드 (백엔드 필드명: authCode)
})

// 클라이언트 유효성 검사 에러 메시지
const errors = reactive({
  apartmentComplexUid: '',
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  phone: '',
  birthDate: '',
  dong: '',
  ho: '',
  authCode: '',
})

// 비밀번호 보이기/숨기기 토글
const showPw = ref(false)
const showPwConfirm = ref(false)

// SMS 인증 상태
const smsLoading = ref(false)  // SMS 발송/검증 중
const smsSent = ref(false)     // SMS 발송 완료 여부
const smsVerified = ref(false) // SMS 인증 완료 여부
const smsError = ref('')       // SMS 관련 서버 에러 메시지

// 회원가입 처리 상태
const loading = ref(false)
const serverError = ref('')

// 이메일 중복 확인 상태
const emailChecked = ref(false)
const emailCheckMsg = ref('')
const emailCheckError = ref(false)

// 회원가입 성공 모달 표시 여부
const showSuccessModal = ref(false)

// 이메일 변경 시 중복 확인 초기화
watch(() => form.email, () => {
  emailChecked.value = false
  emailCheckMsg.value = ''
  emailCheckError.value = false
})

// 단지 목록 로드 (컴포넌트 마운트 시 호출)
async function loadComplexes() {
  complexesLoading.value = true
  try {
    const data = await getPublicComplexes()
    console.log(data)
    complexes.value = Array.isArray(data) ? data : data?.content ?? []
  } catch (e) {
    complexes.value = []
  } finally {
    complexesLoading.value = false
  }
}

onMounted(() => {
  loadComplexes()
})

// 이메일 중복 확인
async function checkEmail() {
  if (!form.email) {
    errors.email = '이메일을 입력해주세요.'
    return
  }
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(form.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
    return
  }
  errors.email = ''
  try {
    await authApi.checkEmail({ email: form.email })
    emailChecked.value = true
    emailCheckError.value = false
    emailCheckMsg.value = '사용 가능한 이메일입니다.'
  } catch (e) {
    emailChecked.value = false
    emailCheckError.value = true
    emailCheckMsg.value = e.response?.data?.message || '이미 사용중인 이메일입니다.'
  }
}

// 1단계 유효성 검사
function validateStep1() {
  errors.apartmentComplexUid = ''
  errors.email = ''
  errors.password = ''
  errors.passwordConfirm = ''
  errors.name = ''
  errors.phone = ''
  errors.birthDate = ''
  errors.dong = ''
  errors.ho = ''
  let valid = true

  // 단지 선택
  if (!form.apartmentComplexUid) {
    errors.apartmentComplexUid = '단지를 선택해주세요.'
    valid = false
  }

  // 이메일
  if (!form.email) {
    errors.email = '이메일을 입력해주세요.'
    valid = false
  } else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(form.email)) {
    errors.email = '올바른 이메일 형식이 아닙니다.'
    valid = false
  } else if (!emailChecked.value) {
    errors.email = '이메일 중복 확인을 해주세요.'
    valid = false
  }

  // 비밀번호 — 백엔드 정책 기준
  if (!form.password) {
    errors.password = '비밀번호를 입력해주세요.'
    valid = false
  } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(form.password)) {
    errors.password = '8자 이상, 영문·숫자·특수문자를 포함해야 합니다.'
    valid = false
  }

  // 비밀번호 확인
  if (!form.passwordConfirm) {
    errors.passwordConfirm = '비밀번호 확인을 입력해주세요.'
    valid = false
  } else if (form.password !== form.passwordConfirm) {
    errors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    valid = false
  }

  // 이름
  if (!form.name) { errors.name = '이름을 입력해주세요.'; valid = false }

  // 휴대폰 번호
  if (!form.phone) { errors.phone = '휴대폰 번호를 입력해주세요.'; valid = false }

  // 생년월일
  if (!form.birthDate) { errors.birthDate = '생년월일을 입력해주세요.'; valid = false }

  // 동
  if (!form.dong) { errors.dong = '동을 입력해주세요.'; valid = false }

  // 호
  if (!form.ho) { errors.ho = '호를 입력해주세요.'; valid = false }

  return valid
}

// 2단계 유효성 검사
function validateStep2() {
  errors.authCode = ''
  if (!form.authCode) {
    errors.authCode = '인증번호를 입력해주세요.'
    return false
  }
  return true
}

// 1단계 → 2단계 이동 (SMS 발송)
async function goToStep2() {
  if (!validateStep1()) return
  await sendSms()
  if (!smsError.value) step.value = 2
}

// SMS 인증번호 발송
async function sendSms() {
  smsLoading.value = true
  smsError.value = ''
  try {
    await authApi.sendSmsCode({ phone: form.phone })
    smsSent.value = true
  } catch (e) {
    smsError.value = e.response?.data?.message || 'SMS 발송에 실패했습니다.'
  } finally {
    smsLoading.value = false
  }
}

// SMS 인증번호 재발송
async function resendSms() {
  smsSent.value = false
  smsVerified.value = false
  form.authCode = ''
  await sendSms()
}

// SMS 인증번호 검증
async function verifySms() {
  if (!validateStep2()) return
  smsLoading.value = true
  smsError.value = ''
  try {
    await authApi.verifySmsCode({ phone: form.phone, code: form.authCode })
    smsVerified.value = true
  } catch (e) {
    smsError.value = e.response?.data?.message || '인증에 실패했습니다.'
  } finally {
    smsLoading.value = false
  }
}

// 회원가입 최종 제출 (SMS 인증 완료 후에만 가능)
async function handleRegister() {
  if (!smsVerified.value) {
    smsError.value = '휴대폰 인증을 완료해주세요.'
    return
  }
  loading.value = true
  serverError.value = ''
  try {
    await authApi.register({
      apartmentComplexUid: form.apartmentComplexUid,
      email: form.email,
      password: form.password,
      name: form.name,
      phone: form.phone,
      birthDate: form.birthDate,
      dong: form.dong,
      ho: form.ho,
      authCode: form.authCode,
    })
    // 회원가입 성공 → 바로 이동하지 않고 성공 모달 표시
    showSuccessModal.value = true
  } catch (e) {
    serverError.value = e.response?.data?.message || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 성공 모달 닫기 → 로그인 페이지로 이동
function handleSuccessClose() {
  showSuccessModal.value = false
  router.push('/login')
}
</script>

<template>
  <div class="register">

    <!-- 로고 -->
    <div class="register__logo">
      <svg viewBox="0 0 28 28" fill="none" class="register__logo-icon">
        <rect width="28" height="28" rx="6" fill="var(--resident-primary)"/>
        <path d="M7 20V10l7-4 7 4v10" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <rect x="11" y="14" width="6" height="6" rx="1" fill="white"/>
      </svg>
      <span class="register__logo-text">아파트엔</span>
    </div>

    <!-- 제목 -->
    <div class="register__title-area">
      <h1 class="register__title">회원가입</h1>
      <p class="register__sub">
        {{ step === 1 ? '기본 정보를 입력해주세요' : '휴대폰 인증을 완료해주세요' }}
      </p>
    </div>

    <!-- 단계 표시 -->
    <div class="register__steps">
      <div class="register__step" :class="{ 'register__step--active': step === 1, 'register__step--done': step > 1 }">1</div>
      <div class="register__step-line"></div>
      <div class="register__step" :class="{ 'register__step--active': step === 2 }">2</div>
    </div>

    <!-- 1단계: 기본 정보 입력 -->
    <form v-if="step === 1" class="register__form" @submit.prevent="goToStep2">

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
        <p v-if="errors.apartmentComplexUid" class="field__error">{{ errors.apartmentComplexUid }}</p>
      </div>

      <!-- 이메일 + 중복 확인 버튼 -->
      <div class="field">
        <label class="field__label">이메일</label>
        <div class="field__row">
          <input
            v-model="form.email"
            type="email"
            class="field__input"
            :class="{ 'field__input--error': errors.email }"
            placeholder="example@email.com"
            autocomplete="email"
          />
          <!-- 이메일 중복 확인 버튼 -->
          <button type="button" class="btn-check" @click="checkEmail">중복 확인</button>
        </div>
        <!-- 중복 확인 결과 메시지 -->
        <p v-if="emailCheckMsg" :class="emailCheckError ? 'field__error' : 'field__success'">
          {{ emailCheckMsg }}
        </p>
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
            placeholder="8자 이상, 영문·숫자·특수문자 포함"
            autocomplete="new-password"
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

      <!-- 비밀번호 확인 -->
      <div class="field">
        <label class="field__label">비밀번호 확인</label>
        <div class="field__pw-wrap">
          <input
            v-model="form.passwordConfirm"
            :type="showPwConfirm ? 'text' : 'password'"
            class="field__input field__input--pw"
            :class="{ 'field__input--error': errors.passwordConfirm }"
            placeholder="비밀번호를 다시 입력하세요"
            autocomplete="new-password"
          />
          <button type="button" class="field__pw-toggle" @click="showPwConfirm = !showPwConfirm">
            <svg v-if="!showPwConfirm" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <p v-if="errors.passwordConfirm" class="field__error">{{ errors.passwordConfirm }}</p>
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

      <!-- 휴대폰 번호 -->
      <div class="field">
        <label class="field__label">휴대폰 번호</label>
        <input
          v-model="form.phone"
          type="tel"
          class="field__input"
          :class="{ 'field__input--error': errors.phone }"
          placeholder="01012345678"
          autocomplete="tel"
        />
        <p v-if="errors.phone" class="field__error">{{ errors.phone }}</p>
      </div>

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

      <!-- 다음 버튼 (SMS 발송) -->
      <button type="submit" class="btn-primary" :disabled="smsLoading">
        <span v-if="!smsLoading">다음</span>
        <span v-else class="btn-spinner"></span>
      </button>

    </form>

    <!-- 2단계: SMS 인증 -->
    <div v-if="step === 2" class="register__form">

      <!-- 안내 메시지 -->
      <div class="sms-info">
        <p class="sms-info__text">
          <strong>{{ form.phone }}</strong> 으로<br>인증번호를 발송했습니다.
        </p>
      </div>

      <!-- 인증번호 입력 -->
      <div class="field">
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

      <!-- SMS/서버 에러 메시지 -->
      <p v-if="smsError" class="register__error">{{ smsError }}</p>

      <!-- 인증 완료 메시지 -->
      <p v-if="smsVerified" class="register__success">✓ 인증이 완료되었습니다.</p>

      <!-- 인증번호 확인 버튼 -->
      <button v-if="!smsVerified" type="button" class="btn-primary" :disabled="smsLoading" @click="verifySms">
        <span v-if="!smsLoading">인증번호 확인</span>
        <span v-else class="btn-spinner"></span>
      </button>

      <!-- 서버 에러 -->
      <p v-if="serverError" class="register__error">{{ serverError }}</p>

      <!-- 회원가입 완료 버튼 -->
      <button type="button" class="btn-primary" :disabled="!smsVerified || loading" @click="handleRegister">
        <span v-if="!loading">회원가입 완료</span>
        <span v-else class="btn-spinner"></span>
      </button>

      <!-- 인증번호 재발송 -->
      <button type="button" class="btn-text" :disabled="smsLoading" @click="resendSms">
        인증번호 재발송
      </button>

      <!-- 이전 단계로 -->
      <button type="button" class="btn-text" @click="step = 1">
        ← 이전으로
      </button>

    </div>

    <!-- 로그인 페이지 링크 -->
    <p class="register__login-link">
      이미 계정이 있으신가요?
      <RouterLink to="/login" class="link">로그인</RouterLink>
    </p>

    <!-- 회원가입 성공 모달 — 확인 버튼 클릭 시 로그인 페이지로 이동 -->
    <ResidentModal
      :visible="showSuccessModal"
      type="success"
      title="회원가입 완료"
      subtitle="관리자 승인 후 서비스를 이용하실 수 있습니다."
      confirm-text="로그인하러 가기"
      @close="handleSuccessClose"
    />

  </div>
</template>

<style scoped>
.register {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.register__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
}
.register__logo-icon { width: 28px; height: 28px; }
.register__logo-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.register__title-area { text-align: center; }
.register__title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}
.register__sub {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.register__steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
}
.register__step {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-detail);
  font-weight: 700;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}
.register__step--active {
  border-color: var(--resident-primary);
  background: var(--resident-primary);
  color: white;
}
.register__step--done {
  border-color: var(--resident-primary);
  color: var(--resident-primary);
}
.register__step-line {
  width: 40px;
  height: 2px;
  background: var(--color-border);
}

.register__form { display: flex; flex-direction: column; gap: var(--space-16); }

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
.field__input:disabled {
  background: var(--color-bg-muted);
  cursor: not-allowed;
}
.field__input--error { border-color: var(--color-danger) !important; }
.field__input--pw { padding-right: 44px; }

/* 단지 선택 드롭다운 */
.field__select { cursor: pointer; }

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

/* 가로 행 */
.field__row {
  display: flex;
  gap: var(--space-8);
}
.field__row .field {
  flex: 1;
  min-width: 0; /* 넘침 방지 */
}
.field__row .field .field__input {
  width: 100%;
}

/* 이메일 중복 확인 버튼 */
.btn-check {
  height: 46px;
  padding: 0 var(--space-16);
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
.btn-check:hover { background: var(--color-border); }

/* 이메일 중복 확인 성공 메시지 */
.field__success {
  font-size: var(--font-size-label);
  color: var(--resident-success);
  margin: 0;
}

.sms-info {
  background: var(--color-bg-muted);
  border-radius: var(--radius-8);
  padding: var(--space-16);
  text-align: center;
}
.sms-info__text {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  line-height: 1.6;
  margin: 0;
}

.register__error {
  font-size: var(--font-size-detail);
  color: var(--color-danger);
  background: rgba(231, 76, 60, 0.08);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-8);
  text-align: center;
  margin: 0;
}
.register__success {
  font-size: var(--font-size-detail);
  color: var(--resident-success);
  text-align: center;
  font-weight: 600;
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

.btn-text {
  height: 36px;
  background: none;
  border: none;
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.15s;
}
.btn-text:hover { color: var(--color-text-primary); }
.btn-text:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spinner {
  display: inline-block;
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.register__login-link {
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
