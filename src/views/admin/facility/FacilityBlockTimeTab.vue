<script setup>
import { inject, onMounted, onUnmounted, reactive } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { toList } from '@/utils/apiResponse'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import FacilityBlockTimeForm from '@/components/admin/facility/FacilityBlockTimeForm.vue'

const facilityStore = useFacilityStore()
const registerOpenModal = inject('registerOpenModal', () => {})

const state = reactive({
  facilities: [],
  blockTimes: [],
  facilityId: '',
  fromDate: '',
  toDate: '',
  mode: 'list',
  loading: false,
  errorMessage: '',
})

// 결과 모달 상태
const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
})

// 페이지 응답 시설 목록 정리
const normalizeFacilities = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.content)) return response.content
  if (Array.isArray(response?.data?.content)) return response.data.content
  return []
}

// 결과 모달 표시
const openResultModal = (type, title, subtitle) => {
  resultModal.type = type
  resultModal.title = title
  resultModal.subtitle = subtitle
  resultModal.show = true
}

// 결과 모달 닫기
const closeResultModal = () => {
  resultModal.show = false
}

// 시설 목록 조회
const fetchFacilities = async () => {
  state.loading = true
  state.errorMessage = ''

  try {
    const result = await facilityStore.fetchAdminFacilities({ page: 0, size: 100 })
    state.facilities = normalizeFacilities(result).map((facility) => ({
      ...facility,
      facilityId: facility.facilityId ?? facility.facilityUid ?? facility.id,
    }))

    if (!state.facilityId && state.facilities.length > 0) {
      state.facilityId = state.facilities[0].facilityId
    }
  } catch (error) {
    console.error('시설 목록 조회 실패:', error)
    state.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '시설 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

// 차단 시간 목록 조회
const fetchBlockTimes = async () => {
  if (!state.facilityId) return

  state.loading = true
  state.errorMessage = ''

  try {
    const params = {
      fromDate: state.fromDate || undefined,
      toDate: state.toDate || undefined,
    }

    const result = await facilityStore.fetchFacilityBlockTimes(state.facilityId, params)
    state.blockTimes = toList(result)
  } catch (error) {
    console.error('차단 시간 조회 실패:', error)
    state.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '차단 시간 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const changeFacility = () => {
  fetchBlockTimes()
}

// 조회 조건 초기화
const resetSearch = () => {
  state.fromDate = ''
  state.toDate = ''
  fetchBlockTimes()
}

const openCreateForm = () => {
  state.mode = 'create'
}

const closeCreateForm = () => {
  state.mode = 'list'
}

const handleBlockTimeSaved = async (facilityName) => {
  state.mode = 'list'
  await fetchBlockTimes()
  openResultModal('success', '차단 시간이 등록되었습니다.', `${facilityName} 예약 차단 시간을 반영했습니다.`)
}

onMounted(async () => {
  registerOpenModal(openCreateForm)
  await fetchFacilities()
  await fetchBlockTimes()
})

onUnmounted(() => {
  registerOpenModal(null)
})
</script>

<template>
  <section class="block-time-tab">
    <FacilityBlockTimeForm
      v-if="state.mode === 'create'"
      :facilities="state.facilities"
      :initial-facility-id="state.facilityId"
      @saved="handleBlockTimeSaved"
      @cancel="closeCreateForm"
    />

    <div v-else class="tab-grid">
      <article class="panel">
        <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

        <div class="search-row">
          <label class="form-field form-field--wide">
            <span>시설 선택</span>
            <select v-model="state.facilityId" @change="changeFacility">
              <option value="" disabled>시설을 선택해주세요.</option>
              <option v-for="facility in state.facilities" :key="facility.facilityId" :value="facility.facilityId">
                {{ facility.name }}
              </option>
            </select>
          </label>

          <label class="form-field">
            <span>시작일</span>
            <input v-model="state.fromDate" type="date" />
          </label>
          <label class="form-field">
            <span>종료일</span>
            <input v-model="state.toDate" type="date" />
          </label>
          <div class="search-actions">
            <button class="btn-secondary" type="button" @click="resetSearch">초기화</button>
            <button class="btn-primary" type="button" @click="fetchBlockTimes">조회</button>
          </div>
        </div>

        <div class="block-list">
          <div v-for="item in state.blockTimes" :key="item.facilityBlockTimeId" class="block-card">
            <div>
              <strong>{{ item.blockDate }}</strong>
              <p>{{ item.reason || '차단 사유 없음' }}</p>
            </div>
            <div class="block-card-meta">
              <span class="block-scope">
                {{ item.seatId ? `좌석 ${item.seatNo || item.seatId}번 차단` : '전체 차단' }}
              </span>
              <span>
                {{ item.startTime && item.endTime ? `${item.startTime} ~ ${item.endTime}` : '종일' }}
              </span>
            </div>
          </div>
          <div v-if="state.blockTimes.length === 0" class="empty-box">
            조회된 차단 시간이 없습니다.
          </div>
        </div>
      </article>
    </div>

    <ActionResultModal
      :visible="resultModal.show"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      confirm-text="확인"
      @close="closeResultModal"
    />
  </section>
</template>

<style scoped>
.block-time-tab {
  font-family: 'Noto Sans KR', sans-serif;
}


.panel {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  padding: 24px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1e2a3e;
}

.panel-header p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #687282;
}

.search-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.3fr) repeat(2, minmax(160px, 1fr)) auto;
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: #2b3a55;
}

.form-field--wide {
  grid-column: 1 / -1;
}

.form-field input,
.form-field select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d7dee8;
  border-radius: 8px;
  color: #1e2a3e;
}

.form-field input:disabled {
  background: #f5f6f8;
  color: #a0aec0;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.search-actions {
  align-items: end;
}

.btn-primary,
.btn-secondary {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.btn-primary {
  border: 0;
  background: #1e2a3e;
  color: #ffffff;
}

.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.btn-secondary {
  border: 1px solid #d7dee8;
  background: #ffffff;
  color: #2b3a55;
}

.block-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.block-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  background: #f8fafc;
}

.block-card strong {
  color: #1e2a3e;
  font-size: 14px;
}

.block-card p {
  margin: 5px 0 0;
  color: #687282;
  font-size: 12px;
}

.block-card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.block-card-meta span {
  color: #2b3a55;
  font-size: 12px;
  font-weight: 800;
}

.block-scope {
  color: #7b8ea8 !important;
  font-weight: 600 !important;
}

.empty-box,
.error-box {
  padding: 14px;
  border-radius: 10px;
  font-size: 13px;
}

.empty-box {
  background: #f8fafc;
  color: #7b8ea8;
  text-align: center;
}

.error-box {
  margin-bottom: 14px;
  background: #fff5f5;
  color: #e53e3e;
}

@media (max-width: 960px) {
  .search-row {
    grid-template-columns: 1fr;
  }
}
</style>
