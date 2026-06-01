<script setup>
// 차량 관리 컨테이너의 차량 정책 탭이다.
// 시설 정책 패턴을 차용해 왼쪽 셀렉터에서 정책을 고르고 오른쪽 패널에서 세대당 등록 한도와 차량 대수별 월 요금을 읽기/편집한다.
import { computed, onMounted, ref, watch } from 'vue'
import { useVehicleStore } from '@/stores/useVehicleStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { useAuthStore } from '@/stores/useAuthStore'

const vehicleStore = useVehicleStore()
const complexStore = useComplexStore()
const authStore = useAuthStore()

const loading = ref(false)
const loadError = ref('')
const editing = ref(false)
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

// 등록 한도 섹션 전용 상태
const regLoadError = ref('')
const limitInput = ref('')
const limitSaving = ref(false)
const limitError = ref('')
const limitSuccess = ref(false)

// 편집용 정책 행 목록, 입력 바인딩을 위해 문자열로 보관
const policyRows = ref([])

// 현재 저장된 정책, 차량 대수 오름차순 정렬
const currentPolicies = computed(() => {
  const policies = vehicleStore.vehiclePolicies?.policies ?? []
  return [...policies].sort((a, b) => Number(a.carCount) - Number(b.carCount))
})

// 정책 존재 여부
const hasPolicy = computed(() => currentPolicies.value.length > 0)

// 저장된 등록 한도 정책
const registrationPolicy = computed(() => vehicleStore.vehicleRegistrationPolicy)

// 한도 설정 여부 (양의 정수일 때만 설정으로 간주)
const hasLimit = computed(() => {
  const value = Number(registrationPolicy.value?.maxCarCount)
  return Number.isInteger(value) && value >= 1
})

// 한도 입력값 유효성
const limitValid = computed(() => {
  const value = Number(limitInput.value)
  return limitInput.value !== '' && Number.isInteger(value) && value >= 1
})

// 현재 선택된 정책 키
const selectedPolicyKey = ref('limit')

// 정책 셀렉터 항목, 상태 점은 각 정책 설정 여부로 결정
const policyMenus = computed(() => [
  { key: 'limit', label: '세대당 등록 한도', active: hasLimit.value },
  { key: 'fee', label: '차량 요금 정책', active: hasPolicy.value },
])

// 셀렉터 항목 선택
const selectPolicy = (key) => {
  selectedPolicyKey.value = key
}

// 금액 천 단위 표기 변환
const formatFee = (value) => Number(value || 0).toLocaleString()

// 빈 정책 행 생성
const createEmptyRow = () => ({ carCount: '', monthlyFee: '' })

// 현재 정책 조회
const loadPolicies = async () => {
  loading.value = true
  loadError.value = ''
  saveError.value = ''
  saveSuccess.value = false
  editing.value = false
  await vehicleStore.fetchVehiclePolicies()
  if (vehicleStore.error) loadError.value = '차량 정책을 불러오지 못했습니다.'
  loading.value = false
}

// 등록 한도 정책 조회 후 입력값 동기화
const loadRegistrationPolicy = async () => {
  regLoadError.value = ''
  limitSuccess.value = false
  limitError.value = ''
  await vehicleStore.fetchVehicleRegistrationPolicy()
  if (vehicleStore.error) {
    regLoadError.value = '등록 한도 정책을 불러오지 못했습니다.'
    return
  }
  // 저장된 값이 있으면 입력란에 채우고 없으면 빈 상태 유지
  const current = vehicleStore.vehicleRegistrationPolicy?.maxCarCount
  limitInput.value = current == null ? '' : String(current)
}

// 등록 한도 저장 후 재조회로 최신 반영
const handleSaveLimit = async () => {
  if (limitSaving.value) return
  if (!limitValid.value) {
    limitError.value = '세대당 등록 한도는 1 이상의 정수로 입력해주세요.'
    return
  }
  limitSaving.value = true
  limitError.value = ''
  limitSuccess.value = false
  await vehicleStore.saveVehicleRegistrationPolicy({ maxCarCount: Number(limitInput.value) })
  limitSaving.value = false
  if (vehicleStore.error) {
    limitError.value = '등록 한도 저장에 실패했습니다.'
    return
  }
  await vehicleStore.fetchVehicleRegistrationPolicy()
  const current = vehicleStore.vehicleRegistrationPolicy?.maxCarCount
  limitInput.value = current == null ? '' : String(current)
  limitSuccess.value = true
}

// 수정 모드 진입, 현재 정책을 편집 행으로 복사
const startEdit = () => {
  policyRows.value = currentPolicies.value.map((policy) => ({
    carCount: String(policy.carCount ?? ''),
    monthlyFee: String(policy.monthlyFee ?? ''),
  }))
  if (policyRows.value.length === 0) {
    policyRows.value.push(createEmptyRow())
  }
  saveError.value = ''
  saveSuccess.value = false
  editing.value = true
}

// 수정 취소, 편집 내용 폐기
const cancelEdit = () => {
  editing.value = false
  saveError.value = ''
}

// 정책 행 추가
const addRow = () => {
  policyRows.value.push(createEmptyRow())
  saveSuccess.value = false
}

// 정책 행 삭제
const removeRow = (index) => {
  policyRows.value.splice(index, 1)
}

// 입력값 검증, 문제가 있으면 안내 문구 반환
const validatePolicies = () => {
  if (policyRows.value.length === 0) {
    return '최소 한 개 이상의 정책을 입력해주세요.'
  }
  const seenCarCounts = new Set()
  for (const row of policyRows.value) {
    const carCount = Number(row.carCount)
    const monthlyFee = Number(row.monthlyFee)
    if (row.carCount === '' || !Number.isInteger(carCount) || carCount < 1) {
      return '차량 대수는 1 이상의 정수로 입력해주세요.'
    }
    if (row.monthlyFee === '' || Number.isNaN(monthlyFee) || monthlyFee < 0) {
      return '월 요금은 0 이상으로 입력해주세요.'
    }
    if (seenCarCounts.has(carCount)) {
      return '차량 대수가 중복되었습니다.'
    }
    seenCarCounts.add(carCount)
  }
  return ''
}

// 전체 정책 저장 후 재조회로 최신 반영
const handleSave = async () => {
  if (saving.value) return
  const message = validatePolicies()
  if (message) {
    saveError.value = message
    return
  }
  saving.value = true
  saveError.value = ''
  const policies = policyRows.value.map((row) => ({
    carCount: Number(row.carCount),
    monthlyFee: Number(row.monthlyFee),
  }))
  await vehicleStore.saveVehiclePolicies({ policies })
  saving.value = false
  if (vehicleStore.error) {
    saveError.value = '차량 정책 저장에 실패했습니다.'
    return
  }
  editing.value = false
  await vehicleStore.fetchVehiclePolicies()
  saveSuccess.value = true
}

// 마운트 시 요금 정책과 등록 한도 정책을 순차 조회
onMounted(async () => {
  await loadPolicies()
  await loadRegistrationPolicy()
})

// MASTER 단지 전환 시 두 정책 재조회
watch(
  () => complexStore.selectedComplex?.complexId,
  async (nextComplexId, prevComplexId) => {
    if (authStore.role !== 'MASTER' || !nextComplexId || nextComplexId === prevComplexId) return
    await loadPolicies()
    await loadRegistrationPolicy()
  },
)
</script>

<template>
  <section class="policy-tab">
    <div v-if="loading" class="empty-box">차량 정책을 불러오는 중...</div>
    <div v-else-if="loadError" class="error-box">{{ loadError }}</div>

    <div v-else class="policy-layout">
      <!-- 왼쪽 정책 셀렉터 -->
      <aside class="policy-selector">
        <button
          v-for="menu in policyMenus"
          :key="menu.key"
          type="button"
          class="selector-btn"
          :class="{ active: selectedPolicyKey === menu.key }"
          @click="selectPolicy(menu.key)"
        >
          <span class="selector-name">{{ menu.label }}</span>
          <span :class="['selector-dot', menu.active ? 'selector-dot--has' : 'selector-dot--none']"></span>
        </button>
      </aside>

      <!-- 오른쪽 상세 패널 -->
      <article class="panel">
        <!-- 세대당 등록 한도 상세 -->
        <template v-if="selectedPolicyKey === 'limit'">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">세대당 등록 한도</h3>
              <div class="panel-meta">
                <span class="meta-tag">단지 단위</span>
                <span class="meta-tag">세대당 최대 등록 대수</span>
              </div>
            </div>
            <span :class="['policy-status-badge', hasLimit ? 'badge--active' : 'badge--inactive']">
              {{ hasLimit ? `한도 ${registrationPolicy.maxCarCount}대` : '한도 미설정' }}
            </span>
          </div>

          <p class="section-desc">세대당 등록 가능한 최대 차량 대수를 설정합니다.</p>

          <div v-if="regLoadError" class="error-box">{{ regLoadError }}</div>

          <div class="limit-field">
            <label class="limit-label">세대당 등록 한도</label>
            <div class="input-suffix-wrap limit-input">
              <input v-model="limitInput" type="number" min="1" step="1" placeholder="예: 2" />
              <span class="input-suffix">대</span>
            </div>
          </div>

          <p v-if="limitError" class="error-box">{{ limitError }}</p>
          <p v-if="limitSuccess" class="success-box">세대당 등록 한도가 저장되었습니다.</p>

          <div class="button-row">
            <button
              class="btn-primary"
              type="button"
              :disabled="limitSaving || !limitValid"
              @click="handleSaveLimit"
            >
              {{ limitSaving ? '저장 중...' : '한도 저장' }}
            </button>
          </div>
        </template>

        <!-- 차량 요금 정책 상세 -->
        <template v-else>
          <div class="panel-header">
            <div>
              <h3 class="panel-title">차량 요금 정책</h3>
              <div class="panel-meta">
                <span class="meta-tag">단지 단위</span>
                <span class="meta-tag">차량 대수별 월 요금</span>
              </div>
            </div>
            <span :class="['policy-status-badge', hasPolicy ? 'badge--active' : 'badge--inactive']">
              {{ hasPolicy ? '정책 사용 중' : '정책 미설정' }}
            </span>
          </div>

          <!-- 읽기 모드 -->
          <template v-if="!editing">
            <div v-if="hasPolicy" class="detail-grid">
              <div v-for="policy in currentPolicies" :key="policy.carCount" class="detail-row">
                <span class="detail-label">차량 {{ policy.carCount }}대</span>
                <span class="detail-value">{{ formatFee(policy.monthlyFee) }}원 / 월</span>
              </div>
            </div>
            <div v-else class="empty-box">
              등록된 정책이 없습니다. 수정 버튼을 눌러 정책을 등록해주세요.
            </div>

            <p v-if="saveSuccess" class="success-box">차량 정책이 저장되었습니다.</p>

            <div class="button-row">
              <button class="btn-primary" type="button" @click="startEdit">수정</button>
            </div>
          </template>

          <!-- 편집 모드 -->
          <template v-else>
            <div class="edit-list">
              <div class="edit-head">
                <span>차량 대수</span>
                <span>월 요금</span>
                <span class="edit-head__action">관리</span>
              </div>
              <div v-for="(row, index) in policyRows" :key="index" class="edit-row">
                <div class="input-suffix-wrap">
                  <input v-model="row.carCount" type="number" min="1" step="1" placeholder="예) 1" />
                  <span class="input-suffix">대</span>
                </div>
                <div class="input-suffix-wrap">
                  <input v-model="row.monthlyFee" type="number" min="0" step="1000" placeholder="예) 50000" />
                  <span class="input-suffix">원</span>
                </div>
                <button type="button" class="btn-remove" @click="removeRow(index)">삭제</button>
              </div>
              <button type="button" class="btn-add-row" @click="addRow">+ 정책 추가</button>
            </div>

            <p v-if="saveError" class="error-box">{{ saveError }}</p>

            <div class="button-row">
              <button class="btn-secondary" type="button" @click="cancelEdit">취소</button>
              <button class="btn-primary" type="button" :disabled="saving" @click="handleSave">
                {{ saving ? '저장 중...' : '저장' }}
              </button>
            </div>
          </template>
        </template>
      </article>
    </div>
  </section>
</template>

<style scoped>
.policy-tab {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 패널 카드 */
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

/* 좌우 그리드 레이아웃 */
.policy-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 18px;
  align-items: start;
}

/* 왼쪽 정책 셀렉터 */
.policy-selector {
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  background: #FFFFFF;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.selector-btn {
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
}

.selector-btn:hover {
  background: #F5F6F8;
  color: #2B3A55;
}

.selector-btn.active {
  background: #1E2A3E;
  color: #FFFFFF;
}

.selector-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-left: 8px;
}

.selector-dot--has { background: #48BB78; }
.selector-dot--none { background: #E2E8F0; }
.selector-btn.active .selector-dot--has { background: #9AE6B4; }
.selector-btn.active .selector-dot--none { background: rgba(255, 255, 255, 0.3); }

/* 정책 설명 문구 */
.section-desc {
  margin: 0;
  font-size: 13px;
  color: #687282;
}

/* 등록 한도 입력 행 */
.limit-field {
  display: flex;
  align-items: center;
  gap: 16px;
}

.limit-label {
  flex: 0 0 140px;
  font-size: 13px;
  font-weight: 600;
  color: #4A5568;
}

.limit-input {
  flex: 1;
  max-width: 200px;
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

/* 읽기 전용 grid */
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
}

.detail-value {
  font-size: 14px;
  color: #1A202C;
  font-weight: 600;
}

/* 편집 목록 */
.edit-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-head,
.edit-row {
  display: grid;
  grid-template-columns: 1fr 1fr 80px;
  gap: 12px;
  align-items: center;
}

.edit-head {
  padding: 0 4px 6px;
  font-size: 12px;
  font-weight: 600;
  color: #687282;
}

.edit-head__action {
  text-align: center;
}

.input-suffix-wrap {
  position: relative;
}

.input-suffix-wrap input {
  width: 100%;
  height: 40px;
  padding: 0 44px 0 12px;
  border: 1px solid #D7DEE8;
  border-radius: 8px;
  color: #1E2A3E;
  background: #FFFFFF;
  font: inherit;
  font-size: 13px;
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

.btn-remove {
  height: 36px;
  border: 1px solid #E53E3E;
  border-radius: 8px;
  background: #FFFFFF;
  color: #E53E3E;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-add-row {
  margin-top: 4px;
  height: 38px;
  border: 1px dashed #CBD5E0;
  border-radius: 8px;
  background: #F8FAFC;
  color: #4A5568;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-add-row:hover {
  background: #EEF2F7;
}

/* 버튼 영역 */
.button-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
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

/* 공통 박스 */
.error-box {
  padding: 11px 14px;
  border-radius: 8px;
  background: #FFF5F5;
  color: #E53E3E;
  font-size: 13px;
}

.success-box {
  margin: 0;
  padding: 11px 14px;
  border-radius: 8px;
  background: #EBFBEE;
  color: #4D8B5A;
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

@media (max-width: 768px) {
  .policy-layout {
    grid-template-columns: 1fr;
  }

  .policy-selector {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .selector-btn {
    width: auto;
  }
}

@media (max-width: 640px) {
  .edit-head,
  .edit-row {
    grid-template-columns: 1fr 1fr 64px;
  }
}
</style>
