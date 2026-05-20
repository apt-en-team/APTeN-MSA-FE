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
  // 직접 진입 시 zone 이름 표시를 위해 단지 주차 현황 확보
  if (!parkingStore.residentParkingStatus?.zones?.length) {
    await parkingStore.fetchResidentParkingStatus()
  }
  parkingStore.fetchZoneSpots(route.params.zoneId)
  parkingStore.connectSpotSse()
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

    <!-- 자리 맵 본문 -->
    <div class="spot-card">
      <div v-if="spotsLoading && spotList.length === 0" class="placeholder">
        불러오는 중...
      </div>
      <div v-else-if="spotList.length === 0" class="placeholder">
        등록된 자리가 없습니다.
      </div>
      <div v-else class="spot-grid">
        <ParkingSpotCell
          v-for="spot in spotList"
          :key="spot.sensorId"
          :spot="spot"
        />
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-8);
}

/* 빈 상태 / 로딩 */
.placeholder {
  padding: var(--space-32);
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
  text-align: center;
}
</style>
