<script setup>
import { ref, onMounted, computed } from 'vue'
import {useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { FEATURE_CODES, DEFAULT_COMPLEX_FEATURES } from '@/constants/complexFeatures'
import { isFeatureEnabled, normalizeFeatures } from '@/utils/featureGate'
import {getMyVehicles} from '@/api/vehicleApi'
import {getMyReservations} from '@/api/reservationApi'
import {getNotices} from '@/api/noticeApi'
import {getVisitorVehicles} from '@/api/visitorVehicleApi'

const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()

// 로그인한 사용자 이름 (useAuthStore에서 조회)
const userName = computed(() => authStore.name || '입주민')

// 소속 단지 이름
const complexName = computed(() => {
  return complexStore.residentComplex?.name || ''
})

// 내 차량 현황
const vehicleCount = ref(0)
const maxVehicleCount = 2 // 최대 등록 가능 대수

// 예약 현황 (이번 주 예약 건수)
const reservationCount = ref(0)

// 방문차량 현황 (승인 대기 건수)
const pendingVisitorCount = ref(0)

// 주차 현황 (사용률 %)
const parkingUsageRate = ref(0)

// 최근 공지사항 목록
const notices = ref([])

// 내 예약 현황 목록
const myReservations = ref([])

// 로딩 상태
const loading = ref(true)

// 입주민 기능 설정 source가 아직 명확하지 않으면 기본 true로 동작시킨다.
// TODO: 입주민용 단지 정보 API에 features가 연결되면 resident 홈 카드도 실제 단지 features 기준으로 제어한다.
const residentFeatures = computed(() => {
  return normalizeFeatures(
    complexStore.residentComplex?.features ||
    DEFAULT_COMPLEX_FEATURES,
  )
})

const showFacilitySection = computed(() => {
  return isFeatureEnabled(residentFeatures.value, FEATURE_CODES.FACILITY)
})

const showParkingSection = computed(() => {
  return isFeatureEnabled(residentFeatures.value, FEATURE_CODES.PARKING_STATUS)
})

// 홈 상단 요약 카드는 사용 가능한 기능만 자연스럽게 재배치해 노출한다.
const homeSummaryCards = computed(() => {
  const cards = [
    {
      key: 'vehicle',
      label: '내 차량',
      value: vehicleCount.value,
      unit: '대',
      desc: `최대 ${maxVehicleCount}대 등록 가능`,
      descClass: '',
      path: '/resident/my-vehicle',
      showProgress: false,
      progressValue: 0,
    },
  ]

  if (showFacilitySection.value) {
    cards.push({
      key: 'reservation',
      label: '예약 현황',
      value: reservationCount.value,
      unit: '건',
      desc: '이번 주 예약',
      descClass: '',
      path: '/resident/my-reservation',
      showProgress: false,
      progressValue: 0,
    })
  }

  cards.push({
    key: 'visitor',
    label: '방문차량',
    value: pendingVisitorCount.value,
    unit: '건',
    desc: '승인 대기',
    descClass: 'stat-card__desc--warn',
    path: '/resident/visitor-vehicles/list',
    showProgress: false,
    progressValue: 0,
  })

  if (showParkingSection.value) {
    cards.push({
      key: 'parking',
      label: '주차 현황',
      value: parkingUsageRate.value,
      unit: '%',
      desc: '',
      descClass: '',
      path: '',
      showProgress: true,
      progressValue: parkingUsageRate.value,
    })
  }

  return cards
})

// 날짜 포맷 (26.02.15 형식)
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

// 홈 데이터 전체 로드
async function loadHomeData() {
  loading.value = true
  try {
    // 병렬 요청으로 성능 최적화
    const [vehicles, reservations, notices_res, visitors] = await Promise.allSettled([
      getMyVehicles(),
      getMyReservations({size: 2}),
      getNotices({size: 3}),
      getVisitorVehicles({status: 'PENDING', size: 1}),
    ])

    // 차량 건수
    if (vehicles.status === 'fulfilled') {
      vehicleCount.value = Array.isArray(vehicles.value)
        ? vehicles.value.length
        : vehicles.value?.totalElements ?? 0
    }

    // 예약 현황
    if (reservations.status === 'fulfilled') {
      const data = reservations.value
      myReservations.value = Array.isArray(data) ? data : data?.content ?? []
      reservationCount.value = data?.totalElements ?? myReservations.value.length
    }

    // 최근 공지사항
    if (notices_res.status === 'fulfilled') {
      const data = notices_res.value
      notices.value = Array.isArray(data) ? data : data?.content ?? []
    }

    // 방문차량 승인 대기
    if (visitors.status === 'fulfilled') {
      const data = visitors.value
      pendingVisitorCount.value = data?.totalElements ?? 0
    }

    // // 주차 현황
    // if (parking.status === 'fulfilled') {
    //   parkingUsageRate.value = parking.value?.usageRate ?? 0
    // }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHomeData()
})
</script>

<template>
  <div class="home">

    <!-- 인사말 -->
    <section class="home__greeting">
      <p v-if="complexName" class="home__greeting-complex">{{ complexName }}</p>
      <h1 class="home__greeting-name">안녕하세요, {{ userName }}님</h1>
      <p class="home__greeting-unit">{{ authStore.building }}동 {{ authStore.unit }}호</p>
    </section>

    <!-- 통계 카드 2x2 -->
    <section class="home__stats">
      <div
        v-for="card in homeSummaryCards"
        :key="card.key"
        class="stat-card"
        :class="{ 'stat-card--static': !card.path }"
        @click="card.path ? router.push(card.path) : null"
      >
        <p class="stat-card__label">{{ card.label }}</p>
        <p class="stat-card__value">{{ card.value }}<span v-if="card.unit" class="stat-card__unit">{{ card.unit }}</span></p>
        <p v-if="card.desc" class="stat-card__desc" :class="card.descClass">{{ card.desc }}</p>
        <div v-if="card.showProgress" class="stat-card__progress">
          <div
            class="stat-card__progress-bar"
            :style="{ width: card.progressValue + '%' }"
          ></div>
        </div>
      </div>
    </section>

    <!-- 최근 공지사항 -->
    <section class="home__section">
      <div class="home__section-header">
        <h2 class="home__section-title">최근 공지사항</h2>
        <button class="home__section-more" @click="router.push('/resident/board/notice')">
          더보기 →
        </button>
      </div>

      <!-- 공지 없을 때 -->
      <p v-if="!loading && notices.length === 0" class="home__empty">
        공지사항이 없습니다.
      </p>

      <!-- 공지 목록 -->
      <ul class="notice-list">
        <li
          v-for="notice in notices"
          :key="notice.noticeUid"
          class="notice-item"
          @click="router.push(`/resident/board/notice/${notice.noticeUid}`)"
        >
          <span class="notice-item__title">{{ notice.title }}</span>
          <span class="notice-item__date">{{ formatDate(notice.createdAt) }}</span>
        </li>
      </ul>
    </section>

    <!-- 내 예약 현황 -->
    <section v-if="showFacilitySection" class="home__section">
      <div class="home__section-header">
        <h2 class="home__section-title">내 예약 현황</h2>
        <button class="home__section-more" @click="router.push('/resident/my-reservation')">
          더보기 →
        </button>
      </div>

      <!-- 예약 없을 때 -->
      <p v-if="!loading && myReservations.length === 0" class="home__empty">
        예약 내역이 없습니다.
      </p>

      <!-- 예약 목록 -->
      <ul v-else class="reservation-list">
        <li
          v-for="item in myReservations"
          :key="item.reservationUid"
          class="reservation-item"
          @click="router.push(`/resident/my-reservation/${item.reservationUid}`)"
        >
          <div class="reservation-item__info">
            <span class="reservation-item__name">{{ item.facilityName }}</span>
            <span class="reservation-item__time">
              {{ item.startTime }}~{{ item.endTime }} {{ formatDate(item.reservationDate) }}
            </span>
          </div>
          <!-- 예약 상태 뱃지 -->
          <span class="reservation-item__badge">예약중</span>
        </li>
      </ul>
    </section>

  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

/* 인사말 */
.home__greeting {
  padding: var(--space-8) 0 0;
}

.home__greeting-complex {
  font-size: var(--font-size-detail);
  font-weight: 600;
  color: var(--resident-primary);
  margin: 0 0 var(--space-4);
}

.home__greeting-name {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}

.home__greeting-unit {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* 통계 카드 2x2 */
.home__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
}

.stat-card {
  background: var(--resident-bg-2);
  border-radius: var(--radius-12);
  padding: var(--space-16);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  box-shadow: var(--shadow-small);
  transition: transform 0.15s;
}

.stat-card--static {
  cursor: default;
}

.stat-card:active {
  transform: scale(0.97);
}

.stat-card--static:active {
  transform: none;
}

.stat-card__label {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  margin: 0;
}

.stat-card__value {
  font-size: var(--font-size-heading-2);
  font-weight: 800;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.stat-card__unit {
  font-size: var(--font-size-body-sm);
  font-weight: 400;
  margin-left: 2px;
}

.stat-card__desc {
  font-size: var(--font-size-label);
  color: var(--resident-primary);
  margin: 0;
}

.stat-card__desc--warn {
  color: var(--color-warning);
  font-weight: 600;
}

/* 주차 현황 프로그레스 바 */
.stat-card__progress {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: var(--space-4);
}

.stat-card__progress-bar {
  height: 100%;
  background: var(--resident-primary);
  border-radius: 2px;
  transition: width 0.4s ease;
}

/* 섹션 공통 */
.home__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.home__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.home__section-title {
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.home__section-more {
  background: none;
  border: none;
  font-size: var(--font-size-detail);
  color: var(--resident-primary);
  cursor: pointer;
  padding: 0;
}

.home__empty {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  text-align: center;
  padding: var(--space-16);
  margin: 0;
}

/* 공지사항 리스트 */
.notice-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--resident-bg-2);
  border-radius: var(--radius-12);
  overflow: hidden;
  box-shadow: var(--shadow-small);
}

.notice-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-12) var(--space-16);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background 0.15s;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-item:active {
  background: var(--color-bg-muted);
}

.notice-item__title {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: var(--space-12);
}

.notice-item__date {
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

/* 예약 현황 리스트 */
.reservation-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.reservation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-12) var(--space-16);
  background: var(--resident-bg-2);
  border-radius: var(--radius-12);
  cursor: pointer;
  box-shadow: var(--shadow-small);
  transition: transform 0.15s;
}

.reservation-item:active {
  transform: scale(0.98);
}

.reservation-item__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.reservation-item__name {
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.reservation-item__time {
  font-size: var(--font-size-label);
  color: var(--color-text-secondary);
}

.reservation-item__badge {
  font-size: var(--font-size-badge);
  font-weight: 600;
  color: var(--resident-primary);
  background: rgba(73, 115, 229, 0.1);
  padding: 3px 8px;
  border-radius: 20px;
  flex-shrink: 0;
}
</style>
