<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useComplexStore } from '@/stores/useComplexStore'
import { useAuthStore } from '@/stores/useAuthStore'
import BaseModal from '@/components/common/BaseModal.vue'

const router = useRouter()
const complexStore = useComplexStore()
const authStore = useAuthStore()

const state = reactive({
  selectedCode: '',
  complexes: [],
  showNeedSelectModal: false,
})

// 선택된 단지 객체를 찾는다.
const selectedComplex = computed(() => {
  return state.complexes.find((complex) => complex.code === state.selectedCode) || null
})

// 단지 목록을 드롭다운용으로 조회한다.
async function fetchComplexes() {
  try {
    const result = await complexStore.fetchMasterComplexes({
      page: 0,
      size: 100,
    })

    console.log('단지 목록 API result:', result)
    console.log('store.masterComplexPage:', complexStore.masterComplexPage)
    console.log('store.complexList:', complexStore.complexList)

    const content =
      result?.content ||
      complexStore.masterComplexPage?.content ||
      complexStore.complexList?.content ||
      []

    console.log('단지 목록 content:', content)

    state.complexes = content.filter((complex) => {
      const status = complex.status
      return status !== '03' && status !== '삭제' && status !== 'DELETED'
    })

    console.log('select에 들어간 단지 목록:', state.complexes)

    complexStore.restoreSelectedComplex?.()

    if (complexStore.selectedComplex?.code) {
      state.selectedCode = complexStore.selectedComplex.code
    }
  } catch (error) {
    console.error('단지 목록 조회 실패:', error)
    state.complexes = []
  }
}

// 선택한 단지를 store에 저장한다.
function handleSelectComplex() {
  if (!selectedComplex.value) return

  complexStore.setSelectedComplex(selectedComplex.value)
}

// 단지 선택 전에는 BaseModal로 안내한다.
function openNeedSelectModal() {
  state.showNeedSelectModal = true
}

// 단지 등록 화면으로 이동한다.
function goCreateComplex() {
  router.push('/admin/master/complexes/create')
}

// 단지 수정 화면으로 이동한다.
function goEditComplex() {
  if (!selectedComplex.value) {
    openNeedSelectModal()
    return
  }

  router.push(`/admin/master/complexes/${selectedComplex.value.code}/edit`)
}

// 입주민 미리보기 화면으로 이동한다.
function goResidentPreview() {
  if (!selectedComplex.value) {
    openNeedSelectModal()
    return
  }

  router.push(`/admin/complexes/${selectedComplex.value.code}/resident-preview`)
}

// MASTER 전용 관리자 대시보드로 이동한다.
function goAdminDashboard() {
  if (!selectedComplex.value) {
    openNeedSelectModal()
    return
  }

  router.push(`/admin/master/complexes/${selectedComplex.value.code}/dashboard`)
}

// 로그아웃 후 로그인 화면으로 이동한다.
function handleLogout() {
  if (authStore.logout) {
    authStore.logout()
  } else {
    localStorage.clear()
  }

  router.push('/admin/login')
}

onMounted(() => {
  fetchComplexes()
})
</script>

<template>
  <div class="landing-page">
    <!-- 배경 글로우 -->
    <div class="bg-glow"></div>

    <!-- 상단 헤더 -->
    <header class="landing-header">
      <div class="header-logo">
        <div class="logo-icon">A</div>
        <span class="logo-text">아파트엔 마스터</span>
      </div>

      <button class="logout-btn" @click="handleLogout">로그아웃</button>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="landing-main">
      <p class="sub-title">SMART APARTMENT MANAGEMENT</p>
      <h1 class="main-title">아파트엔 마스터</h1>
      <p class="main-desc">스마트 주거·생활 통합 관리 시스템</p>
      <div class="divider-bar"></div>
      <div class="complex-control-row">
          <select class="complex-select" v-model="state.selectedCode" @change="handleSelectComplex">
            <option value="">단지 선택</option>
            <option
              v-for="complex in state.complexes"
              :key="complex.code"
              :value="complex.code"
            >
              {{ complex.name }}
            </option>
          </select>

          <button class="small-action-btn" @click="goEditComplex">
            <span>⚙</span>
            수정
          </button>

          <button class="small-action-btn primary" @click="goCreateComplex">
            <span>＋</span>
            등록
          </button>
        </div>

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
  background-color: #0F1923;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #4973E5;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-text {
  font-size: 16px;
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
.resident-card .card-icon-wrap { background: rgba(255,255,255,0.15); }
.admin-card .card-icon-wrap { background: rgba(255,255,255,0.08); }
.card-icon { font-size: 22px; }

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
.resident-card .card-desc { color: rgba(255,255,255,0.6); }
.admin-card .card-desc { color: rgba(255,255,255,0.35); }

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
.resident-card .card-arrow { background: rgba(255,255,255,0.2); }
.admin-card .card-arrow { background: rgba(255,255,255,0.08); }
.select-card:hover .card-arrow { transform: translateX(4px); }

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

.complex-select {
  width: 390px;
  height: 42px;
  padding: 0 42px 0 16px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 8px;
  background: #fff;
  color: #1A202C;
  font-size: 13px;
  font-family: 'Noto Sans KR', sans-serif;
  text-align: center;
  cursor: pointer;
  outline: none;
}

.complex-select:focus {
  border-color: #4973E5;
  box-shadow: 0 0 0 3px rgba(73, 115, 229, 0.14);
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
  .card-row { flex-direction: column; }
  .select-card { width: 100%; max-width: 340px; }
  .main-title { font-size: 36px; }
}
</style>
