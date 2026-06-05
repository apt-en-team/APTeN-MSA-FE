<script setup>
// 관리자 레이아웃 안에서 사용하는 공용 대시보드 본문 페이지이다.
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import StatsCards from '@/components/admin/StatsCards.vue'
import { FEATURE_CODES } from '@/constants/complexFeatures'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { isFeatureEnabled, normalizeFeatures } from '@/utils/featureGate'
import { useReservationStore } from '@/stores/useReservationStore'
import { useParkingStore } from '@/stores/useParkingStore'
import { getAdminFacilities } from '@/api/facilityApi.js'
import { getAdminVisitorVehicles } from '@/api/visitorVehicleApi'
import { getParkingLogs } from '@/api/parkingApi'
import { getAdminNotices } from '@/api/noticeApi'
import { getAdminHouseholds, getHouseholdMatchRequests } from '@/api/householdApi'
import { getAdminVehicleStats } from '@/api/vehicleApi'
import { getAdminGxPrograms } from '@/api/gxApi'

const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()
const reservationStore = useReservationStore()
const parkingStore = useParkingStore()

//const todayStr = (() => {
//   const d = new Date()
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// })()

// 대시보드 화면 데이터
const state = reactive({
  loading: false,
  errorMessage: '',
  gxPending: null,
  vehiclePending: null,
  householdPending: null,
  parkingRate: null,
  parkingUsed: null,
  parkingTotal: null,
  todayReservation: null,
  todayReserved: null,
  gxWaiting: null,
  todayCancelled: null,
  activeCount: null,
  totalHousehold: null,
  occupiedHousehold: null,
  currentMonthMoveIns: null,
  visitors: [],
  reservations: [],
  facilitySummary: [],
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

const pendingApproval = computed(() => {
  const hasData = state.vehiclePending !== null || state.householdPending !== null
  if (!hasData) return null
  const gx = showFacilitySection.value ? (state.gxPending ?? 0) : 0
  return gx + (state.vehiclePending ?? 0) + (state.householdPending ?? 0)
})

const pendingDesc = computed(() => {
  if (pendingApproval.value === null) return '데이터를 불러오는 중입니다.'
  const parts = []
  if (showFacilitySection.value && state.gxPending !== null) parts.push(`GX ${state.gxPending}건`)
  if (state.vehiclePending !== null) parts.push(`차량 ${state.vehiclePending}건`)
  if (state.householdPending !== null) parts.push(`세대 ${state.householdPending}건`)
  return parts.length ? parts.join(' · ') : '-'
})

// StatsCards에 넘길 상단 요약 카드 데이터이다.
const dashboardStats = computed(() => {
  return [
    {
      label: '승인 대기',
      value: pendingApproval.value ?? '-',
      unit: pendingApproval.value === null ? '' : '건',
      desc: pendingDesc.value,
      descClass: 'highlight-orange',
      iconClass: 'icon-orange',
    },
    {
      label: '주차 현황',
      value: state.parkingRate ?? '-',
      unit: state.parkingRate === null ? '' : '%',
      desc: showParkingSection.value
        ? (state.parkingRate !== null
            ? `사용 ${state.parkingUsed} / 전체 ${state.parkingTotal}면`
            : '주차 현황')
        : '기능이 비활성화되었습니다.',
      iconClass: 'icon-blue',
    },
    {
      label: '오늘 예약',
      value: state.todayReservation ?? '-',
      unit: state.todayReservation === null ? '' : '건',
      desc: showFacilitySection.value
        ? (state.todayReserved !== null
            ? `예약 ${state.todayReserved} · 대기 ${state.gxWaiting} · 취소 ${state.todayCancelled}`
            : '시설 예약 현황')
        : '기능이 비활성화되었습니다.',
      descClass: 'highlight-green',
      iconClass: 'icon-green',
    },
    {
      label: '전체 세대',
      value: state.totalHousehold ?? '-',
      unit: state.totalHousehold === null ? '' : '세대',
      desc: state.totalHousehold !== null
        ? `입주 ${state.occupiedHousehold} · 공실 ${state.totalHousehold - state.occupiedHousehold} · ${new Date().getMonth() + 1}월 입주 ${state.currentMonthMoveIns}`
        : '단지 전체 기준',
      iconClass: 'icon-gray',
    },
  ]
})

async function fetchPendingStats() {
  const FINISHED = ['CLOSED', '종료', 'CANCELLED', '취소됨']
  const results = await Promise.allSettled([
    showFacilitySection.value
      ? getAdminGxPrograms({ size: 200 }).then((res) => {
          const list = Array.isArray(res?.content) ? res.content : (Array.isArray(res) ? res : [])
          state.gxPending = list
            .filter((p) => !FINISHED.includes(p.status))
            .reduce((sum, p) => sum + Number(p.waitingCount ?? 0), 0)
        })
      : Promise.resolve(),
    getAdminVehicleStats().then((s) => { state.vehiclePending = Number(s?.pending ?? 0) }),
    getHouseholdMatchRequests({ page: 0, size: 200 })
      .then((res) => {
        const content = Array.isArray(res?.content) ? res.content : (Array.isArray(res) ? res : [])
        const normalize = (s) => ({ '01': 'PENDING', '승인대기': 'PENDING' })[s]
        state.householdPending = content.filter((m) => normalize(m.matchStatus) === 'PENDING').length
      }),
  ])
  results.forEach((r) => { if (r.status === 'rejected') console.warn('[대시보드] 승인대기 일부 조회 실패', r.reason) })
}

// 대시보드 전체 조회
async function fetchDashboard() {
  state.loading = true
  state.errorMessage = ''

  try {
    await Promise.all([
      fetchPendingStats(),
      fetchStats(),
      fetchHouseholdStats(),
      fetchParkingCard(),
      fetchRecentItems(),
    ])
  } catch (error) {
    console.error('대시보드 조회 실패:', error)
    state.errorMessage = '대시보드 정보를 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const formatTime = (t) => (t ? String(t).slice(0, 5) : '-')

// HH:mm:ss 형식의 시각 문자열을 분 단위 숫자로 변환한다.
const toMinutes = (t) => {
  if (!t) return 0
  const parts = String(t).split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

const BAR_COLORS = ['green', 'dark', 'yellow']

// 시설 데이터로 오늘 기준 요약 항목을 만든다. idx로 색상을 고정 할당한다.
const buildFacilitySummaryItem = (f, idx) => {
  const openMins = toMinutes(f.openTime)
  let closeMins = toMinutes(f.closeTime)
  // 00:00(자정)은 다음날 0시이므로 1440분(24시간)으로 처리한다.
  if (f.closeTime && closeMins <= openMins) closeMins += 1440
  const slotMin = f.slotMin || 60
  const maxCount = f.maxCount || 1
  // DAY 단위 시설은 하루 전체가 1슬롯이므로 maxCount가 곧 총 정원이다.
  const totalSlots = f.usageUnitType === 'DAY' || !f.slotMin
    ? maxCount
    : (f.openTime && f.closeTime ? Math.floor((closeMins - openMins) / slotMin) * maxCount : 0)
  const current = f.todayReservedCount || 0
  const percent = totalSlots > 0 ? Math.round((current / totalSlots) * 100) : 0
  const isFull = totalSlots > 0 && current >= totalSlots
  const barColor = BAR_COLORS[idx] ?? 'dark'
  const slotLabel = f.reservationType === '좌석형' ? '석' : '타임'
  const hours = (f.openTime && f.closeTime)
    ? `${formatTime(f.openTime)} ~ ${formatTime(f.closeTime)}`
    : '-'
  return { facilityId: f.facilityId, name: f.name, hours, current, totalSlots, percent, isFull, barColor, slotLabel }
}

// const reservationStatusLabel = (s) =>
//   ({ CONFIRMED: '예약완료', COMPLETED: '이용완료', CANCELLED: '취소됨' })[s] || s || '-'

// const reservationStatusClass = (s) =>
//   ({ CONFIRMED: 'status-confirmed', COMPLETED: 'status-completed', CANCELLED: 'status-cancelled' })[s] || ''

// 입출차 구분 라벨 반환
const entryTypeLabel = (t) => (t === 'IN' ? '입차' : t === 'OUT' ? '출차' : '-')

// 기록 시각을 MM.dd HH:mm 형태로 변환
const formatLoggedAt = (v) => (v ? String(v).replace('T', ' ').slice(5, 16) : '-')

// 방문일을 yyyy.MM.dd 형태로 변환
const formatVisitDate = (v) => (v ? String(v).slice(0, 10).replace(/-/g, '.') : '-')

const formatNoticeDate = (v) => (v ? String(v).slice(0, 10).replace(/-/g, '.') : '-')

// 주차 현황 카드 데이터 조회
async function fetchParkingCard() {
  if (!showParkingSection.value) return
  try {
    await parkingStore.fetchAdminParkingStatus()
    const status = parkingStore.adminParkingStatus
    state.parkingRate = Math.round(Number(status?.occupancyRate || 0))
    state.parkingUsed = Number(status?.currentParkedCount || 0)
    state.parkingTotal = Number(status?.totalSlots || 0)
  } catch {
    // 실패 시 카드는 '-' 유지
  }
}

// 통계 데이터 조회
async function fetchHouseholdStats() {
  try {
    const res = await getAdminHouseholds({ page: 0, size: 1 })
    const summary = res?.summary
    state.totalHousehold = summary?.totalHouseholds ?? null
    state.occupiedHousehold = summary?.occupiedHouseholds ?? null
    state.currentMonthMoveIns = summary?.currentMonthMoveIns ?? null
  } catch {
    // 통계 실패 시 카드는 '-' 유지
  }
}

async function fetchStats() {
  if (!showFacilitySection.value) return
  try {
    const stats = await reservationStore.fetchAdminReservationStats()
    state.todayReservation = stats?.todayTotal ?? null
    state.todayReserved = stats?.todayReserved ?? null
    state.gxWaiting = stats?.gxWaiting ?? null
    state.todayCancelled = stats?.todayCancelled ?? null
    state.activeCount = stats?.activeCount ?? null
  } catch {
    // 통계 실패 시 카드는 '-' 유지
  }
}

// 최근 목록 조회
async function fetchRecentItems() {
  if (showFacilitySection.value) {
    try {
      const res = await getAdminFacilities({ size: 20, isActive: true })
      state.facilitySummary = (res?.content ?? [])
        .sort((a, b) => (b.todayReservedCount || 0) - (a.todayReservedCount || 0))
        .slice(0, 3)
        .map(buildFacilitySummaryItem)
    } catch {
      state.facilitySummary = []
    }
  }
  // 방문차량/입출차는 주차 기능 사용 단지에서만 조회
  if (showParkingSection.value) {
    // 방문차량 최근 5건 조회
    try {
      const res = await getAdminVisitorVehicles({ page: 0, size: 3 })
      state.visitors = res?.content ?? []
    } catch {
      state.visitors = []
    }
    // 최근 입출차 기록 5건 조회
    try {
      const res = await getParkingLogs({ page: 0, size: 5 })
      state.records = res?.content ?? []
    } catch {
      state.records = []
    }
  } else {
    state.visitors = []
    state.records = []
  }

  state.reservations = []
  state.posts = []

  // 공지사항 최근 5건 조회
  try {
    const res = await getAdminNotices({ page: 0, size: 5 })
    state.posts = (res?.content ?? []).slice(0, 5)
  } catch {
    state.posts = []
  }
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
            <div v-for="v in state.visitors" :key="v.visitorVehicleId" class="visitor-item">
              <div class="visitor-main">
                <strong class="visitor-plate">{{ v.licensePlate }}</strong>
                <span class="visitor-badge">{{ v.status || '-' }}</span>
              </div>
              <div class="visitor-sub">
                <span>{{ v.visitorName || '-' }}</span>
                <span>{{ v.building || '-' }}동 {{ v.unit || '-' }}호</span>
                <span>{{ formatVisitDate(v.visitDate) }}</span>
              </div>
            </div>
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
              @click="router.push('/admin/reservations/list')"
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

          <div v-else-if="state.facilitySummary.length > 0" class="facility-list">
            <div
              v-for="item in state.facilitySummary"
              :key="item.facilityId"
              class="facility-item card-clickable"
              @click="router.push({ path: '/admin/reservations/facility-status', query: { facilityId: item.facilityId } })"
            >
              <div class="facility-bar" :class="'bar-' + item.barColor"></div>
              <div class="facility-left">
                <strong class="facility-name">{{ item.name }}</strong>
                <span class="facility-time">{{ item.hours }}</span>
              </div>
              <div class="facility-right">
                <div class="facility-name-row">
                  <div class="progress-bar">
                    <div class="progress-fill" :class="item.barColor" :style="{ width: Math.min(item.percent, 100) + '%' }"></div>
                  </div>
                  <span class="facility-count">
                    <span :class="['count-current', item.isFull ? 'count-full' : '']">{{ item.current }}</span>
                    / {{ item.totalSlots }} {{ item.slotLabel }}
                  </span>
                </div>
                <span class="facility-percent" :class="item.isFull ? 'text-full' : ''">{{ item.percent }}%</span>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span class="empty-text">등록된 시설이 없습니다.</span>
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
                  <th>시각</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in state.records" :key="r.parkingLogId">
                  <td>{{ entryTypeLabel(r.entryType) }}</td>
                  <td>{{ r.licensePlate }}</td>
                  <td>{{ r.vehicleCategoryLabel || '-' }}</td>
                  <td>{{ formatLoggedAt(r.loggedAt) }}</td>
                </tr>
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
            <button type="button" class="panel-more" @click="router.push('/admin/boards/statistics')">
              전체보기 →
            </button>
          </div>

          <div v-if="state.posts.length > 0" class="notice-list">
            <div
              v-for="notice in state.posts"
              :key="notice.noticeId"
              class="notice-item card-clickable"
              @click="router.push(`/admin/notices/${notice.noticeId}`)"
            >
              <div class="notice-title">{{ notice.title }}</div>
              <div class="notice-date">{{ formatNoticeDate(notice.createdAt) }}</div>
            </div>
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

/* 방문차량 목록 행 */
.visitor-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 14px;
  border-radius: 10px;
  background: #f9fafb;
}

.visitor-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.visitor-plate {
  font-size: 14px;
  font-weight: 700;
  color: #1A202C;
}

.visitor-badge {
  font-size: 11px;
  font-weight: 600;
  color: #3D5170;
}

.visitor-sub {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #687282;
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

.card-clickable {
  cursor: pointer;
  transition: background 0.15s;
}

.card-clickable:hover {
  background: #f1f4f9 !important;
}

.facility-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 14px;
  border-radius: 10px;
  background: #f9fafb;
  justify-content: space-between;
}

.facility-bar {
  width: 4px;
  height: 40px;
  border-radius: 5px;
  flex-shrink: 0;
}

.bar-dark { background: #2B3A55; }
.bar-green { background: #276749; }
.bar-yellow { background: #C08B2D; }

.facility-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 80px;
}

.facility-name {
  font-size: 13px;
  font-weight: 600;
  color: #1A202C;
}

.facility-time {
  font-size: 11px;
  color: #687282;
}

.facility-right {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.facility-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 7px;
  background: #E2E8F0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease;
}

.progress-fill.dark { background: #2B3A55; }
.progress-fill.green { background: #4D8B5A; }
.progress-fill.yellow { background: #C08B2D; }

.facility-count {
  font-size: 11px;
  color: #92959D;
  white-space: nowrap;
}

.count-current {
  font-weight: 700;
  color: #276749;
}

.count-full { color: #C08B2D !important; }

.facility-percent {
  font-size: 11px;
  color: #6B7280;
  text-align: right;
}

.text-full { color: #C08B2D !important; }

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.notice-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f9fafb;
  gap: 12px;
}

.notice-title {
  font-size: 13px;
  font-weight: 600;
  color: #1A202C;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-date {
  font-size: 11px;
  color: #92959D;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
