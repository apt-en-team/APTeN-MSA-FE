<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { getFacilitySeats } from '@/api/facilityApi.js'
import { toList } from '@/utils/apiResponse'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const facilityStore = useFacilityStore()

const state = reactive({
  facilities: [],
  blockTimes: [],
  seats: [],
  facilityId: '',
  seatId: '',
  fromDate: '',
  toDate: '',
  blockDate: '',
  fullDay: false,
  startTime: '09:00',
  endTime: '18:00',
  reason: '',
  loading: false,
  submitting: false,
  errorMessage: '',
})

// 결과 모달 상태
const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
})

const selectedFacility = computed(() => {
  return state.facilities.find((facility) => String(facility.facilityId) === String(state.facilityId)) || null
})

const isSeatFacility = computed(() => selectedFacility.value?.reservationType === 'SEAT')

// 페이지 응답 시설 목록 정리
const normalizeFacilities = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.content)) return response.content
  if (Array.isArray(response?.data?.content)) return response.data.content
  return []
}

// 시간 포맷 정리
const toSecondTime = (time) => {
  if (!time) return null
  return time.length === 5 ? `${time}:00` : time
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

const fetchSeats = async () => {
  if (!state.facilityId || !isSeatFacility.value) {
    state.seats = []
    state.seatId = ''
    return
  }
  try {
    const res = await getFacilitySeats(state.facilityId)
    state.seats = Array.isArray(res) ? res : []
  } catch {
    state.seats = []
  }
}

watch(isSeatFacility, (isSeat) => {
  if (!isSeat) {
    state.seats = []
    state.seatId = ''
  } else {
    fetchSeats()
  }
})

const changeFacility = () => {
  state.seatId = ''
  fetchBlockTimes()
  fetchSeats()
}

// 조회 조건 초기화
const resetSearch = () => {
  state.fromDate = ''
  state.toDate = ''
  fetchBlockTimes()
}

const resetForm = () => {
  state.blockDate = ''
  state.fullDay = false
  state.startTime = '09:00'
  state.endTime = '18:00'
  state.reason = ''
  state.seatId = ''
}

// 차단 시간 등록
const submitBlockTime = async () => {
  if (!state.facilityId) {
    state.errorMessage = '시설을 선택해주세요.'
    return
  }

  if (!state.blockDate) {
    state.errorMessage = '차단일을 선택해주세요.'
    return
  }

  state.submitting = true
  state.errorMessage = ''

  const payload = {
    blockDate: state.blockDate,
    startTime: state.fullDay ? null : toSecondTime(state.startTime),
    endTime: state.fullDay ? null : toSecondTime(state.endTime),
    reason: String(state.reason || '').trim(),
    seatId: isSeatFacility.value && state.seatId ? Number(state.seatId) : null,
  }

  try {
    await facilityStore.createFacilityBlockTime(state.facilityId, payload)
    await fetchBlockTimes()
    resetForm()
    openResultModal('success', '차단 시간이 등록되었습니다.', `${selectedFacility.value?.name || '선택 시설'} 예약 차단 시간을 반영했습니다.`)
  } catch (error) {
    console.error('차단 시간 등록 실패:', error)
    openResultModal(
      'danger',
      '차단 시간 등록에 실패했습니다.',
      error.response?.data?.resultMessage ||
        error.response?.data?.message ||
        '잠시 후 다시 시도해주세요.',
    )
  } finally {
    state.submitting = false
  }
}

onMounted(async () => {
  await fetchFacilities()
  await fetchBlockTimes()
  await fetchSeats()
})
</script>

<template>
  <section class="block-time-tab">
    <div class="tab-grid">
      <article class="panel">
        <div class="panel-header">
          <div>
            <h3>차단 시간 등록</h3>
            <p>시설 점검, 행사, 대관 등 예약을 막아야 하는 시간을 등록합니다.</p>
          </div>
          <button class="btn-secondary" type="button" @click="fetchBlockTimes">목록 조회</button>
        </div>

        <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

        <div class="form-grid">
          <label class="form-field form-field--wide">
            <span>시설 선택</span>
            <select v-model="state.facilityId" @change="changeFacility">
              <option value="" disabled>시설을 선택해주세요.</option>
              <option v-for="facility in state.facilities" :key="facility.facilityId" :value="facility.facilityId">
                {{ facility.name }}
              </option>
            </select>
          </label>

          <label v-if="isSeatFacility" class="form-field form-field--wide">
            <span>좌석 선택 (선택사항 - 미선택 시 전체 차단)</span>
            <select v-model="state.seatId">
              <option value="">전체 차단</option>
              <option v-for="seat in state.seats" :key="seat.seatId" :value="seat.seatId">
                {{ seat.seatNo }}번 {{ seat.seatName }}
              </option>
            </select>
          </label>

          <label class="form-field">
            <span>차단일</span>
            <input v-model="state.blockDate" type="date" />
          </label>

          <label class="check-row">
            <input v-model="state.fullDay" type="checkbox" />
            <span>전체 차단</span>
          </label>

          <label class="form-field">
            <span>시작 시간</span>
            <input v-model="state.startTime" type="time" :disabled="state.fullDay" />
          </label>

          <label class="form-field">
            <span>종료 시간</span>
            <input v-model="state.endTime" type="time" :disabled="state.fullDay" />
          </label>

          <label class="form-field form-field--wide">
            <span>차단 사유</span>
            <input v-model="state.reason" type="text" placeholder="예: 정기 점검" />
          </label>
        </div>

        <div class="button-row">
          <button class="btn-secondary" type="button" @click="resetForm">초기화</button>
          <button class="btn-primary" type="button" :disabled="state.submitting" @click="submitBlockTime">
            {{ state.submitting ? '등록 중' : '차단 시간 등록' }}
          </button>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <div>
            <h3>차단 시간 목록</h3>
            <p>선택한 시설의 차단 시간을 기간 조건으로 조회합니다.</p>
          </div>
        </div>

        <div class="search-row">
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

.tab-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 18px;
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

.form-grid,
.search-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  color: #2b3a55;
  font-size: 13px;
  font-weight: 800;
}

.button-row,
.search-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.button-row {
  margin-top: 20px;
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
  .tab-grid,
  .form-grid,
  .search-row {
    grid-template-columns: 1fr;
  }
}
</style>
