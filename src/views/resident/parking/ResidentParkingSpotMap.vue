<script setup>
// 입주민 자리 맵 페이지이다.
// 특정 zone의 자리 목록을 실시간으로 표시한다.
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useParkingStore } from '@/stores/useParkingStore'
import ParkingSpotCell from '@/components/resident/parking/ParkingSpotCell.vue'

const route = useRoute()
const router = useRouter()
const parkingStore = useParkingStore()

// 자리 목록 노출
const spotList = computed(() => parkingStore.currentZoneSpots)
const spotsLoading = computed(() => parkingStore.spotsLoading)

// 좌우 분할 기준점, 홀수 시 왼쪽 우선
const halfCount = computed(() => Math.ceil(spotList.value.length / 2))

// 왼쪽 자리 목록 노출
const leftSpots = computed(() => spotList.value.slice(0, halfCount.value))

// 오른쪽 자리 목록 노출
const rightSpots = computed(() => spotList.value.slice(halfCount.value))

// 왼쪽 자리 8칸 청크 묶음
const leftChunks = computed(() => {
  const result = []
  for (let i = 0; i < leftSpots.value.length; i += 8) {
    result.push(leftSpots.value.slice(i, i + 8))
  }
  return result
})

// 오른쪽 자리 8칸 청크 묶음
const rightChunks = computed(() => {
  const result = []
  for (let i = 0; i < rightSpots.value.length; i += 8) {
    result.push(rightSpots.value.slice(i, i + 8))
  }
  return result
})

// 현재 zone 정보 매칭 노출
const currentZone = computed(() => {
  const zones = parkingStore.residentParkingStatus?.zones || []
  return zones.find((zone) => String(zone.zoneId) === String(route.params.zoneId)) || null
})

// 페이지 타이틀 산출
const pageTitle = computed(() => {
  const zone = currentZone.value
  if (!zone) return '자리 현황'
  if (zone.zoneName) return `${zone.areaName} ${zone.zoneName}`
  return zone.areaName || '자리 현황'
})

// 주차 현황 페이지로 복귀
const goBack = () => {
  router.push(`/resident/${route.params.complexId}/parking`)
}

onMounted(async () => {
  // SSE 먼저 동기 시작, await race 누수 방지
  // (이 줄 아래에 SSE 새 연결을 여는 코드 추가 금지)
  parkingStore.connectSpotSse()
  // 직접 진입 시 zone 이름 표시를 위해 단지 주차 현황 확보
  if (!parkingStore.residentParkingStatus?.zones?.length) {
    await parkingStore.fetchResidentParkingStatus()
  }
  parkingStore.fetchZoneSpots(route.params.zoneId)
})

onUnmounted(() => {
  parkingStore.disconnectSpotSse()
  parkingStore.clearZoneSpots()
})
</script>

<template>
  <div class="parking-spot-map">
    <!-- 뒤로가기 -->
    <button class="back-btn" type="button" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>주차 현황</span>
    </button>

    <!-- 페이지 타이틀 -->
    <h1 class="page-title">{{ pageTitle }}</h1>

    <!-- 상태 범례 -->
    <div class="spot-legend">
      <span class="spot-legend__item">
        <span class="spot-legend__swatch spot-legend__swatch--vacant"></span>
        빈자리
      </span>
      <span class="spot-legend__item">
        <span class="spot-legend__swatch spot-legend__swatch--occupied"></span>
        사용중
      </span>
      <span class="spot-legend__item">
        <span class="spot-legend__swatch spot-legend__swatch--unknown"></span>
        확인불가
      </span>
      <span class="spot-legend__item spot-legend__item--inactive">
        <span class="spot-legend__swatch spot-legend__swatch--unknown"></span>
        사용불가
      </span>
    </div>

    <!-- 자리 맵 본문 -->
    <div class="spot-card">
      <div v-if="spotsLoading && spotList.length === 0" class="placeholder">
        불러오는 중...
      </div>
      <div v-else-if="spotList.length === 0" class="placeholder">
        등록된 자리가 없습니다.
      </div>
      <div v-else class="spot-grid">
        <div class="spot-grid__side">
          <div
            v-for="(chunk, index) in leftChunks"
            :key="`L-${index}`"
            class="spot-grid__chunk"
          >
            <ParkingSpotCell
              v-for="spot in chunk"
              :key="spot.sensorId"
              :spot="spot"
            />
          </div>
        </div>
        <div class="spot-grid__aisle" aria-hidden="true"></div>
        <div class="spot-grid__side">
          <div
            v-for="(chunk, index) in rightChunks"
            :key="`R-${index}`"
            class="spot-grid__chunk"
          >
            <ParkingSpotCell
              v-for="spot in chunk"
              :key="spot.sensorId"
              :spot="spot"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.parking-spot-map {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  padding: var(--space-12) var(--space-16) 120px;
}

/* 뒤로가기 */
.back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: none;
  border: none;
  padding: 0;
  color: var(--color-primary);
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

/* 페이지 타이틀 */
.page-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 20px;
  font-weight: 500;
}

/* 상태 범례 */
.spot-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: 0 4px 14px rgba(73, 115, 229, 0.08);
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

/* 범례 항목 */
.spot-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 비활성 범례 항목 */
.spot-legend__item--inactive {
  opacity: 0.45;
}

/* 색상 스와치 */
.spot-legend__swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  border: 1px solid var(--gray-400);
}

.spot-legend__swatch--vacant {
  background: var(--color-success);
  border-color: var(--color-success);
}

.spot-legend__swatch--occupied {
  background: #eee;
  border-color: var(--color-border);
}

.spot-legend__swatch--unknown {
  background: var(--color-warning);
  border-color: var(--color-warning);
}

/* 비활성 항목 스와치 패턴 */
.spot-legend__item--inactive .spot-legend__swatch {
  background-color: var(--gray-200);
  border-style: dashed;
  border-color: var(--gray-600);
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0 3px,
    rgba(0, 0, 0, 0.18) 3px 4px
  );
}

/* 자리 맵 카드 컨테이너 */
.spot-card {
  padding: var(--space-16);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: 0 4px 14px rgba(73, 115, 229, 0.08);
}

/* 자리 맵 그리드 */
.spot-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: var(--space-8);
}

/* 좌우 자리 묶음 */
.spot-grid__side {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* 8칸 청크 격자 */
.spot-grid__chunk {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-8);
}

/* 청크 간 가로 구분선 */
.spot-grid__chunk + .spot-grid__chunk {
  padding-top: var(--space-8);
  border-top: 1px dashed var(--gray-400);
}

/* 가운데 통로 */
.spot-grid__aisle {
  align-self: stretch;
  width: 20px;
  border-left: 1px dashed var(--gray-400);
  border-right: 1px dashed var(--gray-400);
}

/* 빈 상태 / 로딩 */
.placeholder {
  padding: var(--space-32);
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
  text-align: center;
}
</style>
