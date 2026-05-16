<script setup>
// 주차 운영 타입(BASIC/SENSOR) 카드 셀렉터다.
// AdminParkingSetting의 옵션 카드 UI를 재사용 가능한 컴포넌트로 추출한 것이다.
// NONE은 옵션 정의에는 포함되지만 사용자 노출 카드에서는 제외한다.
import { computed } from 'vue'
import BaseBadge from '@/components/common/BaseBadge.vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  currentCode: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

// 운영 타입 옵션 정의
// name: 백엔드 enum 이름 (v-model 값으로 사용)
// code: DB 저장 코드 (현재값 비교에 사용)
const PARKING_TYPE_OPTIONS = [
  {
    name: 'NONE',
    code: '01',
    label: '미사용',
    badgeVariant: 'neutral',
    summary: '주차 시스템을 사용하지 않음',
    description: '주차 구역, 입출차 기록, 주차 현황 화면이 모두 비활성화됩니다.',
  },
  {
    name: 'BASIC',
    code: '02',
    label: '기본',
    badgeVariant: 'info',
    summary: '단지 전체 점유율 기준으로 관리',
    description: '주차 구역과 입출차 기록을 관리하며, 전체 면수 대비 점유율을 집계해 표시합니다.',
  },
  {
    name: 'SENSOR',
    code: '03',
    label: '센서',
    badgeVariant: 'primary',
    summary: '자리별 센서로 실시간 점유 관리',
    description: '주차면 단위 실시간 점유 정보를 SSE로 받아 표시합니다. 더 정밀한 운영이 가능합니다.',
  },
]

// 카드로 노출할 옵션 필터링 (NONE 제외)
const visibleOptions = computed(() =>
  PARKING_TYPE_OPTIONS.filter((opt) => opt.name !== 'NONE'),
)

// 현재 저장된 코드와 일치 여부 판별
const isCurrent = (opt) => {
  if (!props.currentCode) return false
  return props.currentCode === opt.code
}

// 카드 클릭 처리, 선택 enum name emit
const handleSelect = (name) => {
  if (props.disabled) return
  emit('update:modelValue', name)
}
</script>

<template>
  <div class="option-grid">
    <button
      v-for="opt in visibleOptions"
      :key="opt.name"
      type="button"
      class="option-card"
      :class="{ 'is-selected': modelValue === opt.name }"
      :disabled="disabled"
      @click="handleSelect(opt.name)"
    >
      <div class="option-card__head">
        <BaseBadge :variant="opt.badgeVariant">{{ opt.label }}</BaseBadge>
        <span v-if="isCurrent(opt)" class="option-card__current">
          현재
        </span>
      </div>
      <strong class="option-card__name">{{ opt.label }}</strong>
      <p class="option-card__summary">{{ opt.summary }}</p>
      <p class="option-card__description">{{ opt.description }}</p>
    </button>
  </div>
</template>

<style scoped>
/* 옵션 카드 그리드 */
.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 960px) {
  .option-grid {
    grid-template-columns: 1fr;
  }
}

.option-card {
  position: relative;
  display: grid;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.option-card:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.option-card.is-selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(124, 92, 219, 0.18);
}

.option-card:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.option-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.option-card__current {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  font-size: var(--font-size-badge);
  font-weight: 600;
}

.option-card__name {
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 700;
}

.option-card__summary {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-detail);
  font-weight: 500;
}

.option-card__description {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
  line-height: 1.6;
}
</style>
