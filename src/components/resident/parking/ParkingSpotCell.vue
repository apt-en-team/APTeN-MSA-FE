<script setup>
// 입주민 자리 셀 컴포넌트이다.
// 자리 상태별 배경색과 라벨을 표시한다.
import { computed } from 'vue'

const props = defineProps({
  spot: {
    type: Object,
    required: true,
  },
})

// 상태별 라벨 매핑
const STATUS_LABELS = {
  VACANT: '빈자리',
  OCCUPIED: '사용중',
  UNKNOWN: '확인불가',
}

// 상태별 모디파이어 키 산출
const statusKey = computed(() => {
  const status = props.spot?.status
  if (status === 'VACANT') return 'vacant'
  if (status === 'OCCUPIED') return 'occupied'
  return 'unknown'
})

// 표시 라벨 산출, 비활성 시 우선 적용
const labelText = computed(() => {
  if (props.spot?.isActive === false) return '사용불가'
  return STATUS_LABELS[props.spot?.status] || '확인불가'
})

// 비활성 여부 확인
const isInactive = computed(() => props.spot?.isActive === false)

// 상태 라벨 노출 여부, OCCUPIED는 배경색으로 구분 가능하므로 비활성 아닐 때 숨김
const showStatusLabel = computed(() => {
  if (props.spot?.isActive === false) return true
  return props.spot?.status !== 'OCCUPIED'
})
</script>

<template>
  <div
    class="spot-cell"
    :class="[
      `spot-cell--${statusKey}`,
      { 'spot-cell--inactive': isInactive },
    ]"
  >
    <span class="spot-cell__number">{{ spot.spotNumber }}</span>
    <span v-if="showStatusLabel" class="spot-cell__label">{{ labelText }}</span>
  </div>
</template>

<style scoped>
.spot-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 64px;
  padding: var(--space-8) 4px;
  border: 1px solid var(--gray-400);
  border-radius: 8px;
  background: var(--color-card-bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.spot-cell--vacant {
  background: var(--color-success);
  border-color: var(--color-success);
  color: #fff;
}

.spot-cell--occupied {
  background: #eee;
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.spot-cell--unknown {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: var(--color-text-primary);
}

.spot-cell--inactive {
  opacity: 0.45;
  border-style: dashed;
  border-color: var(--gray-600);
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0 6px,
    rgba(0, 0, 0, 0.12) 6px 8px
  );
}

.spot-cell__number {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: -0.2px;
}

.spot-cell__label {
  font-size: 10px;
  font-weight: 500;
}
</style>
