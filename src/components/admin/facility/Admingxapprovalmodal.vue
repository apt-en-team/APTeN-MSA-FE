<script setup>
import { reactive, computed } from 'vue'
import gxApi from '@/api/gxApi'
import { useAuthStore } from '@/stores/useAuthStore.js'
import BaseModal from '@/components/common/BaseModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const props = defineProps({
  program: { type: Object, default: null },
  waitingList: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'approved'])

const authStore = useAuthStore()

const getCurrentTimeText = () =>
  new Date().toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const getCurrentActorName = () =>
  authStore.userInfo?.name || authStore.user?.name || authStore.name || '관리자'

const state = reactive({ loading: false })

const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
  desc: '',
  itemName: '',
  time: '',
  actionLabel: '',
  actor: '',
  afterConfirm: null,
})

const openResultModal = ({
  type = 'success',
  title,
  subtitle = '',
  desc = '',
  itemName = '',
  time = '',
  actionLabel = '',
  actor = '',
  afterConfirm = null,
} = {}) => {
  Object.assign(resultModal, { show: true, type, title, subtitle, desc, itemName, time, actionLabel, actor, afterConfirm })
}

const handleResultConfirm = async () => {
  const callback = resultModal.afterConfirm
  resultModal.show = false
  resultModal.afterConfirm = null
  if (typeof callback === 'function') await callback()
}

const maxCapacity = computed(() => props.program?.maxCount ?? 0)
const alreadyConfirmed = computed(() => props.program?.confirmedCount ?? 0)
const remainingCapacity = computed(() => Math.max(0, maxCapacity.value - alreadyConfirmed.value))
const pendingCount = computed(() => props.waitingList.length)
const confirmCount = computed(() => Math.min(pendingCount.value, remainingCapacity.value))
const overflowCount = computed(() => Math.max(0, pendingCount.value - remainingCapacity.value))

const pendingListWithLabel = computed(() =>
  props.waitingList.map((r, i) => ({ ...r, willConfirm: i < remainingCapacity.value })),
)

const handleApprove = async () => {
  if (!props.program?.programId) return
  state.loading = true
  try {
    const result = await gxApi.bulkApproveGxProgram(props.program.programId, {
      approveCount: confirmCount.value,
    })
    const approvedCount = result?.confirmedCount ?? confirmCount.value
    const cancelledCount = result?.cancelledCount ?? overflowCount.value
    openResultModal({
      type: 'success',
      title: 'GX 승인 처리가 완료되었습니다.',
      subtitle: props.program?.name || '',
      desc: `확정 ${approvedCount}명 / 취소 ${cancelledCount}명 처리되었습니다.`,
      itemName: props.program?.name || '',
      time: getCurrentTimeText(),
      actionLabel: 'GX 일괄 승인',
      actor: getCurrentActorName(),
      afterConfirm: () => {
        emit('approved')
        emit('close')
      },
    })
  } catch (e) {
    openResultModal({
      type: 'danger',
      title: '일괄 승인 처리에 실패했습니다.',
      subtitle: e?.response?.data?.resultMessage || '잠시 후 다시 시도해주세요.',
    })
  } finally {
    state.loading = false
  }
}
</script>

<template>
  <BaseModal
    :visible="true"
    :title="program?.name || 'GX 승인'"
    subtitle="대기 인원을 승인 순서대로 처리합니다."
    @close="emit('close')"
  >
    <div class="bulk-stat-cards">
      <div class="bulk-stat-card">
        <p class="bulk-stat-label">승인 대기</p>
        <p class="bulk-stat-value">{{ pendingCount }}명</p>
      </div>
      <div class="bulk-stat-card">
        <p class="bulk-stat-label">여유 자리</p>
        <p class="bulk-stat-value">{{ remainingCapacity }}명</p>
        <p class="bulk-stat-sub">최대 {{ maxCapacity }}명 중</p>
      </div>
      <div class="bulk-stat-card">
        <p class="bulk-stat-label">정원 초과</p>
        <p class="bulk-stat-value" :class="{ 'value-overflow': overflowCount > 0 }">
          {{ overflowCount }}명
        </p>
      </div>
    </div>

    <div v-if="confirmCount > 0" class="bulk-notice">
      신청 순서대로 <strong>{{ confirmCount }}명</strong> 확정되며, 나머지
      <strong>{{ overflowCount }}명</strong>은 자동 취소됩니다.
    </div>
    <div v-else class="bulk-notice bulk-notice--warn">
      확정 가능한 인원이 없습니다. (정원 초과 또는 대기자 없음)
    </div>

    <div v-if="pendingListWithLabel.length > 0" class="bulk-pending-list">
      <div
        v-for="(r, index) in pendingListWithLabel"
        :key="r.gxReservationId"
        :class="['bulk-pending-item', r.willConfirm ? 'will-confirm' : 'will-cancel']"
      >
        <span class="bulk-pending-order">{{ index + 1 }}</span>
        <div class="bulk-pending-info">
          <span class="bulk-pending-name">{{ r.residentName || '-' }}</span>
          <span class="bulk-pending-unit">{{ r.unit || [r.dong, r.ho].filter(Boolean).join(' ') || '-' }}</span>
        </div>
        <span :class="['bulk-badge', r.willConfirm ? 'badge-confirm' : 'badge-cancel']">
          {{ r.willConfirm ? '확정 예정' : '취소 예정' }}
        </span>
      </div>
    </div>
    <div v-else class="bulk-empty">승인 대기 중인 신청이 없습니다.</div>

    <template #footer>
      <button class="btn-modal-secondary" @click="emit('close')">닫기</button>
      <button
        class="btn-modal-primary"
        :disabled="confirmCount === 0 || state.loading"
        @click="handleApprove"
      >
        {{ state.loading ? '처리 중...' : '일괄 승인' }}
      </button>
    </template>
  </BaseModal>

  <ActionResultModal
    :visible="resultModal.show"
    :type="resultModal.type"
    :title="resultModal.title"
    :subtitle="resultModal.subtitle"
    :desc="resultModal.desc"
    :item-name="resultModal.itemName"
    :time="resultModal.time"
    :action-label="resultModal.actionLabel"
    :actor="resultModal.actor"
    confirm-text="확인"
    @close="handleResultConfirm"
  />
</template>

<style scoped>
:deep(.base-modal__content) {
  width: min(100%, 420px);
}

.bulk-stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.bulk-stat-card {
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  text-align: center;
}

.bulk-stat-label {
  margin: 0 0 4px;
  font-size: 11px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.bulk-stat-value {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.bulk-stat-value.value-overflow {
  color: #c62828;
}

.bulk-stat-sub {
  margin: 2px 0 0;
  font-size: 10px;
  color: #a0aec0;
  font-family: 'Noto Sans KR', sans-serif;
}

.bulk-notice {
  padding: 12px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
  margin-bottom: 16px;
  font-family: 'Noto Sans KR', sans-serif;
}

.bulk-notice--warn {
  background: #fef2f2;
  border-color: #fecaca;
  color: #c62828;
}

.bulk-pending-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
}

.bulk-pending-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  font-family: 'Noto Sans KR', sans-serif;
}

.bulk-pending-item.will-confirm {
  background: #e6f4ea;
}

.bulk-pending-item.will-cancel {
  background: #fce4ec;
}

.bulk-pending-order {
  font-size: 12px;
  color: #718096;
  min-width: 20px;
  text-align: center;
}

.bulk-pending-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bulk-pending-name {
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
}

.bulk-pending-unit {
  font-size: 11px;
  color: #718096;
}

.bulk-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}

.badge-confirm {
  background: #d9f0dc;
  color: #2e7d32;
}

.badge-cancel {
  background: #ffcdd2;
  color: #c62828;
}

.bulk-empty {
  text-align: center;
  padding: 30px;
  color: #94a3b8;
  font-size: 13px;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-modal-secondary,
.btn-modal-primary {
  min-width: 80px;
  height: 40px;
  padding: 0 16px;
  border-radius: 7px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-modal-secondary {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #718096;
}

.btn-modal-secondary:hover {
  background: #f8fafc;
}

.btn-modal-primary {
  border: none;
  background: #2b3a55;
  color: #ffffff;
}

.btn-modal-primary:hover:not(:disabled) {
  background: #1e2d44;
}

.btn-modal-primary:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}
</style>