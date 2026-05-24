<script setup>
import { computed, reactive, watch } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { getFacilitySeats } from '@/api/facilityApi.js'
import { toList } from '@/utils/apiResponse'

// 정기 휴무 요일/주차 선택지 상수
const WEEK_ORDINALS = [
  { value: 1, label: '첫째' },
  { value: 2, label: '둘째' },
  { value: 3, label: '셋째' },
  { value: 4, label: '넷째' },
  { value: 5, label: '다섯째' },
]

const props = defineProps({
  facilities: {
    type: Array,
    default: () => [],
  },
  initialFacilityId: {
    type: [String, Number],
    default: '',
  },
  // 단건 수정 모드: 기존 차단 시간 항목
  editItem: {
    type: Object,
    default: null,
  },
  // 정기 휴무 규칙 수정 모드
  editClosureRule: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['saved', 'rule-saved', 'cancel'])

const facilityStore = useFacilityStore()

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: '월' },
  { value: 'TUESDAY', label: '화' },
  { value: 'WEDNESDAY', label: '수' },
  { value: 'THURSDAY', label: '목' },
  { value: 'FRIDAY', label: '금' },
  { value: 'SATURDAY', label: '토' },
  { value: 'SUNDAY', label: '일' },
]

const state = reactive({
  seats: [],
  facilityId: '',
  seatScope: 'facility',
  seatId: '',
  // 'single' | 'closure-rule'
  blockMode: 'single',
  // 단일 모드
  blockDate: '',
  // 정기 휴무 모드
  ruleType: 'WEEKLY',         // 'WEEKLY' | 'MONTHLY_NTH'
  daysOfWeek: [],             // 선택된 요일 목록
  weekOrdinals: [],           // MONTHLY_NTH 전용: 선택된 주차 목록
  validFrom: '',
  validUntil: '',
  // 공통
  fullDay: false,
  startTime: '09:00',
  endTime: '18:00',
  reason: '',
  loadingSeats: false,
  submitting: false,
  errorMessage: '',
})

// 단건 차단 수정 모드 여부
const isEditMode = computed(() => !!props.editItem)
// 정기 휴무 규칙 수정 모드 여부
const isEditClosureRule = computed(() => !!props.editClosureRule)

const selectedFacility = computed(() =>
  props.facilities.find((f) => String(f.facilityId) === String(state.facilityId)) || null,
)

const normalizeReservationType = (type) => {
  const value = String(type || '').trim()
  if (value === '좌석형') return 'SEAT'
  if (value === '정원형') return 'COUNT'
  if (value === '승인형') return 'APPROVAL'
  return value
}

const isSeatFacility = computed(
  () => normalizeReservationType(selectedFacility.value?.reservationType) === 'SEAT',
)

const toSecondTime = (time) => {
  if (!time) return null
  return time.length === 5 ? `${time}:00` : time
}

const resetModeFields = () => {
  state.blockDate = ''
  state.ruleType = 'WEEKLY'
  state.daysOfWeek = []
  state.weekOrdinals = []
  state.validFrom = ''
  state.validUntil = ''
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
  } catch {
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

const toggleDay = (day) => {
  const idx = state.daysOfWeek.indexOf(day)
  if (idx === -1) state.daysOfWeek.push(day)
  else state.daysOfWeek.splice(idx, 1)
}

// 주차 토글 (MONTHLY_NTH 전용)
const toggleOrdinal = (ordinal) => {
  const idx = state.weekOrdinals.indexOf(ordinal)
  if (idx === -1) state.weekOrdinals.push(ordinal)
  else state.weekOrdinals.splice(idx, 1)
}

// 정기 휴무 규칙 유효성 검사
const validateClosureRule = () => {
  if (!state.facilityId) return '시설을 선택해주세요.'
  if (state.daysOfWeek.length === 0) return '적용 요일을 하나 이상 선택해주세요.'
  if (state.ruleType === 'MONTHLY_NTH' && state.weekOrdinals.length === 0)
    return '몇 번째 주인지 선택해주세요.'
  if (!state.fullDay && (!state.startTime || !state.endTime)) return '차단 시간을 입력해주세요.'
  if (state.validFrom && state.validUntil && state.validFrom > state.validUntil)
    return '종료일은 시작일 이후여야 합니다.'
  if (isSeatFacility.value && state.seatScope === 'seat' && !state.seatId)
    return '차단할 좌석을 선택해주세요.'
  return ''
}

const validateSingle = () => {
  if (!state.facilityId) return '시설을 선택해주세요.'
  if (!state.blockDate) return '차단일을 선택해주세요.'
  if (!state.fullDay && (!state.startTime || !state.endTime)) return '차단 시간을 입력해주세요.'
  if (isSeatFacility.value && state.seatScope === 'seat' && !state.seatId)
    return '차단할 좌석을 선택해주세요.'
  return ''
}


const submitBlockTime = async () => {
  // 모드별 유효성 검사
  const error = state.blockMode === 'closure-rule'
    ? validateClosureRule()
    : isEditMode.value || state.blockMode === 'single'
      ? validateSingle()
      : validateSingle()
  if (error) {
    state.errorMessage = error
    return
  }

  state.submitting = true
  state.errorMessage = ''

  const seatId = isSeatFacility.value && state.seatScope === 'seat' ? state.seatId : null

  try {
    if (state.blockMode === 'closure-rule') {
      // 정기 휴무 규칙 등록 또는 수정
      const body = {
        ruleType: state.ruleType,
        daysOfWeek: [...state.daysOfWeek],
        weekOrdinals: state.ruleType === 'MONTHLY_NTH' ? [...state.weekOrdinals] : [],
        startTime: state.fullDay ? null : toSecondTime(state.startTime),
        endTime: state.fullDay ? null : toSecondTime(state.endTime),
        validFrom: state.validFrom || null,
        validUntil: state.validUntil || null,
        reason: String(state.reason || '').trim(),
        seatId,
      }
      if (isEditClosureRule.value) {
        await facilityStore.updateClosureRule(state.facilityId, props.editClosureRule.closureRuleId, body)
        emit('rule-saved', '수정')
      } else {
        await facilityStore.createClosureRule(state.facilityId, body)
        emit('rule-saved', '등록')
      }
    } else if (isEditMode.value) {
      // 단건 차단 수정
      await facilityStore.updateFacilityBlockTime(
        state.facilityId,
        props.editItem.facilityBlockTimeId,
        {
          blockDate: state.blockDate,
          startTime: state.fullDay ? null : toSecondTime(state.startTime),
          endTime: state.fullDay ? null : toSecondTime(state.endTime),
        },
      )
      emit('saved', selectedFacility.value?.name || '선택 시설', '차단 시간이 수정되었습니다.')
    } else {
      // 단건 차단 등록
      await facilityStore.createFacilityBlockTime(state.facilityId, {
        blockDate: state.blockDate,
        startTime: state.fullDay ? null : toSecondTime(state.startTime),
        endTime: state.fullDay ? null : toSecondTime(state.endTime),
        reason: String(state.reason || '').trim(),
        seatId,
      })
      emit('saved', selectedFacility.value?.name || '선택 시설', null)
    }
    resetModeFields()
  } catch (e) {
    state.errorMessage =
      e?.response?.data?.resultMessage ||
      e?.response?.data?.message ||
      '처리 중 오류가 발생했습니다.'
  } finally {
    state.submitting = false
  }
}

watch(
  () => state.blockMode,
  () => {
    if (!isEditMode.value && !isEditClosureRule.value) resetModeFields()
  },
)

// 단건 수정 모드: editItem으로 폼 프리필
watch(
  () => props.editItem,
  (item) => {
    if (!item) return
    state.facilityId = String(item.facilityId || '')
    state.blockMode = 'single'
    state.blockDate = item.blockDate || ''
    state.fullDay = !item.startTime && !item.endTime
    state.startTime = item.startTime ? String(item.startTime).slice(0, 5) : '09:00'
    state.endTime = item.endTime ? String(item.endTime).slice(0, 5) : '18:00'
    state.reason = item.reason || ''
    state.seatId = item.seatId || ''
    state.seatScope = item.seatId ? 'seat' : 'facility'
    fetchSeats()
  },
  { immediate: true },
)

// 정기 휴무 규칙 수정 모드: editClosureRule로 폼 프리필
watch(
  () => props.editClosureRule,
  (rule) => {
    if (!rule) return
    state.facilityId = String(rule.facilityId || '')
    state.blockMode = 'closure-rule'
    state.ruleType = rule.ruleType || 'WEEKLY'
    state.daysOfWeek = Array.isArray(rule.daysOfWeek) ? [...rule.daysOfWeek] : []
    state.weekOrdinals = Array.isArray(rule.weekOrdinals) ? [...rule.weekOrdinals] : []
    state.fullDay = !rule.startTime && !rule.endTime
    state.startTime = rule.startTime ? String(rule.startTime).slice(0, 5) : '09:00'
    state.endTime = rule.endTime ? String(rule.endTime).slice(0, 5) : '18:00'
    state.validFrom = rule.validFrom || ''
    state.validUntil = rule.validUntil || ''
    state.reason = rule.reason || ''
    state.seatId = rule.seatId || ''
    state.seatScope = rule.seatId ? 'seat' : 'facility'
    fetchSeats()
  },
  { immediate: true },
)

watch(
  () => props.initialFacilityId,
  (facilityId) => {
    if (!state.facilityId && facilityId && !props.editItem && !props.editClosureRule) {
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
        <h3>
          {{
            isEditClosureRule
              ? '정기 휴무 수정'
              : isEditMode
                ? '차단 시간 수정'
                : state.blockMode === 'closure-rule'
                  ? '정기 휴무 등록'
                  : '차단 시간 등록'
          }}
        </h3>
        <p>
          {{
            isEditClosureRule
              ? '정기 휴무 규칙을 수정합니다.'
              : isEditMode
                ? '차단일과 시간을 수정합니다.'
                : state.blockMode === 'closure-rule'
                  ? '매주 또는 매월 N번째 요일에 반복되는 휴무를 설정합니다.'
                  : '시설 전체 또는 좌석별 예약 차단 시간을 등록합니다.'
          }}
        </p>
      </div>
      <button class="btn-secondary" type="button" @click="emit('cancel')">목록으로</button>
    </div>

    <!-- 등록 모드 선택: 수정 모드에서는 숨김 -->
    <div v-if="!isEditMode && !isEditClosureRule" class="mode-tabs">
      <button
        :class="['mode-tab', { active: state.blockMode === 'single' }]"
        type="button"
        @click="state.blockMode = 'single'"
      >
        임시 차단
      </button>
      <button
        :class="['mode-tab', { active: state.blockMode === 'closure-rule' }]"
        type="button"
        @click="state.blockMode = 'closure-rule'"
      >
        정기 휴무
      </button>
    </div>

    <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

    <div class="form-grid">
      <!-- 시설 선택: 수정 모드에서는 비활성 -->
      <label class="form-field form-field--wide">
        <span>시설 선택</span>
        <select
          v-model="state.facilityId"
          :disabled="isEditMode || isEditClosureRule"
          @change="changeFacility"
        >
          <option value="" disabled>시설을 선택해주세요.</option>
          <option v-for="facility in facilities" :key="facility.facilityId" :value="facility.facilityId">
            {{ facility.name }}
          </option>
        </select>
      </label>

      <!-- 차단 대상 (좌석형만, 수정 모드에서는 비활성) -->
      <div v-if="isSeatFacility && !isEditMode" class="form-field form-field--wide">
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

      <label
        v-if="isSeatFacility && state.seatScope === 'seat' && !isEditMode"
        class="form-field form-field--wide"
      >
        <span>좌석 선택</span>
        <select v-model="state.seatId" :disabled="state.loadingSeats">
          <option value="" disabled>좌석을 선택해주세요.</option>
          <option v-for="seat in state.seats" :key="seat.seatId" :value="seat.seatId">
            {{ seat.seatNo }}번 {{ seat.seatName }}
          </option>
        </select>
      </label>

      <!-- 단일 모드 / 수정 모드: 차단일 -->
      <template v-if="isEditMode || state.blockMode === 'single'">
        <label class="form-field">
          <span>차단일</span>
          <input v-model="state.blockDate" type="date" />
        </label>
        <label class="check-row">
          <input v-model="state.fullDay" type="checkbox" />
          <span>하루종일</span>
        </label>
      </template>

      <!-- 정기 휴무 모드: 규칙 유형 + 요일 + 주차 + 기간 -->
      <template v-if="isEditClosureRule || (!isEditMode && state.blockMode === 'closure-rule')">
        <!-- 규칙 유형: 매주 / 매월 N번째 -->
        <div class="form-field form-field--wide">
          <span>규칙 유형</span>
          <div class="mode-tabs mode-tabs--inline">
            <button
              :class="['mode-tab', { active: state.ruleType === 'WEEKLY' }]"
              type="button"
              @click="state.ruleType = 'WEEKLY'"
            >
              매주
            </button>
            <button
              :class="['mode-tab', { active: state.ruleType === 'MONTHLY_NTH' }]"
              type="button"
              @click="state.ruleType = 'MONTHLY_NTH'"
            >
              매월 N번째
            </button>
          </div>
        </div>

        <!-- 적용 요일 -->
        <div class="form-field form-field--wide">
          <span>적용 요일</span>
          <div class="days-grid">
            <button
              v-for="day in DAYS_OF_WEEK"
              :key="day.value"
              type="button"
              :class="['day-chip', { active: state.daysOfWeek.includes(day.value) }]"
              @click="toggleDay(day.value)"
            >
              {{ day.label }}
            </button>
          </div>
        </div>

        <!-- MONTHLY_NTH 전용: 몇 번째 주 선택 -->
        <div v-if="state.ruleType === 'MONTHLY_NTH'" class="form-field form-field--wide">
          <span>주차 선택 (해당 월의 몇 번째 주)</span>
          <div class="days-grid">
            <button
              v-for="ord in WEEK_ORDINALS"
              :key="ord.value"
              type="button"
              :class="['day-chip', 'day-chip--wide', { active: state.weekOrdinals.includes(ord.value) }]"
              @click="toggleOrdinal(ord.value)"
            >
              {{ ord.label }}
            </button>
          </div>
        </div>

        <!-- 유효 기간 (선택사항) -->
        <label class="form-field">
          <span>적용 시작일 <span class="optional">(선택)</span></span>
          <input v-model="state.validFrom" type="date" />
        </label>
        <label class="form-field">
          <span>적용 종료일 <span class="optional">(선택)</span></span>
          <input v-model="state.validUntil" type="date" />
        </label>

        <!-- 하루종일 체크 -->
        <label class="check-row check-row--batch">
          <input v-model="state.fullDay" type="checkbox" />
          <span>하루종일</span>
        </label>
      </template>

      <!-- 시간 (공통) -->
      <label class="form-field">
        <span>시작 시간</span>
        <input v-model="state.startTime" type="time" :disabled="state.fullDay" />
      </label>
      <label class="form-field">
        <span>종료 시간</span>
        <input v-model="state.endTime" type="time" :disabled="state.fullDay" />
      </label>

      <!-- 차단 사유 (수정 모드에서는 읽기 전용 — 사유는 수정 불가) -->
      <label class="form-field form-field--wide">
        <span>차단 사유</span>
        <input
          v-model="state.reason"
          type="text"
          placeholder="예: 정기 점검"
          :disabled="isEditMode"
        />
      </label>
    </div>

    <div class="button-row">
      <button class="btn-secondary" type="button" @click="emit('cancel')">취소</button>
      <button class="btn-primary" type="button" :disabled="state.submitting" @click="submitBlockTime">
        {{
          state.submitting
            ? isEditClosureRule || state.blockMode === 'closure-rule'
              ? isEditClosureRule ? '수정 중...' : '등록 중...'
              : isEditMode ? '수정 중...' : '등록 중...'
            : isEditClosureRule
              ? '정기 휴무 수정'
              : isEditMode
                ? '차단 시간 수정'
                : state.blockMode === 'closure-rule'
                  ? '정기 휴무 등록'
                  : '차단 시간 등록'
        }}
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

/* ── 모드 탭 ─────────────────────────────────── */
.mode-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border: 1px solid #d7dee8;
  border-radius: 8px;
  overflow: hidden;
  width: fit-content;
}

.mode-tab {
  padding: 8px 20px;
  border: none;
  background: #f8fafc;
  color: #718096;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}

.mode-tab + .mode-tab {
  border-left: 1px solid #d7dee8;
}

.mode-tab.active {
  background: #2b3a55;
  color: #ffffff;
}

/* ── 폼 그리드 ───────────────────────────────── */
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
  font-family: 'Noto Sans KR', sans-serif;
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

.check-row--batch {
  grid-column: 1 / -1;
}

/* ── 인라인 모드 탭 (규칙 유형) ──────────────── */
.mode-tabs--inline {
  width: fit-content;
}

/* ── 요일 선택 ───────────────────────────────── */
.days-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.day-chip {
  width: 42px;
  height: 42px;
  border: 1px solid #d7dee8;
  border-radius: 8px;
  background: #f8fafc;
  color: #718096;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}

.day-chip:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #2b3a55;
}

.day-chip.active {
  background: #2b3a55;
  border-color: #2b3a55;
  color: #ffffff;
}

/* 주차 칩: 더 넓은 너비 */
.day-chip--wide {
  width: auto;
  min-width: 56px;
  padding: 0 10px;
}

/* 선택 항목 옵션 표시 */
.optional {
  font-weight: 400;
  color: #a0aec0;
  font-size: 12px;
}

/* ── 버튼 ─────────────────────────────────────── */
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
  font-family: 'Noto Sans KR', sans-serif;
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
