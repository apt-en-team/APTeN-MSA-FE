<script setup>
import { reactive, computed, watch } from 'vue'
import gxApi from '@/api/gxApi'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const props = defineProps({
  programId: {
    type: [Number, String],
    required: true,
  },
  program: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['refresh'])

const state = reactive({
  loading: false,
  status: null,
  bulkModal: {
    show: false,
    loading: false,
  },
  resultModal: {
    show: false,
    type: 'success',
    title: '',
    subtitle: '',
  },
})

const statusLabel = (status) => {
  return { OPEN: '모집중', CLOSED: '종료', CANCELLED: '취소됨' }[status] || status || '-'
}

const statusClass = (status) => {
  return { OPEN: 'open', CLOSED: 'closed', CANCELLED: 'cancelled' }[status] || ''
}

const waitingCount = computed(
  () => state.status?.waitingCount ?? props.program?.waitingCount ?? 0,
)

const fetchStatus = async () => {
  if (!props.programId) return
  state.loading = true
  try {
    state.status = await gxApi.getGxProgramStatus(props.programId)
  } catch (e) {
    state.status = null
  } finally {
    state.loading = false
  }
}

const openBulkApprove = () => {
  state.bulkModal.show = true
}

const closeBulkApprove = () => {
  state.bulkModal.show = false
  state.bulkModal.loading = false
}

const confirmBulkApprove = async () => {
  state.bulkModal.loading = true
  try {
    await gxApi.bulkApproveGxProgram(props.programId, { approveCount: waitingCount.value })
    state.bulkModal.show = false
    state.bulkModal.loading = false
    state.resultModal = {
      show: true,
      type: 'success',
      title: '일괄 승인 완료',
      subtitle: `${waitingCount.value}명이 승인 처리되었습니다.`,
    }
    await fetchStatus()
    emit('refresh')
  } catch (e) {
    state.bulkModal.loading = false
    state.resultModal = {
      show: true,
      type: 'error',
      title: '일괄 승인 실패',
      subtitle: '처리 중 오류가 발생했습니다.',
    }
  }
}

watch(
  () => props.programId,
  () => {
    fetchStatus()
  },
  { immediate: true },
)
</script>

<template>
  <div class="gx-detail-panel">
    <!-- 프로그램 헤더 -->
    <div class="detail-head">
      <div>
        <h3 class="detail-title">{{ program.name }}</h3>
        <p class="detail-desc">
          {{ program.startDate ?? '-' }} ~ {{ program.endDate ?? '-' }}
          &nbsp;·&nbsp;
          {{ program.startTime ?? '-' }} ~ {{ program.endTime ?? '-' }}
        </p>
      </div>
      <span class="status-badge" :class="statusClass(program.status)">
        {{ statusLabel(program.status) }}
      </span>
    </div>

    <!-- 현황 카드 -->
    <div v-if="state.loading" class="loading-text">현황을 불러오는 중입니다.</div>
    <div v-else class="summary-row">
      <div class="summary-card">
        <p class="summary-label">최대 정원</p>
        <p class="summary-value">{{ program.maxCount ?? '-' }}명</p>
      </div>
      <div class="summary-card confirmed-card">
        <p class="summary-label">확정 인원</p>
        <p class="summary-value">{{ state.status?.confirmedCount ?? '-' }}명</p>
      </div>
      <div class="summary-card waiting-card">
        <p class="summary-label">대기 인원</p>
        <p class="summary-value">{{ state.status?.waitingCount ?? '-' }}명</p>
      </div>
      <div class="summary-card rejected-card">
        <p class="summary-label">거절 인원</p>
        <p class="summary-value">{{ state.status?.rejectedCount ?? '-' }}명</p>
      </div>
      <div class="summary-card cancelled-card">
        <p class="summary-label">취소 인원</p>
        <p class="summary-value">{{ state.status?.cancelledCount ?? '-' }}명</p>
      </div>
    </div>

    <!-- 일괄 승인 -->
    <div class="bulk-area">
      <button
        class="btn-bulk-approve"
        :disabled="waitingCount === 0 || state.bulkModal.loading"
        @click="openBulkApprove"
      >
        일괄 승인 ({{ waitingCount }}명)
      </button>
    </div>

    <!-- 신청자 목록 안내 -->
    <div class="api-notice">
      <span class="notice-icon">ℹ</span>
      GX 신청자 목록 API 필요 — 개별 신청자 목록 조회 기능은 추후 연결 예정입니다.
    </div>
  </div>

  <!-- 일괄 승인 확인 모달 -->
  <ConfirmModal
    :visible="state.bulkModal.show"
    title="일괄 승인"
    :subtitle="`대기 중인 ${waitingCount}명을 일괄 승인하시겠습니까?`"
    confirm-type="success"
    confirm-text="승인"
    :loading="state.bulkModal.loading"
    @confirm="confirmBulkApprove"
    @cancel="closeBulkApprove"
  />

  <!-- 결과 모달 -->
  <ActionResultModal
    :visible="state.resultModal.show"
    :type="state.resultModal.type"
    :title="state.resultModal.title"
    :subtitle="state.resultModal.subtitle"
    @close="state.resultModal.show = false"
  />
</template>

<style scoped>
.gx-detail-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.detail-desc {
  margin: 6px 0 0;
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.loading-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.summary-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-card {
  flex: 1;
  min-width: 110px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.summary-card.confirmed-card {
  background: #e8f5e9;
  border-color: #a5d6a7;
}

.summary-card.waiting-card {
  background: #fff3e0;
  border-color: #ffcc80;
}

.summary-card.rejected-card {
  background: #fce4ec;
  border-color: #f48fb1;
}

.summary-card.cancelled-card {
  background: #f5f5f5;
  border-color: #e0e0e0;
}

.summary-label {
  margin: 0 0 8px;
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.summary-value {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
}

.bulk-area {
  display: flex;
  align-items: center;
}

.btn-bulk-approve {
  padding: 10px 20px;
  background: #4f46e5;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-bulk-approve:hover:not(:disabled) {
  background: #4338ca;
}

.btn-bulk-approve:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}

.api-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  font-size: 13px;
  color: #0369a1;
  font-family: 'Noto Sans KR', sans-serif;
}

.notice-icon {
  font-style: normal;
  font-weight: 700;
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  flex-shrink: 0;
  font-family: 'Noto Sans KR', sans-serif;
}

.status-badge.open {
  background: #e6f4ea;
  color: #4d8b5a;
}

.status-badge.closed {
  background: #e2e8f0;
  color: #475569;
}

.status-badge.cancelled {
  background: #fce4ec;
  color: #e53e3e;
}
</style>
