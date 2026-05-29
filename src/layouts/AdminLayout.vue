<script setup>
// 일반 ADMIN과 MASTER 선택 단지 모드가 공통으로 사용하는 데스크톱 관리자 레이아웃이다.
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { FEATURE_CODES } from '@/constants/complexFeatures'
import { useComplexStore } from '@/stores/useComplexStore'
import { normalizeFeatures, isFeatureEnabled } from '@/utils/featureGate'
import { useNotificationStore } from '@/stores/useNotificationStore'
import NotificationBadge from '@/components/notification/NotificationBadge.vue'
import NotificationDropdown from '@/components/notification/NotificationDropdown.vue'
import notificationSocketService from '@/services/notificationSocketService'
import { startForegroundMessageListener } from '@/services/fcmService'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()
const notificationStore = useNotificationStore()

// MASTER는 알림 UI를 표시하지 않음 (USER, ADMIN, MANAGER만 대상)
const showNotification = computed(() => {
  return authStore.role === 'ADMIN' || authStore.role === 'MANAGER'
})

// 일반 ADMIN과 MASTER 모드가 공유하는 대표 메뉴 정의이다.
const adminMenuDefinitions = [
  {
    label: 'MAIN',
    items: [{ label: '대시보드', path: 'dashboard', icon: 'grid' }],
  },
  {
    label: 'ACCOUNT',
    items: [{ label: '관리자 관리', path: 'admins', icon: 'account' }],
  },
  {
    label: 'HOUSEHOLD',
    items: [
      { label: '세대 관리', path: 'households', icon: 'home' },
      { label: '관리비 정산', path: 'bills', icon: 'bill' },
    ],
  },
  {
    label: 'VEHICLE',
    items: [
      { label: '입주민 차량 목록', path: 'vehicles', icon: 'car' },
      { label: '방문차량 목록', path: 'visitor-vehicles', icon: 'visitor-car' },
      { label: '입출차 기록', path: 'parking-logs', icon: 'log' },
      { label: '주차 현황', path: 'parking/dashboard', icon: 'parking' },
      { label: '주차 통계', path: 'parking/statistics', icon: 'chart' },
      { label: '주차 구역 관리', path: 'parking/zones', icon: 'layers' },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { label: '게시판 관리', path: 'boards/statistics', icon: 'chart' },
      { label: '투표 관리', path: 'votes', icon: 'vote' },
    ],
  },
  {
    label: 'FACILITY / RESERVATION',
    items: [
      { label: '시설 관리', path: 'facilities', icon: 'facility' },
      { label: '구독 현황', path: 'reservations', icon: 'calendar' },
    ],
  },
]

// MASTER가 공통 관리자 화면에서 선택 단지를 정한 상태인지 store 값으로 판단한다.
const isMasterComplexMode = computed(() => {
  return authStore.role === 'MASTER' && !!complexStore.selectedComplex?.complexId
})

// 같은 메뉴 구성을 현재 모드에 맞는 링크로 변환한다.
function buildAdminPath(path) {
  return `/admin/${path}`
}

// 현재 관리자 컨텍스트에서 사용할 기능 사용 여부를 계산한다.
const currentAdminFeatures = computed(() => {
  if (isMasterComplexMode.value) {
    return normalizeFeatures(
      complexStore.selectedComplex?.features || complexStore.complexDetail?.features,
    )
  }

  return normalizeFeatures(complexStore.myComplex?.features || complexStore.complexDetail?.features)
})

// 메뉴 경로별로 단지 기능 사용 여부를 판별한다.
function isAdminMenuVisible(path) {
  if (['facilities', 'reservations', 'gx-programs'].includes(path)) {
    return isFeatureEnabled(currentAdminFeatures.value, FEATURE_CODES.FACILITY)
  }

  // 주차 관련 메뉴는 단지의 주차 기능이 켜진 경우에만 노출
  if (['parking-logs', 'parking/dashboard', 'parking/statistics', 'parking/zones'].includes(path)) {
    return isFeatureEnabled(currentAdminFeatures.value, FEATURE_CODES.PARKING_STATUS)
  }

  if (path === 'votes') {
    return isFeatureEnabled(currentAdminFeatures.value, FEATURE_CODES.VOTE)
  }

  return true
}

// 사이드바 메뉴는 동일하게 유지하고 링크만 MASTER/ADMIN 모드에 맞게 분기한다.
const adminMenuGroups = computed(() => {
  return adminMenuDefinitions
    .map((group) => ({
      ...group,
      items: (group.items || [])
        .filter((item) => isAdminMenuVisible(item.path))
        .map((item) => ({
          ...item,
          to: buildAdminPath(item.path),
        })),
    }))
    .filter((group) => group.items.length > 0)
})

// 사용자 권한과 표시용 이름을 계산한다.
const userName = computed(() => authStore.name || '관리자')
const userRole = computed(() => authStore.role || 'ADMIN')
const userSubtext = computed(() => {
  return authStore.userInfo?.email || authStore.user?.email || userRole.value
})

// 시설 관리 화면의 탭별 페이지 제목 매핑이다.
const facilityTabTitles = {
  gx: '시설 관리 / GX 프로그램',
  policy: '시설 관리 / 시설 정책',
  'block-time': '시설 관리 / 차단 시간 목록',
}

// 현재 페이지 제목을 계산한다. 시설 관리는 탭에 따라 제목이 달라진다.
const currentPageTitle = computed(() => {
  if (route.path === '/admin/facilities' && facilityTabTitles[route.query.tab]) {
    return facilityTabTitles[route.query.tab]
  }
  return route.meta?.title || '관리자 화면'
})

// 상단 헤더에 표시할 오늘 날짜 문자열을 계산한다.
const todayStr = computed(() => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dayOfWeek = days[date.getDay()]

  return `${year}.${month}.${day} (${dayOfWeek})`
})

// 현재 경로와 메뉴 경로를 비교해 활성 상태를 표시한다.
function isMenuActive(targetPath) {
  return route.path === targetPath || route.path.startsWith(`${targetPath}/`)
}

// 현재 화면에서 표시할 단지명을 store 값 기준으로 계산한다.
const currentComplexName = computed(() => {
  if (isMasterComplexMode.value && complexStore.selectedComplex?.name) return complexStore.selectedComplex.name
  if (isMasterComplexMode.value && complexStore.complexDetail?.name) return complexStore.complexDetail.name
  if (isMasterComplexMode.value && complexStore.selectedComplex?.code) return `선택 단지 ${complexStore.selectedComplex.code}`
  if (complexStore.myComplex?.name) return complexStore.myComplex.name
  return 'APT-EN 아파트'
})

// 상단 보조 문구는 현재 모드와 선택 단지명을 기준으로 표시한다.
const topbarSub = computed(() => {
  return `${todayStr.value} · ${currentComplexName.value}`
})

// 기존 store 액션을 사용해 로그아웃 버튼을 연결한다.
const handleLogout = async () => {
  const roleBeforeLogout = authStore.role

  await authStore.logout()

  router.push(roleBeforeLogout === 'MASTER' ? '/master/login' : '/admin/login')
}

// 자식 페이지가 상단 액션 버튼에 연결할 모달 열기 함수를 등록한다.
const openModalFn = ref(null)
provide('registerOpenModal', (fn) => {
  openModalFn.value = typeof fn === 'function' ? fn : null
})

// 상단 액션 버튼 클릭 시 자식 페이지가 등록한 모달 열기 함수를 실행한다.
function handleActionClick() {
  if (openModalFn.value) {
    openModalFn.value()
  }
}

// 자식 페이지가 등록(create) 버튼에 연결할 모달 열기 함수를 등록한다.
const createModalFn = ref(null)
provide('registerCreateModal', (fn) => {
  createModalFn.value = typeof fn === 'function' ? fn : null
})

function handleCreateClick() {
  if (createModalFn.value) {
    createModalFn.value()
  }
}

// MASTER 사용자는 어느 관리자 화면에서도 단지 선택 화면으로 돌아갈 수 있다.
const isMasterUser = computed(() => userRole.value === 'MASTER')

// 관리자 관리 화면에서는 MASTER와 MANAGER만 신규 등록 버튼을 볼 수 있다.
const canRegisterAdmin = computed(() => {
  const isAdminManagePage = route.path === '/admin/admins' || /\/admin\/master\/complexes\/[^/]+\/admins$/.test(route.path)
  const allowedRole = userRole.value === 'MASTER' || userRole.value === 'MANAGER'
  return isAdminManagePage && allowedRole
})

const canManageHouseholdType = computed(() => {
  const allowedRole = userRole.value === 'MASTER' || userRole.value === 'MANAGER'
  return route.path === '/admin/households' && allowedRole
})

// 게시판 관리 화면에서 공지 작성 버튼 표시
const canCreateNotice = computed(() => route.path === '/admin/boards/statistics')

// 입출차 기록 화면에서 기록 등록 버튼을 표시할지 판단한다.
const canRegisterParkingLog = computed(() => route.path === '/admin/parking-logs')

// 주차 구역 관리 화면에서 구역 등록 버튼을 표시할지 판단한다.
const canRegisterParkingZone = computed(() => route.path === '/admin/parking/zones')

// 센서 관리 화면에서 센서 등록 버튼을 표시할지 판단한다.
const canRegisterSensor = computed(() => route.path === '/admin/parking/sensors')

// 세대 관리 화면에서 세대 등록 버튼을 표시할지 판단한다. (모든 관리자 역할)
const canCreateHousehold = computed(() => route.path === '/admin/households')

// 헤더 공통 버튼 노출 여부를 계산한다.
const headerActions = computed(() => {
  return {
    showAlert: true,
    showComplexSelector: isMasterUser.value,
    showAdminRegister: canRegisterAdmin.value,
    showHouseholdTypeManage: canManageHouseholdType.value,
    showHouseholdCreate: canCreateHousehold.value,
    showParkingLogCreate: canRegisterParkingLog.value,
    showParkingZoneCreate: canRegisterParkingZone.value,
    showSensorCreate: canRegisterSensor.value,
  }
})

// 시설 등록 화면으로 이동한다.
const goFacilityCreate = () => {
  router.push('/admin/facilities/create')
}

// 시설별 예약 현황 화면으로 이동한다.
const goToFacilityStatus = () => {
  router.push('/admin/reservations/facility-status')
}

// 사이드바 아이콘 키에 맞는 SVG를 렌더링한다.
function getMenuIconPath(icon) {
  return icon || 'grid'
}

// 일반 관리자 모드에서는 내 단지 정보를 조회해 헤더 단지명을 보강한다.
async function ensureMyComplex() {
  if (isMasterComplexMode.value) return
  if (authStore.role !== 'MANAGER' && authStore.role !== 'ADMIN') return
  if (complexStore.myComplex?.name) return

  try {
    await complexStore.fetchMyComplex()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  ensureMyComplex()

  // ADMIN/MANAGER일 때 미읽음 수 조회 및 WebSocket 연결
  if (showNotification.value) {
    notificationStore.fetchUnreadCount()
    notificationSocketService.connect()
    // 설정 화면에서 토큰 등록을 마친 관리자도 새로고침 후 foreground FCM을 받을 수 있게 한다.
    startForegroundMessageListener().catch((error) => console.error('[FCM] foreground listener 초기화 실패', error))
  }
})

onUnmounted(() => {
  // 레이아웃 해제 시 WebSocket 연결 종료
  notificationSocketService.disconnect()
  notificationStore.closeDropdown()
})

watch(
  () => [route.path, route.params.code, authStore.role, complexStore.selectedComplex?.complexId],
  () => {
    ensureMyComplex()
  },
)
</script>

<template>
  <div class="admin-layout theme-admin">
    <!-- 사이드바 영역 -->
    <aside class="admin-layout__sidebar">
      <div class="admin-layout__brand-panel">
        <div class="admin-layout__brand-icon">A</div>
        <div class="admin-layout__brand-copy">
          <p class="admin-layout__brand-title">아파트엔</p>
          <p class="admin-layout__brand-role">관리자</p>
        </div>
      </div>

      <div class="admin-layout__nav-scroll">
        <div
          v-for="group in adminMenuGroups"
          :key="group.label"
          class="admin-layout__nav-group"
        >
          <p class="admin-layout__section-label">{{ group.label }}</p>
          <nav class="admin-layout__nav">
            <RouterLink
              v-for="menu in group.items"
              :key="menu.to"
              :to="menu.to"
              class="admin-layout__nav-link"
              :class="{ 'is-active': isMenuActive(menu.to) }"
            >
              <span class="admin-layout__nav-icon" aria-hidden="true">
                <svg
                  v-if="getMenuIconPath(menu.icon) === 'grid'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'account'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'home'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'bill'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z" />
                  <line x1="8" y1="7" x2="16" y2="7" />
                  <line x1="8" y1="11" x2="16" y2="11" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'car'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <path d="M14 16H9m10 0h2l-1.34-4.69A3 3 0 0 0 16.78 9H7.22a3 3 0 0 0-2.88 2.31L3 16h2" />
                  <circle cx="6.5" cy="16.5" r="2.5" />
                  <circle cx="17.5" cy="16.5" r="2.5" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'visitor-car'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <path d="M14 16H9m10 0h2l-1.34-4.69A3 3 0 0 0 16.78 9H7.22a3 3 0 0 0-2.88 2.31L3 16h2" />
                  <circle cx="6.5" cy="16.5" r="2.5" />
                  <circle cx="17.5" cy="16.5" r="2.5" />
                  <path d="M18 6l2 2 4-4" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'log'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'parking'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 17V7h5a3 3 0 0 1 0 6H9" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'chart'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'notice'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'vote'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'facility'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <path d="M3 21h18" />
                  <path d="M5 21V7l7-4 7 4v14" />
                  <path d="M9 9h.01" />
                  <path d="M15 9h.01" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'calendar'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />

                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'gx'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="m9 15 2 2 4-4" />
                </svg>
                <svg
                  v-else-if="getMenuIconPath(menu.icon) === 'layers'"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"
                >
                  <path d="m12 2-10 5 10 5 10-5-10-5z" />
                  <path d="m2 17 10 5 10-5" />
                  <path d="m2 12 10 5 10-5" />
                </svg>
              </span>
              {{ menu.label }}
            </RouterLink>
          </nav>
        </div>
      </div>

      <!-- 하단 프로필 영역 -->
      <div class="admin-layout__profile">
        <div class="admin-layout__profile-avatar">관</div>
        <div class="admin-layout__profile-card">
          <p class="admin-layout__profile-name">{{ userName }}</p>
          <p class="admin-layout__profile-role">{{ userSubtext }}</p>
        </div>
        <button
          type="button"
          class="admin-layout__profile-action"
          title="로그아웃"
          @click="handleLogout"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>

    <!-- 메인 콘텐츠 래퍼 영역 -->
    <div class="admin-layout__shell">
      <!-- 상단 헤더 영역 -->
      <header class="admin-layout__header">
        <div class="admin-layout__header-copy">
          <h2 class="admin-layout__header-title">{{ currentPageTitle }}</h2>
          <p class="admin-layout__header-kicker">{{ topbarSub }}</p>
        </div>

        <div class="admin-layout__header-actions">
          <!-- 알림 버튼: ADMIN/MANAGER만 표시, MASTER 제외 -->
          <div v-if="showNotification" class="admin-layout__notif-wrap">
            <button
              type="button"
              class="admin-layout__utility-button"
              @click="notificationStore.toggleDropdown()"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>알림</span>
              <NotificationBadge />
            </button>

            <!-- 드롭다운: 열림 상태일 때만 렌더링 -->
            <NotificationDropdown v-if="notificationStore.dropdownOpen" />

            <!-- 드롭다운 외부 클릭 시 닫기 오버레이 -->
            <div
              v-if="notificationStore.dropdownOpen"
              class="admin-layout__notif-overlay"
              @click="notificationStore.closeDropdown()"
            />
          </div>
          <button
            v-if="headerActions.showComplexSelector"
            type="button"
            class="admin-layout__action-button admin-layout__action-button--ghost"
            @click="router.push('/admin/master')"
          >
            단지 선택
          </button>

          <button
            v-if="headerActions.showAdminRegister"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 관리자 등록
          </button>

          <button
            v-if="canCreateNotice"
            type="button"
            class="admin-layout__action-button"
            @click="router.push('/admin/notices/create')"
          >
            + 공지 작성
          </button>

          <button
            v-if="headerActions.showHouseholdTypeManage"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 평형/라인 관리
          </button>

          <button
            v-if="headerActions.showHouseholdCreate"
            type="button"
            class="admin-layout__action-button"
            @click="handleCreateClick"
          >
            + 세대 등록
          </button>

          <button
            v-if="route.path === '/admin/bills'"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 비용 확정
          </button>

          <button
            v-if="route.path === '/admin/vehicles'"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 차량 등록
          </button>

          <button
            v-if="route.path === '/admin/visitor-vehicles'"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 방문차량 등록
          </button>

          <button
            v-if="headerActions.showParkingLogCreate"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 기록 등록
          </button>

          <button
            v-if="route.path === '/admin/parking/dashboard'"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 주차 구역 등록
          </button>

          <button
            v-if="headerActions.showParkingZoneCreate"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 구역 등록
          </button>

          <button
            v-if="headerActions.showSensorCreate"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 센서 등록
          </button>

          <button
            v-if="route.path === '/admin/notices'"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 공지 등록
          </button>

          <button
            v-if="route.path === '/admin/votes'"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 투표 등록
          </button>

          <button
            v-if="route.path === '/admin/facilities' && (!route.query.tab || route.query.tab === 'list')"
            type="button"
            class="admin-layout__action-button"
            @click="goFacilityCreate"
          >
            + 시설 등록
          </button>

          <button
            v-if="route.path === '/admin/facilities' && route.query.tab === 'gx'"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 프로그램 등록
          </button>

          <button
            v-if="route.path === '/admin/facilities' && route.query.tab === 'block-time'"
            type="button"
            class="admin-layout__action-button"
            @click="handleActionClick"
          >
            + 차단 시간 등록
          </button>

          <button
            v-if="route.path === '/admin/reservations' || route.path === '/admin/reservations/list'"
            type="button"
            class="admin-layout__action-button"
            @click="goToFacilityStatus"
          >
            시설별 현황 →
          </button>
        </div>
      </header>

      <!-- 메인 콘텐츠 영역 -->
      <main class="admin-layout__main">
        <div class="page-container admin-layout__page-container">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100vh;
  min-width: 960px;
  background-color: var(--color-bg-app);
  color: var(--color-text-primary);
}

.admin-layout__sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--color-sidebar-bg);
  color: var(--color-sidebar-text);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.08);
  overflow-y: auto;
}

.admin-layout__brand-panel {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-24) var(--space-20);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.admin-layout__brand-icon {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-8);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-size: var(--font-size-body);
  font-weight: 700;
}

.admin-layout__brand-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.admin-layout__brand-role {
  margin: 2px 0 0;
  color: rgba(255, 255, 255, 0.48);
  font-size: var(--font-size-badge);
}

.admin-layout__nav-scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-12);
}

.admin-layout__nav-group + .admin-layout__nav-group {
  margin-top: var(--space-8);
}

.admin-layout__nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.admin-layout__nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 5px 10px;
  border: 1px solid transparent;
  border-radius: 7px;
  color: var(--color-sidebar-text);
  font-size: var(--font-size-detail);
  font-weight: 500;
  opacity: 0.68;
  text-decoration: none;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.admin-layout__nav-icon {
  display: inline-flex;
  width: 15px;
  height: 15px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.admin-layout__nav-icon svg {
  display: block;
}

.admin-layout__nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-sidebar-text);
  opacity: 0.88;
}

.admin-layout__nav-link.is-active {
  background: var(--color-primary);
  border-color: transparent;
  color: var(--color-primary-contrast);
  opacity: 1;
  font-weight: 600;
}

.admin-layout__nav-link.is-active .admin-layout__nav-icon {
  color: var(--color-primary-contrast);
}

.admin-layout__section-label {
  padding: 10px 10px 5px;
  color: rgba(255, 255, 255, 0.36);
  font-size: var(--font-size-caption-sm);
  letter-spacing: 0.08em;
  font-weight: 600;
}

.admin-layout__profile {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-16) var(--space-20);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-layout__profile-avatar {
  display: flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-label);
  font-weight: 700;
}

.admin-layout__profile-card {
  flex: 1;
  min-width: 0;
}

.admin-layout__profile-name {
  margin: 0;
  font-size: var(--font-size-detail);
  font-weight: 600;
}

.admin-layout__profile-role {
  margin: 2px 0 0;
  color: rgba(255, 255, 255, 0.48);
  font-size: var(--font-size-badge);
}

.admin-layout__profile-action {
  display: flex;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: transparent;
  color: var(--color-sidebar-text);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.admin-layout__profile-action:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(229, 62, 62, 0.5);
  color: #E53E3E;
}

.admin-layout__shell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  background: var(--color-bg-app);
}

.admin-layout__header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88px;
  padding: 0 48px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-app);
}

.admin-layout__header-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-layout__header-kicker {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
}

.admin-layout__header-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.admin-layout__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.admin-layout__notif-wrap {
  position: relative;
}

.admin-layout__notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 199;
}

.admin-layout__utility-button {
  position: relative;
  display: flex;
  height: 36px;
  align-items: center;
  gap: 5px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: var(--font-size-detail);
}

.admin-layout__action-button {
  display: inline-flex;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border: none;
  border-radius: 7px;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  cursor: pointer;
  font-size: var(--font-size-detail);
  font-weight: 500;
}

.admin-layout__action-button--ghost {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}

.admin-layout__identity {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: 0 2px 0 var(--space-4);
}

.admin-layout__identity-name {
  font-size: var(--font-size-body-sm);
  font-weight: 700;
}

.admin-layout__identity-role {
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.admin-layout__main {
  flex: 1;
  background: var(--color-bg-app);
}

.admin-layout__page-container {
  min-height: calc(100vh - 88px);
  padding-left: 64px;
  padding-right: 64px;
}

@media (max-width: 1024px) {
  .admin-layout__header {
    padding: 0 var(--space-20);
  }

  .admin-layout__page-container {
    padding-left: var(--space-24);
    padding-right: var(--space-24);
  }
}
</style>
