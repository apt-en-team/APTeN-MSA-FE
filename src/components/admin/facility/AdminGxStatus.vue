<script setup>
import { reactive, computed, watch } from 'vue'
import gxApi from '@/api/gxApi'
import { toList } from '@/utils/apiResponse'

const props = defineProps({
  facilityId: {
    type: [Number, String],
    required: true,
  },
  selectedMonth: {
    type: String,
    default: '',
  },
})

const state = reactive({
  loadingPrograms: false,
  selectedProgramId: null,
  programList: [],
})

const displayMonth = computed(() => {
  if (!props.selectedMonth) return ''
  return Number(props.selectedMonth.split('-')[1]) + '월'
})

const selectedProgram = computed(() =>
  state.programList.find((item) => item.programId === state.selectedProgramId) || null,
)

const fetchGxPrograms = async () => {
  if (!props.facilityId) return

  state.loadingPrograms = true

  try {
    const res = await gxApi.getAdminGxPrograms({ facilityId: props.facilityId })
    state.programList = toList(res)

    if (state.programList.length > 0) {
      state.selectedProgramId = state.programList[0].programId
    } else {
      state.selectedProgramId = null
    }
  } catch (e) {
    console.error('GX 프로그램 목록 조회 실패:', e)
    state.programList = []
    state.selectedProgramId = null
  } finally {
    state.loadingPrograms = false
  }
}

const selectProgram = (programId) => {
  state.selectedProgramId = programId
}

const statusLabel = (status) => {
  return { OPEN: '모집중', CLOSED: '종료', CANCELLED: '취소됨' }[status] || status || '-'
}

const statusClass = (status) => {
  return { OPEN: 'confirmed', CLOSED: 'completed', CANCELLED: 'cancelled' }[status] || ''
}

watch(
  [() => props.facilityId, () => props.selectedMonth],
  async () => {
    await fetchGxPrograms()
  },
  { immediate: true },
)
</script>

<template>
  <div class="gx-page">
    <div v-if="state.loadingPrograms" class="empty-text">GX 프로그램 데이터를 불러오는 중입니다.</div>

    <div class="gx-layout">
      <!-- 좌측: 프로그램 목록 -->
      <div class="program-panel">
        <div class="program-list">
          <div
            v-for="program in state.programList"
            :key="program.programId"
            class="program-item"
            :class="{ active: state.selectedProgramId === program.programId }"
            @click="selectProgram(program.programId)"
          >
            <div class="program-top">
              <p class="program-name">{{ displayMonth }} {{ program.name }}</p>
            </div>

            <div class="program-bottom">
              <div class="program-capacity">
                신청 {{ (program.confirmedCount ?? 0) + (program.waitingCount ?? 0) }} / 정원 {{ program.maxCount ?? '-' }}명
              </div>

              <div class="program-counts-right">
                <span class="count-chip confirmed-chip">확정 {{ program.confirmedCount ?? 0 }}</span>
                <span class="count-chip waiting-chip">대기 {{ program.waitingCount ?? 0 }}</span>
              </div>
            </div>
          </div>

          <div v-if="!state.loadingPrograms && state.programList.length === 0" class="empty-text">
            등록된 GX 프로그램이 없습니다.
          </div>
        </div>
      </div>

      <!-- 우측: 선택 프로그램 상세 -->
      <div v-if="selectedProgram" class="detail-panel">
        <div class="detail-head">
          <div>
            <h3 class="detail-title">{{ selectedProgram.name }}</h3>
            <p class="detail-desc">
              {{ selectedProgram.startDate ?? '-' }} ~ {{ selectedProgram.endDate ?? '-' }}
              &nbsp;·&nbsp;
              {{ selectedProgram.startTime ?? '-' }} ~ {{ selectedProgram.endTime ?? '-' }}
            </p>
          </div>
          <span class="status-badge" :class="statusClass(selectedProgram.status)">
            {{ statusLabel(selectedProgram.status) }}
          </span>
        </div>

        <div class="summary-row">
          <div class="summary-card">
            <p class="summary-label">최대 정원</p>
            <p class="summary-value">{{ selectedProgram.maxCount ?? '-' }}명</p>
          </div>
          <div class="summary-card confirmed-card">
            <p class="summary-label">확정 인원</p>
            <p class="summary-value">{{ selectedProgram.confirmedCount ?? '-' }}명</p>
          </div>
          <div class="summary-card waiting-card">
            <p class="summary-label">대기 인원</p>
            <p class="summary-value">{{ selectedProgram.waitingCount ?? '-' }}명</p>
          </div>
        </div>

        <p class="guide-text">예약자 관리는 GX 프로그램 관리 메뉴에서 확인하세요.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gx-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.gx-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
}

.program-panel,
.detail-panel {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  padding: 16px;
}

.program-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.program-item {
  padding: 20px 24px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s;
}

.program-item:hover {
  background: #f1f5f9;
}

.program-item.active {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.program-top {
  margin-bottom: 28px;
}

.program-name {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1a202c;
  line-height: 1.4;
  font-family: 'Noto Sans KR', sans-serif;
}

.program-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.program-capacity {
  font-size: 14px;
  font-weight: 600;
  color: #757575;
  font-family: 'Noto Sans KR', sans-serif;
}

.program-counts-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Noto Sans KR', sans-serif;
}

.confirmed-chip {
  background: #d9f0dc;
  color: #2e7d32;
}

.waiting-chip {
  background: #fff3e0;
  color: #e65100;
}

/* 우측 상세 */
.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
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

.guide-text {
  margin: 20px 0 0;
  font-size: 12px;
  color: #94a3b8;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 상태 배지 */
.status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  flex-shrink: 0;
  font-family: 'Noto Sans KR', sans-serif;
}

.status-badge.confirmed {
  background: #e6f4ea;
  color: #4d8b5a;
}

.status-badge.completed {
  background: #e2e8f0;
  color: #475569;
}

.status-badge.cancelled {
  background: #fce4ec;
  color: #e53e3e;
}

.empty-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

@media (max-width: 1200px) {
  .gx-layout {
    grid-template-columns: 1fr;
  }
}
</style>
