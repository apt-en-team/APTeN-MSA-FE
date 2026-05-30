<script setup>
// 차량 관리 컨테이너 화면이다. 차량 목록 탭과 차량 정책 탭을 제공한다.
import { reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VehicleListTab from '@/views/admin/vehicle/VehicleListTab.vue'
import VehiclePolicyTab from '@/views/admin/vehicle/VehiclePolicyTab.vue'

const route = useRoute()
const router = useRouter()

// 차량 관리 탭 목록
const tabs = [
  { key: 'list', label: '차량 목록' },
  { key: 'policy', label: '차량 정책' },
]

const state = reactive({ activeTab: 'list' })

// 유효하지 않은 탭 키는 기본값으로 정규화
const normalizeTab = (tab) => (tabs.some((item) => item.key === tab) ? tab : 'list')

// 탭 전환 시 URL 쿼리에 반영
const changeTab = (tab) => {
  router.push({ path: '/admin/vehicles', query: { ...route.query, tab: normalizeTab(tab) } })
}

// URL 쿼리 변경 시 활성 탭 동기화
watch(
  () => route.query.tab,
  (tab) => {
    state.activeTab = normalizeTab(tab)
  },
  { immediate: true },
)
</script>

<template>
  <section class="vehicle-manage">
    <nav class="tab-bar" aria-label="차량관리 탭">
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
      <VehicleListTab v-show="state.activeTab === 'list'" />
      <VehiclePolicyTab v-if="state.activeTab === 'policy'" />
    </div>
  </section>
</template>

<style scoped>
.vehicle-manage {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tab-bar {
  display: flex;
  gap: 8px;
  padding: 6px;
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
