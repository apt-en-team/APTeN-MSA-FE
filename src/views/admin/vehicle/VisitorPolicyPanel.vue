<script setup>
// 차량 정책 탭의 방문차량 요금 정책 패널이다.
// 단지별 단일 방문차량 정책(월 무료시간, 초과 시간당 요금, 활성 여부)을 읽기/편집한다.
import { computed, onMounted, ref, watch } from 'vue'
import { useVisitorVehicleStore } from '@/stores/useVisitorVehicleStore'
import { useComplexStore } from '@/stores/useComplexStore'
import { useAuthStore } from '@/stores/useAuthStore'

const visitorStore = useVisitorVehicleStore()
const complexStore = useComplexStore()
const authStore = useAuthStore()

const loading = ref(false)
const loadError = ref('')
const editing = ref(false)
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

// 편집용 입력값, 입력 바인딩을 위해 문자열로 보관
const monthlyLimitHoursInput = ref('')
const hourFeeInput = ref('')
const isActiveInput = ref(true)

// 저장된 방문 정책
const currentPolicy = computed(() => visitorStore.visitorPolicy)

// 정책 설정 여부 (월 무료시간과 시간당 요금이 모두 존재할 때만 설정으로 간주)
const hasPolicy = computed(() => {
  const policy = currentPolicy.value
  return policy != null && policy.monthlyLimitHours != null && policy.hourFee != null
})

// 정책 활성 여부
const isActivePolicy = computed(() => hasPolicy.value && currentPolicy.value?.isActive === true)

// 상태 배지 문구
const statusBadge = computed(() => {
  if (!hasPolicy.value) return '정책 미설정'
  return isActivePolicy.value ? '정책 사용 중' : '정책 비활성'
})

// 천 단위 표기 변환
const formatNumber = (value) => Number(value || 0).toLocaleString()

// 입력값 유효성 (월 무료시간 0 이상 정수, 시간당 요금 0 이상)
const inputValid = computed(() => {
  const limit = Number(monthlyLimitHoursInput.value)
  const fee = Number(hourFeeInput.value)
  if (monthlyLimitHoursInput.value === '' || !Number.isInteger(limit) || limit < 0) return false
  if (hourFeeInput.value === '' || Number.isNaN(fee) || fee < 0) return false
  return true
})

// 현재 방문 정책 조회
const loadPolicy = async () => {
  loading.value = true
  loadError.value = ''
  saveError.value = ''
  saveSuccess.value = false
  editing.value = false
  await visitorStore.fetchVisitorPolicy()
  if (visitorStore.error) loadError.value = '방문차량 요금 정책을 불러오지 못했습니다.'
  loading.value = false
}

// 수정 모드 진입, 현재 정책을 입력값으로 복사
const startEdit = () => {
  const policy = currentPolicy.value
  monthlyLimitHoursInput.value = policy?.monthlyLimitHours == null ? '' : String(policy.monthlyLimitHours)
  hourFeeInput.value = policy?.hourFee == null ? '' : String(policy.hourFee)
  isActiveInput.value = policy?.isActive == null ? true : policy.isActive === true
  saveError.value = ''
  saveSuccess.value = false
  editing.value = true
}

// 수정 취소, 편집 내용 폐기
const cancelEdit = () => {
  editing.value = false
  saveError.value = ''
}

// 방문 정책 저장 후 재조회로 최신 반영
const handleSave = async () => {
  if (saving.value) return
  if (!inputValid.value) {
    saveError.value = '월 무료시간은 0 이상의 정수, 초과 시간당 요금은 0 이상으로 입력해주세요.'
    return
  }
  saving.value = true
  saveError.value = ''
  await visitorStore.saveVisitorPolicy({
    hourFee: Number(hourFeeInput.value),
    monthlyLimitHours: Number(monthlyLimitHoursInput.value),
    isActive: isActiveInput.value,
  })
  saving.value = false
  if (visitorStore.error) {
    saveError.value = '방문차량 요금 정책 저장에 실패했습니다.'
    return
  }
  editing.value = false
  await visitorStore.fetchVisitorPolicy()
  saveSuccess.value = true
}

// 마운트 시 방문 정책 조회
onMounted(async () => {
  await loadPolicy()
})

// MASTER 단지 전환 시 방문 정책 재조회
watch(
  () => complexStore.selectedComplex?.complexId,
  async (nextComplexId, prevComplexId) => {
    if (authStore.role !== 'MASTER' || !nextComplexId || nextComplexId === prevComplexId) return
    await loadPolicy()
  },
)
</script>

<template>
  <article class="panel">
    <div class="panel-header">
      <div>
        <h3 class="panel-title">방문차량 요금 정책</h3>
        <div class="panel-meta">
          <span class="meta-tag">단지 단위</span>
          <span class="meta-tag">월 무료시간 / 초과 시간당 요금</span>
        </div>
      </div>
      <span :class="['policy-status-badge', isActivePolicy ? 'badge--active' : 'badge--inactive']">
        {{ statusBadge }}
      </span>
    </div>

    <p class="section-desc">월 기본 제공(무료) 시간과 이를 초과한 분에 부과할 시간당 요금을 설정합니다.</p>

    <div v-if="loading" class="empty-box">방문차량 요금 정책을 불러오는 중...</div>
    <div v-else-if="loadError" class="error-box">{{ loadError }}</div>

    <template v-else>
      <!-- 읽기 모드 -->
      <template v-if="!editing">
        <div v-if="hasPolicy" class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">월 무료시간</span>
            <span class="detail-value">{{ formatNumber(currentPolicy.monthlyLimitHours) }}시간</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">초과 시간당 요금</span>
            <span class="detail-value">{{ formatNumber(currentPolicy.hourFee) }}원 / 시간</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">활성 여부</span>
            <span class="detail-value">{{ isActivePolicy ? '사용' : '미사용' }}</span>
          </div>
        </div>
        <div v-else class="empty-box">
          등록된 방문차량 요금 정책이 없습니다. 수정 버튼을 눌러 정책을 등록해주세요.
        </div>

        <p v-if="saveSuccess" class="success-box">방문차량 요금 정책이 저장되었습니다.</p>

        <div class="button-row">
          <button class="btn-primary" type="button" @click="startEdit">수정</button>
        </div>
      </template>

      <!-- 편집 모드 -->
      <template v-else>
        <div class="edit-fields">
          <div class="limit-field">
            <label class="limit-label">월 무료시간</label>
            <div class="input-suffix-wrap limit-input">
              <input v-model="monthlyLimitHoursInput" type="number" min="0" step="1" placeholder="예) 300" />
              <span class="input-suffix">시간</span>
            </div>
          </div>
          <div class="limit-field">
            <label class="limit-label">초과 시간당 요금</label>
            <div class="input-suffix-wrap limit-input">
              <input v-model="hourFeeInput" type="number" min="0" step="100" placeholder="예) 1000" />
              <span class="input-suffix">원</span>
            </div>
          </div>
          <div class="limit-field">
            <label class="limit-label">활성 여부</label>
            <label class="active-toggle">
              <input v-model="isActiveInput" type="checkbox" />
              <span>{{ isActiveInput ? '사용' : '미사용' }}</span>
            </label>
          </div>
        </div>

        <p v-if="saveError" class="error-box">{{ saveError }}</p>

        <div class="button-row">
          <button class="btn-secondary" type="button" @click="cancelEdit">취소</button>
          <button class="btn-primary" type="button" :disabled="saving || !inputValid" @click="handleSave">
            {{ saving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </template>
    </template>
  </article>
</template>

<style scoped>
/* VehiclePolicyTab "세대당 등록 한도" 패널과 동일 톤 (scoped라 자체 정의) */
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

.section-desc {
  margin: 0;
  font-size: 13px;
  color: #687282;
}

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

.edit-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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

.input-suffix-wrap {
  position: relative;
}

.input-suffix-wrap input[type="number"] {
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

.active-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #2B3A55;
  font-weight: 600;
  cursor: pointer;
}

.active-toggle input {
  width: 16px;
  height: 16px;
}

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
</style>
