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
  if (props.spot?.isActive === false) return '비활성'
  return STATUS_LABELS[props.spot?.status] || '확인불가'
})

// 비활성 여부 확인
const isInactive = computed(() => props.spot?.isActive === false)
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
    <span class="spot-cell__label">{{ labelText }}</span>
  </div>
</template>

<style scoped>
.spot-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 56px;
  padding: var(--space-8) 4px;
  border: 1px solid var(--gray-400);
  border-radius: 8px;
  background: var(--color-card-bg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.spot-cell--vacant {
  color: var(--color-success);
}

.spot-cell--occupied {
  color: var(--color-danger);
}

.spot-cell--unknown {
  color: var(--color-neutral);
}

.spot-cell--inactive {
  opacity: 0.45;
}

.spot-cell__number {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: -0.2px;
}

.spot-cell__label {
  font-size: 10px;
  font-weight: 500;
}
</style>
