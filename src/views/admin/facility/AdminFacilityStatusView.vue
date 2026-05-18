<script setup>
import { reactive, computed, onMounted } from 'vue'
import facilityApi from '@/api/facilityApi'
import { toList } from '@/utils/apiResponse'
import AdminStudyRoomStatus from '@/components/admin/facility/AdminStudyRoomStatus.vue'
import AdminGymStatus from '@/components/admin/facility/AdminGymStatus.vue'
import AdminGxStatus from '@/components/admin/facility/AdminGxStatus.vue'

const state = reactive({
  loading: false,
  facilityList: [],
  selectedFacilityId: null,
  selectedDate: new Date().toISOString().slice(0, 10),
  selectedMonth: new Date().toISOString().slice(0, 7),

  // 좌석형 요약
  seatSummary: {
    reservedCount: 0,
    totalCount: 0,
  },

  // 정원형 요약
  countSummary: {
    maxCount: 0,
    reservedCount: 0,
    availableCount: 0,
  },
})

const selectedFacility = computed(() =>
  state.facilityList.find((f) => String(f.facilityId) === String(state.selectedFacilityId)) || null,
)

const reservationType = computed(() => selectedFacility.value?.reservationType || null)

const showSeatSummary = computed(() => reservationType.value === 'SEAT')
const showCountSummary = computed(() => reservationType.value === 'COUNT')

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

const fetchFacilities = async () => {
  state.loading = true
  try {
    const res = await facilityApi.getAdminFacilities({ page: 0, size: 100 })
    state.facilityList = toList(res)
    if (state.facilityList.length > 0) {
      state.selectedFacilityId = state.facilityList[0].facilityId
    }
  } catch (e) {
    console.error('시설 목록 조회 실패:', e)
    state.facilityList = []
  } finally {
    state.loading = false
  }
}

const changeTab = (facilityId) => {
  state.selectedFacilityId = facilityId
}

onMounted(() => {
  fetchFacilities()
})
</script>

<template>
  <div class="facility-status-page">
    <div v-if="state.loading" class="empty-text">시설 목록을 불러오는 중입니다.</div>

    <template v-else>
      <!-- 상단 제어 카드 -->
      <div class="top-controls-card">
        <!-- 탭 영역 -->
        <div class="tab-bar">
          <button
            v-for="facility in state.facilityList"
            :key="facility.facilityId"
            class="tab-btn"
            :class="{ active: String(state.selectedFacilityId) === String(facility.facilityId) }"
            @click="changeTab(facility.facilityId)"
          >
            {{ facility.name }}
          </button>
          <div v-if="state.facilityList.length === 0" class="tab-empty">등록된 시설이 없습니다.</div>
        </div>

        <!-- 필터 + 요약칩 영역 -->
        <div class="top-filter-area">
          <div class="filter-left">
            <template v-if="reservationType !== 'APPROVAL'">
              <label class="filter-label">조회 날짜</label>
              <input v-model="state.selectedDate" class="date-input" type="date" />
            </template>
            <template v-else>
              <label class="filter-label">조회 월</label>
              <input v-model="state.selectedMonth" class="date-input" type="month" />
            </template>
          </div>

          <!-- 요약칩 -->
          <div class="filter-right">
            <template v-if="showSeatSummary">
              <div class="summary-chip seat-chip">
                예약 {{ state.seatSummary.reservedCount }} / 전체 {{ state.seatSummary.totalCount }}석
              </div>
            </template>

            <template v-if="showCountSummary">
              <div class="summary-chip gym-chip">
                최대 {{ state.countSummary.maxCount }}명
              </div>
              <div class="summary-chip confirmed-chip">
                예약 {{ state.countSummary.reservedCount }}명
              </div>
              <div class="summary-chip available-chip">
                남은 자리 {{ state.countSummary.availableCount }}명
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 본문 카드 -->
      <div class="content-card">
        <div v-if="!selectedFacility" class="empty-text">시설을 선택하세요.</div>

        <template v-else>
          <!-- 좌석형 -->
          <AdminStudyRoomStatus
            v-if="reservationType === 'SEAT'"
            :facility-id="selectedFacility.facilityId"
            :selected-date="state.selectedDate"
            @update-summary="updateSeatSummary"
          />

          <!-- 정원형 -->
          <AdminGymStatus
            v-else-if="reservationType === 'COUNT'"
            :facility-id="selectedFacility.facilityId"
            :selected-date="state.selectedDate"
            @update-summary="updateCountSummary"
          />

          <!-- 승인형 (GX) -->
          <AdminGxStatus
            v-else-if="reservationType === 'APPROVAL'"
            :facility-id="selectedFacility.facilityId"
            :selected-month="state.selectedMonth"
          />

          <div v-else class="empty-text">이 시설의 예약 방식을 확인할 수 없습니다.</div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.facility-status-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f5f6f8;
}

/* 상단 제어 카드 */
.top-controls-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

/* 탭 */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 20px;
  overflow-x: auto;
}

.tab-btn {
  padding: 14px 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #718096;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
  white-space: nowrap;
  flex-shrink: 0;
}

.tab-btn:hover {
  color: #2b3a55;
}

.tab-btn.active {
  color: #2b3a55;
  font-weight: 700;
  border-bottom-color: #2b3a55;
}

.tab-empty {
  padding: 14px 0;
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 필터 */
.top-filter-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  background: #ffffff;
}

.filter-left,
.filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
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
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  font-family: 'Noto Sans KR', sans-serif;
}

.seat-chip {
  background: #e8eaf6;
  color: #3949ab;
}

.gym-chip {
  background: #edf2f7;
  color: #718096;
}

.confirmed-chip {
  background: #e6f4ea;
  color: #2e7d32;
}

.available-chip {
  background: #e8eaf6;
  color: #3949ab;
}

/* 본문 카드 */
.content-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  min-height: 520px;
}

.empty-text {
  font-size: 13px;
  color: #718096;
  font-family: 'Noto Sans KR', sans-serif;
}
</style>
