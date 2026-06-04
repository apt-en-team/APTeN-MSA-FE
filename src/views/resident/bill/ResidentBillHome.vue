<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueApexCharts from 'vue3-apexcharts'
import billApi from '@/api/billApi'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const currentBill = ref(null)
const billItems = ref([])

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1

const ITEM_META = {
  '기본관리비':   { label: '기본 관리비', color: '#4A72F4', icon: 'house' },
  '차량비용':     { label: '차량 비용',   color: '#EF5350', icon: 'car' },
  '시설이용비용': { label: '시설 이용',   color: '#FFA726', icon: 'calendar' },
  '방문차량비용': { label: '방문차량',    color: '#4CAF83', icon: 'truck' },
}

const totalAmount = computed(() =>
  currentBill.value?.payableAmount ?? currentBill.value?.totalFee
    ? Number(currentBill.value.payableAmount ?? currentBill.value.totalFee)
    : billItems.value.reduce((s, i) => s + Number(i.amount ?? 0), 0),
)

function formatWon(amount) {
  const man = Math.round(Number(amount) / 10000)
  return `${man}만원`
}

function isVisibleOnHome(bill) {
  if (!bill) return false
  const today = new Date()
  const sendDate = bill.sendDate ? new Date(`${bill.sendDate}T00:00:00`) : null
  const displayUntil = bill.homeDisplayUntil ? new Date(`${bill.homeDisplayUntil}T23:59:59`) : null
  if (sendDate && today < sendDate) return false
  if (displayUntil && today > displayUntil) return false
  return true
}

const chartSeries = computed(() =>
  billItems.value.length
    ? billItems.value.map(i => Number(i.amount ?? 0))
    : [1],
)

const chartColors = computed(() =>
  billItems.value.length
    ? billItems.value.map(i => i.color)
    : ['#E2E8F0'],
)

const chartOptions = computed(() => ({
  chart: { type: 'donut', animations: { enabled: true }, toolbar: { show: false } },
  colors: chartColors.value,
  labels: billItems.value.length ? billItems.value.map(i => i.label) : [''],
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: { show: false },
      },
    },
  },
  legend: { show: false },
  stroke: { width: 2, colors: ['#fff'] },
  states: { hover: { filter: { type: 'none' } } },
  tooltip: {
    y: { formatter: (val) => formatWon(val) },
  },
}))

async function loadBill() {
  loading.value = true
  try {
    const res = await billApi.getMyHouseholdBills({
      billYear: currentYear,
      billMonth: currentMonth,
      page: 0,
      size: 1,
    })
    const list = Array.isArray(res) ? res : (res?.content ?? [])
    currentBill.value = list.find(isVisibleOnHome) ?? null

    if (currentBill.value?.billId) {
      try {
        const detail = await billApi.getMyHouseholdBillDetail(currentBill.value.billId)
        if (detail?.items?.length) {
          billItems.value = detail.items.map(item => {
            const meta = ITEM_META[item.itemType?.code ?? item.itemType] ?? { label: item.itemName, color: '#94a3b8', icon: 'default' }
            return { ...meta, label: item.itemName || meta.label, amount: item.amount }
          })
        }
      } catch {
        // 상세 API 미구현 시 총액만 표시
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadBill)
</script>

<template>
  <section class="bill-page">
    <!-- 상단 카드: 이번 달 관리비 -->
    <div class="bill-summary-card">
      <p class="bill-card-title">이번 달 관리비</p>

      <div class="bill-chart-wrap">
        <VueApexCharts
          type="donut"
          :width="240"
          :options="chartOptions"
          :series="chartSeries"
        />
        <!-- 도넛 중앙 텍스트 오버레이 -->
        <div class="bill-chart-center">
          <span v-if="loading" class="bill-total-amount">—</span>
          <span v-else class="bill-total-amount">{{ formatWon(totalAmount) }}</span>
          <span class="bill-chart-month">{{ currentMonth }}월 청구</span>
        </div>
      </div>
    </div>

    <!-- 항목 별 조회 -->
    <div class="bill-items-section">
      <p class="bill-items-title">항목 별 조회</p>

      <div v-if="loading" class="bill-loading">불러오는 중...</div>

      <template v-else-if="billItems.length">
        <div
          v-for="item in billItems"
          :key="item.label"
          class="bill-item-row"
        >
          <div class="bill-item-icon-wrap" :style="{ background: item.color + '22' }">
            <!-- 집 아이콘 -->
            <svg v-if="item.icon === 'house'" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="item.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <!-- 차 아이콘 -->
            <svg v-else-if="item.icon === 'car'" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="item.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <!-- 캘린더 아이콘 -->
            <svg v-else-if="item.icon === 'calendar'" width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="item.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <!-- 트럭 아이콘 (방문차량) -->
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="item.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <span class="bill-item-label">{{ item.label }}</span>
          <span class="bill-item-amount">{{ formatWon(item.amount) }}</span>
        </div>
      </template>

      <!-- 항목 없이 총액만 있을 때 -->
      <div v-else-if="currentBill" class="bill-item-row">
        <div class="bill-item-icon-wrap" style="background: #EEF2FF;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A72F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
        <span class="bill-item-label">총 관리비</span>
        <span class="bill-item-amount">{{ formatWon(totalAmount) }}</span>
      </div>

      <div v-else class="bill-empty">이번 달 청구 내역이 없습니다.</div>
    </div>

    <!-- 더보기 버튼 -->
    <div class="bill-more-wrap">
      <button
        type="button"
        class="bill-more-btn"
        @click="router.push({ path: `/resident/${route.params.complexId}/bill/detail`, query: currentBill ? { billId: currentBill.billId } : {} })"
      >
        더보기
      </button>
    </div>
  </section>
</template>

<style scoped>
.bill-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 8px;
}

/* 상단 요약 카드 */
.bill-summary-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 8px rgba(74, 114, 244, 0.07);
}

.bill-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1A202C;
  margin: 0 0 20px;
}

/* 차트 + 중앙 텍스트 */
.bill-chart-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bill-chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.bill-total-amount {
  font-size: 22px;
  font-weight: 800;
  color: #1A202C;
  line-height: 1.2;
}

.bill-chart-month {
  font-size: 12px;
  color: #94A3B8;
  margin-top: 2px;
}

/* 항목 섹션 */
.bill-items-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(74, 114, 244, 0.07);
}

.bill-items-title {
  font-size: 15px;
  font-weight: 700;
  color: #1A202C;
  margin: 0 0 16px;
}

.bill-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #F1F5F9;
}

.bill-item-row:last-child {
  border-bottom: none;
}

.bill-item-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bill-item-label {
  flex: 1;
  font-size: 14px;
  color: #1A202C;
  font-weight: 500;
}

.bill-item-amount {
  font-size: 14px;
  font-weight: 700;
  color: #1A202C;
}

.bill-loading,
.bill-empty {
  text-align: center;
  font-size: 13px;
  color: #94A3B8;
  padding: 24px 0;
}

/* 더보기 버튼 */
.bill-more-wrap {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
}

.bill-more-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  background: #4A72F4;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.bill-more-btn:hover {
  background: #3a5ed4;
}
</style>
