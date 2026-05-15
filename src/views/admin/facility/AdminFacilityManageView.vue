<script setup>
import { reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminFacilityList from '@/views/admin/facility/AdminFacilityList.vue'
import AdminGxProgramList from '@/views/admin/facility/AdminGxProgramList.vue'
import FacilityPolicyTab from '@/views/admin/facility/FacilityPolicyTab.vue'
import FacilityBlockTimeTab from '@/views/admin/facility/FacilityBlockTimeTab.vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'list', label: '시설 목록' },
  { key: 'gx', label: 'GX 프로그램' },
  { key: 'policy', label: '시설 정책' },
  { key: 'block-time', label: '차단 시간' },
]

const state = reactive({
  activeTab: 'list',
})

const normalizeTab = (tab) => {
  return tabs.some((item) => item.key === tab) ? tab : 'list'
}

const changeTab = (tab) => {
  const nextTab = normalizeTab(tab)
  router.push({
    path: '/admin/facilities',
    query: { ...route.query, tab: nextTab },
  })
}

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
      <AdminGxProgramList v-if="state.activeTab === 'gx'" />
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
  .tab-bar {
    overflow-x: auto;
  }

  .tab-btn {
    flex-shrink: 0;
  }
}
</style>
