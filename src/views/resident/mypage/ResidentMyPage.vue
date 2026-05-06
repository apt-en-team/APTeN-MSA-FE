<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import apiClient from '@/api/apiClient'
import ResidentModal from '@/components/resident/ResidentModal.vue'


const router = useRouter()
const authStore = useAuthStore()

// 사용자 정보 — onMounted에서 GET /api/users/me 조회 후 채움
const userInfo = reactive({
  name: '',
  complexId: null,
  building: '',
  unit: '',
  birthDate: '',
  phone: '',
})

// 로그아웃 모달
const showLogoutModal = ref(false)

// 회원 탈퇴 모달
const showWithdrawModal = ref(false)
const withdrawPassword = ref('')
const withdrawError = ref('')

const quickMenus = [
  {
    label: '관리비 조회',
    path: '/resident/bill',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    highlight: true,
  },
  {
    label: '내 차량',
    path: '/resident/vehicle',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 12h14"/></svg>`,
    highlight: false,
  },
  {
    label: '고정 방문차량 목록',
    path: '/resident/visitor-vehicle',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>`,
    highlight: false,
  },
  {
    label: '내 예약',
    path: '/resident/reservation',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    highlight: false,
  },
  {
    label: '내가 쓴 글',
    path: '/resident/my-posts',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    highlight: false,
  },
  {
    label: '비밀번호 변경',
    path: '/resident/mypage/password',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    highlight: false,
  },
]

// 내 계정 정보 조회 — GET /api/users/me
async function fetchUserInfo() {
  try {
    const res = await apiClient.get('/api/users/me')
    const data = res.data.data
    userInfo.name = data.name
    userInfo.complexId = data.complexId
    userInfo.building = data.building
    userInfo.unit = data.unit
    userInfo.birthDate = data.birthDate
    userInfo.phone = data.phone
  } catch (e) {
    console.error('내 정보 조회 실패', e)
  }
}

// 로그아웃 확정 — POST /api/auth/logout (authStore 내부에서 처리)
async function confirmLogout() {
  showLogoutModal.value = false
  await authStore.logout()
  router.push('/login')
}

// 회원 탈퇴 확정 — DELETE /api/users/me
// axios delete는 body를 { data: ... }로 감싸야 전송됨
async function confirmWithdraw() {
  withdrawError.value = ''
  if (!withdrawPassword.value) {
    withdrawError.value = '비밀번호를 입력해주세요.'
    return
  }
  try {
    await apiClient.delete('/api/users/me', { data: { password: withdrawPassword.value } })
    showWithdrawModal.value = false
    authStore.logout()
    router.push('/login')
  } catch (e) {
    console.error('회원 탈퇴 실패', e)
    withdrawError.value = '비밀번호가 올바르지 않거나 오류가 발생했습니다.'
  }
}

// 탈퇴 모달 닫기 시 입력값 초기화
function closeWithdrawModal() {
  showWithdrawModal.value = false
  withdrawPassword.value = ''
  withdrawError.value = ''
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<template>
  <div class="my-page">
    <!-- 내 정보 -->
    <section class="section">
      <p class="section-title">내 정보</p>
      <div class="card profile-card">
        <div class="profile-row">
          <div class="avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <div class="profile-info">
            <div class="profile-name-row">
              <p class="profile-name">{{ userInfo.name }}</p>
              <button class="edit-btn" @click="$router.push('/resident/my-page/edit')">수정</button>
            </div>
            <p class="profile-complex">그린아파트 {{ userInfo.building }}동 / {{ userInfo.unit }}호</p>
            <p class="profile-sub">
              <span>입주일 {{ userInfo.birthDate }}</span>
              <span class="divider">|</span>
              <span>
                <svg class="phone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.39 19a19.45 19.45 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {{ userInfo.phone }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 빠른 메뉴 -->
    <section class="section">
      <p class="section-title">빠른 메뉴</p>
      <div class="card menu-card">
        <div
          v-for="menu in quickMenus"
          :key="menu.label"
          class="menu-item"
          :class="{ 'menu-item--highlight': menu.highlight }"
          @click="$router.push(menu.path)"
        >
          <span class="menu-icon" :class="{ 'menu-icon--highlight': menu.highlight }" v-html="menu.icon" />
          <span class="menu-label">{{ menu.label }}</span>
        </div>
      </div>
    </section>

    <!-- 회원 정보 관리 -->
    <section class="section">
      <p class="section-title">회원 정보 관리</p>
      <div class="account-actions">
        <button class="btn-logout" @click="showLogoutModal = true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          로그아웃
        </button>
        <button class="btn-withdraw" @click="showWithdrawModal = true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          회원 탈퇴
        </button>
      </div>
      <p class="admin-contact">
        관리자 전화번호 <a href="tel:010-1111-2222">010-1111-2222</a>
      </p>
    </section>
  </div>

  <!-- 로그아웃 확인 모달 -->
  <ResidentModal
    :visible="showLogoutModal"
    type="info"
    title="로그아웃"
    subtitle="정말 로그아웃 하시겠습니까?"
    confirm-text="로그아웃"
    confirm-type="primary"
    @close="showLogoutModal = false"
    @confirm="confirmLogout"
  />

  <!-- 회원 탈퇴 확인 모달 -->
  <ResidentModal
    :visible="showWithdrawModal"
    type="danger"
    title="회원 탈퇴"
    subtitle="탈퇴 후에는 복구가 불가능합니다."
    confirm-text="탈퇴하기"
    confirm-type="danger"
    @close="closeWithdrawModal"
    @confirm="confirmWithdraw"
  >
    <div class="withdraw-field">
      <input
        v-model="withdrawPassword"
        type="password"
        placeholder="본인 확인을 위해 비밀번호를 입력하세요"
        class="withdraw-input"
      />
      <p v-if="withdrawError" class="withdraw-error">{{ withdrawError }}</p>
    </div>
  </ResidentModal>
</template>

<style scoped>
.my-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 10px;
}

.card {
  background-color: var(--color-card-bg);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(73, 115, 229, 0.06);
}

.profile-row {
  display: flex;
  gap: 14px;
  align-items: center;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background-color: #e8eef9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-primary);
}

.avatar svg {
  width: 28px;
  height: 28px;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.profile-name {
  font-size: 15px;
  font-weight: 700;
}

.edit-btn {
  font-size: 12px;
  color: var(--color-primary);
  cursor: pointer;
}

.profile-complex {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.profile-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.divider {
  opacity: 0.4;
}

.phone-icon {
  width: 11px;
  height: 11px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 2px;
}

/* 빠른 메뉴 */
.menu-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: #fff;
  box-shadow: none;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--color-card-bg);
  border-radius: 30px;
  border: 1px solid var(--color-border);
  cursor: pointer;
}

.menu-item--highlight {
  background-color: #eef3fb;
  border-color: var(--color-primary);
}

.menu-item--highlight .menu-label {
  color: var(--color-primary);
  font-weight: 600;
}

.menu-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: var(--color-primary);
  display: flex;
  align-items: center;
}

.menu-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.menu-label {
  flex: 1;
  font-size: 14px;
  color: var(--color-text-primary);
}

/* 회원 정보 관리 */
.account-actions {
  display: flex;
  justify-content: space-evenly;
  gap: 8px;
  margin: 14px 0;
}

.btn-logout,
.btn-withdraw {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}

.btn-logout svg,
.btn-withdraw svg {
  width: 16px;
  height: 16px;
}

.btn-logout {
  border: 1px solid var(--color-border);
  background-color: #fff;
  color: var(--color-text-primary);
}

.btn-withdraw {
  border: 1px solid var(--color-danger);
  background-color: #fff;
  color: var(--color-danger);
}

.admin-contact {
  display: flex;
  justify-content: space-evenly;
  font-size: 16px;
  color: var(--color-text-secondary);
}

.admin-contact a {
  color: var(--color-primary);
  font-weight: 500;
}

/* 탈퇴 비밀번호 입력 */
.withdraw-field {
  width: 100%;
  margin-top: 4px;
}

.withdraw-input {
  width: 100%;
  height: 46px;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  padding: 0 14px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
}

.withdraw-input:focus {
  border-color: var(--color-danger);
}

.withdraw-error {
  font-size: 12px;
  color: var(--color-danger);
  margin: 6px 0 0;
}
</style>
