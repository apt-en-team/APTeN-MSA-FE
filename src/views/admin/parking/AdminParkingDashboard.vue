<script setup>
// 관리자 주차 현황 대시보드 화면이다. 상단 요약 카드와 전체 사용률을 폴링으로 표시한다.
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useParkingStore } from '@/stores/useParkingStore'
import { codeToParkingTypeName } from '@/constants/parkingTypes'
import StatsCards from '@/components/admin/StatsCards.vue'

const parkingStore = useParkingStore()
const { adminParkingStatus } = storeToRefs(parkingStore)

// 첫 조회 로딩 상태 (폴링 갱신 시에는 화면 깜빡임 방지를 위해 유지하지 않음)
const loading = ref(true)

// 폴링 타이머 핸들
let pollTimer = null

// 폴링 주기 (3초)
const POLL_INTERVAL_MS = 3000

// 관리자 주차 현황 조회
const loadStatus = async () => {
  await parkingStore.fetchAdminParkingStatus()
  loading.value = false
}

// 점유율을 숫자로 안전 변환 (BigDecimal이 문자열로 올 수 있음)
const occupancyRate = computed(() => Number(adminParkingStatus.value.occupancyRate || 0))

// 화면 표기용 정수 점유율
const occupancyPercent = computed(() => Math.round(occupancyRate.value))

// 점유율 기준 혼잡도 분류
const congestionLevel = (rate) => {
  const value = Number(rate || 0)
  if (value < 50) return '여유'
  if (value < 80) return '보통'
  return '혼잡'
}

// 현재 혼잡도 라벨
const congestion = computed(() => congestionLevel(occupancyRate.value))

// 혼잡도별 뱃지 색상 키
const congestionClass = computed(() => {
  const value = occupancyRate.value
  if (value < 50) return 'is-free'
  if (value < 80) return 'is-normal'
  return 'is-busy'
})

// 미등록 차량 비율 (SENSOR 단지 null이거나 전체 면수 0이면 생략)
const unregisteredRatio = computed(() => {
  const status = adminParkingStatus.value
  const total = Number(status.totalSlots || 0)
  if (status.unregisteredCount == null || total === 0) return null
  return Math.round((Number(status.unregisteredCount) / total) * 100)
})

// 상단 통계 카드 4장 구성
const stats = computed(() => {
  const status = adminParkingStatus.value
  const total = Number(status.totalSlots || 0)
  const parked = Number(status.currentParkedCount || 0)
  const remaining = Number(status.remainingSlots || 0)
  const unregistered = status.unregisteredCount
  return [
    {
      label: '전체 주차면',
      value: total,
      unit: '면',
      desc: `주차장 ${Number(status.areaCount || 0)}곳`,
    },
    {
      label: '현재 사용',
      value: parked,
      unit: '대',
      desc: `전체 대비 ${occupancyPercent.value}%`,
    },
    {
      label: '현재 가용',
      value: remaining,
      unit: '면',
      desc: '주차 가능',
    },
    {
      label: '미등록 차량',
      value: unregistered == null ? '-' : Number(unregistered),
      unit: '대',
      desc: unregisteredRatio.value == null ? '' : `전체 대비 ${unregisteredRatio.value}%`,
      descClass: 'warning',
    },
  ]
})

// 갱신 시각 표기 변환
const updatedAtText = computed(() => {
  const value = adminParkingStatus.value.updatedAt
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 16)
})

// 단지가 SENSOR 운영 타입인지 여부
const isSensor = computed(() => codeToParkingTypeName(adminParkingStatus.value.parkingTypeCode) === 'SENSOR')

// 차량 유형별 현황 항목 (BASIC 단지 전용)
const vehicleTypeItems = computed(() => {
  const status = adminParkingStatus.value
  const parked = Number(status.currentParkedCount || 0)
  // 현재 사용 대수 대비 유형 비율 계산, 분모 0 방어
  const ratio = (count) => (parked === 0 ? 0 : Math.round((Number(count || 0) / parked) * 100))
  return [
    { key: 'resident', label: '등록(입주민)', count: Number(status.residentCount || 0), ratio: ratio(status.residentCount), color: '#2B3A55' },
    { key: 'visitor', label: '방문', count: Number(status.visitorCount || 0), ratio: ratio(status.visitorCount), color: '#4973E5' },
    { key: 'regular', label: '고정방문', count: Number(status.regularVisitorCount || 0), ratio: ratio(status.regularVisitorCount), color: '#48BB78' },
    { key: 'unregistered', label: '미등록', count: Number(status.unregisteredCount || 0), ratio: ratio(status.unregisteredCount), color: '#C08B2D' },
  ]
})

// 유형 분포 도넛 색상
const TYPE_COLORS = ['#2B3A55', '#4973E5', '#48BB78', '#C08B2D']

// 사용/여유 도넛 색상
const USAGE_COLORS = ['#4973E5', '#E2E8F0']

// 도넛 라벨 (SENSOR면 사용/여유, BASIC이면 유형 분포)
const donutLabels = computed(() =>
  isSensor.value ? ['사용', '여유'] : ['등록(입주민)', '방문', '고정방문', '미등록'],
)

// 도넛 시리즈 (SENSOR면 사용/여유 2분할, BASIC이면 유형 분포)
const donutSeries = computed(() => {
  const status = adminParkingStatus.value
  if (isSensor.value) {
    return [Number(status.currentParkedCount || 0), Number(status.remainingSlots || 0)]
  }
  return [
    Number(status.residentCount || 0),
    Number(status.visitorCount || 0),
    Number(status.regularVisitorCount || 0),
    Number(status.unregisteredCount || 0),
  ]
})

// 도넛 차트 옵션 구성, 가운데에 사용률 표시하고 조각 위 라벨은 끔
const donutOptions = computed(() => ({
  chart: { type: 'donut' },
  labels: donutLabels.value,
  colors: isSensor.value ? USAGE_COLORS : TYPE_COLORS,
  legend: { position: 'bottom' },
  stroke: { width: 0 },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        labels: {
          show: true,
          name: { show: true },
          value: { show: true },
          total: {
            show: true,
            label: '사용률',
            formatter: () => `${occupancyPercent.value}%`,
          },
        },
      },
    },
  },
}))

// 구역 목록 (null 방어)
const zones = computed(() => adminParkingStatus.value.zones || [])

// 구역 점유율 계산, 분모 0 방어
const zoneOccupancy = (zone) => {
  const total = Number(zone.totalSlots || 0)
  if (total === 0) return 0
  return Math.round((Number(zone.currentParkedCount || 0) / total) * 100)
}

// 구역 표시 이름 반환 (zoneName 없으면 areaName만)
const zoneTitle = (zone) => (zone.zoneName ? `${zone.areaName} ${zone.zoneName}` : zone.areaName)

// 점유율 기준 혼잡도 뱃지 색상 키 반환
const congestionClassOf = (rate) => {
  const value = Number(rate || 0)
  if (value < 50) return 'is-free'
  if (value < 80) return 'is-normal'
  return 'is-busy'
}

onMounted(() => {
  loadStatus()
  pollTimer = setInterval(loadStatus, POLL_INTERVAL_MS)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <section class="admin-page">

    <!-- 첫 조회 로딩 -->
    <div v-if="loading" class="dashboard-feedback">주차 현황을 불러오는 중입니다...</div>

    <template v-else>
      <!-- 상단 통계 카드 4장 -->
      <StatsCards :stats="stats" />

      <!-- 블록 B: 좌측(사용률 + 유형별) / 우측(도넛) 2단 -->
      <div class="dashboard-grid">
        <!-- 왼쪽: 전체 사용률 + 차량 유형별 현황 -->
        <section class="dashboard-card usage-card">
          <!-- 전체 사용률 -->
          <div class="usage-head">
            <span class="usage-title">전체 사용률</span>
            <span class="usage-rate">{{ occupancyPercent }}%</span>
            <span :class="['usage-badge', congestionClass]">{{ congestion }}</span>
          </div>
          <div class="usage-bar">
            <div class="usage-fill" :class="congestionClass" :style="{ width: `${occupancyPercent}%` }" />
          </div>
          <div class="usage-meta">
            사용 {{ Number(adminParkingStatus.currentParkedCount || 0) }}대 / 여유 {{ Number(adminParkingStatus.remainingSlots || 0) }}면
            <span class="usage-meta__total">(전체 {{ Number(adminParkingStatus.totalSlots || 0) }}면)</span>
          </div>

          <!-- BASIC: 차량 유형별 격자 -->
          <div v-if="!isSensor" class="type-block">
            <h2 class="dashboard-card__title">차량 유형별 현황</h2>
            <div class="type-grid">
              <div
                v-for="item in vehicleTypeItems"
                :key="item.key"
                :class="['type-card', `type-card--${item.key}`]"
              >
                <span class="type-badge" :style="{ background: item.color }">{{ item.label.charAt(0) }}</span>
                <div class="type-body">
                  <span class="type-name">{{ item.label }}</span>
                  <span class="type-num"><strong>{{ item.count }}</strong>대 <em>{{ item.ratio }}%</em></span>
                </div>
              </div>
            </div>
          </div>

          <!-- SENSOR: 층별 점유 현황을 왼쪽 카드에 표시 -->
          <div v-else class="type-block">
            <h2 class="dashboard-card__title">층별 점유 현황</h2>
            <div v-if="zones.length === 0" class="dashboard-feedback">표시할 주차 구역이 없습니다.</div>
            <div v-else class="zone-grid zone-grid--narrow">
              <article v-for="zone in zones" :key="zone.zoneId" class="zone-card">
                <div class="zone-card__head">
                  <span class="zone-card__name">{{ zoneTitle(zone) }}</span>
                  <span :class="['usage-badge', congestionClassOf(zoneOccupancy(zone))]">
                    {{ congestionLevel(zoneOccupancy(zone)) }}
                  </span>
                </div>
                <div class="zone-card__count">
                  <strong>{{ Number(zone.currentParkedCount || 0) }}</strong> / {{ Number(zone.totalSlots || 0) }}면
                </div>
                <div class="zone-bar">
                  <div
                    class="zone-fill"
                    :class="congestionClassOf(zoneOccupancy(zone))"
                    :style="{ width: `${zoneOccupancy(zone)}%` }"
                  />
                </div>
                <div class="zone-card__rate">점유율 {{ zoneOccupancy(zone) }}%</div>
              </article>
            </div>
          </div>
        </section>

        <!-- 오른쪽: 점유 분포 도넛 차트 -->
        <section class="dashboard-card">
          <div class="dashboard-card__head">
            <h2 class="dashboard-card__title">{{ isSensor ? '사용 분포' : '차량 유형 분포' }}</h2>
            <span v-if="updatedAtText" class="dashboard-card__time">현재 기준 {{ updatedAtText }}</span>
          </div>
          <apexchart type="donut" height="300" :options="donutOptions" :series="donutSeries" />
        </section>
      </div>

      <!-- 블록 C: 층별 점유 카드 (BASIC만, SENSOR는 왼쪽 카드로 이동) -->
      <section v-if="!isSensor" class="dashboard-card">
        <h2 class="dashboard-card__title">층별 점유 현황</h2>
        <div v-if="zones.length === 0" class="dashboard-feedback">표시할 주차 구역이 없습니다.</div>
        <div v-else class="zone-grid zone-grid--wide">
          <article v-for="zone in zones" :key="zone.zoneId" class="zone-card">
            <div class="zone-card__head">
              <span class="zone-card__name">{{ zoneTitle(zone) }}</span>
              <span :class="['usage-badge', congestionClassOf(zoneOccupancy(zone))]">
                {{ congestionLevel(zoneOccupancy(zone)) }}
              </span>
            </div>
            <div class="zone-card__count">
              <strong>{{ Number(zone.currentParkedCount || 0) }}</strong> / {{ Number(zone.totalSlots || 0) }}면
            </div>
            <div class="zone-bar">
              <div
                class="zone-fill"
                :class="congestionClassOf(zoneOccupancy(zone))"
                :style="{ width: `${zoneOccupancy(zone)}%` }"
              />
            </div>
            <div class="zone-card__rate">점유율 {{ zoneOccupancy(zone) }}%</div>
          </article>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.admin-page {
  display: grid;
  gap: 20px;
}

.admin-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-page__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
  font-weight: 700;
}

.admin-page__description {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.admin-page__updated {
  flex-shrink: 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.dashboard-feedback {
  padding: 48px 0;
  color: var(--color-text-secondary);
  text-align: center;
  font-size: 14px;
}

/* 사용률 + 유형별을 담는 왼쪽 카드 내부 세로 정렬 */
.usage-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 유형별 현황 영역, 사용률 영역과 구분선으로 분리 */
.type-block {
  margin-top: 6px;
  padding-top: 16px;
  border-top: 1px solid #E2E8F0;
}

.usage-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.usage-title {
  font-size: 14px;
  font-weight: 700;
  color: #2B3A55;
}

.usage-rate {
  font-size: 20px;
  font-weight: 700;
  color: #1E2A3E;
}

.usage-badge {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.usage-badge.is-free {
  background: #EBFBEE;
  color: #2F855A;
}

.usage-badge.is-normal {
  background: #FDF6E8;
  color: #C08B2D;
}

.usage-badge.is-busy {
  background: #FFF5F5;
  color: #E53E3E;
}

.usage-bar {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: #EDF0F4;
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.4s ease;
}

.usage-fill.is-free {
  background: #48BB78;
}

.usage-fill.is-normal {
  background: #C08B2D;
}

.usage-fill.is-busy {
  background: #E53E3E;
}

.usage-meta {
  font-size: 13px;
  color: #4A5568;
}

.usage-meta__total {
  color: #94A3B8;
}

/* 하단 그리드 (유형별 패널 + 도넛), 두 카드 높이를 같게 stretch */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: stretch;
}

/* 오른쪽 도넛 카드를 grid 셀 높이만큼 채우는 세로 배치 */
.dashboard-grid > .dashboard-card:last-child {
  display: flex;
  flex-direction: column;
}

/* 헤더 아래 차트 영역이 남은 높이를 채우고 도넛을 세로 가운데 정렬 */
.dashboard-grid > .dashboard-card:last-child > :last-child {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 공통 카드 */
.dashboard-card {
  padding: 22px 24px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  background: #FFFFFF;
}

.dashboard-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dashboard-card__title {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 700;
  color: #2B3A55;
}

.dashboard-card__head .dashboard-card__title {
  margin-bottom: 0;
}

.dashboard-card__time {
  font-size: 12px;
  color: #94A3B8;
}

/* 유형별 현황 2열 격자 */
.type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.type-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  min-height: 96px;
  border-radius: 12px;
  background: #F5F6F8;
  box-sizing: border-box;
}

/* 유형별 옅은 배경 톤 */
.type-card--resident { background: #EEF1F6; }
.type-card--visitor { background: #EEF3FE; }
.type-card--regular { background: #ECFBF1; }
.type-card--unregistered { background: #FBF4E6; }

.type-badge {
  display: flex;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
}

.type-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.type-name {
  font-size: 12px;
  color: #687282;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-num {
  font-size: 13px;
  color: #1E2A3E;
}

.type-num strong {
  font-size: 16px;
  font-weight: 700;
}

.type-num em {
  margin-left: 4px;
  font-style: normal;
  font-size: 12px;
  color: #94A3B8;
}

/* 층별 카드 그리드 */
.zone-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* 하단 블록 C 넓은 영역, 한 줄에 4개 */
.zone-grid.zone-grid--wide {
  grid-template-columns: repeat(4, 1fr);
}

/* 왼쪽 카드 SENSOR 좁은 영역, 한 줄에 3개 */
.zone-grid.zone-grid--narrow {
  grid-template-columns: repeat(3, 1fr);
}

/* 넓은 영역 축소 단계 */
@media (max-width: 900px) {
  .zone-grid.zone-grid--wide {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 좁은 화면에서 두 격자 모두 단일 열로 축소 */
@media (max-width: 560px) {
  .zone-grid.zone-grid--wide,
  .zone-grid.zone-grid--narrow {
    grid-template-columns: 1fr;
  }
}

.zone-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  min-height: 96px;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  background: #FBFCFE;
  box-sizing: border-box;
}

.zone-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.zone-card__name {
  font-size: 13px;
  font-weight: 700;
  color: #2B3A55;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zone-card__count {
  font-size: 13px;
  color: #4A5568;
}

.zone-card__count strong {
  font-size: 18px;
  color: #1E2A3E;
}

.zone-bar {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #EDF0F4;
  overflow: hidden;
}

.zone-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.zone-fill.is-free {
  background: #48BB78;
}

.zone-fill.is-normal {
  background: #C08B2D;
}

.zone-fill.is-busy {
  background: #E53E3E;
}

.zone-card__rate {
  font-size: 12px;
  color: #94A3B8;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
