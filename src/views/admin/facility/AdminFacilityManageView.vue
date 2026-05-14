<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminFacilityList from '@/views/admin/facility/AdminFacilityList.vue'
import FacilityPolicyTab from '@/views/admin/facility/FacilityPolicyTab.vue'
import FacilityBlockTimeTab from '@/views/admin/facility/FacilityBlockTimeTab.vue'

const route = useRoute()
const router = useRouter()

// 탭 목록 관리
const tabs = [
  { key: 'list', label: '시설 목록' },
  { key: 'policy', label: '시설 정책' },
  { key: 'block-time', label: '차단 시간' },
]

// 탭 화면 상태
const state = reactive({
  activeTab: 'list',
})

const activeTabLabel = computed(() => {
  return tabs.find((tab) => tab.key === state.activeTab)?.label || '시설 목록'
})

// query 기준 탭 정리
const normalizeTab = (tab) => {
  return tabs.some((item) => item.key === tab) ? tab : 'list'
}

// 탭 클릭 시 query 변경
const changeTab = (tab) => {
  const nextTab = normalizeTab(tab)

  router.push({
    path: '/admin/facilities',
    query: {
      ...route.query,
      tab: nextTab,
    },
  })
}

// query와 state 동기화
watch(
  () => route.query.tab,
  (tab) => {
    state.activeTab = normalizeTab(tab)
  },
  { immediate: true },
)
</script>

<template>
  <section class="facility-manage">
    <header class="facility-manage__header">
      <div>
        <p class="facility-manage__eyebrow">FACILITY MANAGEMENT</p>
        <h2 class="facility-manage__title">시설 관리</h2>
        <p class="facility-manage__desc">
          시설 목록, 예약 정책, 차단 시간을 한 화면에서 관리합니다.
        </p>
      </div>
      <span class="facility-manage__badge">{{ activeTabLabel }}</span>
    </header>

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
      <AdminFacilityList v-show="state.activeTab === 'list'" />
      <FacilityPolicyTab v-if="state.activeTab === 'policy'" />
      <FacilityBlockTimeTab v-if="state.activeTab === 'block-time'" />
    </div>
  </section>
</template>

<style scoped>
.facility-manage {
  font-family: 'Noto Sans KR', sans-serif;
  color: #1e2a3e;
}

.facility-manage__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.facility-manage__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 800;
  color: #7b8ea8;
  letter-spacing: 0.12em;
}

.facility-manage__title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #1e2a3e;
}

.facility-manage__desc {
  margin: 8px 0 0;
  font-size: 13px;
  color: #687282;
}

.facility-manage__badge {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 999px;
  background: #eef3f8;
  color: #2b3a55;
  font-size: 12px;
  font-weight: 700;
}

.tab-bar {
  display: flex;
  gap: 8px;
  padding: 6px;
  margin-bottom: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
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
  .facility-manage__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .tab-bar {
    overflow-x: auto;
  }

  .tab-btn {
    flex-shrink: 0;
  }
}
</style>
