<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import { getMySubscriptions, cancelFacilitySubscription } from '@/api/facilityApi.js'

const route = useRoute()
const router = useRouter()

const state = reactive({
  list: [],
  loading: false,
  errorMessage: '',
})

// 해지 대상 facilityId를 보관한다.
const cancelModal = reactive({ show: false, facilityId: null, facilityName: '' })
const resultModal = reactive({ show: false, type: 'success', title: '', subtitle: '' })

const goToFacility = () => {
  router.push(`/resident/${route.params.complexId}/facility`)
}

const formatDate = (d) => (d ? String(d).replaceAll('-', '.') : '-')

// 구독 상태 한글 + 스타일 키 변환 (API가 EnumMapperType @JsonValue 값으로 내려줄 경우 대비)
const statusLabel = (s) => {
  if (!s) return '-'
  const v = String(s)
  if (v === 'ACTIVE' || v === '구독중') return '구독 중'
  if (v === 'CANCELLED' || v === '해지') return '해지'
  return v
}
const isActive = (s) => {
  const v = String(s || '')
  return v === 'ACTIVE' || v === '구독중'
}

// feeType 한글 변환
const feeTypeLabel = (t) => {
  if (!t) return '-'
  const v = String(t)
  if (v === 'FLAT') return '월정액'
  if (v === 'PER_PERSON') return '인당 정액'
  if (v === 'PER_USE') return '건당 요금'
  return v
}

const activeSubs = computed(() => state.list.filter(s => isActive(s.status)))
const cancelledSubs = computed(() => state.list.filter(s => !isActive(s.status)))

const openCancelModal = (sub) => {
  cancelModal.facilityId = sub.facilityId
  cancelModal.facilityName = sub.facilityName
  cancelModal.show = true
}

const executeCancel = async () => {
  const facilityId = cancelModal.facilityId
  cancelModal.show = false
  try {
    await cancelFacilitySubscription(facilityId)
    resultModal.type = 'success'
    resultModal.title = '구독이 해지되었습니다.'
    resultModal.subtitle = '다음 달부터 요금이 청구되지 않습니다.'
    await fetchSubscriptions()
  } catch (e) {
    const msg = e?.response?.data?.resultMessage || '해지 처리 중 오류가 발생했습니다.'
    resultModal.type = 'danger'
    resultModal.title = '해지할 수 없습니다.'
    resultModal.subtitle = msg
  }
  resultModal.show = true
}

const fetchSubscriptions = async () => {
  state.loading = true
  state.errorMessage = ''
  try {
    const res = await getMySubscriptions()
    state.list = Array.isArray(res) ? res : []
  } catch (e) {
    state.errorMessage = e?.response?.data?.resultMessage || '구독 목록을 불러오지 못했습니다.'
  } finally {
    state.loading = false
  }
}

onMounted(() => {
  fetchSubscriptions()
})
</script>

<template>
  <div class="my-sub-view">
    <!-- 메인 탭 -->
    <div class="main-tabs">
      <button class="main-tab" type="button" @click="goToFacility">예약하기</button>
      <button class="main-tab" type="button" @click="router.push(`/resident/${route.params.complexId}/reservations`)">내 예약</button>
      <button class="main-tab is-active" type="button">나의 구독</button>
    </div>

    <!-- 로딩 -->
    <div v-if="state.loading" class="state-area">
      <p class="state-text">불러오는 중...</p>
    </div>

    <!-- 오류 -->
    <div v-else-if="state.errorMessage" class="state-area">
      <p class="state-text is-error">{{ state.errorMessage }}</p>
      <button class="btn-retry" type="button" @click="fetchSubscriptions">다시 시도</button>
    </div>

    <!-- 목록 없음 -->
    <div v-else-if="state.list.length === 0" class="state-area">
      <div class="empty-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      </div>
      <p class="state-text">구독 중인 시설이 없습니다.</p>
    </div>

    <!-- 구독 목록 -->
    <div v-else class="sub-list">
      <!-- 구독 중 -->
      <template v-if="activeSubs.length > 0">
        <p class="section-label">구독 중 ({{ activeSubs.length }})</p>
        <div
          v-for="sub in activeSubs"
          :key="sub.subscriptionId"
          class="sub-card is-active"
        >
          <div class="sub-card__info">
            <div class="sub-card__name">{{ sub.facilityName }}</div>
            <div class="sub-card__meta">
              <span class="tag">{{ feeTypeLabel(sub.feeType) }}</span>
              <span class="sub-date">{{ formatDate(sub.subscribedAt) }} 구독 시작</span>
            </div>
          </div>
          <div class="sub-card__right">
            <span class="status-badge is-active">구독 중</span>
            <button
              class="btn-cancel"
              type="button"
              @click="openCancelModal(sub)"
            >
              해지
            </button>
          </div>
        </div>
      </template>

      <!-- 해지된 구독 -->
      <template v-if="cancelledSubs.length > 0">
        <p class="section-label">해지된 구독 ({{ cancelledSubs.length }})</p>
        <div
          v-for="sub in cancelledSubs"
          :key="sub.subscriptionId"
          class="sub-card is-cancelled"
        >
          <div class="sub-card__info">
            <div class="sub-card__name">{{ sub.facilityName }}</div>
            <div class="sub-card__meta">
              <span class="tag">{{ feeTypeLabel(sub.feeType) }}</span>
              <span class="sub-date">{{ formatDate(sub.cancelledAt) }} 해지</span>
            </div>
          </div>
          <div class="sub-card__right">
            <span class="status-badge is-cancelled">해지</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 해지 확인 모달 -->
    <ResidentModal
      :visible="cancelModal.show"
      type="warning"
      title="구독을 해지하시겠습니까?"
      :subtitle="`${cancelModal.facilityName} 구독을 해지하면 다음 달부터 요금이 청구되지 않습니다.`"
      confirm-text="해지하기"
      cancel-text="취소"
      confirm-type="danger"
      @close="cancelModal.show = false"
      @confirm="executeCancel"
    />

    <!-- 해지 결과 모달 -->
    <ResidentModal
      :visible="resultModal.show"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      confirm-text="확인"
      :show-cancel="false"
      @close="resultModal.show = false"
      @confirm="resultModal.show = false"
    />
  </div>
</template>

<style scoped>
.my-sub-view {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 16px;
}

/* 메인 탭 */
.main-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  background: #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}

.main-tab {
  height: 40px;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: #718096;
  transition: background 0.15s, color 0.15s;
  font-family: 'Noto Sans KR', sans-serif;
}

.main-tab.is-active {
  background: #4973e5;
  color: #ffffff;
}

/* 섹션 레이블 */
.section-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  margin: 0 0 8px 2px;
}

/* 구독 목록 */
.sub-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 구독 카드 */
.sub-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(73, 115, 229, 0.07);
}

.sub-card.is-cancelled {
  opacity: 0.6;
}

.sub-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sub-card__name {
  font-size: 15px;
  font-weight: 700;
  color: #1a202c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 7px;
  background: #f1f5f9;
  border-radius: 5px;
  font-size: 11px;
  color: #718096;
  font-weight: 600;
}

.sub-date {
  font-size: 12px;
  color: #94a3b8;
}

.sub-card__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

/* 상태 뱃지 */
.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.status-badge.is-active {
  background: #e6f4ec;
  color: #2e7d52;
}

.status-badge.is-cancelled {
  background: #f1f5f9;
  color: #94a3b8;
}

/* 해지 버튼 */
.btn-cancel {
  padding: 5px 12px;
  background: transparent;
  border: 1.5px solid #e53e3e;
  color: #e53e3e;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
  transition: background 0.15s, color 0.15s;
}

.btn-cancel:active {
  background: #fff5f5;
}

/* 공통 상태 영역 */
.state-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 16px;
  gap: 12px;
}

.state-text {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  text-align: center;
}

.state-text.is-error {
  color: #e53e3e;
}

.empty-icon {
  color: #cbd5e1;
}

.btn-retry {
  padding: 8px 20px;
  background: #4973e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
</style>
