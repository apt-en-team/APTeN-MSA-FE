<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { useAuthStore } from '@/stores/useAuthStore.js'
import { toList } from '@/utils/apiResponse'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const facilityStore = useFacilityStore()
const authStore = useAuthStore()

const getCurrentTimeText = () =>
  new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })

const getCurrentActorName = () =>
  authStore.userInfo?.name || authStore.user?.name || authStore.name || '관리자'

const state = reactive({
  facilities: [],
  policiesMap: {},
  facilityId: '',
  editing: false,
  baseFee: 0,
  usageUnitType: 'MINUTE',
  slotMin: 60,
  cancelDeadlineHours: 2,
  maxReservationCount: '',
  feeType: 'FLAT',
  includedPersonCount: '',
  extraPersonFee: 0,
  subscribeCutoffDay: '',  // 신청 기준일 (null이면 항상 당월 청구)
  cancelCutoffDay: '',     // 해지 기준일 (null이면 항상 당월 청구)
  loading: false,
  submitting: false,
  errorMessage: '',
})

const confirmModal = reactive({
  show: false,
  loading: false,
})

const resultModal = reactive({
  show: false,
  type: 'success',
  title: '',
  subtitle: '',
  desc: '',
  itemName: '',
  time: '',
  actionLabel: '',
  actor: '',
  afterConfirm: null,
})

const openResultModal = ({
  type = 'success', title, subtitle = '', desc = '',
  itemName = '', time = '', actionLabel = '', actor = '', afterConfirm = null,
} = {}) => {
  Object.assign(resultModal, { show: true, type, title, subtitle, desc, itemName, time, actionLabel, actor, afterConfirm })
}

const handleResultConfirm = async () => {
  const callback = resultModal.afterConfirm
  resultModal.show = false
  resultModal.afterConfirm = null
  if (typeof callback === 'function') await callback()
}

const normalizeFacilities = (response) => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.content)) return response.content
  if (Array.isArray(response?.data?.content)) return response.data.content
  return []
}

const normalizeReservationType = (type) => {
  const value = String(type || '').trim()
  if (value === '좌석형') return 'SEAT'
  if (value === '정원형') return 'COUNT'
  if (value === '승인형') return 'APPROVAL'
  return value
}

const policyList = (data) => {
  const list = toList(data)
  if (list.length > 0) return list
  if (data && typeof data === 'object' && !Array.isArray(data) && !data.content) return [data]
  return []
}

const getFacilityType = (facility) => {
  const typeId = String(facility?.typeId || '')
  return facilityStore.facilityTypes?.find((t) => String(t.typeId) === typeId) || null
}

const getFacilityTypeCode = (facility) => getFacilityType(facility)?.typeCode || facility?.typeCode || null
const getFacilityTypeLabel = (facility) => getFacilityType(facility)?.typeName || facility?.typeName || getFacilityTypeCode(facility) || '-'
const reservationTypeLabel = (type) => ({ SEAT: '좌석형', COUNT: '정원형', APPROVAL: '승인형' }[normalizeReservationType(type)] || type || '-')
const isGxFacility = (facility) => getFacilityTypeCode(facility) === 'GX'

const policyTargets = computed(() => state.facilities.filter((f) => !isGxFacility(f)))

const selectedFacility = computed(() =>
  state.facilities.find((f) => String(f.facilityId) === String(state.facilityId)) || null
)

const selectedPolicy = computed(() => state.policiesMap[String(state.facilityId)] || null)

const selectedReservationType = computed(() => normalizeReservationType(selectedFacility.value?.reservationType))

const showMaxReservationCount = computed(() =>
  selectedReservationType.value === 'COUNT' || selectedReservationType.value === 'APPROVAL'
)

const isMinuteUnit = computed(() => state.usageUnitType !== 'DAY')
const isFlatWithExtra = computed(() => state.feeType === 'FLAT')

const feeTypeLabel = (type) =>
  ({ FLAT: '세대 고정 (월 1회)', PER_PERSON: '인원당 (월)', PER_USE: '건당 이용' }[type] || type || '-')

const syncPolicyForm = (policy) => {
  state.baseFee = policy?.baseFee ?? 0
  state.usageUnitType = policy?.usageUnitType ?? 'MINUTE'
  state.slotMin = policy?.usageUnitType === 'DAY' ? 60 : (policy?.slotMin ?? 60)
  state.cancelDeadlineHours = policy?.cancelDeadlineHours ?? 2
  state.maxReservationCount = policy?.maxReservationCount ?? ''
  state.feeType = policy?.feeType ?? 'FLAT'
  state.includedPersonCount = policy?.includedPersonCount ?? ''
  state.extraPersonFee = policy?.extraPersonFee ?? 0
  // null이면 '' 로 초기화해 "기준일 없음(항상 전액)" 상태를 input에서 표현
  state.subscribeCutoffDay = policy?.subscribeCutoffDay ?? ''
  state.cancelCutoffDay = policy?.cancelCutoffDay ?? ''
}

const fetchPolicyForFacility = async (facilityId) => {
  const result = await facilityStore.fetchFacilityPolicies({ facilityId })
  const list = policyList(result)
  return list.find((p) => String(p.facilityId) === String(facilityId)) || list[0] || null
}

const fetchFacilitiesAndPolicies = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    if (!facilityStore.facilityTypes?.length) {
      await facilityStore.fetchFacilityTypes()
    }
    const result = await facilityStore.fetchAdminFacilities()
    state.facilities = normalizeFacilities(result).map((f) => ({
      ...f,
      facilityId: f.facilityId ?? f.facilityUid ?? f.id,
      typeId: f.typeId ?? f.facilityTypeId ?? f.type?.id,
      reservationType: normalizeReservationType(f.reservationType),
    }))
    const entries = await Promise.all(
      policyTargets.value.map(async (f) => {
        try {
          return [String(f.facilityId), await fetchPolicyForFacility(f.facilityId)]
        } catch {
          return [String(f.facilityId), null]
        }
      }),
    )
    state.policiesMap = Object.fromEntries(entries)
  } catch (error) {
    state.errorMessage =
      error.response?.data?.message ||
      error.response?.data?.message ||
      '시설 정책 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

const selectFacility = (facility) => {
  if (state.editing) state.editing = false
  state.facilityId = facility.facilityId
  syncPolicyForm(state.policiesMap[String(facility.facilityId)])
  state.errorMessage = ''
}

const startEdit = () => {
  state.editing = true
  state.errorMessage = ''
}

const cancelEdit = () => {
  state.editing = false
  syncPolicyForm(selectedPolicy.value)
  state.errorMessage = ''
}

const openSubmitConfirm = () => {
  state.errorMessage = ''
  confirmModal.show = true
}

const handleConfirmSave = async () => {
  confirmModal.loading = true
  state.submitting = true

  const payload = {
    facilityId: state.facilityId,
    baseFee: Number(state.baseFee || 0),
    usageUnitType: state.usageUnitType,
    slotMin: isMinuteUnit.value ? Number(state.slotMin || 0) : null,
    cancelDeadlineHours: Number(state.cancelDeadlineHours || 0),
    maxReservationCount: showMaxReservationCount.value
      ? (state.maxReservationCount === '' || state.maxReservationCount === null
          ? null
          : Number(state.maxReservationCount))
      : null,
    feeType: state.feeType,
    includedPersonCount: isFlatWithExtra.value
      ? (state.includedPersonCount === '' ? null : Number(state.includedPersonCount))
      : null,
    extraPersonFee: isFlatWithExtra.value ? Number(state.extraPersonFee || 0) : null,
    // 빈 문자열이면 null 전송 → BE에서 항상 전액 청구로 처리
    subscribeCutoffDay: state.subscribeCutoffDay === '' ? null : Number(state.subscribeCutoffDay),
    cancelCutoffDay: state.cancelCutoffDay === '' ? null : Number(state.cancelCutoffDay),
    isActive: true,
  }

  try {
    const savedPolicy = await facilityStore.saveFacilityPolicy(payload)
    state.policiesMap[String(state.facilityId)] = savedPolicy || payload
    syncPolicyForm(state.policiesMap[String(state.facilityId)])
    confirmModal.show = false
    state.editing = false
    openResultModal({
      type: 'success',
      title: '시설 정책이 저장되었습니다.',
      itemName: selectedFacility.value?.name || '',
      actionLabel: '시설 정책 수정',
      time: getCurrentTimeText(),
      actor: getCurrentActorName(),
    })
  } catch (error) {
    confirmModal.show = false
    openResultModal({
      type: 'danger',
      title: '시설 정책 저장에 실패했습니다.',
      subtitle:
        error.response?.data?.message ||
        error.response?.data?.message ||
        '잠시 후 다시 시도해주세요.',
    })
  } finally {
    confirmModal.loading = false
    state.submitting = false
  }
}

onMounted(async () => {
  await fetchFacilitiesAndPolicies()
  if (policyTargets.value.length > 0) {
    selectFacility(policyTargets.value[0])
  }
})
</script>

<template>
  <section class="policy-tab">
    <div v-if="state.loading" class="empty-box">시설 정책을 불러오는 중...</div>

    <div v-else-if="state.errorMessage && !state.facilityId" class="error-box">
      {{ state.errorMessage }}
    </div>

    <div v-else-if="policyTargets.length === 0" class="empty-box">
      정책을 설정할 수 있는 시설이 없습니다.
    </div>

    <div v-else class="policy-layout">
      <!-- 왼쪽: 시설 nav -->
      <aside class="type-nav">
        <button
          v-for="f in policyTargets"
          :key="f.facilityId"
          type="button"
          class="type-nav-btn"
          :class="{ active: String(state.facilityId) === String(f.facilityId) }"
          @click="selectFacility(f)"
        >
          <span class="nav-name">{{ f.name }}</span>
          <span
            :class="['nav-dot', state.policiesMap[String(f.facilityId)] ? 'nav-dot--has' : 'nav-dot--none']"
          ></span>
        </button>
      </aside>

      <!-- 오른쪽: 정책 패널 -->
      <article class="panel">
        <!-- 패널 헤더 -->
        <div class="panel-header">
          <div>
            <h3 class="panel-title">{{ selectedFacility?.name }}</h3>
            <div class="panel-meta">
              <span class="meta-tag">{{ getFacilityTypeLabel(selectedFacility) }}</span>
              <span class="meta-tag">{{ reservationTypeLabel(selectedFacility?.reservationType) }}</span>
            </div>
          </div>
          <span
            v-if="selectedPolicy"
            :class="['policy-status-badge', selectedPolicy.isActive ? 'badge--active' : 'badge--inactive']"
          >
            {{ selectedPolicy.isActive ? '정책 사용 중' : '정책 미사용' }}
          </span>
        </div>

        <div v-if="selectedReservationType === 'SEAT'" class="notice-box notice-box--subtle">
          좌석 수와 사용 여부는 시설 상세의 좌석 관리에서 설정합니다.
        </div>

        <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

        <!-- 읽기 전용 -->
        <template v-if="!state.editing">
          <div v-if="selectedPolicy" class="detail-grid">
            <div class="detail-row">
              <span class="detail-label">요금 방식</span>
              <span class="detail-value">{{ feeTypeLabel(selectedPolicy.feeType) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">기본 요금</span>
              <span class="detail-value">{{ Number(selectedPolicy.baseFee || 0).toLocaleString() }}원</span>
            </div>
            <template v-if="selectedPolicy.feeType === 'FLAT'">
              <div class="detail-row">
                <span class="detail-label">기본 포함 인원</span>
                <span class="detail-value">{{ selectedPolicy.includedPersonCount ?? 0 }}명</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">초과 인원당 요금</span>
                <span class="detail-value">{{ Number(selectedPolicy.extraPersonFee || 0).toLocaleString() }}원</span>
              </div>
            </template>
            <div class="detail-row">
              <span class="detail-label">이용 단위</span>
              <span class="detail-value">{{ selectedPolicy.usageUnitType === 'DAY' ? '하루 이용' : '시간 단위' }}</span>
            </div>
            <div v-if="selectedPolicy.usageUnitType !== 'DAY'" class="detail-row">
              <span class="detail-label">예약 단위</span>
              <span class="detail-value">{{ selectedPolicy.slotMin || '-' }}분</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">취소 마감</span>
              <span class="detail-value">{{ selectedPolicy.cancelDeadlineHours || '-' }}시간 전</span>
            </div>
            <!-- FLAT/PER_PERSON 요금 방식일 때만 월정산 기준일 표시 -->
            <template v-if="['FLAT', 'PER_PERSON'].includes(selectedPolicy.feeType)">
              <div class="detail-row">
                <span class="detail-label">
                  월정산 기준일 (신청)
                  <span class="tooltip-wrap">
                    <span class="tooltip-trigger">!</span>
                    <span class="tooltip-popup">예) 기준일 20일 → 20일 이하 신청 시 당월부터 청구,<br>21일 이후 신청 시 익월부터 청구</span>
                  </span>
                </span>
                <span class="detail-value">
                  {{ selectedPolicy.subscribeCutoffDay != null ? selectedPolicy.subscribeCutoffDay + '일' : '없음' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">
                  월정산 기준일 (해지)
                  <span class="tooltip-wrap">
                    <span class="tooltip-trigger">!</span>
                    <span class="tooltip-popup">예) 기준일 10일 → 10일 이하 해지 시 당월 요금 미청구,<br>11일 이후 해지 시 당월까지 청구</span>
                  </span>
                </span>
                <span class="detail-value">
                  {{ selectedPolicy.cancelCutoffDay != null ? selectedPolicy.cancelCutoffDay + '일' : '없음' }}
                </span>
              </div>
            </template>
            <div
              v-if="['COUNT', 'APPROVAL'].includes(normalizeReservationType(selectedFacility?.reservationType))"
              class="detail-row"
            >
              <span class="detail-label">최대 예약 인원</span>
              <span class="detail-value">
                {{ selectedPolicy.maxReservationCount != null ? selectedPolicy.maxReservationCount + '명' : '제한 없음' }}
              </span>
            </div>
          </div>

          <div v-else class="empty-box">
            등록된 정책이 없습니다. 수정 버튼을 눌러 정책을 등록해주세요.
          </div>

          <div class="button-row">
            <button class="btn-primary" type="button" @click="startEdit">수정</button>
          </div>
        </template>

        <!-- 편집 폼 -->
        <template v-else>
          <div class="form-grid">
            <label class="form-field">
              <span>요금 방식</span>
              <select v-model="state.feeType">
                <option value="FLAT">세대 고정 (월 1회)</option>
                <option value="PER_PERSON">인원당 (월)</option>
                <option value="PER_USE">건당 이용</option>
              </select>
            </label>

            <label class="form-field">
              <span>기본 요금</span>
              <div class="input-suffix-wrap">
                <input v-model="state.baseFee" type="number" min="0" />
                <span class="input-suffix">원</span>
              </div>
            </label>

            <template v-if="isFlatWithExtra">
              <label class="form-field">
                <span>기본 포함 인원</span>
                <div class="input-suffix-wrap">
                  <input v-model="state.includedPersonCount" type="number" min="0" placeholder="0" />
                  <span class="input-suffix">명</span>
                </div>
              </label>
              <label class="form-field">
                <span>초과 인원당 요금</span>
                <div class="input-suffix-wrap">
                  <input v-model="state.extraPersonFee" type="number" min="0" />
                  <span class="input-suffix">원</span>
                </div>
              </label>
            </template>

            <label class="form-field">
              <span>이용 단위</span>
              <select v-model="state.usageUnitType">
                <option value="MINUTE">시간 단위</option>
                <option value="DAY">하루 이용</option>
              </select>
            </label>

            <label v-if="isMinuteUnit" class="form-field">
              <span>예약 단위</span>
              <div class="input-suffix-wrap">
                <input v-model="state.slotMin" type="number" min="1" />
                <span class="input-suffix">분</span>
              </div>
            </label>

            <label class="form-field">
              <span>취소 마감</span>
              <div class="input-suffix-wrap">
                <input v-model="state.cancelDeadlineHours" type="number" min="0" />
                <span class="input-suffix">시간 전</span>
              </div>
            </label>

            <!-- FLAT/PER_PERSON 요금 방식일 때만 월정산 기준일 입력 표시 -->
            <template v-if="['FLAT', 'PER_PERSON'].includes(state.feeType)">
              <label class="form-field">
                <span class="field-label-row">
                  월정산 기준일 (신청)
                  <span class="tooltip-wrap">
                    <span class="tooltip-trigger">!</span>
                    <span class="tooltip-popup">예) 기준일 20일 → 20일 이하 신청 시 당월부터 청구,<br>21일 이후 신청 시 익월부터 청구</span>
                  </span>
                </span>
                <div class="input-suffix-wrap">
                  <input
                    v-model="state.subscribeCutoffDay"
                    type="number"
                    min="1"
                    max="28"
                    placeholder="없음"
                  />
                  <span class="input-suffix">일</span>
                </div>
              </label>
              <label class="form-field">
                <span class="field-label-row">
                  월정산 기준일 (해지)
                  <span class="tooltip-wrap">
                    <span class="tooltip-trigger">!</span>
                    <span class="tooltip-popup">예) 기준일 10일 → 10일 이하 해지 시 당월 요금 미청구,<br>11일 이후 해지 시 당월까지 청구</span>
                  </span>
                </span>
                <div class="input-suffix-wrap">
                  <input
                    v-model="state.cancelCutoffDay"
                    type="number"
                    min="1"
                    max="28"
                    placeholder="없음"
                  />
                  <span class="input-suffix">일</span>
                </div>
              </label>
            </template>

            <label v-if="showMaxReservationCount" class="form-field">
              <span>최대 예약 인원</span>
              <div class="input-suffix-wrap">
                <input v-model="state.maxReservationCount" type="number" min="0" placeholder="제한 없음" />
                <span class="input-suffix">명</span>
              </div>
            </label>
          </div>

          <div class="button-row">
            <button class="btn-secondary" type="button" @click="cancelEdit">취소</button>
            <button class="btn-primary" type="button" :disabled="state.submitting" @click="openSubmitConfirm">
              저장
            </button>
          </div>
        </template>
      </article>
    </div>

    <!-- 저장 확인 모달 -->
    <ConfirmModal
      :visible="confirmModal.show"
      title="시설 정책을 저장하시겠습니까?"
      subtitle="변경된 정책은 즉시 예약에 반영됩니다."
      item-label="시설명"
      :item-name="selectedFacility?.name"
      confirm-text="저장"
      confirm-type="success"
      :loading="confirmModal.loading"
      @confirm="handleConfirmSave"
      @cancel="confirmModal.show = false"
    />

    <!-- 처리 결과 모달 -->
    <ActionResultModal
      :visible="resultModal.show"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      :desc="resultModal.desc"
      :item-name="resultModal.itemName"
      :time="resultModal.time"
      :action-label="resultModal.actionLabel"
      :actor="resultModal.actor"
      confirm-text="확인"
      @close="handleResultConfirm"
    />
  </section>
</template>

<style scoped>
.policy-tab {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'Noto Sans KR', sans-serif;
}

/* ── 레이아웃 ── */
.policy-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 18px;
  align-items: start;
}

/* ── 왼쪽 nav ── */
.type-nav {
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  background: #FFFFFF;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.type-nav-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #687282;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  transition: background 0.15s, color 0.15s;
}

.type-nav-btn:hover {
  background: #F5F6F8;
  color: #2B3A55;
}

.type-nav-btn.active {
  background: #1E2A3E;
  color: #FFFFFF;
}

.nav-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-left: 8px;
}

.nav-dot--has { background: #48BB78; }
.nav-dot--none { background: #E2E8F0; }
.type-nav-btn.active .nav-dot--has { background: #9AE6B4; }
.type-nav-btn.active .nav-dot--none { background: rgba(255,255,255,0.3); }

/* ── 오른쪽 패널 ── */
.panel {
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  background: #FFFFFF;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E2E8F0;
}

.panel-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  color: #1E2A3E;
}

.panel-meta {
  display: flex;
  gap: 6px;
}

.meta-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  background: #EEF2F7;
  color: #4A5568;
  font-size: 11px;
  font-weight: 600;
}

.policy-status-badge {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.badge--active { background: #EBFBEE; color: #4D8B5A; }
.badge--inactive { background: #FFF5F5; color: #E53E3E; }

/* ── 읽기 전용 grid ── */
.detail-grid {
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  overflow: hidden;
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 13px 16px;
  border-bottom: 1px solid #F0F4F8;
  gap: 16px;
}

.detail-row:last-child { border-bottom: none; }

.detail-label {
  flex: 0 0 140px;
  font-size: 12px;
  color: #687282;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.detail-value {
  font-size: 14px;
  color: #1A202C;
  font-weight: 600;
}

/* ── 편집 폼 ── */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: #2B3A55;
}

.form-field input,
.form-field select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #D7DEE8;
  border-radius: 8px;
  color: #1E2A3E;
  background: #FFFFFF;
  font: inherit;
  font-size: 13px;
}

.input-suffix-wrap {
  position: relative;
}

.input-suffix-wrap input {
  width: 100%;
  padding-right: 44px;
  box-sizing: border-box;
}

.input-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #A0AEC0;
  font-weight: 400;
  pointer-events: none;
}

/* ── 버튼 ── */
.button-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid #E2E8F0;
  margin-top: auto;
}

.btn-primary,
.btn-secondary {
  min-height: 38px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}

.btn-primary {
  border: 0;
  background: #1E2A3E;
  color: #FFFFFF;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-secondary {
  border: 1px solid #D7DEE8;
  background: #FFFFFF;
  color: #2B3A55;
}

/* ── 공통 박스 ── */
.notice-box {
  padding: 11px 14px;
  border-radius: 8px;
  background: #F0F4FF;
  color: #2B3A55;
  font-size: 13px;
}

.notice-box--subtle {
  background: #F8FAFC;
  color: #687282;
}

.error-box {
  padding: 11px 14px;
  border-radius: 8px;
  background: #FFF5F5;
  color: #E53E3E;
  font-size: 13px;
}

.empty-box {
  padding: 32px;
  text-align: center;
  color: #7B8EA8;
  font-size: 13px;
  background: #F8FAFC;
  border-radius: 10px;
}

/* ── 툴팁 ── */
.field-label-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.tooltip-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.tooltip-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #94a3b8;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  cursor: default;
  user-select: none;
  flex-shrink: 0;
}

.tooltip-popup {
  display: none;
  position: absolute;
  bottom: calc(100% + 7px);
  left: 50%;
  transform: translateX(-50%);
  background: #1E2A3E;
  color: #e2e8f0;
  font-size: 11.5px;
  font-weight: 400;
  line-height: 1.6;
  padding: 9px 13px;
  border-radius: 8px;
  white-space: nowrap;
  z-index: 200;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
}

.tooltip-popup::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #1E2A3E;
}

.tooltip-wrap:hover .tooltip-popup {
  display: block;
}

/* ── 반응형 ── */
@media (max-width: 960px) {
  .policy-layout {
    grid-template-columns: 1fr;
  }

  .type-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .type-nav-btn {
    width: auto;
  }
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
