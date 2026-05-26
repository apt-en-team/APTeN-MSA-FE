<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import StatsCards from '@/components/admin/StatsCards.vue'
import AdminFacilityList from '@/views/admin/facility/AdminFacilityList.vue'
import AdminGxProgramList from '@/views/admin/facility/AdminGxProgramList.vue'
import FacilityPolicyTab from '@/views/admin/facility/FacilityPolicyTab.vue'
import FacilityBlockTimeTab from '@/views/admin/facility/FacilityBlockTimeTab.vue'

const route = useRoute()
const router = useRouter()
const facilityStore = useFacilityStore()

// 시설 관리 탭 목록 (순서대로 표시)
const tabs = [
  { key: 'list', label: '시설 목록' },
  { key: 'gx', label: 'GX 프로그램' },
  { key: 'policy', label: '시설 정책' },
  { key: 'block-time', label: '차단 시간' },
]

const state = reactive({
  activeTab: 'list',
  facilities: [],
  errorMessage: '',
})

const normalizeReservationType = (type) => {
  const value = String(type || '').trim()
  if (value === '좌석형') return 'SEAT'
  if (value === '정원형') return 'COUNT'
  if (value === '승인형') return 'APPROVAL'
  return value
}

const normalizeFacilities = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.content)) return response.content
  if (Array.isArray(response?.data?.content)) return response.data.content
  return []
}

const facilityList = computed(() =>
  state.facilities.map((facility) => ({
    ...facility,
    reservationType: normalizeReservationType(facility.reservationType),
  })),
)

const activeCount = computed(() => facilityList.value.filter((facility) => facility.isActive).length)
const inactiveCount = computed(() => facilityList.value.filter((facility) => facility.isActive === false).length)

const statsCards = computed(() => [
  {
    label: '전체 시설',
    value: facilityList.value.length,
    unit: '개',
    desc: `운영 중 ${activeCount.value}개`,
  },
  {
    label: '운영 중',
    value: activeCount.value,
    unit: '개',
    desc: '예약 가능',
    descClass: 'success',
  },
  {
    label: '운영 중단',
    value: inactiveCount.value,
    unit: '개',
    desc: '비활성 상태',
    descClass: 'warning',
  },
  {
    label: '좌석형',
    value: facilityList.value.filter((facility) => facility.reservationType === 'SEAT').length,
    unit: '개',
    desc: '좌석 단위 예약',
  },
])

const fetchFacilities = async () => {
  state.errorMessage = ''

  try {
    const result = await facilityStore.fetchAdminFacilities()
    state.facilities = normalizeFacilities(result)
  } catch (error) {
    console.error('시설 통계 조회 실패:', error)
    state.facilities = []
    state.errorMessage =
      error.response?.data?.message ||
      error.response?.data?.message ||
      '시설 목록을 불러오지 못했습니다.'
  }
}

// 유효하지 않은 탭 키는 기본값(list)으로 정규화
const normalizeTab = (tab) => {
  return tabs.some((item) => item.key === tab) ? tab : 'list'
}

// 탭 전환 시 URL query 파라미터에 반영 (뒤로가기 지원)
const changeTab = (tab) => {
  const nextTab = normalizeTab(tab)
  router.push({
    path: '/admin/facilities',
    query: { ...route.query, tab: nextTab },
  })
}

// URL query 변경 시 활성 탭 동기화
watch(
  () => route.query.tab,
  (tab) => {
    state.activeTab = normalizeTab(tab)
  },
  { immediate: true },
)

onMounted(fetchFacilities)
</script>

<template>
  <section class="facility-manage">
    <!-- 페이지 제목과 액션 버튼은 AdminLayout 헤더에서 처리 -->
    <StatsCards v-if="state.activeTab === 'list'" :stats="statsCards" />
    <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

    <nav class="tab-bar" aria-label="시설관리 탭">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab-btn"
        :class="{ active: state.activeTab === tab.key }"
        @click="changeTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="tab-panel">
      <AdminFacilityList v-show="state.activeTab === 'list'" :facilities="state.facilities" />
      <AdminGxProgramList v-if="state.activeTab === 'gx'" />
      <FacilityPolicyTab v-if="state.activeTab === 'policy'" />
      <FacilityBlockTimeTab v-if="state.activeTab === 'block-time'" />
    </div>
  </section>
</template>

<style scoped>
.facility-manage {
  display: flex;
  flex-direction: column;
  gap: 18px;
  font-family: 'Noto Sans KR', sans-serif;
  color: #1e2a3e;
}

.tab-bar {
  display: flex;
  gap: 8px;
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
}

.error-box {
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
}

.tab-btn {
  min-height: 38px;
  padding: 0 18px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #687282;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.tab-btn:hover {
  background: #f5f6f8;
  color: #2b3a55;
}

.tab-btn.active {
  background: #1e2a3e;
  color: #ffffff;
}

.tab-panel {
  min-width: 0;
}

@media (max-width: 768px) {
  .tab-bar {
    overflow-x: auto;
  }

  .tab-btn {
    flex-shrink: 0;
  }
}
</style>
