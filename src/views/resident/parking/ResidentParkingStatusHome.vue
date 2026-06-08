<script setup>
// 입주민 주차 현황 화면이다.
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useParkingStore } from '@/stores/useParkingStore'
import { useComplexStore } from '@/stores/useComplexStore'

const parkingStore = useParkingStore()
const complexStore = useComplexStore()
const route = useRoute()
const router = useRouter()

const isFirstLoad = ref(true)
const selectedZoneIndex = ref(0)

// 현재 단지가 SENSOR 운영 타입인지 판별
const isSensorComplex = computed(() => complexStore.isSensorComplex)

// 현재 단지의 주차 운영 타입이 NONE이 아닌지 판별
const isParkingActiveComplex = computed(
  () => complexStore.residentComplex?.parkingTypeCode !== '01',
)

// 자동 갱신 안내 문구 산출
const refreshNoteText = computed(() =>
  isParkingActiveComplex.value
    ? '주차 현황은 실시간으로 갱신됩니다.'
    : '주차 현황은 화면을 열 때 갱신됩니다.',
)

// 입주민 주차 현황 조회
const loadStatus = () => {
  return parkingStore.fetchResidentParkingStatus()
}

// 포그라운드 복귀 시 스냅샷 재동기화
const handleVisibilityChange = () => {
  if (!document.hidden) {
    loadStatus()
  }
}

// 구역 표시 라벨 변환
const formatZoneLabel = (zone) => {
  if (zone.zoneName) return zone.areaName + ' ' + zone.zoneName
  return zone.areaName
}

// 점유율 기준 상태 키 분류
const computeStatusKey = (rate) => {
  if (rate >= 90) return 'full'
  if (rate >= 60) return 'busy'
  return 'free'
}

// 구역별 상태 키 산출
const zoneStatusKey = (zone) => {
  if (!zone || !zone.totalSlots) return 'free'
  const r = (zone.currentParkedCount / zone.totalSlots) * 100
  return computeStatusKey(r)
}

// 입주민 주차 현황 응답 노출
const status = computed(() => parkingStore.residentParkingStatus)

// 구역 목록 안전 노출
const zoneList = computed(() => status.value?.zones || [])

// 선택된 구역 노출
const selectedZone = computed(() => zoneList.value[selectedZoneIndex.value] || null)

// 선택된 구역 점유율 산출
const selectedRate = computed(() => {
  const zone = selectedZone.value
  if (!zone || !zone.totalSlots) return 0
  return Number(((zone.currentParkedCount / zone.totalSlots) * 100).toFixed(1))
})

// 선택된 구역 점유율 텍스트
const selectedRateText = computed(() => selectedRate.value + '%')

// 선택된 구역 상태 키
const selectedStatusKey = computed(() => computeStatusKey(selectedRate.value))

// 선택된 구역 상태 라벨
const selectedStatusText = computed(() => {
  const map = { free: '여유', busy: '혼잡', full: '만차' }
  return map[selectedStatusKey.value]
})

// 구역 선택 처리
const handleZoneSelect = (index) => {
  selectedZoneIndex.value = index
}

// 선택 구역 자리 현황으로 이동 (SENSOR 단지 전용)
const goToSpots = () => {
  const zone = selectedZone.value
  if (zone?.zoneId != null) {
    router.push(`/resident/${route.params.complexId}/parking/zones/${zone.zoneId}/spots`)
  }
}

// 구역 목록 변동 시 선택 인덱스 보정
watch(zoneList, () => {
  if (selectedZoneIndex.value >= zoneList.value.length) {
    selectedZoneIndex.value = 0
  }
})

onMounted(async () => {
  // SSE 먼저 동기 시작, await race 누수 방지
  // (이 줄 아래에 SSE 새 연결을 여는 코드 추가 금지)
  // 주차 운영 단지(SENSOR/BASIC)에서 SSE 구독
  if (isParkingActiveComplex.value) {
    parkingStore.connectSpotSse()
  }
  await loadStatus()
  isFirstLoad.value = false
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  parkingStore.disconnectSpotSse()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <section class="resident-parking-status">

    <h1 class="resident-parking-status__page-title">주차 현황</h1>

    <div
      v-if="isFirstLoad && parkingStore.loading"
      class="resident-parking-status__loading"
    >
      조회 중입니다...
    </div>

    <template v-else>
      <div
        v-if="zoneList.length === 0 || status?.totalSlots === 0"
        class="resident-parking-status__empty"
      >
        데이터 없음
      </div>

      <template v-else>
        <div class="parking-header-card">
          <p class="parking-header-card__title">{{ selectedZone ? formatZoneLabel(selectedZone) : '' }}</p>
          <p class="parking-header-card__subtitle">실시간 주차 현황</p>
          <div class="parking-header-card__divider"></div>

          <p v-if="isSensorComplex" class="zone-select-hint">
            구역을 선택하면 세부 현황을 확인할 수 있습니다
          </p>

          <div class="zone-toggle">
            <button
              v-for="(zone, index) in zoneList"
              :key="zone.zoneId"
              type="button"
              class="zone-toggle__card"
              :class="{ 'zone-toggle__card--active': selectedZoneIndex === index }"
              @click="handleZoneSelect(index)"
            >
              <span
                class="zone-toggle__status-dot"
                :class="`zone-toggle__status-dot--${zoneStatusKey(zone)}`"
              ></span>
              <p class="zone-toggle__name">{{ formatZoneLabel(zone) }}</p>
              <p class="zone-toggle__count">
                {{ zone.currentParkedCount }}<span class="zone-toggle__total">/{{ zone.totalSlots }}</span>
              </p>
            </button>
          </div>
        </div>

        <div class="parking-detail">
          <div class="parking-detail__left">
            <div class="parking-detail__row">
              <span class="parking-detail__row-label">현재 주차 중</span>
              <span class="parking-detail__row-value">
                {{ selectedZone?.currentParkedCount ?? 0 }} 대
                <span :class="`parking-detail__row-badge parking-detail__row-badge--${selectedStatusKey}`">
                  {{ selectedStatusText }}
                </span>
              </span>
            </div>

            <div class="parking-detail__row">
              <span class="parking-detail__row-label">잔여 주차면</span>
              <span class="parking-detail__row-value">
                {{ selectedZone?.remainingSlots ?? 0 }} 면
              </span>
            </div>
          </div>

          <div class="parking-detail__total">
            <p class="parking-detail__total-label">전체</p>
            <p class="parking-detail__total-label">주차면</p>
            <p class="parking-detail__total-value">
              {{ selectedZone?.totalSlots ?? 0 }} <span class="parking-detail__total-unit">면</span>
            </p>
            <p
              class="parking-detail__total-caption"
              :class="`parking-detail__total-caption--${selectedStatusKey}`"
            >
              총 주차 가능 대수
            </p>
          </div>
        </div>

        <button
          v-if="isSensorComplex && selectedZone"
          type="button"
          class="spot-map-btn"
          @click="goToSpots"
        >
          자리 현황 보기
        </button>

        <div class="zone-status-badge" :class="`zone-status-badge--${selectedStatusKey}`">
          <span class="zone-status-badge__dot"></span>
          <span class="zone-status-badge__text">
            현재 주차장 상태: <strong class="zone-status-badge__label">{{ selectedStatusText }}</strong>
          </span>
        </div>

        <div class="usage-bar">
          <div class="usage-bar__head">
            <span class="usage-bar__title">주차 사용률</span>
            <span class="usage-bar__rate">{{ selectedRateText }}</span>
          </div>
          <div class="usage-bar__track">
            <div class="usage-bar__fill" :style="{ width: selectedRate + '%' }"></div>
          </div>
          <div class="usage-bar__foot">
            <span class="usage-bar__used">사용 {{ selectedZone?.currentParkedCount ?? 0 }}면</span>
            <span class="usage-bar__free">여유 {{ selectedZone?.remainingSlots ?? 0 }}면</span>
          </div>
        </div>

        <p class="auto-refresh-note">
          <svg class="auto-refresh-note__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9"/>
            <polyline points="12 7 12 12 15 14"/>
          </svg>
          <span>{{ refreshNoteText }}</span>
        </p>
      </template>
    </template>

  </section>
</template>

<style scoped>
.resident-parking-status {
  display: grid;
  gap: var(--space-12);
  padding: var(--space-16);
}

.resident-parking-status__page-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 500;
}

/* 로딩 / 빈 상태 */
.resident-parking-status__loading,
.resident-parking-status__empty {
  padding: var(--space-32);
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
  text-align: center;
}

/* 헤더 통합 카드 */
.parking-header-card {
  padding: var(--space-16);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: 0 4px 14px rgba(73, 115, 229, 0.08);
}

.parking-header-card__title {
  margin: 0 0 2px;
  color: var(--color-text-primary);
  font-size: 17px;
  font-weight: 500;
}

.parking-header-card__subtitle {
  margin: 0 0 14px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.parking-header-card__divider {
  height: 1px;
  margin-bottom: 14px;
  background: var(--color-border);
}

/* 구역 선택 안내 문구 */
.zone-select-hint {
  margin: 0 0 var(--space-8);
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
}

/* zone 토글 */
.zone-toggle {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: var(--space-8);
}

.zone-toggle__card {
  position: relative;
  padding: var(--space-12);
  border: 1px solid transparent;
  border-radius: 10px;
  background: #F1F3F5;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.zone-toggle__card--active {
  border: 1.5px solid var(--resident-primary);
  background: var(--color-card-bg);
}

.zone-toggle__status-dot {
  position: absolute;
  top: var(--space-12);
  right: var(--space-12);
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
}

.zone-toggle__status-dot--free { background: #50C878; }
.zone-toggle__status-dot--busy { background: #F59E0B; }
.zone-toggle__status-dot--full { background: #E53E3E; }

.zone-toggle__name {
  margin: 0 0 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.zone-toggle__count {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 22px;
  font-weight: 500;
}

.zone-toggle__total {
  margin-left: 2px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 400;
}

/* 상세 영역 */
.parking-detail {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-8);
}

.parking-detail__left {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: var(--space-8);
}

.parking-detail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-12) var(--space-16);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: 0 4px 14px rgba(73, 115, 229, 0.08);
}

.parking-detail__row-label {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.parking-detail__row-value {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-4);
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
}

.parking-detail__row-badge {
  font-size: 11px;
}

.parking-detail__row-badge--free { color: #2F855A; }
.parking-detail__row-badge--busy { color: #B7791F; }
.parking-detail__row-badge--full { color: #C53030; }

.parking-detail__total {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: 0 4px 14px rgba(73, 115, 229, 0.08);
  text-align: center;
}

.parking-detail__total-label {
  margin: 0 0 2px;
  color: var(--color-text-secondary);
  font-size: 11px;
}

.parking-detail__total-label + .parking-detail__total-label {
  margin-bottom: 6px;
}

.parking-detail__total-value {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 500;
}

.parking-detail__total-unit {
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 400;
}

.parking-detail__total-caption {
  margin: 6px 0 0;
  font-size: 9px;
}

.parking-detail__total-caption--free { color: #2F855A; }
.parking-detail__total-caption--busy { color: #B7791F; }
.parking-detail__total-caption--full { color: #C53030; }

/* 자리 현황 보기 버튼 */
.spot-map-btn {
  width: 100%;
  height: 44px;
  border: 1.5px solid var(--resident-primary);
  border-radius: var(--radius-12);
  background: transparent;
  color: var(--resident-primary);
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  cursor: pointer;
}

/* 상태 뱃지 */
.zone-status-badge {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-12) var(--space-16);
  border-radius: var(--radius-12);
}

.zone-status-badge--free { background: rgba(80, 200, 120, 0.10); }
.zone-status-badge--busy { background: rgba(245, 158, 11, 0.10); }
.zone-status-badge--full { background: rgba(229, 62, 62, 0.10); }

.zone-status-badge__dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
}

.zone-status-badge--free .zone-status-badge__dot { background: #50C878; }
.zone-status-badge--busy .zone-status-badge__dot { background: #F59E0B; }
.zone-status-badge--full .zone-status-badge__dot { background: #E53E3E; }

.zone-status-badge__text {
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
  font-weight: 600;
}

.zone-status-badge__label {
  font-weight: 500;
}

.zone-status-badge--free .zone-status-badge__label { color: #2F855A; }
.zone-status-badge--busy .zone-status-badge__label { color: #B7791F; }
.zone-status-badge--full .zone-status-badge__label { color: #C53030; }

/* 사용률 게이지바 */
.usage-bar {
  display: grid;
  gap: var(--space-8);
  padding: 0 var(--space-4);
}

.usage-bar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.usage-bar__title {
  color: var(--color-text-primary);
  font-size: 13px;
}

.usage-bar__rate {
  color: var(--resident-primary);
  font-size: 14px;
  font-weight: 500;
}

.usage-bar__track {
  height: 6px;
  border-radius: 3px;
  background: var(--color-bg-muted);
  overflow: hidden;
}

.usage-bar__fill {
  height: 100%;
  border-radius: 3px;
  background: var(--resident-primary);
  transition: width 0.3s ease;
}

.usage-bar__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.usage-bar__used,
.usage-bar__free {
  color: var(--color-text-secondary);
  font-size: 11px;
}

/* 자동 갱신 안내 */
.auto-refresh-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
}

.auto-refresh-note__icon {
  width: 14px;
  height: 14px;
}
</style>
