<script setup>
import { inject, onMounted, onUnmounted, reactive } from 'vue'
import { useGxStore } from '@/stores/useGxStore.js'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { toList } from '@/utils/apiResponse'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const gxStore = useGxStore()
const facilityStore = useFacilityStore()
const registerOpenModal = inject('registerOpenModal', () => {})

const DAY_OPTIONS = [
  { value: 'MONDAY', label: '월' },
  { value: 'TUESDAY', label: '화' },
  { value: 'WEDNESDAY', label: '수' },
  { value: 'THURSDAY', label: '목' },
  { value: 'FRIDAY', label: '금' },
  { value: 'SATURDAY', label: '토' },
  { value: 'SUNDAY', label: '일' },
]

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'OPEN', label: '모집중' },
  { value: 'CLOSED', label: '종료' },
  { value: 'CANCELLED', label: '취소됨' },
]

const state = reactive({
  list: [],
  gxFacilities: [],
  selectedFacilityId: '',
  selectedStatus: '',
  loading: false,
  submitting: false,
  errorMessage: '',
  mode: 'list', // 'list' | 'create' | 'edit'
  editTarget: null,
})

const form = reactive({
  facilityId: '',
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  daysOfWeek: [],  // UI 체크박스용 배열 → API 전송 시 쉼표 구분 문자열
  maxCount: '',
  minCount: '',
  baseFee: 0,
  waitingEnabled: false,
  error: '',
})

const cancelModal = reactive({
  show: false,
  loading: false,
  target: null,
})

const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
})

// 상태 표시 레이블 (WAITING_CLOSED 포함)
const statusLabel = (status) => {
  return {
    OPEN: '모집중',
    WAITING_CLOSED: '모집마감',
    CLOSED: '종료',
    CANCELLED: '취소됨',
  }[status] || status || '-'
}

// 상태 CSS 클래스
const statusClass = (status) => {
  return {
    OPEN: 'status--open',
    WAITING_CLOSED: 'status--waiting-closed',
    CLOSED: 'status--closed',
    CANCELLED: 'status--cancelled',
  }[status] || ''
}

// ── stacked bar (GX 확정율 기준) ─────────────────────────────

// 비율에 따른 bar 메인 색상
const getBarColor = (ratio) => {
  if (ratio >= 80) return '#E53E3E'
  if (ratio >= 40) return '#ED8936'
  return '#48BB78'
}

// 비율에 따른 잔여 배경색
const getRemainingColor = (ratio) => {
  if (ratio >= 80) return '#FED7D7'
  if (ratio >= 50) return '#FEEBC8'
  return '#C6F6D5'
}

// 확정 인원 비율 (0~100)
const getGxConfirmedRatio = (program) => {
  if (!program.maxCount) return 0
  const confirmed = program.confirmedCount ?? 0
  return Math.min(Math.round((confirmed / program.maxCount) * 100), 100)
}

// daysOfWeek 값(배열 또는 쉼표 문자열) → 한글 레이블 변환
const dayLabel = (daysOfWeek) => {
  if (!daysOfWeek || (Array.isArray(daysOfWeek) && daysOfWeek.length === 0)) return '-'
  const arr = Array.isArray(daysOfWeek)
    ? daysOfWeek
    : String(daysOfWeek).split(',').map((d) => d.trim()).filter(Boolean)
  return arr.map((d) => DAY_OPTIONS.find((opt) => opt.value === d)?.label || d).join(' ') || '-'
}

// facilityId → 시설명
const facilityNameById = (facilityId) => {
  const f = state.gxFacilities.find((f) => String(f.facilityId) === String(facilityId))
  return f?.name || `시설 ${facilityId}`
}

// GX 시설 목록 조회 (facilityStore 재활용, 새 API 추가 없음)
const fetchGxFacilities = async () => {
  try {
    if (!facilityStore.facilityTypes.length) {
      await facilityStore.fetchFacilityTypes()
    }
    const gxType = facilityStore.facilityTypes.find((t) => t.typeCode === 'GX')
    const gxTypeId = gxType?.typeId

    const result = await facilityStore.fetchAdminFacilities()
    const all = toList(result)

    state.gxFacilities = all
      .map((f) => ({
        ...f,
        facilityId: f.facilityId ?? f.facilityUid ?? f.id,
        typeId: f.typeId ?? f.facilityTypeId ?? f.type?.id,
      }))
      .filter((f) => gxTypeId && String(f.typeId) === String(gxTypeId))
  } catch (e) {
    console.error('GX 시설 목록 조회 실패:', e)
  }
}

// GX 프로그램 목록 조회
const fetchList = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const params = {
      facilityId: state.selectedFacilityId || undefined,
      status: state.selectedStatus || undefined,
    }
    const result = await gxStore.fetchAdminGxPrograms(params)
    state.list = toList(result)
  } catch (e) {
    state.errorMessage =
      e.response?.data?.resultMessage || e.response?.data?.message || 'GX 프로그램 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

// 폼 초기화
const resetForm = () => {
  form.facilityId = state.gxFacilities[0]?.facilityId ?? ''
  form.name = ''
  form.description = ''
  form.startDate = ''
  form.endDate = ''
  form.startTime = ''
  form.endTime = ''
  form.daysOfWeek = []
  form.maxCount = ''
  form.minCount = ''
  form.baseFee = 0
  form.waitingEnabled = false
  form.error = ''
}

// 등록 모드로 전환
const openCreate = () => {
  resetForm()
  state.editTarget = null
  state.mode = 'create'
}

// 수정 모드로 전환
const openEdit = (program) => {
  state.editTarget = program
  form.facilityId = String(program.facilityId ?? '')
  form.name = program.name ?? ''
  form.description = program.description ?? ''
  form.startDate = program.startDate ?? ''
  form.endDate = program.endDate ?? ''
  form.startTime = program.startTime ? String(program.startTime).slice(0, 5) : ''
  form.endTime = program.endTime ? String(program.endTime).slice(0, 5) : ''
  form.daysOfWeek = program.daysOfWeek
    ? program.daysOfWeek.split(',').map((d) => d.trim()).filter(Boolean)
    : []
  form.maxCount = program.maxCount ?? ''
  form.minCount = program.minCount ?? ''
  form.baseFee = program.baseFee ?? 0
  form.waitingEnabled = !!program.waitingEnabled
  form.error = ''
  state.mode = 'edit'
}

// 목록으로 복귀
const cancelMode = () => {
  state.mode = 'list'
  state.editTarget = null
}

// 등록 / 수정 제출
const handleSubmit = async () => {
  if (state.mode === 'create' && !form.facilityId) {
    form.error = 'GX 시설을 선택해주세요.'
    return
  }
  if (!form.name.trim()) {
    form.error = '프로그램명을 입력해주세요.'
    return
  }
  form.error = ''
  state.submitting = true

  const payload = {
    name: form.name.trim(),
    description: String(form.description || '').trim(),
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
    daysOfWeek: form.daysOfWeek.length ? form.daysOfWeek.join(',') : null,
    maxCount: form.maxCount !== '' ? Number(form.maxCount) : null,
    minCount: form.minCount !== '' ? Number(form.minCount) : null,
    baseFee: Number(form.baseFee || 0),
    waitingEnabled: !!form.waitingEnabled,
  }

  try {
    if (state.mode === 'create') {
      await gxStore.createGxProgram({ ...payload, facilityId: form.facilityId })
      resultModal.type = 'success'
      resultModal.title = 'GX 프로그램이 등록되었습니다.'
      resultModal.subtitle = `${form.name} 프로그램이 추가되었습니다.`
    } else {
      await gxStore.updateGxProgram(state.editTarget.programId, payload)
      resultModal.type = 'success'
      resultModal.title = 'GX 프로그램이 수정되었습니다.'
      resultModal.subtitle = `${form.name} 정보가 업데이트되었습니다.`
    }
    resultModal.show = true
    state.mode = 'list'
    await fetchList()
  } catch (e) {
    form.error =
      e.response?.data?.resultMessage || e.response?.data?.message || '저장 중 오류가 발생했습니다.'
  } finally {
    state.submitting = false
  }
}

// 취소 확인 모달 열기
const openCancelConfirm = (program) => {
  cancelModal.target = program
  cancelModal.show = true
}

// GX 프로그램 취소 실행
const handleCancelProgram = async () => {
  if (!cancelModal.target) return
  cancelModal.loading = true
  try {
    await gxStore.cancelGxProgram(cancelModal.target.programId, { reason: '' })
    cancelModal.show = false
    resultModal.type = 'success'
    resultModal.title = 'GX 프로그램이 취소되었습니다.'
    resultModal.subtitle = `${cancelModal.target.name} 운영이 취소되었습니다.`
    resultModal.show = true
    cancelModal.target = null
    await fetchList()
  } catch (e) {
    cancelModal.show = false
    cancelModal.target = null
    resultModal.type = 'danger'
    resultModal.title = '취소에 실패했습니다.'
    resultModal.subtitle =
      e.response?.data?.resultMessage || e.response?.data?.message || '잠시 후 다시 시도해주세요.'
    resultModal.show = true
  } finally {
    cancelModal.loading = false
  }
}

onMounted(async () => {
  registerOpenModal(openCreate)
  await fetchGxFacilities()
  await fetchList()
})

onUnmounted(() => {
  registerOpenModal(null)
})
</script>

<template>
  <section class="gx-program">
    <!-- 등록 / 수정 폼 -->
    <template v-if="state.mode === 'create' || state.mode === 'edit'">
      <article class="panel">
        <div class="panel-header">
          <div>
            <h3>{{ state.mode === 'create' ? 'GX 프로그램 등록' : 'GX 프로그램 수정' }}</h3>
            <p>{{ state.mode === 'create' ? 'GX 시설에 새 프로그램을 등록합니다.' : '프로그램 정보를 수정합니다.' }}</p>
          </div>
          <button class="btn-secondary" type="button" @click="cancelMode">목록으로</button>
        </div>

        <div v-if="form.error" class="error-box">{{ form.error }}</div>

        <div class="form-grid">
          <!-- 등록 시에만 시설 선택 -->
          <label v-if="state.mode === 'create'" class="form-field form-field--wide">
            <span>GX 시설 *</span>
            <select v-model="form.facilityId">
              <option value="" disabled>시설을 선택해주세요.</option>
              <option
                v-for="f in state.gxFacilities"
                :key="f.facilityId"
                :value="f.facilityId"
              >
                {{ f.name }}
              </option>
            </select>
            <span v-if="state.gxFacilities.length === 0" class="field-hint">
              GX 타입으로 등록된 시설이 없습니다.
            </span>
          </label>

          <label v-else class="form-field form-field--wide">
            <span>GX 시설</span>
            <input :value="facilityNameById(state.editTarget?.facilityId)" type="text" disabled />
          </label>

          <label class="form-field form-field--wide">
            <span>프로그램명 *</span>
            <input v-model="form.name" type="text" placeholder="예: 요가 기초반" />
          </label>

          <label class="form-field form-field--wide">
            <span>설명</span>
            <input v-model="form.description" type="text" placeholder="프로그램에 대한 간단한 설명" />
          </label>

          <label class="form-field">
            <span>운영 시작일</span>
            <input v-model="form.startDate" type="date" />
          </label>

          <label class="form-field">
            <span>운영 종료일</span>
            <input v-model="form.endDate" type="date" />
          </label>

          <label class="form-field">
            <span>시작 시간</span>
            <input v-model="form.startTime" type="time" />
          </label>

          <label class="form-field">
            <span>종료 시간</span>
            <input v-model="form.endTime" type="time" />
          </label>

          <div class="form-field form-field--wide">
            <span>운영 요일</span>
            <div class="day-check-row">
              <label
                v-for="day in DAY_OPTIONS"
                :key="day.value"
                class="day-check"
                :class="{ 'is-selected': form.daysOfWeek.includes(day.value) }"
              >
                <input v-model="form.daysOfWeek" type="checkbox" :value="day.value" />
                {{ day.label }}
              </label>
            </div>
          </div>

          <label class="form-field">
            <span>최소 인원</span>
            <div class="input-suffix-wrap">
              <input v-model="form.minCount" type="number" placeholder="0" min="0" />
              <span class="input-suffix">명</span>
            </div>
          </label>

          <label class="form-field">
            <span>최대 정원</span>
            <div class="input-suffix-wrap">
              <input v-model="form.maxCount" type="number" placeholder="0" min="1" />
              <span class="input-suffix">명</span>
            </div>
          </label>

          <label class="form-field">
            <span>프로그램 요금</span>
            <div class="input-suffix-wrap">
              <input v-model="form.baseFee" type="number" placeholder="0" min="0" />
              <span class="input-suffix">원</span>
            </div>
          </label>

          <label class="form-field toggle-row">
            <span>대기 신청 허용</span>
            <input v-model="form.waitingEnabled" type="checkbox" />
          </label>
        </div>

        <div class="button-row">
          <button class="btn-secondary" type="button" @click="cancelMode">취소</button>
          <button
            class="btn-primary"
            type="button"
            :disabled="state.submitting"
            @click="handleSubmit"
          >
            {{ state.submitting ? '저장 중...' : state.mode === 'create' ? '등록하기' : '수정완료' }}
          </button>
        </div>
      </article>
    </template>

    <!-- 목록 화면 -->
    <template v-else>
      <article class="panel">
        <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

        <!-- 필터 -->
        <div class="search-row">
          <label class="form-field">
            <span>GX 시설</span>
            <select v-model="state.selectedFacilityId" @change="fetchList">
              <option value="">전체</option>
              <option
                v-for="f in state.gxFacilities"
                :key="f.facilityId"
                :value="f.facilityId"
              >
                {{ f.name }}
              </option>
            </select>
          </label>

          <label class="form-field">
            <span>상태</span>
            <select v-model="state.selectedStatus" @change="fetchList">
              <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label>

          <div class="search-actions">
            <button class="btn-secondary" type="button" @click="fetchList">조회</button>
          </div>
        </div>

        <!-- 로딩 -->
        <div v-if="state.loading" class="empty-box">목록을 불러오는 중...</div>

        <!-- 카드 그리드 -->
        <div v-else class="program-grid">
          <div
            v-for="program in state.list"
            :key="program.programId"
            class="program-card"
          >
            <!-- 카드 헤더 -->
            <div class="card-header">
              <div class="card-title-wrap">
                <div class="card-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
                  </svg>
                </div>
                <div>
                  <div class="card-name">{{ program.name }}</div>
                  <div class="card-id">{{ facilityNameById(program.facilityId) }}</div>
                </div>
              </div>
              <span :class="['status-badge', statusClass(program.status)]">
                {{ statusLabel(program.status) }}
              </span>
            </div>

            <!-- 카드 본문 -->
            <div class="card-body">
              <!-- 기간 + 운영 시간 -->
              <div class="card-info-row">
                <div class="card-info">
                  <span class="info-label">기간</span>
                  <span class="info-value">
                    {{ program.startDate ? program.startDate.slice(5) : '-' }}
                    ~ {{ program.endDate ? program.endDate.slice(5) : '-' }}
                  </span>
                </div>
                <div class="card-info">
                  <span class="info-label">시간</span>
                  <span class="info-value">
                    {{ program.startTime ? String(program.startTime).slice(0, 5) : '-' }}
                    ~ {{ program.endTime ? String(program.endTime).slice(0, 5) : '-' }}
                  </span>
                </div>
              </div>
              <!-- 운영 요일 + 정원 -->
              <div class="card-info-row">
                <div class="card-info">
                  <span class="info-label">요일</span>
                  <span class="info-value">{{ dayLabel(program.daysOfWeek) }}</span>
                </div>
                <div class="card-info">
                  <span class="info-label">정원</span>
                  <span class="info-value">
                    {{ program.maxCount ?? '-' }}명
                    <span v-if="program.minCount" class="info-min">(최소 {{ program.minCount }}명)</span>
                  </span>
                </div>
              </div>

              <!-- 확정율 stacked bar -->
              <div class="stacked-bar-wrap">
                <div class="stacked-bar">
                  <div
                    class="bar-segment bar-reserved"
                    :style="{
                      width: getGxConfirmedRatio(program) + '%',
                      background: getBarColor(getGxConfirmedRatio(program)),
                    }"
                  ></div>
                  <div
                    class="bar-segment bar-remaining"
                    :style="{
                      width: (100 - getGxConfirmedRatio(program)) + '%',
                      background: getRemainingColor(getGxConfirmedRatio(program)),
                    }"
                  ></div>
                </div>
                <div class="stacked-bar-legend">
                  <span class="legend-item">
                    <span class="legend-dot" :style="{ background: getBarColor(getGxConfirmedRatio(program)) }"></span>
                    확정 {{ program.confirmedCount ?? 0 }} / {{ program.maxCount ?? '-' }}명 ({{ getGxConfirmedRatio(program) }}%)
                  </span>
                  <span class="legend-item">
                    <span class="legend-dot" style="background: #F6E05E"></span>
                    대기 {{ program.waitingCount ?? 0 }}명
                  </span>
                </div>
              </div>
            </div>

            <!-- 카드 액션 -->
            <div class="card-actions">
              <button
                class="btn-card-action"
                type="button"
                :disabled="program.status === 'CANCELLED' || program.status === 'CLOSED'"
                @click="openEdit(program)"
              >
                수정
              </button>
              <button
                class="btn-card-action btn-card-action--danger"
                type="button"
                :disabled="program.status === 'CANCELLED'"
                @click="openCancelConfirm(program)"
              >
                취소
              </button>
            </div>
          </div>

          <div v-if="state.list.length === 0" class="empty-box">
            등록된 GX 프로그램이 없습니다.
          </div>
        </div>
      </article>
    </template>

    <!-- 취소 확인 모달 -->
    <ConfirmModal
      :visible="cancelModal.show"
      title="GX 프로그램을 취소하시겠습니까?"
      subtitle="취소 후에는 신청자에게 취소 안내가 전달됩니다."
      subtitle-color="#e53e3e"
      item-label="프로그램명"
      :item-name="cancelModal.target?.name"
      confirm-text="취소 처리"
      confirm-type="danger"
      :loading="cancelModal.loading"
      @confirm="handleCancelProgram"
      @cancel="cancelModal.show = false"
    />

    <!-- 처리 결과 모달 -->
    <ActionResultModal
      :visible="resultModal.show"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      confirm-text="확인"
      @close="resultModal.show = false"
    />
  </section>
</template>

<style scoped>
.gx-program {
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

/* 필터 행 */
.search-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 18px;
}

.search-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

/* 폼 그리드 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
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

.form-field input:disabled {
  background: #f5f6f8;
  color: #a0aec0;
}

.field-hint {
  font-size: 11px;
  font-weight: 400;
  color: #a0aec0;
}

/* 요일 체크박스 */
.day-check-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.day-check {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #d7dee8;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.day-check input {
  display: none;
}

.day-check.is-selected {
  background: #1e2a3e;
  border-color: #1e2a3e;
  color: #ffffff;
}

/* 토글 행 */
.toggle-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 11px 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.toggle-row input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* 숫자 인풋 suffix */
.input-suffix-wrap {
  position: relative;
}

.input-suffix-wrap input {
  padding-right: 36px;
}

.input-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #a0aec0;
  font-weight: 400;
}

/* 버튼 */
.btn-primary,
.btn-secondary {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-primary {
  border: 0;
  background: #1e2a3e;
  color: #ffffff;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-secondary {
  border: 1px solid #d7dee8;
  background: #ffffff;
  color: #2b3a55;
}

.button-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

/* ── 카드 그리드 ── */
.program-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.program-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #fff;
  transition: box-shadow 0.15s;
}

.program-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-color: #2b3a55;
}

/* 카드 헤더 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon {
  width: 36px;
  height: 36px;
  background: #f0f4ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2b3a55;
  flex-shrink: 0;
}

.card-name { font-size: 15px; font-weight: 700; color: #1e2a3e; }
.card-id { font-size: 11px; color: #687282; margin-top: 2px; }

/* 상태 배지 */
.status-badge {
  flex-shrink: 0;
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.status--open { background: #ebf5ee; color: #4d8b5a; }
.status--waiting-closed { background: #fefcbf; color: #b7791f; }
.status--closed { background: #e2e8f0; color: #4a5568; }
.status--cancelled { background: #fff5f5; color: #e53e3e; }

/* 카드 본문 */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-info-row {
  display: flex;
  gap: 20px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.info-label { font-size: 11px; color: #687282; }
.info-value { font-size: 13px; font-weight: 600; color: #1a202c; }
.info-min { font-size: 11px; font-weight: 400; color: #a0aec0; }

/* ── stacked bar ── */
.stacked-bar-wrap { display: flex; flex-direction: column; gap: 6px; }
.stacked-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: #e2e8f0;
}
.bar-segment { transition: width 0.4s ease, background 0.4s ease; }
.bar-reserved { border-radius: 4px; }
.bar-remaining { border-radius: 0 4px 4px 0; }
.bar-reserved:only-child { border-radius: 4px; }
.bar-remaining:first-child { border-radius: 4px; }
.stacked-bar-legend { display: flex; gap: 10px; flex-wrap: wrap; }
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #718096;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
  transition: background 0.4s ease;
}

/* 카드 액션 */
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: auto;
}

.btn-card-action {
  height: 30px;
  padding: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  color: #4a5568;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-card-action:hover:not(:disabled) { background: #f5f6f8; }
.btn-card-action--danger { color: #e53e3e; border-color: #fecaca; }
.btn-card-action--danger:hover:not(:disabled) { background: #fff5f5; }
.btn-card-action:disabled { opacity: 0.4; cursor: not-allowed; }

/* 공통 */
.error-box {
  margin-bottom: 14px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
}

.empty-box {
  padding: 32px;
  text-align: center;
  color: #7b8ea8;
  font-size: 13px;
  background: #f8fafc;
  border-radius: 10px;
}

@media (max-width: 1100px) {
  .program-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .program-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .search-row {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .program-grid {
    grid-template-columns: 1fr;
  }
}
</style>
