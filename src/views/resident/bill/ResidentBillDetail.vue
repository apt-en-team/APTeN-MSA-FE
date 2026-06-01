<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import VueApexCharts from 'vue3-apexcharts'
import billApi from '@/api/billApi'

const route = useRoute()

const loading = ref(false)
const bill = ref(null)
const comparison = ref(null) // BE 비교 API 연동 시 채워짐

const now = new Date()
const billYear = computed(() => bill.value?.billYear ?? now.getFullYear())
const billMonth = computed(() => bill.value?.billMonth ?? (now.getMonth() + 1))

const payBefore = computed(() => Number(bill.value?.totalFee ?? 0))
const payAfter = computed(() => Number(bill.value?.payableAmount ?? bill.value?.totalFee ?? 0))
const lateFee = computed(() => Number(bill.value?.lateFee ?? 0))

function formatWon(amount) {
  return Number(amount).toLocaleString('ko-KR') + '원'
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

function formatWonShort(val) {
  return `${Math.round(Number(val) / 10000)}만`
}

const monthLabels = computed(() => {
  const result = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(billYear.value, billMonth.value - 1 - i, 1)
    result.push(`${d.getMonth() + 1}월`)
  }
  return result
})

const avg6Month = computed(() => {
  const amounts = comparison.value?.myAmounts
  if (!amounts?.length) return null
  return Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
})

const hasChartData = computed(() =>
  comparison.value?.myAmounts?.length > 0,
)

const chartSeries = computed(() => [
  { name: '우리집', data: comparison.value?.myAmounts ?? Array(6).fill(0) },
  { name: '평균',   data: comparison.value?.avgAmounts ?? Array(6).fill(0) },
])

const chartOptions = computed(() => ({
  chart: { type: 'bar', height: 220, toolbar: { show: false } },
  colors: ['#4A72F4', '#E2E8F0'],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 5,
      borderRadiusApplication: 'end',
    },
  },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: {
    categories: monthLabels.value,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: '12px', colors: Array(6).fill('#94A3B8') } },
  },
  yaxis: {
    labels: {
      formatter: formatWonShort,
      style: { fontSize: '11px', colors: ['#94A3B8'] },
    },
  },
  grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
  legend: { show: false },
  tooltip: { y: { formatter: (val) => formatWon(val) } },
  fill: { opacity: 1 },
}))

async function loadData() {
  loading.value = true
  try {
    const billId = route.query.billId
    if (billId) {
      try {
        bill.value = await billApi.getMyHouseholdBillDetail(billId)
      } catch {
        // 상세 API 미구현 시 목록 폴백
      }
    }
    if (!bill.value) {
      const res = await billApi.getMyHouseholdBills({
        billYear: now.getFullYear(),
        billMonth: now.getMonth() + 1,
        page: 0,
        size: 1,
      })
      const list = Array.isArray(res) ? res : (res?.content ?? [])
      bill.value = list[0] ?? null
    }
    // TODO: 비교 API 구현 후 아래 주석 해제
    // comparison.value = await billApi.getMyBillComparison(bill.value?.billId)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <section class="detail-page">
    <!-- 로딩 -->
    <div v-if="loading" class="detail-loading">불러오는 중...</div>

    <template v-else>
      <!-- 고지서 카드 -->
      <div class="detail-card">
        <h2 class="detail-notice-title">
          <span class="detail-notice-blue">{{ billYear }}년 {{ billMonth }}월</span>
          관리비 고지서
        </h2>

        <div class="detail-divider" />

        <div class="detail-fee-row">
          <span class="detail-fee-label">납기내 금액</span>
          <span class="detail-fee-value">{{ bill ? formatWon(payBefore) : '—' }}</span>
        </div>

        <div class="detail-fee-row">
          <span class="detail-fee-label">납기일</span>
          <span class="detail-fee-value">{{ bill ? formatDate(bill.dueDate) : '-' }}</span>
        </div>

        <div v-if="lateFee > 0" class="detail-fee-row">
          <span class="detail-fee-label">연체료</span>
          <span class="detail-fee-value">{{ formatWon(lateFee) }}</span>
        </div>

        <div class="detail-divider" />

        <div class="detail-fee-row">
          <span class="detail-fee-label">납기후 금액</span>
          <span class="detail-fee-value">{{ bill ? formatWon(payAfter) : '—' }}</span>
        </div>
      </div>

      <!-- 관리비 비교 카드 -->
      <div class="detail-card">
        <div class="compare-header">
          <p class="compare-title">
            관리비 비교
            <span v-if="comparison?.areaSize" class="compare-area">({{ comparison.areaSize }}m² 평형대 기준)</span>
          </p>
          <p class="compare-sub">최근 6개월 간의 관리비 변화를 확인 가능합니다.</p>
        </div>

        <div class="compare-stat-row">
          <span class="compare-stat-label">우리집<br>6개월 평균 금액</span>
          <span class="compare-stat-value">{{ avg6Month !== null ? formatWon(avg6Month) : '—' }}</span>
        </div>

        <div v-if="comparison?.rank != null" class="compare-stat-row" style="margin-top: 12px;">
          <span class="compare-stat-label">우리집<br>순위</span>
          <span class="compare-stat-value">
            <span class="compare-rank">{{ comparison?.rank }}등</span>
            <span class="compare-rank-total"> / {{ comparison?.totalHouseholds }}세대 중</span>
          </span>
        </div>

        <div class="chart-legend">
          <span class="legend-dot" style="background: #4A72F4;"></span>
          <span class="legend-label">우리집</span>
          <span class="legend-dot" style="background: #E2E8F0; margin-left: 12px;"></span>
          <span class="legend-label">평균</span>
        </div>

        <VueApexCharts
          type="bar"
          :height="220"
          :options="chartOptions"
          :series="chartSeries"
        />
      </div>

      <!-- 청구 없음 -->
      <div v-if="!bill" class="detail-empty">이번 달 청구 내역이 없습니다.</div>
    </template>
  </section>
</template>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}

.detail-loading,
.detail-empty {
  text-align: center;
  font-size: 14px;
  color: #94A3B8;
  padding: 48px 0;
}

.detail-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px 20px;
  box-shadow: 0 2px 8px rgba(74, 114, 244, 0.07);
}

.detail-notice-title {
  font-size: 18px;
  font-weight: 700;
  color: #1A202C;
  margin: 0 0 20px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.detail-notice-blue {
  color: #4A72F4;
  font-weight: 800;
}

.detail-divider {
  height: 1px;
  background: #F1F5F9;
}

.detail-fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 0;
}

.detail-fee-label {
  font-size: 15px;
  color: #4A5568;
  font-weight: 500;
}

.detail-fee-value {
  font-size: 15px;
  font-weight: 700;
  color: #1A202C;
}

.compare-header {
  margin-bottom: 20px;
}

.compare-title {
  font-size: 15px;
  font-weight: 700;
  color: #1A202C;
  margin: 0 0 6px;
}

.compare-area {
  font-size: 13px;
  font-weight: 400;
  color: #687282;
}

.compare-sub {
  font-size: 12px;
  color: #94A3B8;
  margin: 0;
}

.compare-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compare-stat-label {
  font-size: 14px;
  color: #687282;
  line-height: 1.5;
}

.compare-stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #4A72F4;
  text-align: right;
}

.compare-rank {
  font-size: 28px;
  font-weight: 800;
  color: #4A72F4;
}

.compare-rank-total {
  font-size: 13px;
  font-weight: 500;
  color: #687282;
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 20px 0 4px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 12px;
  color: #94A3B8;
}
</style>
