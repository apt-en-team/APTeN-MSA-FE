<script setup>
import { computed, reactive, watch } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { getFacilitySeats } from '@/api/facilityApi.js'
import { toList } from '@/utils/apiResponse'

const props = defineProps({
  facilities: {
    type: Array,
    default: () => [],
  },
  initialFacilityId: {
    type: [String, Number],
    default: '',
  },
})

const emit = defineEmits(['saved', 'cancel'])

const facilityStore = useFacilityStore()

const state = reactive({
  seats: [],
  facilityId: '',
  seatScope: 'facility',
  seatId: '',
  blockDate: '',
  fullDay: false,
  startTime: '09:00',
  endTime: '18:00',
  reason: '',
  loadingSeats: false,
  submitting: false,
  errorMessage: '',
})

const selectedFacility = computed(() => {
  return props.facilities.find((facility) => String(facility.facilityId) === String(state.facilityId)) || null
})

const normalizeReservationType = (type) => {
  const value = String(type || '').trim()
  if (value === '좌석형') return 'SEAT'
  if (value === '정원형') return 'COUNT'
  if (value === '승인형') return 'APPROVAL'
  return value
}

const isSeatFacility = computed(() => normalizeReservationType(selectedFacility.value?.reservationType) === 'SEAT')

const toSecondTime = (time) => {
  if (!time) return null
  return time.length === 5 ? `${time}:00` : time
}

const resetForm = () => {
  state.seatScope = 'facility'
  state.seatId = ''
  state.blockDate = ''
  state.fullDay = false
  state.startTime = '09:00'
  state.endTime = '18:00'
  state.reason = ''
  state.errorMessage = ''
}

const fetchSeats = async () => {
  if (!state.facilityId || !isSeatFacility.value) {
    state.seats = []
    state.seatScope = 'facility'
    state.seatId = ''
    return
  }

  state.loadingSeats = true

  try {
    const res = await getFacilitySeats(state.facilityId)
    state.seats = toList(res)
  } catch (error) {
    console.error('좌석 목록 조회 실패:', error)
    state.seats = []
  } finally {
    state.loadingSeats = false
  }
}

const changeFacility = () => {
  state.seatScope = 'facility'
  state.seatId = ''
  fetchSeats()
}

const submitBlockTime = async () => {
  if (!state.facilityId) {
    state.errorMessage = '시설을 선택해주세요.'
    return
  }

  if (!state.blockDate) {
    state.errorMessage = '차단일을 선택해주세요.'
    return
  }

  if (!state.fullDay && (!state.startTime || !state.endTime)) {
    state.errorMessage = '차단 시간을 입력해주세요.'
    return
  }

  if (isSeatFacility.value && state.seatScope === 'seat' && !state.seatId) {
    state.errorMessage = '차단할 좌석을 선택해주세요.'
    return
  }

  state.submitting = true
  state.errorMessage = ''

  // 좌석형 시설만 특정 좌석 차단 허용
  const payload = {
    blockDate: state.blockDate,
    startTime: state.fullDay ? null : toSecondTime(state.startTime),
    endTime: state.fullDay ? null : toSecondTime(state.endTime),
    reason: String(state.reason || '').trim(),
    seatId: isSeatFacility.value && state.seatScope === 'seat' ? state.seatId : null,
  }

  try {
    await facilityStore.createFacilityBlockTime(state.facilityId, payload)
    emit('saved', selectedFacility.value?.name || '선택 시설')
    resetForm()
  } catch (error) {
    console.error('차단 시간 등록 실패:', error)
    state.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '차단 시간 등록에 실패했습니다.'
  } finally {
    state.submitting = false
  }
}

watch(
  () => props.initialFacilityId,
  (facilityId) => {
    if (!state.facilityId && facilityId) {
      state.facilityId = facilityId
      fetchSeats()
    }
  },
  { immediate: true },
)
</script>

<template>
  <article class="panel">
    <div class="panel-header">
      <div>
        <h3>차단 시간 등록</h3>
        <p>시설 전체 또는 좌석별 예약 차단 시간을 등록합니다.</p>
      </div>
      <button class="btn-secondary" type="button" @click="emit('cancel')">목록으로</button>
    </div>

    <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

    <div class="form-grid">
      <label class="form-field form-field--wide">
        <span>시설 선택</span>
        <select v-model="state.facilityId" @change="changeFacility">
          <option value="" disabled>시설을 선택해주세요.</option>
          <option v-for="facility in facilities" :key="facility.facilityId" :value="facility.facilityId">
            {{ facility.name }}
          </option>
        </select>
      </label>

      <div v-if="isSeatFacility" class="form-field form-field--wide">
        <span>차단 대상</span>
        <div class="radio-row">
          <label>
            <input v-model="state.seatScope" type="radio" value="facility" />
            시설 전체
          </label>
          <label>
            <input v-model="state.seatScope" type="radio" value="seat" />
            특정 좌석
          </label>
        </div>
      </div>

      <label v-if="isSeatFacility && state.seatScope === 'seat'" class="form-field form-field--wide">
        <span>좌석 선택</span>
        <select v-model="state.seatId" :disabled="state.loadingSeats">
          <option value="" disabled>좌석을 선택해주세요.</option>
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
        <span>하루종일</span>
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
      <button class="btn-secondary" type="button" @click="emit('cancel')">취소</button>
      <button class="btn-primary" type="button" :disabled="state.submitting" @click="submitBlockTime">
        {{ state.submitting ? '등록 중' : '차단 시간 등록' }}
      </button>
    </div>
  </article>
</template>

<style scoped>
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

.form-grid {
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

.form-field input:disabled,
.form-field select:disabled {
  background: #f5f6f8;
  color: #a0aec0;
}

.radio-row {
  display: flex;
  gap: 14px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.radio-row label,
.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2b3a55;
  font-size: 13px;
  font-weight: 800;
}

.check-row {
  min-height: 40px;
}

.button-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
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

.error-box {
  margin-bottom: 14px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
}

@media (max-width: 960px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
