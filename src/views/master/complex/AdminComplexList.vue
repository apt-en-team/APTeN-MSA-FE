<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useComplexStore } from '@/stores/useComplexStore'
import { useAuthStore } from '@/stores/useAuthStore'
import BaseModal from '@/components/common/BaseModal.vue'
import AdminComplexCreate from '@/views/master/complex/AdminComplexCreate.vue'
import AdminComplexEdit from '@/views/master/complex/AdminComplexEdit.vue'

const router = useRouter()
const complexStore = useComplexStore()
const authStore = useAuthStore()

const state = reactive({
  selectedCode: '',
  complexes: [],
  loading: false,
  errorMessage: '',
  showNeedSelectModal: false,
  showCreateModal: false,
  showEditModal: false,
  isComplexDropdownOpen: false,
})

// 선택된 단지 객체를 찾는다.
const selectedComplex = computed(() => {
  return state.complexes.find((complex) => complex.code === state.selectedCode) || null
})

// 드롭다운에 표시할 단지가 있는지 확인한다.
const hasComplexes = computed(() => state.complexes.length > 0)

// 현재 선택바에 표시할 문구를 만든다.
const selectedComplexName = computed(() => {
  if (state.loading) return '단지 목록을 불러오는 중입니다.'
  if (!hasComplexes.value) return '등록된 단지가 없습니다.'
  return selectedComplex.value?.name || '단지 선택'
})

// 단지 목록을 드롭다운용으로 조회한다.
// 마스터 랜딩 선택바는 활성 단지만 필요하므로 API-209를 사용한다.
async function fetchComplexes() {
  state.loading = true
  state.errorMessage = ''

  try {
    const result = await complexStore.fetchPublicComplexes()

    state.complexes = Array.isArray(result) ? result : []

    // 선택한 단지를 새로고침 후에도 유지하기 위해 store에서 복구를 시도한다.
    complexStore.restoreSelectedComplex?.()

    if (complexStore.selectedComplex?.code) {
      state.selectedCode = complexStore.selectedComplex.code
    }

    // 재조회 후 선택된 단지가 목록에 없으면 선택 상태를 안전하게 초기화한다.
    const selectedExists = state.complexes.some((complex) => complex.code === state.selectedCode)

    if (!selectedExists) {
      state.selectedCode = ''
      complexStore.clearSelectedComplex?.()
    }
  } catch (error) {
    console.error('단지 목록 조회 실패:', error)
    state.complexes = []
    state.selectedCode = ''
    state.errorMessage = '단지 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    state.loading = false
  }
}

// 선택바를 열고 닫는다.
function toggleComplexDropdown() {
  if (state.loading || !hasComplexes.value) return
  state.isComplexDropdownOpen = !state.isComplexDropdownOpen
}

// 단지를 선택하고 store에 저장한다.
function selectComplex(complex) {
  state.selectedCode = complex.code
  state.isComplexDropdownOpen = false
  complexStore.setSelectedComplex(complex)
}

// 단지 선택 전에는 BaseModal로 안내한다.
function openNeedSelectModal() {
  state.showNeedSelectModal = true
}

// 단지 등록 모달을 연다.
function goCreateComplex() {
  state.showCreateModal = true
}

// 단지 선택 여부를 확인한 뒤 수정 모달을 연다.
function goEditComplex() {
  if (!selectedComplex.value) {
    openNeedSelectModal()
    return
  }

  state.showEditModal = true
}

// 입주민 미리보기 화면으로 이동한다.
function goResidentPreview() {
  if (!selectedComplex.value) {
    openNeedSelectModal()
    return
  }

  router.push(`/admin/complexes/${selectedComplex.value.code}/resident-preview`)
}

// 선택 단지 정보를 보강한 뒤 공통 관리자 대시보드로 이동한다.
async function goAdminDashboard() {
  if (!selectedComplex.value) {
    openNeedSelectModal()
    return
  }

  try {
    await complexStore.selectComplexForMaster(selectedComplex.value.code)
    router.push('/admin/dashboard')
  } catch (error) {
    console.error(error)
    state.errorMessage = '선택 단지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
  }
}

// 로그아웃 후 마스터 로그인 화면으로 이동한다.
async function handleLogout() {
  try {
    if (authStore.logout) {
      await authStore.logout()
    } else {
      localStorage.clear()
      sessionStorage.clear()
    }
  } finally {
    await router.replace('/master/login')
  }
}

onMounted(() => {
  fetchComplexes()
})

// 단지 등록 성공 후 목록을 다시 조회한다.
async function handleCreated() {
  state.showCreateModal = false
  await fetchComplexes()
}

// 단지 수정 성공 후 목록을 다시 조회한다.
async function handleUpdated() {
  state.showEditModal = false
  await fetchComplexes()
}
</script>

<template>
  <div class="landing-page">
    <!-- 배경 글로우 -->
    <div class="bg-glow"></div>

    <!-- 상단 헤더 -->
    <header class="landing-header">
      <RouterLink to="/" class="master-login-header__brand">
        <img
          src="/APTeNLOGO.png"
          alt="아파트엔 로고"
          class="master-login-header__logo"
        />
        <span>아파트엔 마스터</span>
      </RouterLink>

      <button class="logout-btn" @click="handleLogout">로그아웃</button>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="landing-main">
      <p class="sub-title">SMART APARTMENT MANAGEMENT</p>
      <h1 class="main-title">아파트엔 마스터</h1>
      <p class="main-desc">스마트 주거·생활 통합 관리 시스템</p>
      <div class="divider-bar"></div>

      <div class="complex-control-row">
        <!-- 단지 선택 커스텀 드롭다운 -->
        <div class="complex-dropdown" :class="{ open: state.isComplexDropdownOpen }">
          <button
            class="complex-dropdown__button"
            type="button"
            :disabled="state.loading || !hasComplexes"
            @click="toggleComplexDropdown"
          >
            <span class="complex-dropdown__button-text">
              {{ selectedComplexName }}
            </span>
            <span class="complex-dropdown__arrow">⌄</span>
          </button>

          <div v-if="state.isComplexDropdownOpen" class="complex-dropdown__menu">
            <button
              v-for="complex in state.complexes"
              :key="complex.code"
              class="complex-dropdown__item"
              :class="{ selected: complex.code === state.selectedCode }"
              type="button"
              @click="selectComplex(complex)"
            >
              <span class="complex-dropdown__name">{{ complex.name }}</span>
              <span class="complex-dropdown__code">{{ complex.code }}</span>
            </button>
          </div>
        </div>

        <button class="small-action-btn" @click="goEditComplex">
          <span>⚙</span>
          수정
        </button>

        <button class="small-action-btn primary" @click="goCreateComplex">
          <span>＋</span>
          등록
        </button>
      </div>

      <!-- 단지 목록 조회 실패 문구를 표시한다. -->
      <p v-if="state.errorMessage" class="complex-guide error">
        {{ state.errorMessage }}
      </p>

      <!-- 등록된 단지가 없을 때 안내 문구를 표시한다. -->
      <p v-else-if="!state.loading && !hasComplexes" class="complex-guide">
        등록된 단지가 없습니다.
      </p>

      <!-- 선택 카드 2개 -->
      <div class="card-row">
        <!-- 입주민 카드 -->
        <div class="select-card resident-card" @click="goResidentPreview">
          <div class="card-icon-wrap">
            <span class="card-icon">🏢</span>
          </div>
          <span class="card-label">PREVIEW</span>
          <h2 class="card-title">입주민 미리보기</h2>
          <p class="card-desc">게시판 · 시설 예약 · 차량 관리 · 주차 현황</p>
          <div class="card-arrow">→</div>
        </div>

        <!-- 관리자 카드 -->
        <div class="select-card admin-card" @click="goAdminDashboard">
          <div class="card-icon-wrap">
            <span class="card-icon">🔧</span>
          </div>
          <span class="card-label">ADMIN</span>
          <h2 class="card-title">관리자 바로가기</h2>
          <p class="card-desc">세대 관리 · 승인 · 입출차 · 주차 통계</p>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </main>

    <!-- 하단 푸터 -->
    <footer class="landing-footer">
      <p>아파트엔에 오신 것을 환영합니다</p>
      <div class="footer-links">
        <span>이용약관</span>
        <span class="sep">|</span>
        <span>개인정보처리방침</span>
        <span class="sep">|</span>
        <span>고객센터</span>
      </div>
    </footer>
  </div>

  <BaseModal
    v-if="state.showNeedSelectModal"
    title="단지 선택 필요"
    subtitle="관리할 단지를 먼저 선택해주세요."
    @close="state.showNeedSelectModal = false"
  >
    <p class="modal-guide-text">
      단지를 선택한 뒤 입주민 미리보기 또는 관리자 바로가기를 이용할 수 있습니다.
    </p>

    <template #footer>
      <button
        class="modal-confirm-btn"
        type="button"
        @click="state.showNeedSelectModal = false"
      >
        확인
      </button>
    </template>
  </BaseModal>

  <AdminComplexCreate
    v-if="state.showCreateModal"
    :visible="state.showCreateModal"
    @close="state.showCreateModal = false"
    @created="handleCreated"
  />

  <AdminComplexEdit
    v-if="state.showEditModal && selectedComplex"
    :visible="state.showEditModal"
    :selected-complex="selectedComplex"
    :complex-code="selectedComplex.code"
    @close="state.showEditModal = false"
    @updated="handleUpdated"
  />
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #eaeaec 0%, #fff 50%, #d6d6d7 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.bg-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79,110,247,0.08) 0%, transparent 70%);
  pointer-events: none;
}

/* 헤더 */
.landing-header {
  width: 100%;
  padding: 20px 40px;
  height: 64px;
  background-color: #0F1923;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.master-login-header__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  text-decoration: none;
}

.master-login-header__logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.logo-text {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

/* 메인 */
.landing-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
}

.sub-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  letter-spacing: 4px;
  margin-bottom: 20px;
}

.main-title {
  font-size: 52px;
  font-weight: 800;
  color: #0F1923;
  margin: 0;
}

.main-desc {
  font-size: 16px;
  color: #8B92A0;
  margin-top: 12px;
}

.divider-bar {
  width: 50px;
  height: 3px;
  border-radius: 2px;
  background: rgba(79,110,247,0.6);
  margin: 28px 0 40px;
}

/* 카드 */
.card-row {
  display: flex;
  gap: 24px;
}

.select-card {
  width: 320px;
  padding: 32px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}

.select-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.3);
}

.resident-card {
  background: linear-gradient(135deg, #4973E5 0%, #3B5BDB 100%);
  border: 1px solid rgba(255,255,255,0.12);
}

.admin-card {
  background: linear-gradient(135deg, #2D3142 0%, #1A1A2E 100%);
  border: 1px solid rgba(255,255,255,0.08);
}

.card-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.resident-card .card-icon-wrap {
  background: rgba(255,255,255,0.15);
}

.admin-card .card-icon-wrap {
  background: rgba(255,255,255,0.08);
}

.card-icon {
  font-size: 22px;
}

.card-label {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 1px;
}

.card-title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  margin: 8px 0 10px;
}

.card-desc {
  font-size: 13px;
  margin: 0;
}

.resident-card .card-desc {
  color: rgba(255,255,255,0.6);
}

.admin-card .card-desc {
  color: rgba(255,255,255,0.35);
}

.card-arrow {
  position: absolute;
  bottom: 28px;
  right: 28px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  transition: transform 0.2s;
}

.resident-card .card-arrow {
  background: rgba(255,255,255,0.2);
}

.admin-card .card-arrow {
  background: rgba(255,255,255,0.08);
}

.select-card:hover .card-arrow {
  transform: translateX(4px);
}

/* 푸터 */
.landing-footer {
  padding: 28px;
  text-align: center;
}

.landing-footer p {
  font-size: 12px;
  color: #8B92A0;
  margin-bottom: 8px;
}

.footer-links {
  font-size: 11px;
  color: #5A6070;
}

.footer-links .sep {
  margin: 0 8px;
  color: #3A3F4E;
}

.logout-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.logout-btn:hover {
  color: #fff;
}

.complex-control-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 34px;
}

/* 단지 선택 커스텀 드롭다운 */
.complex-dropdown {
  position: relative;
  width: 390px;
}

.complex-dropdown__button {
  width: 100%;
  height: 42px;
  padding: 0 14px 0 16px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 8px;
  background: #fff;
  color: #1A202C;
  font-size: 13px;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.complex-dropdown__button:disabled {
  color: #8B92A0;
  cursor: not-allowed;
  background: #F5F6F8;
}

.complex-dropdown__button:focus,
.complex-dropdown.open .complex-dropdown__button {
  border-color: #4973E5;
  box-shadow: 0 0 0 3px rgba(73, 115, 229, 0.14);
}

.complex-dropdown__button-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.complex-dropdown__arrow {
  flex-shrink: 0;
  color: #8B92A0;
  font-size: 14px;
  transition: transform 0.2s;
}

.complex-dropdown.open .complex-dropdown__arrow {
  transform: rotate(180deg);
}

.complex-dropdown__menu {
  position: absolute;
  z-index: 20;
  top: 48px;
  left: 0;
  width: 100%;
  max-height: 260px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 14px 34px rgba(15, 25, 35, 0.14);
  box-sizing: border-box;
}

.complex-dropdown__menu::-webkit-scrollbar {
  width: 6px;
}

.complex-dropdown__menu::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #CBD5E1;
}

.complex-dropdown__item {
  width: 100%;
  min-height: 38px;
  padding: 8px 10px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #1A202C;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
}

.complex-dropdown__item:hover {
  background: #F5F6F8;
}

.complex-dropdown__item.selected {
  background: rgba(73, 115, 229, 0.08);
  color: #4973E5;
  font-weight: 700;
}

.complex-dropdown__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.complex-dropdown__code {
  flex-shrink: 0;
  font-size: 11px;
  color: #8B92A0;
}

.small-action-btn {
  width: 48px;
  height: 42px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 8px;
  background: #fff;
  color: #687282;
  font-size: 11px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  transition: all 0.2s;
}

.small-action-btn:hover {
  background: #F5F6F8;
  transform: translateY(-1px);
}

.small-action-btn.primary {
  border-color: #4973E5;
  color: #4973E5;
}

.small-action-btn.primary:hover {
  background: rgba(73, 115, 229, 0.06);
}

.complex-guide {
  margin: -14px 0 24px;
  color: #687282;
  font-size: 13px;
  text-align: center;
}

.complex-guide.error {
  color: #E53E3E;
}

.small-action-icon {
  font-size: 15px;
  line-height: 1;
}

.modal-guide-text {
  margin: 0;
  color: #687282;
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
}

.modal-confirm-btn {
  min-width: 88px;
  height: 36px;
  padding: 0 18px;
  border: none;
  border-radius: 7px;
  background: #2B3A55;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
}

.modal-confirm-btn:hover {
  background: #1E2A3E;
}

/* 모바일 반응형 */
@media (max-width: 700px) {
  .card-row {
    flex-direction: column;
  }

  .select-card {
    width: 100%;
    max-width: 340px;
  }

  .main-title {
    font-size: 36px;
  }

  .complex-control-row {
    width: 100%;
    flex-wrap: wrap;
  }

  .complex-dropdown {
    width: 100%;
    max-width: 340px;
  }
}
</style>
