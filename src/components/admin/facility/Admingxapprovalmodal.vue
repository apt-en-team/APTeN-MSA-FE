<script setup>
import { reactive, computed, watch } from 'vue'
import BaseModal from '@/components/common/BeseModel.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import reservationAPI from '@/api/reservation'

const props = defineProps({
  program: {
    type: Object,
    required: true,
  },
  userList: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'approved'])

const state = reactive({
  isProcessing: false,
  pendingList: [],
  errorMsg: '',
})

const resultModal = reactive({
  show: false,
  title: '',
  subtitle: '',
  desc: '',
  itemName: '',
  time: '',
  actionLabel: '',
  actor: '관리사무소',
  type: 'success',
})

watch(
  () => props.userList,
  (newList) => {
    const list = Array.isArray(newList) ? newList : []
    state.pendingList = list.filter((item) => item.status === 'PENDING')
  },
  { immediate: true }
)

const pendingCount = computed(() => state.pendingList.length)

const maxCapacity = computed(() => {
  return props.program?.maxCapacity || 0
})

const overflowCount = computed(() => {
  return Math.max(0, pendingCount.value - maxCapacity.value)
})

const confirmCount = computed(() => {
  return Math.min(pendingCount.value, maxCapacity.value)
})

const handleApprove = async () => {
  if (!props.program?.programId) return

  state.isProcessing = true
  state.errorMsg = ''

  try {
    const res = await reservationAPI.approveGx(props.program.programId)
    const result = res.data?.resultData

    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const mi = String(now.getMinutes()).padStart(2, '0')

    resultModal.type = 'success'
    resultModal.title = 'GX 승인 처리가 완료되었습니다'
    resultModal.subtitle = props.program?.facilityName || 'GX 프로그램'
    resultModal.desc = `확정 ${result?.confirmedCount || 0}명 / 취소 ${result?.cancelledCount || 0}명 처리되었습니다.`
    resultModal.itemName = props.program?.facilityName || 'GX 프로그램'
    resultModal.time = `${yyyy}.${mm}.${dd} ${hh}:${mi}`
    resultModal.actionLabel = 'GX 일괄 승인'
    resultModal.actor = '관리사무소'
    resultModal.show = true

  } catch (error) {
    state.errorMsg = error.response?.data?.resultMessage || '승인 처리 중 오류가 발생했습니다.'
  } finally {
    state.isProcessing = false
  }
}

const handleCloseResultModal = () => {
  resultModal.show = false
  emit('approved')
  emit('close')
}
</script>

<template>
  <BaseModal
    :title="props.program?.facilityName || props.program?.name || 'GX 승인'"
    subtitle="대기 인원을 승인 순서대로 처리합니다."
    @close="$emit('close')"
  >
    <div class="stat-row">
      <div class="stat-card">
        <span class="stat-label">승인 대기</span>
        <span class="stat-value pending">{{ pendingCount }}명</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">최대 정원</span>
        <span class="stat-value">{{ maxCapacity }}명</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">정원 초과</span>
        <span class="stat-value" :class="{ overflow: overflowCount > 0 }">
          {{ overflowCount }}명
        </span>
      </div>
    </div>

    <div class="notice">
      신청 순서대로 <strong>{{ confirmCount }}명</strong> 확정되며,
      나머지 <strong>{{ overflowCount }}명</strong>은 자동 취소됩니다.
    </div>

    <p v-if="state.errorMsg" class="error-msg">{{ state.errorMsg }}</p>

    <div class="pending-list">
      <div
        v-for="(item, index) in state.pendingList"
        :key="item.reservationId"
        :class="['pending-item', index < maxCapacity ? 'will-confirm' : 'will-cancel']"
      >
        <span class="order">{{ index + 1 }}</span>

        <div class="user-info">
          <span class="user-name">{{ item.userName }}</span>
          <span class="user-dong">{{ item.dong }} {{ item.ho }}</span>
        </div>

        <span :class="['item-badge', index < maxCapacity ? 'badge-confirm' : 'badge-cancel']">
          {{ index < maxCapacity ? '확정 예정' : '취소 예정' }}
        </span>
      </div>

      <div v-if="state.pendingList.length === 0" class="empty">
        승인 대기 중인 신청이 없습니다.
      </div>
    </div>

    <template #footer>
      <button class="btn-secondary" @click="$emit('close')">닫기</button>

      <button
        class="btn-primary"
        :disabled="pendingCount === 0 || state.isProcessing"
        @click="handleApprove"
      >
        {{ state.isProcessing ? '처리 중...' : '일괄 승인' }}
      </button>
    </template>
  </BaseModal>

  <ActionResultModal
    v-if="resultModal.show"
    :title="resultModal.title"
    :subtitle="resultModal.subtitle"
    :desc="resultModal.desc"
    :type="resultModal.type"
    :item-name="resultModal.itemName"
    :time="resultModal.time"
    :action-label="resultModal.actionLabel"
    :actor="resultModal.actor"
    @close="handleCloseResultModal"
  />
</template>

<style scoped>
.stat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1e2533;
}

.stat-value.pending {
  color: #e65100;
}

.stat-value.overflow {
  color: #c62828;
}

.notice {
  background: #fff3e0;
  border-left: 3px solid #ff9800;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #555;
}

.success-msg {
  margin: 12px 0 14px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f0fdf4;
  color: #166534;
  font-size: 13px;
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
}

.error-msg {
  margin: 12px 0 14px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
}

.pending-list {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 4px;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 6px;
}

.will-confirm {
  background: #e6f4ea;
}

.will-cancel {
  background: #fce4ec;
}

.order {
  font-size: 12px;
  color: #888;
  min-width: 20px;
  text-align: center;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  display: block;
}

.user-dong {
  font-size: 12px;
  color: #888;
}

.item-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
}

.badge-confirm {
  background: #c8e6c9;
  color: #2e7d32;
}

.badge-cancel {
  background: #ffcdd2;
  color: #c62828;
}

.empty {
  text-align: center;
  padding: 30px;
  color: #888;
  font-size: 14px;
}

.btn-primary {
  padding: 9px 20px;
  border-radius: 8px;
  background: #1e2533;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 9px 20px;
  border-radius: 8px;
  background: #f5f5f5;
  border: none;
  color: #333;
  font-size: 14px;
  cursor: pointer;
}
</style>