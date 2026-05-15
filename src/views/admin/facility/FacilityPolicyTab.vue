<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { toList } from '@/utils/apiResponse'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const facilityStore = useFacilityStore()

// 시설 타입 코드 옵션
const facilityTypeOptions = [
  { value: 'STUDY_ROOM', label: '독서실' },
  { value: 'GYM', label: '헬스장' },
  { value: 'GOLF', label: '골프연습장' },
  { value: 'GX', label: 'GX' },
  { value: 'POOL', label: '수영장' },
  { value: 'SAUNA', label: '사우나' },
  { value: 'GUEST_HOUSE', label: '게스트하우스' },
  { value: 'LAUNDRY', label: '세탁실' },
  { value: 'CAFE', label: '카페' },
  { value: 'ETC', label: '기타' },
]

// 정책 탭 상태
const state = reactive({
  facilityTypeCode: 'GYM',
  baseFee: 0,
  slotMin: 60,
  cancelDeadlineHours: 2,
  gxWaitingEnabled: false,
  isActive: true,
  policies: [],
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

const selectedTypeLabel = computed(() => {
  return facilityTypeOptions.find((type) => type.value === state.facilityTypeCode)?.label || '-'
})

const selectedPolicy = computed(() => {
  return state.policies.find((policy) => policy.facilityTypeCode === state.facilityTypeCode) || null
})

const isGxPolicy = computed(() => state.facilityTypeCode === 'GX')

// 정책 폼 초기값 세팅
const syncPolicyForm = (policy) => {
  state.baseFee = policy?.baseFee ?? 0
  state.slotMin = policy?.slotMin ?? 60
  state.cancelDeadlineHours = policy?.cancelDeadlineHours ?? 2
  state.gxWaitingEnabled = !!policy?.gxWaitingEnabled
  state.isActive = policy?.isActive ?? true
}

// 정책 조회
const fetchPolicies = async () => {
  state.loading = true
  state.errorMessage = ''

  try {
    const result = await facilityStore.fetchFacilityPolicies({
      facilityTypeCode: state.facilityTypeCode,
    })

    state.policies = toList(result)
    syncPolicyForm(selectedPolicy.value)
  } catch (error) {
    console.error('시설 정책 조회 실패:', error)
    state.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '시설 정책을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

// 시설 타입 변경
const changeFacilityType = () => {
  fetchPolicies()
}

// 정책 폼 초기화
const resetPolicyForm = () => {
  syncPolicyForm(selectedPolicy.value)
  state.errorMessage = ''
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

// 정책 저장
const submitPolicy = async () => {
  state.submitting = true
  state.errorMessage = ''

  const payload = {
    facilityTypeCode: state.facilityTypeCode,
    baseFee: Number(state.baseFee || 0),
    slotMin: Number(state.slotMin || 0),
    cancelDeadlineHours: Number(state.cancelDeadlineHours || 0),
    gxWaitingEnabled: !!state.gxWaitingEnabled,
    isActive: !!state.isActive,
  }

  try {
    await facilityStore.saveFacilityPolicy(payload)
    await fetchPolicies()
    openResultModal('success', '시설 정책이 저장되었습니다.', `${selectedTypeLabel.value} 정책을 반영했습니다.`)
  } catch (error) {
    console.error('시설 정책 저장 실패:', error)
    openResultModal(
      'danger',
      '시설 정책 저장에 실패했습니다.',
      error.response?.data?.resultMessage ||
        error.response?.data?.message ||
        '잠시 후 다시 시도해주세요.',
    )
  } finally {
    state.submitting = false
  }
}

onMounted(fetchPolicies)
</script>

<template>
  <section class="policy-tab">
    <div class="tab-grid">
      <article class="panel">
        <div class="panel-header">
          <div>
            <h3>시설 정책</h3>
            <p>단지별 시설 타입 기본 요금과 예약 단위를 관리합니다.</p>
          </div>
          <button class="btn-secondary" type="button" @click="fetchPolicies">다시 조회</button>
        </div>

        <div class="notice-box">
          현재는 타입별 정책 구조입니다. 장기적으로 시설별 정책으로 전환할 예정입니다.
        </div>

        <div v-if="isGxPolicy" class="notice-box notice-box--warning">
          GX 정책은 프로그램 단위로 관리 예정입니다. 현재 API 구조 유지를 위해 타입 정책 값만 조회/저장합니다.
        </div>

        <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

        <div class="form-grid">
          <label class="form-field">
            <span>시설 타입</span>
            <select v-model="state.facilityTypeCode" @change="changeFacilityType">
              <option v-for="type in facilityTypeOptions" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </label>

          <label class="form-field">
            <span>기본 요금</span>
            <input v-model="state.baseFee" type="number" min="0" />
          </label>

          <label class="form-field">
            <span>예약 단위</span>
            <input v-model="state.slotMin" type="number" min="1" />
          </label>

          <label class="form-field">
            <span>취소 마감 시간</span>
            <input v-model="state.cancelDeadlineHours" type="number" min="0" />
          </label>
        </div>

        <div class="toggle-list">
          <label class="toggle-row">
            <span>
              GX 대기 허용
              <em>GX 프로그램으로 이관 예정인 설정입니다.</em>
            </span>
            <input v-model="state.gxWaitingEnabled" type="checkbox" />
          </label>

          <label class="toggle-row">
            <span>
              정책 사용
              <em>비활성 정책은 예약 기본값으로 사용하지 않습니다.</em>
            </span>
            <input v-model="state.isActive" type="checkbox" />
          </label>
        </div>

        <div class="button-row">
          <button class="btn-secondary" type="button" @click="resetPolicyForm">초기화</button>
          <button class="btn-primary" type="button" :disabled="state.submitting" @click="submitPolicy">
            {{ state.submitting ? '저장 중' : '정책 저장' }}
          </button>
        </div>
      </article>

      <aside class="summary-card">
        <h3>현재 선택 정책</h3>
        <dl>
          <div>
            <dt>시설 타입</dt>
            <dd>{{ selectedTypeLabel }}</dd>
          </div>
          <div>
            <dt>기본 요금</dt>
            <dd>{{ Number(state.baseFee || 0).toLocaleString() }}원</dd>
          </div>
          <div>
            <dt>예약 단위</dt>
            <dd>{{ state.slotMin }}분</dd>
          </div>
          <div>
            <dt>취소 마감</dt>
            <dd>{{ state.cancelDeadlineHours }}시간 전</dd>
          </div>
          <div>
            <dt>정책 상태</dt>
            <dd>{{ state.isActive ? '사용' : '미사용' }}</dd>
          </div>
        </dl>
      </aside>
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
.policy-tab {
  font-family: 'Noto Sans KR', sans-serif;
}

.tab-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
}

.panel,
.summary-card {
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

.panel-header h3,
.summary-card h3 {
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

.form-field input,
.form-field select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d7dee8;
  border-radius: 8px;
  color: #1e2a3e;
}

.toggle-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border-radius: 10px;
  background: #f8fafc;
  color: #1e2a3e;
  font-size: 13px;
  font-weight: 700;
}

.toggle-row em {
  display: block;
  margin-top: 4px;
  color: #7b8ea8;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
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

.summary-card dl {
  display: grid;
  gap: 13px;
  margin: 18px 0 0;
}

.summary-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f7;
}

.summary-card dt {
  color: #7b8ea8;
  font-size: 12px;
}

.summary-card dd {
  margin: 0;
  color: #1e2a3e;
  font-size: 13px;
  font-weight: 800;
  text-align: right;
}

.error-box {
  margin-bottom: 14px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
}

.notice-box {
  margin-bottom: 14px;
  padding: 11px 12px;
  border-radius: 8px;
  background: #f0f4ff;
  color: #2b3a55;
  font-size: 13px;
}

.notice-box--warning {
  background: #fff7ed;
  color: #c08b2d;
}

@media (max-width: 960px) {
  .tab-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
