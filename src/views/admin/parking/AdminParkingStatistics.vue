<script setup>
// 관리자 주차 통계 화면이다.
import { reactive, onMounted, computed } from 'vue'

import { useParkingStore } from '@/stores/useParkingStore'

const parkingStore = useParkingStore()

const state = reactive({
  unit: 'HOURLY',
})

// 주차 통계 조회
const loadStatistics = () => {
  parkingStore.fetchParkingStatistics({ unit: state.unit })
}

// 단위 변경 처리
const handleUnitChange = (newUnit) => {
  state.unit = newUnit
  loadStatistics()
}

// 통계 응답 노출
const statistics = computed(() => parkingStore.parkingStatistics)

// 입차 합계
const totalIn = computed(() =>
  statistics.value.inCount.reduce((sum, n) => sum + n, 0),
)

// 출차 합계
const totalOut = computed(() =>
  statistics.value.outCount.reduce((sum, n) => sum + n, 0),
)

// 평균 점유율
const averageRate = computed(() => statistics.value.averageOccupancyRate)

// 차트 옵션
const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
  },
  plotOptions: {
    bar: { columnWidth: '60%', borderRadius: 4 },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: statistics.value.labels,
  },
  colors: ['#4973E5', '#F59E0B'],
  legend: {
    position: 'top',
    horizontalAlign: 'right',
  },
  tooltip: {
    y: {
      formatter: (v) => v + '대',
    },
  },
}))

// 차트 시리즈
const chartSeries = computed(() => [
  { name: '입차', data: statistics.value.inCount },
  { name: '출차', data: statistics.value.outCount },
])

onMounted(() => {
  loadStatistics()
})
</script>

<template>
  <section class="admin-parking-stats">

    <div class="admin-parking-stats__unit-toggle">
      <button
        type="button"
        class="unit-btn"
        :class="{ 'is-active': state.unit === 'HOURLY' }"
        @click="handleUnitChange('HOURLY')"
      >시간대별</button>
      <button
        type="button"
        class="unit-btn"
        :class="{ 'is-active': state.unit === 'DAILY' }"
        @click="handleUnitChange('DAILY')"
      >일별</button>
    </div>

    <div class="admin-parking-stats__summary">
      <div class="summary-card">
        <p class="summary-card__label">평균 점유율</p>
        <p class="summary-card__value">{{ Number(averageRate).toFixed(1) }}<span class="summary-card__unit">%</span></p>
      </div>
      <div class="summary-card">
        <p class="summary-card__label">총 입차</p>
        <p class="summary-card__value">{{ totalIn }}<span class="summary-card__unit">대</span></p>
      </div>
      <div class="summary-card">
        <p class="summary-card__label">총 출차</p>
        <p class="summary-card__value">{{ totalOut }}<span class="summary-card__unit">대</span></p>
      </div>
    </div>

    <div class="admin-parking-stats__chart">
      <div v-if="parkingStore.loading" class="chart-empty">조회 중...</div>
      <apexchart
        v-else
        type="bar"
        height="320"
        :options="chartOptions"
        :series="chartSeries"
      />
    </div>
  </section>
</template>

<style scoped>
.admin-parking-stats {
  display: grid;
  gap: var(--space-20);
}

.admin-parking-stats__unit-toggle {
  display: flex;
  gap: var(--space-8);
}

.unit-btn {
  height: 36px;
  padding: 0 var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.unit-btn.is-active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.admin-parking-stats__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-16);
}

.summary-card {
  display: grid;
  gap: var(--space-8);
  padding: var(--space-20);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
}

.summary-card__label {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.summary-card__value {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-page-title-admin);
  font-weight: 700;
}

.summary-card__unit {
  margin-left: var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.admin-parking-stats__chart {
  padding: var(--space-20);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
}

.chart-empty {
  padding: var(--space-32);
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
  text-align: center;
}
</style>
