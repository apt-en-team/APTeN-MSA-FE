<script setup>
// 입주민 고정방문차량 상세 정보 모달입니다.
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  vehicle: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'edit', 'delete'])

// 본인 세대원이 등록한 건 여부
const isMine = computed(() => props.vehicle?.isMine === true)

// 활성 여부 뱃지 색상 반환
const activeVariant = (isActive) => (isActive ? 'success' : 'neutral')

// 활성 여부 한글 표기 반환
const activeLabel = (isActive) => (isActive ? '활성' : '비활성')

// 날짜 문자열을 yyyy.MM.dd 형태로 변환
const formatDate = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}

// 시작일과 종료일을 기간 문자열로 결합
const periodText = computed(() => {
  if (!props.vehicle) return '-'
  return `${formatDate(props.vehicle.startDate)} ~ ${formatDate(props.vehicle.endDate)}`
})
</script>

<template>
  <BaseModal
    :visible="visible"
    title="고정방문차량 상세 정보"
    subtitle="등록된 고정방문 차량의 상세 정보를 확인합니다."
    @close="emit('close')"
  >
    <!-- 로딩 -->
    <div v-if="loading" class="detail-feedback">상세 정보를 불러오는 중입니다.</div>

    <!-- 상세 정보 -->
    <div v-else-if="vehicle" class="detail-grid">
      <div class="detail-row">
        <span class="detail-label">차량번호</span>
        <span class="detail-value">{{ vehicle.licensePlate || '-' }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">방문자</span>
        <span class="detail-value">{{ vehicle.visitorName || '-' }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">연락처</span>
        <span class="detail-value">{{ vehicle.phone || '-' }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">방문목적</span>
        <span class="detail-value">{{ vehicle.visitPurpose || '-' }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">기간</span>
        <span class="detail-value">{{ periodText }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">활성여부</span>
        <span class="detail-value">
          <BaseBadge :variant="activeVariant(vehicle.isActive)">{{ activeLabel(vehicle.isActive) }}</BaseBadge>
        </span>
      </div>
    </div>

    <!-- 오류 -->
    <div v-else class="detail-feedback error">{{ errorMessage || '고정방문차량 정보를 찾을 수 없습니다.' }}</div>

    <template #footer>
      <button type="button" class="detail-btn" @click="emit('close')">닫기</button>
      <button
        v-if="vehicle && isMine"
        type="button"
        class="detail-btn"
        @click="emit('edit', vehicle)"
      >
        수정
      </button>
      <button
        v-if="vehicle && isMine"
        type="button"
        class="detail-btn detail-btn--danger"
        @click="emit('delete', vehicle)"
      >
        삭제
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.detail-feedback {
  padding: 40px 0;
  color: var(--color-text-secondary);
  text-align: center;
  font-size: 13px;
}

.detail-feedback.error {
  color: var(--color-danger);
}

.detail-grid {
  display: grid;
  gap: 14px;
  margin-top: 4px;
  padding: 16px 0 8px;
  border-top: 1px solid var(--color-border);
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-label {
  flex: 0 0 88px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
}

.detail-value {
  min-width: 0;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 500;
}

.detail-btn {
  min-width: 80px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: #FFFFFF;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.detail-btn:hover {
  background: #F8FAFC;
}

.detail-btn--danger {
  color: var(--color-danger);
  border-color: rgba(231, 76, 60, 0.45);
}
</style>
