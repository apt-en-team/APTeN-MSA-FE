<script setup>
// 방문차량 관리 컨테이너 화면이다. 방문차량 탭과 고정방문차량 탭을 제공한다.
import { reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminVisitorVehicleTab from '@/views/admin/vehicle/AdminVisitorVehicleTab.vue'
import AdminRegularVisitorVehicleTab from '@/views/admin/vehicle/AdminRegularVisitorVehicleTab.vue'

const route = useRoute()
const router = useRouter()

// 방문차량 관리 탭 목록
const tabs = [
  { key: 'visitor', label: '방문차량' },
  { key: 'regular', label: '고정방문차량' },
]

const state = reactive({ activeTab: 'visitor' })

// 유효하지 않은 탭 키는 기본값으로 정규화
const normalizeTab = (tab) => (tabs.some((item) => item.key === tab) ? tab : 'visitor')

// 탭 전환 시 URL 쿼리에 반영
const changeTab = (tab) => {
  router.push({ path: '/admin/visitor-vehicles', query: { ...route.query, tab: normalizeTab(tab) } })
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
  <section class="visitor-vehicle-manage">
    <nav class="tab-bar" aria-label="방문차량관리 탭">
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
      <AdminVisitorVehicleTab v-if="state.activeTab === 'visitor'" />
      <AdminRegularVisitorVehicleTab v-if="state.activeTab === 'regular'" />
    </div>
  </section>
</template>

<style scoped>
.visitor-vehicle-manage {
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
