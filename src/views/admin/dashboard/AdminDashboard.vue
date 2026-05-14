<script setup>
// 관리자 레이아웃 안에서 사용하는 공용 대시보드 본문 페이지이다.
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import StatsCards from '@/components/admin/StatsCards.vue'
import { FEATURE_CODES } from '@/constants/complexFeatures'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { isFeatureEnabled, normalizeFeatures } from '@/utils/featureGate'

const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()

// 대시보드 화면 데이터
const state = reactive({
  loading: false,
  errorMessage: '',
  pendingApproval: null,
  parkingRate: null,
  todayReservation: null,
  totalHousehold: null,
  visitors: [],
  reservations: [],
  records: [],
  posts: [],
})

// 현재 관리자 컨텍스트의 기능 사용 여부를 대시보드 카드 노출 기준으로 사용한다.
const dashboardFeatures = computed(() => {
  if (authStore.role === 'MASTER') {
    return normalizeFeatures(complexStore.selectedComplex?.features || complexStore.complexDetail?.features)
  }

  return normalizeFeatures(complexStore.myComplex?.features || complexStore.complexDetail?.features)
})

const showFacilitySection = computed(() => {
  return isFeatureEnabled(dashboardFeatures.value, FEATURE_CODES.FACILITY)
})

const showParkingSection = computed(() => {
  return isFeatureEnabled(dashboardFeatures.value, FEATURE_CODES.PARKING_STATUS)
})

const showVoteSection = computed(() => {
  return isFeatureEnabled(dashboardFeatures.value, FEATURE_CODES.VOTE)
})

// StatsCards에 넘길 상단 요약 카드 데이터이다.
const dashboardStats = computed(() => {
  return [
    {
      label: '승인 대기',
      value: state.pendingApproval ?? '-',
      unit: state.pendingApproval === null ? '' : '건',
      desc: '연결된 데이터가 없습니다.',
      descClass: 'highlight-orange',
      iconClass: 'icon-orange',
    },
    {
      label: '주차 현황',
      value: state.parkingRate ?? '-',
      unit: state.parkingRate === null ? '' : '%',
      desc: showParkingSection.value ? '주차 대시보드 API 연결 예정입니다.' : '기능이 비활성화되었습니다.',
      iconClass: 'icon-blue',
    },
    {
      label: '오늘 예약',
      value: state.todayReservation ?? '-',
      unit: state.todayReservation === null ? '' : '건',
      desc: showFacilitySection.value ? '예약 현황 API 연결 예정입니다.' : '기능이 비활성화되었습니다.',
      descClass: 'highlight-green',
      iconClass: 'icon-green',
    },
    {
      label: '전체 세대',
      value: state.totalHousehold ?? '-',
      unit: state.totalHousehold === null ? '' : '세대',
      desc: '세대 통계 API 연결 예정입니다.',
      iconClass: 'icon-gray',
    },
  ]
})

// 대시보드 전체 조회
async function fetchDashboard() {
  state.loading = true
  state.errorMessage = ''

  try {
    await fetchStats()
    await fetchRecentItems()
  } catch (error) {
    console.error('대시보드 조회 실패:', error)
    state.errorMessage = '대시보드 정보를 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

// 통계 데이터 조회
async function fetchStats() {
  // 실제 대시보드 API 연결 전까지 null 값으로 빈 상태를 유지한다.
  state.pendingApproval = null
  state.parkingRate = null
  state.todayReservation = null
  state.totalHousehold = null
}

// 최근 목록 조회
async function fetchRecentItems() {
  // 실제 최근 목록 API 연결 전까지 빈 배열로 빈 상태를 유지한다.
  state.visitors = []
  state.reservations = []
  state.records = []
  state.posts = []
}

onMounted(() => {
  fetchDashboard()
})
</script>

<template>
  <section class="admin-dashboard">
    <div v-if="state.loading" class="status-overlay">
      <span class="status-spinner"></span>
      <p class="status-text">대시보드 정보를 불러오는 중입니다...</p>
    </div>

    <div v-else-if="state.errorMessage" class="status-overlay status-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p class="status-text">{{ state.errorMessage }}</p>
      <button class="retry-btn" type="button" @click="fetchDashboard">다시 시도</button>
    </div>

    <div v-else class="dashboard-wrapper">

      <section class="summary-section">
        <StatsCards :stats="dashboardStats" :show-icon="true">
          <template #icon-0>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </template>

          <template #icon-1>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 17V9h4a2 2 0 010 4H9" />
            </svg>
          </template>

          <template #icon-2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </template>

          <template #icon-3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          </template>
        </StatsCards>
      </section>

      <section class="middle-grid">
        <article class="panel">
          <div class="panel-header">
            <h2 class="panel-title">방문차량 목록</h2>
            <button type="button" class="panel-more" @click="router.push('/admin/visitor-vehicles')">
              전체보기 →
            </button>
          </div>

          <div v-if="state.visitors.length > 0" class="visitor-list">
            <!-- API 연결 후 방문차량 목록을 표시합니다. -->
          </div>

          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="1" y="9" width="22" height="9" rx="2" />
              <path d="M5 9V6a2 2 0 012-2h10a2 2 0 012 2v3" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
            <span class="empty-text">조회된 방문차량 정보가 없습니다.</span>
          </div>
        </article>

        <article class="panel" :class="{ 'panel-disabled': !showFacilitySection }">
          <div class="panel-header">
            <h2 class="panel-title">오늘 시설 예약 현황</h2>
            <button
              v-if="showFacilitySection"
              type="button"
              class="panel-more"
              @click="router.push('/admin/reservations')"
            >
              전체보기 →
            </button>
          </div>

          <div v-if="!showFacilitySection" class="empty-state disabled-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span class="empty-text">기능이 비활성화되었습니다.</span>
            <p class="disabled-desc">이 단지에서는 시설/예약 기능을 사용하지 않습니다.</p>
          </div>

          <div v-else-if="state.reservations.length > 0" class="facility-list">
            <!-- API 연결 후 시설 예약 현황을 표시합니다. -->
          </div>

          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span class="empty-text">조회된 예약 현황이 없습니다.</span>
          </div>
        </article>
      </section>

      <section class="bottom-grid">
        <article class="panel" :class="{ 'panel-disabled': !showParkingSection }">
          <div class="panel-header">
            <h2 class="panel-title">최근 입출차 기록</h2>
            <button
              v-if="showParkingSection"
              type="button"
              class="panel-more"
              @click="router.push('/admin/parking-logs')"
            >
              전체보기 →
            </button>
          </div>

          <div v-if="!showParkingSection" class="empty-state disabled-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
            <span class="empty-text">기능이 비활성화되었습니다.</span>
            <p class="disabled-desc">이 단지에서는 주차 현황 기능을 사용하지 않습니다.</p>
          </div>

          <template v-else-if="state.records.length > 0">
            <table class="entry-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>차량번호</th>
                  <th>유형</th>
                  <th>세대</th>
                  <th>시각</th>
                </tr>
              </thead>
              <tbody>
                <!-- API 연결 후 입출차 기록을 표시합니다. -->
              </tbody>
            </table>
          </template>

          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
            <span class="empty-text">조회된 입출차 기록이 없습니다.</span>
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <h2 class="panel-title">최근 게시판 활동</h2>
            <button type="button" class="panel-more" @click="router.push('/admin/notices')">
              전체보기 →
            </button>
          </div>

          <div v-if="state.posts.length > 0" class="board-list">
            <!-- API 연결 후 게시판 활동을 표시합니다. -->
          </div>

          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span class="empty-text">조회된 게시판 활동이 없습니다.</span>
          </div>
        </article>
      </section>
    </div>
  </section>
</template>

<style scoped>
.admin-dashboard {
  width: 100%;
  min-height: 100%;
}

.dashboard-wrapper {
  width: 100%;
}

.status-overlay {
  display: flex;
  min-height: 400px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #92959D;
}

.status-spinner {
  display: block;
  width: 36px;
  height: 36px;
  border: 3px solid #E5E7EB;
  border-top-color: #2B3A55;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-text {
  margin: 0;
  color: #687282;
  font-size: 14px;
}

.status-error svg {
  width: 40px;
  height: 40px;
  color: #E53E3E;
}

.retry-btn {
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #2B3A55;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.dashboard-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.dashboard-eyebrow {
  margin: 0 0 8px;
  color: #687282;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.dashboard-title {
  margin: 0;
  color: #1A202C;
  font-size: 28px;
  font-weight: 800;
}

.dashboard-desc {
  margin: 10px 0 0;
  color: #687282;
  font-size: 14px;
}

.dashboard-standard {
  display: grid;
  gap: 4px;
  min-width: 170px;
  padding: 13px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  background: #FFFFFF;
  text-align: right;
}

.dashboard-standard span {
  color: #92959D;
  font-size: 12px;
}

.dashboard-standard strong {
  color: #1A202C;
  font-size: 14px;
}

.summary-section {
  margin-bottom: 20px;
}

.middle-grid,
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.panel {
  display: flex;
  height: 340px;
  flex-direction: column;
  gap: 5px;
  padding: 20px;
  border: 1px solid #E9ECF1;
  border-radius: 15px;
  background: #FFFFFF;
}

.panel-disabled {
  background: #FFFFFF;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #F3F4F6;
}

.panel-title {
  margin: 0;
  color: #333333;
  font-size: 18px;
  font-weight: 700;
}

.panel-more {
  border: none;
  background: transparent;
  color: #3D5170;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
}

.panel-more:hover {
  color: #2B3A55;
}

.empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 36px 0;
}

.disabled-state {
  gap: 8px;
}

.empty-state svg {
  width: 36px;
  height: 36px;
  color: #D1D5DB;
}

.empty-text {
  color: #B0B8C9;
  font-size: 13px;
  font-weight: 500;
}

.disabled-desc {
  margin: 0;
  color: #8A94A6;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
}

.visitor-list,
.facility-list,
.board-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.entry-table th {
  padding: 4px 8px 10px;
  border-bottom: 1px solid #F3F4F6;
  color: #687282;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-align: left;
}

.entry-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #F7F8FA;
  color: #374151;
}

.entry-table tr:last-child td {
  border-bottom: none;
}

@media (max-width: 960px) {
  .middle-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    height: auto;
    min-height: 260px;
  }
}

@media (max-width: 760px) {
  .dashboard-intro {
    flex-direction: column;
    align-items: stretch;
  }

  .dashboard-standard {
    text-align: left;
  }
}
</style>
