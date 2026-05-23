<script setup>
// UI-650 관리자 구독 현황 화면 — FLAT/PER_PERSON 시설 세대 구독 목록
import { computed, onMounted, reactive } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import facilityApi from '@/api/facilityApi.js'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import AppPagination from '@/components/common/AppPagination.vue'

const facilityStore = useFacilityStore()

// 목록, 필터, 로딩 상태
const PAGE_SIZE = 10

const state = reactive({
  list: [],
  loading: false,
  errorMessage: '',
  facilities: [],     // 시설 드롭다운 + facilityId→name 매핑용
  filter: {
    facilityId: '',   // BE @RequestParam facilityId
    status: '',       // BE @RequestParam status (ACTIVE | CANCELLED)
  },
  currentPage: 1,
})

// facilityId → 시설명 매핑 테이블
const facilityNameMap = computed(() => {
  const map = {}
  state.facilities.forEach((f) => {
    map[String(f.facilityId)] = f.name
  })
  return map
})

// 상단 요약 카드 — 구독 현황 집계
const summaryItems = computed(() => [
  { label: '전체', value: state.list.length, unit: '건' },
  { label: '구독중', value: state.list.filter((s) => s.status === '구독중').length, unit: '건' },
  { label: '해지', value: state.list.filter((s) => s.status === '해지').length, unit: '건' },
])

// 테이블 컬럼 정의
const columns = [
  { key: 'no', label: '번호' },
  { key: 'facilityName', label: '시설명' },
  { key: 'householdId', label: '세대 ID' },
  { key: 'subscribedAt', label: '구독 시작일' },
  { key: 'cancelledAt', label: '해지 요청일' },
  { key: 'status', label: '상태' },
]

// 전체 행 — 시설명 매핑, 해지일 없으면 '-' 표시, no는 전체 기준 순번
const rows = computed(() =>
  state.list.map((s, i) => ({
    ...s,
    no: i + 1,
    facilityName: facilityNameMap.value[String(s.facilityId)] || String(s.facilityId),
    cancelledAt: s.cancelledAt || '-',
  })),
)

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / PAGE_SIZE)))

const pagedRows = computed(() => {
  const start = (state.currentPage - 1) * PAGE_SIZE
  return rows.value.slice(start, start + PAGE_SIZE)
})

const goToPage = (page) => {
  state.currentPage = page
}

// 시설 목록 조회 — 필터 드롭다운과 이름 매핑에 사용
const fetchFacilities = async () => {
  try {
    const result = await facilityStore.fetchAdminFacilities()
    const list = Array.isArray(result)
      ? result
      : Array.isArray(result?.content)
        ? result.content
        : []
    state.facilities = list.map((f) => ({
      facilityId: f.facilityId ?? f.facilityUid ?? f.id,
      name: f.name,
    }))
  } catch {
    // 시설 목록 실패 시 필터만 비워둔 채 구독 목록은 계속 조회
  }
}

// 구독 목록 조회 (facilityId, status 필터 적용)
const fetchList = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const params = {}
    if (state.filter.facilityId) params.facilityId = state.filter.facilityId
    // status는 BE enum 이름(ACTIVE/CANCELLED)으로 전달
    if (state.filter.status) params.status = state.filter.status
    const result = await facilityApi.getAdminSubscriptions(params)
    state.list = Array.isArray(result) ? result : []
  } catch (err) {
    state.errorMessage =
      err.response?.data?.resultMessage ||
      err.response?.data?.message ||
      '구독 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const resetFilters = () => {
  state.filter.facilityId = ''
  state.filter.status = ''
  state.currentPage = 1
  fetchList()
}

onMounted(async () => {
  await fetchFacilities()
  await fetchList()
})
</script>

<template>
  <div class="subscription-view">
    <!-- 상단 통계 카드 -->
    <StatsCards :stats="summaryItems" />

    <section class="card-shell">
      <!-- 필터 바 -->
      <AdminFilterBar @reset="resetFilters">
        <!-- 시설 필터 -->
        <select v-model="state.filter.facilityId" class="filter-select" @change="() => { state.currentPage = 1; fetchList() }">
          <option value="">전체 시설</option>
          <option
            v-for="f in state.facilities"
            :key="f.facilityId"
            :value="f.facilityId"
          >
            {{ f.name }}
          </option>
        </select>

        <!-- 상태 필터 — ACTIVE/CANCELLED 는 BE enum 이름 -->
        <select v-model="state.filter.status" class="filter-select" @change="() => { state.currentPage = 1; fetchList() }">
          <option value="">전체 상태</option>
          <option value="ACTIVE">구독중</option>
          <option value="CANCELLED">해지</option>
        </select>
      </AdminFilterBar>

      <!-- 목록 테이블 -->
      <div v-if="state.loading" class="empty-box">목록을 불러오는 중...</div>
      <div v-else-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

      <AdminTable v-else :columns="columns" :rows="pagedRows">
        <!-- 상태 뱃지 커스텀 셀 -->
        <template #cell-status="{ value }">
          <span :class="['status-badge', value === '구독중' ? 'badge--active' : 'badge--cancelled']">
            {{ value }}
          </span>
        </template>
      </AdminTable>

      <AppPagination
        :currentPage="state.currentPage"
        :maxPage="totalPages"
        :totalAll="state.list.length"
        :totalFiltered="rows.length"
        unit="건"
        @change="goToPage"
      />
    </section>
  </div>
</template>

<style scoped>
.subscription-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card-shell {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

/* 필터 select 공통 스타일 */
.filter-select {
  height: 36px;
  padding: 0 10px;
  border: 1px solid #d7dee8;
  border-radius: 7px;
  font-size: 13px;
  color: #2b3a55;
  background: #ffffff;
  min-width: 120px;
  cursor: pointer;
}

/* 상태 뱃지 */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.badge--active {
  background: #ebfbee;
  color: #4d8b5a;
}

.badge--cancelled {
  background: #f5f6f8;
  color: #687282;
}

/* 로딩/에러 박스 */
.empty-box {
  padding: 40px;
  text-align: center;
  color: #7b8ea8;
  font-size: 13px;
}

.error-box {
  padding: 14px 20px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
}
</style>
