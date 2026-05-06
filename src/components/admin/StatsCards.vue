<script setup>
// 1차 관리자 대시보드 카드 스타일을 유지한 통계 카드 묶음이다.
// 카드에 표시할 통계 항목과 아이콘 사용 여부를 props로 받는다.
defineProps({
  stats: {
    type: Array,
    default: () => [],
     // 형식: [{ label, value, unit, desc, descClass, iconClass }]
  },
  showIcon: {
    type: Boolean,
    default: false,
  }, // 아이콘 영역 표시 여부
})
</script>

<template>
  <div class="stats-grid">
    <!-- 각 통계 항목을 동일한 카드 형식으로 반복 렌더링한다. -->
    <div v-for="(item, index) in stats" :key="index" class="stat-card">
      <div class="card-main">
        <div class="stat-label">{{ item.label }}</div>
        <div class="stat-value">
          {{ item.value }}<span class="stat-unit"> {{ item.unit }}</span>
        </div>
        <div v-if="item.progress !== undefined" class="progress-bar-wrap">
          <div class="progress-bar">
            <div class="progress-fill blue" :style="{ width: `${item.progress ?? 0}%` }" />
          </div>
        </div>
        <div class="stat-desc" :class="item.descClass">{{ item.desc }}</div>
      </div>
      <!-- 아이콘 (대시보드용) -->
      <div v-if="showIcon && item.iconClass" :class="['card-icon', item.iconClass]">
        <slot :name="'icon-' + index" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  height: 139px;
  padding: 22px 24px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  background: #FFFFFF;
}

.card-main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 95px;
}

.stat-label {
  color: #687282;
  font-size: 12px;
  font-weight: 500;
}

.stat-value {
  color: #333333;
  font-size: 25px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-unit {
  padding: 5px;
  color: #6B7280;
  font-size: 12px;
  font-weight: 500;
}

.stat-desc {
  color: #6B7280;
  font-size: 12px;
}

.stat-desc.success,
.stat-desc.highlight-green {
  color: #276749;
}

.stat-desc.warning,
.stat-desc.highlight-orange {
  color: #C08B2D;
}

.card-icon {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 50px;
  flex-shrink: 0;
}

.card-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.icon-orange {
  background: #FDF6E8;
  color: #C08B2D;
}

.icon-blue {
  background: #E8EBF2;
  color: #2B3A55;
}

.icon-green {
  background: #C6F6D5;
  color: #276749;
}

.icon-gray {
  background: #EDEEF2;
  color: #6B7280;
}

.progress-bar-wrap {
  margin: 6px 0 2px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #E5E7EB;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.progress-fill.blue {
  background: #3B82F6;
}
</style>
