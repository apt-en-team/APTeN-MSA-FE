<script setup>
// 입주민 방문차량 상세 정보 모달입니다.
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

const emit = defineEmits(['close', 'edit', 'delete', 're-register'])

// 방문차량 상태 한글 value에 따른 뱃지 색상 매핑
const STATUS_VARIANT = {
  등록완료: 'success',
  사용자취소: 'neutral',
  자동만료: 'warning',
  삭제: 'danger',
}

// 상태 뱃지 색상 반환
const badgeVariant = (status) => STATUS_VARIANT[status] ?? 'neutral'

// 본인 세대원이 등록한 건 여부
const isMine = computed(() => props.vehicle?.isMine === true)

// 진행 중(등록완료) 상태 여부
const isActive = computed(() => props.vehicle?.status === '등록완료')

// 수정 버튼 노출 여부 (본인 건 + 진행 중)
const canEdit = computed(() => isMine.value && isActive.value)

// 삭제 버튼 노출 여부 (본인 건)
const canDelete = computed(() => isMine.value)

// 재등록 버튼 노출 여부 (상태 무관, 세대원 누구나)
const canReRegister = computed(() => true)

// 날짜 문자열을 yyyy.MM.dd 형태로 변환
const formatDate = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 10).replace(/-/g, '.')
}
</script>

<template>
  <BaseModal
    :visible="visible"
    title="방문차량 상세 정보"
    subtitle="등록된 방문 예정 차량의 상세 정보를 확인합니다."
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
        <span class="detail-label">방문예정일</span>
        <span class="detail-value">{{ formatDate(vehicle.visitDate) }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">상태</span>
        <span class="detail-value">
          <BaseBadge :variant="badgeVariant(vehicle.status)">{{ vehicle.status || '-' }}</BaseBadge>
        </span>
      </div>
    </div>

    <!-- 오류 -->
    <div v-else class="detail-feedback error">{{ errorMessage || '방문차량 정보를 찾을 수 없습니다.' }}</div>

    <template #footer>
      <button
        v-if="vehicle && canReRegister"
        type="button"
        class="detail-btn detail-btn--primary"
        @click="emit('re-register', vehicle)"
      >
        재등록
      </button>
      <button
        v-if="vehicle && canEdit"
        type="button"
        class="detail-btn"
        @click="emit('edit', vehicle)"
      >
        수정
      </button>
      <button
        v-if="vehicle && canDelete"
        type="button"
        class="detail-btn detail-btn--delete"
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

.detail-btn--primary {
  border-color: var(--resident-primary);
  color: var(--resident-primary);
}

/* 삭제는 채운 빨강과 왼쪽 간격으로 다른 버튼과 분리 */
.detail-btn--delete {
  margin-left: 8px;
  border-color: var(--color-danger);
  background: var(--color-danger);
  color: #FFFFFF;
}
</style>
