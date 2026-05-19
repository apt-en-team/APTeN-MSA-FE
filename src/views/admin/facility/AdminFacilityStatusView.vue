<script setup>
import { computed, onMounted, reactive } from 'vue'
import facilityApi from '@/api/facilityApi'
import gxApi from '@/api/gxApi'
import { toList } from '@/utils/apiResponse'
import AdminStudyRoomStatus from '@/components/admin/facility/AdminStudyRoomStatus.vue'
import AdminGymStatus from '@/components/admin/facility/AdminGymStatus.vue'
import AdminGxStatus from '@/components/admin/facility/AdminGxStatus.vue'

const RESERVATION_TYPE_LABEL = {
  SEAT: '좌석형',
  COUNT: '정원형',
}

const GX_STATUS_LABEL = {
  OPEN: '모집중',
  CLOSED: '종료',
  CANCELLED: '취소됨',
}

const GX_STATUS_CLASS = {
  OPEN: 'gx-badge--open',
  CLOSED: 'gx-badge--closed',
  CANCELLED: 'gx-badge--cancelled',
}

const state = reactive({
  activeTab: 'facility',
  selectedDate: new Date().toISOString().slice(0, 10),

  facilityList: [],
  selectedFacilityId: null,
  loadingFacilities: false,
  facilityError: '',

  gxProgramList: [],
  selectedProgramId: null,
  loadingGx: false,
  gxLoaded: false,
  gxError: '',

  seatSummary: { reservedCount: 0, totalCount: 0 },
  countSummary: { maxCount: 0, reservedCount: 0, availableCount: 0 },
})

const selectedFacility = computed(() =>
  state.facilityList.find((f) => String(f.facilityId) === String(state.selectedFacilityId)) || null,
)

const reservationType = computed(() => selectedFacility.value?.reservationType || null)

const selectedProgram = computed(() =>
  state.gxProgramList.find((p) => String(p.programId) === String(state.selectedProgramId)) || null,
)

const showSeatSummary = computed(() => state.activeTab === 'facility' && reservationType.value === 'SEAT')
const showCountSummary = computed(() => state.activeTab === 'facility' && reservationType.value === 'COUNT')

const formatTime = (t) => (t ? String(t).slice(0, 5) : '-')
const formatDate = (d) => (d ? String(d).replace(/-/g, '.') : '-')

const normalizeReservationType = (type) => {
  const v = String(type || '').trim()
  if (v === '좌석형') return 'SEAT'
  if (v === '정원형') return 'COUNT'
  if (v === '승인형') return 'APPROVAL'
  return v
}

const fetchFacilities = async () => {
  state.loadingFacilities = true
  state.facilityError = ''
  try {
    const res = await facilityApi.getAdminFacilities({ page: 0, size: 100 })
    const all = toList(res)
    state.facilityList = all
      .map((f) => ({ ...f, reservationType: normalizeReservationType(f.reservationType) }))
      .filter((f) => f.reservationType !== 'APPROVAL')
    if (state.facilityList.length > 0 && !state.selectedFacilityId) {
      state.selectedFacilityId = state.facilityList[0].facilityId
    }
  } catch {
    state.facilityError = '시설 목록을 불러오지 못했습니다.'
    state.facilityList = []
  } finally {
    state.loadingFacilities = false
  }
}

const fetchGxPrograms = async () => {
  state.loadingGx = true
  state.gxError = ''
  try {
    const res = await gxApi.getAdminGxPrograms({ page: 0, size: 100 })
    state.gxProgramList = toList(res)
    state.gxLoaded = true
    if (state.gxProgramList.length > 0 && !state.selectedProgramId) {
      state.selectedProgramId = state.gxProgramList[0].programId
    }
  } catch {
    state.gxError = 'GX 프로그램 목록을 불러오지 못했습니다.'
    state.gxProgramList = []
    state.gxLoaded = true
  } finally {
    state.loadingGx = false
  }
}

const switchTab = (tab) => {
  state.activeTab = tab
  if (tab === 'gx' && !state.gxLoaded) {
    fetchGxPrograms()
  }
}

const selectFacility = (id) => {
  state.selectedFacilityId = id
}

const selectProgram = (id) => {
  state.selectedProgramId = id
}

const updateSeatSummary = (summary) => {
  state.seatSummary = {
    reservedCount: summary?.reservedCount || 0,
    totalCount: summary?.totalCount || 0,
  }
}

const updateCountSummary = (summary) => {
  state.countSummary = {
    maxCount: summary?.maxCount || 0,
    reservedCount: summary?.reservedCount || 0,
    availableCount: summary?.availableCount || 0,
  }
}

const onGxRefresh = () => {
  fetchGxPrograms()
}

onMounted(fetchFacilities)
</script>

<template>
  <div class="facility-status-page">
    <!-- 상단 탭 + 날짜 필터 -->
    <div class="top-card">
      <div class="main-tab-bar">
        <button
          :class="['main-tab', { active: state.activeTab === 'facility' }]"
          @click="switchTab('facility')"
        >
          일반 시설
        </button>
        <button
          :class="['main-tab', { active: state.activeTab === 'gx' }]"
          @click="switchTab('gx')"
        >
          GX 프로그램
        </button>
      </div>

      <div v-if="state.activeTab === 'facility'" class="filter-area">
        <label class="filter-label">조회 날짜</label>
        <input v-model="state.selectedDate" class="date-input" type="date" />
        <template v-if="showSeatSummary">
          <div class="summary-chip seat-chip">
            예약 {{ state.seatSummary.reservedCount }} / 전체 {{ state.seatSummary.totalCount }}석
          </div>
        </template>
        <template v-if="showCountSummary">
          <div class="summary-chip">최대 {{ state.countSummary.maxCount }}명</div>
          <div class="summary-chip confirmed-chip">예약 {{ state.countSummary.reservedCount }}명</div>
          <div class="summary-chip available-chip">남은 자리 {{ state.countSummary.availableCount }}명</div>
        </template>
      </div>
    </div>

    <!-- ── 일반 시설 탭 ─────────────────────────────────────────── -->
    <div v-if="state.activeTab === 'facility'" class="split-layout">
      <!-- 왼쪽: 시설 목록 -->
      <div class="left-panel">
        <div v-if="state.loadingFacilities" class="panel-empty">시설 목록 조회 중...</div>
        <div v-else-if="state.facilityError" class="panel-error">{{ state.facilityError }}</div>
        <div v-else-if="state.facilityList.length === 0" class="panel-empty">
          등록된 일반 시설이 없습니다.
        </div>
        <div v-else class="item-list">
          <div
            v-for="facility in state.facilityList"
            :key="facility.facilityId"
            :class="['facility-card', { active: String(state.selectedFacilityId) === String(facility.facilityId) }]"
            @click="selectFacility(facility.facilityId)"
          >
            <div class="card-name">{{ facility.name }}</div>
            <div class="card-row">
              <span class="type-badge">
                {{ RESERVATION_TYPE_LABEL[facility.reservationType] || facility.reservationType || '-' }}
              </span>
              <span class="card-time">{{ formatTime(facility.openTime) }} ~ {{ formatTime(facility.closeTime) }}</span>
            </div>
            <div v-if="facility.maxCount" class="card-sub">최대 {{ facility.maxCount }}명</div>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 현황 -->
      <div class="right-panel">
        <div v-if="!selectedFacility" class="panel-empty">왼쪽에서 시설을 선택하세요.</div>
        <template v-else>
          <AdminStudyRoomStatus
            v-if="reservationType === 'SEAT'"
            :facility-id="selectedFacility.facilityId"
            :selected-date="state.selectedDate"
            :open-time="selectedFacility.openTime"
            :close-time="selectedFacility.closeTime"
            @update-summary="updateSeatSummary"
          />
          <AdminGymStatus
            v-else-if="reservationType === 'COUNT'"
            :facility-id="selectedFacility.facilityId"
            :selected-date="state.selectedDate"
            :open-time="selectedFacility.openTime"
            :close-time="selectedFacility.closeTime"
            @update-summary="updateCountSummary"
          />
          <div v-else class="panel-empty">
            이 시설의 예약 방식({{ selectedFacility.reservationType }})은 현황 조회가 지원되지 않습니다.
          </div>
        </template>
      </div>
    </div>

    <!-- ── GX 프로그램 탭 ──────────────────────────────────────── -->
    <div v-if="state.activeTab === 'gx'" class="split-layout">
      <!-- 왼쪽: GX 프로그램 목록 -->
      <div class="left-panel">
        <div v-if="state.loadingGx" class="panel-empty">GX 프로그램 조회 중...</div>
        <div v-else-if="state.gxError" class="panel-error">{{ state.gxError }}</div>
        <div v-else-if="state.gxProgramList.length === 0" class="panel-empty">
          등록된 GX 프로그램이 없습니다.
        </div>
        <div v-else class="item-list">
          <div
            v-for="program in state.gxProgramList"
            :key="program.programId"
            :class="['gx-card', { active: String(state.selectedProgramId) === String(program.programId) }]"
            @click="selectProgram(program.programId)"
          >
            <div class="gx-card-top">
              <span class="card-name">{{ program.name }}</span>
              <span :class="['gx-status-badge', GX_STATUS_CLASS[program.status] || '']">
                {{ GX_STATUS_LABEL[program.status] || program.status || '-' }}
              </span>
            </div>
            <div class="card-period">
              {{ formatDate(program.startDate) }} ~ {{ formatDate(program.endDate) }}
            </div>
            <div class="card-time-row">
              {{ formatTime(program.startTime) }} ~ {{ formatTime(program.endTime) }}
            </div>
            <div class="card-counts">
              <span class="count-badge count-confirmed">확정 {{ program.confirmedCount ?? 0 }}</span>
              <span class="count-badge count-waiting">대기 {{ program.waitingCount ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽: GX 현황 -->
      <div class="right-panel">
        <div v-if="!selectedProgram" class="panel-empty">왼쪽에서 GX 프로그램을 선택하세요.</div>
        <AdminGxStatus
          v-else
          :program-id="selectedProgram.programId"
          :program="selectedProgram"
          @refresh="onGxRefresh"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.facility-status-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 상단 카드 ─────────────────────────────────────────── */
.top-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.main-tab-bar {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 20px;
}

.main-tab {
  padding: 14px 20px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #718096;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-family: 'Noto Sans KR', sans-serif;
  transition: all 0.15s;
}

.main-tab:hover {
  color: #2b3a55;
}

.main-tab.active {
  color: #2b3a55;
  border-bottom-color: #2b3a55;
}

.filter-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.date-input {
  padding: 7px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13px;
  color: #374151;
  outline: none;
  font-family: 'Noto Sans KR', sans-serif;
}

.summary-chip {
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  background: #edf2f7;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-chip {
  background: #e8eaf6;
  color: #3949ab;
}

.confirmed-chip {
  background: #e6f4ea;
  color: #2e7d32;
}

.available-chip {
  background: #e8eaf6;
  color: #3949ab;
}

/* ── 좌우 분할 레이아웃 ─────────────────────────────────── */
.split-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: start;
}

.left-panel,
.right-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  min-height: 480px;
}

/* ── 리스트 공통 ────────────────────────────────────────── */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── 시설 카드 ─────────────────────────────────────────── */
.facility-card {
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s;
}

.facility-card:hover {
  background: #f1f5f9;
}

.facility-card.active {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.card-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 6px;
  font-family: 'Noto Sans KR', sans-serif;
}

.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.type-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  background: #e8eaf6;
  color: #3949ab;
  font-family: 'Noto Sans KR', sans-serif;
}

.card-time {
  font-size: 12px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

.card-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
  font-family: 'Noto Sans KR', sans-serif;
}

/* ── GX 카드 ────────────────────────────────────────────── */
.gx-card {
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s;
}

.gx-card:hover {
  background: #f1f5f9;
}

.gx-card.active {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.gx-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.card-period,
.card-time-row {
  font-size: 12px;
  color: #718096;
  margin-bottom: 4px;
  font-family: 'Noto Sans KR', sans-serif;
}

.card-counts {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.count-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: 'Noto Sans KR', sans-serif;
}

.count-confirmed {
  background: #d9f0dc;
  color: #2e7d32;
}

.count-waiting {
  background: #fff3e0;
  color: #e65100;
}

.gx-status-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  flex-shrink: 0;
  font-family: 'Noto Sans KR', sans-serif;
}

.gx-badge--open {
  background: #e6f4ea;
  color: #4d8b5a;
}

.gx-badge--closed {
  background: #e2e8f0;
  color: #475569;
}

.gx-badge--cancelled {
  background: #fce4ec;
  color: #e53e3e;
}

/* ── 패널 공통 상태 ─────────────────────────────────────── */
.panel-empty {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
  padding: 20px 0;
}

.panel-error {
  font-size: 13px;
  color: #e53e3e;
  font-family: 'Noto Sans KR', sans-serif;
  padding: 10px 14px;
  background: #fff5f5;
  border-radius: 8px;
}

@media (max-width: 1100px) {
  .split-layout {
    grid-template-columns: 1fr;
  }
}
</style>
