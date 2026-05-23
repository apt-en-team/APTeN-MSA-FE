<script setup>
import { onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFacilityStore } from '@/stores/useFacilityStore.js'
import { useAuthStore } from '@/stores/useAuthStore.js'

import BaseModal from '@/components/common/BaseModal.vue'
import ActionResultModal from '@/components/common/ActionResultModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { toList } from '@/utils/apiResponse'

const props = defineProps({
  facilities: {
    type: Array,
    default: null,
  },
})

const router = useRouter()
const facilityStore = useFacilityStore()
const authStore = useAuthStore()

// 처리 시각 텍스트
const getCurrentTimeText = () =>
  new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })

// 처리자명
const getCurrentActorName = () =>
  authStore.userInfo?.name || authStore.user?.name || authStore.name || '관리자'

// 목록·필터·페이지 상태
const state = reactive({
  list: [],
  currentPage: 1,
  pageSize: 8,
  errorMessage: '',
  searchQuery: '',
  filterStatus: '',
  filterType: '',
})

// 상세 모달 상태
const detailModal = reactive({ show: false, facility: null })

// 좌석 목록·로딩 상태 (SEAT 타입 상세 모달 내부)
const seatState = reactive({
  list: [],
  loading: false,
  errorMessage: '',
})

// 좌석 등록·수정 폼 모달 상태
const seatFormModal = reactive({
  show: false,
  mode: 'create',
  loading: false,
  errorMessage: '',
  seatId: '',
  seatNo: '',
  seatName: '',
  isActive: true,
})

// 처리 결과 모달 상태 (규칙 패턴 전체 필드)
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

// ── 정규화 ──────────────────────────────────────────────────────

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

const normalizeSeats = (response) =>
  toList(response).map((seat) => ({
    ...seat,
    id: seat.seatId ?? seat.id,
    seatId: seat.seatId ?? seat.id,
    seatNo: seat.seatNo ?? '',
    seatName: seat.seatName ?? '',
    isActive: seat.isActive !== false,
  }))

// ── computed ────────────────────────────────────────────────────

const sourceList = computed(() => props.facilities ?? state.list)

const facilityList = computed(() =>
  sourceList.value.map((f) => ({
    ...f,
    facilityId: f.facilityId ?? f.facilityUid ?? f.id,
    reservationType: normalizeReservationType(f.reservationType),
  }))
)

// 검색·필터 적용
const filteredList = computed(() =>
  facilityList.value.filter((f) => {
    const matchSearch = !state.searchQuery || f.name.includes(state.searchQuery)
    const matchStatus =
      !state.filterStatus ||
      (state.filterStatus === 'active' && f.isActive) ||
      (state.filterStatus === 'inactive' && !f.isActive)
    const matchType = !state.filterType || f.reservationType === state.filterType
    return matchSearch && matchStatus && matchType
  })
)

// 현재 페이지 슬라이스
const pagedList = computed(() => {
  const start = (state.currentPage - 1) * state.pageSize
  return filteredList.value.slice(start, start + state.pageSize)
})

const maxPage = computed(() => Math.ceil(filteredList.value.length / state.pageSize) || 1)

const isSeatFacility = (facility) =>
  normalizeReservationType(facility?.reservationType) === 'SEAT'

// ── 표시 헬퍼 ──────────────────────────────────────────────────

// 오늘 차단이 있으면 "점검중" 우선 표시
const statusLabel = (f) => {
  if (f?.isTodayBlocked && f?.isActive) return '점검중'
  return f?.isActive ? '운영 중' : '운영 중단'
}
const statusClass = (f) => {
  if (f?.isTodayBlocked && f?.isActive) return 'maintenance'
  return f?.isActive ? 'active' : 'inactive'
}
const formatTime = (t) => (t ? String(t).slice(0, 5) : '-')
const formatPrice = (p) => (!p || p === 0 ? '무료' : Number(p).toLocaleString() + '원')
const seatStatusLabel = (isActive) => (isActive ? '활성' : '비활성')
const seatStatusClass = (isActive) => (isActive ? 'active' : 'inactive')

const reservationTypeLabel = (type) =>
  ({ SEAT: '좌석형', COUNT: '정원형', APPROVAL: '승인형' }[type] || type || '-')

// ── stacked bar 계산 ───────────────────────────────────────────

// "HH:mm:ss" 또는 "HH:mm" → 분 변환
const timeToMin = (t) => {
  if (!t) return 0
  const parts = String(t).split(':')
  return Number(parts[0]) * 60 + Number(parts[1] || 0)
}

// 오늘 전체 예약 가능 수: slotMin이 있으면 슬롯×maxCount, 없으면 maxCount
const getTotalDailyCapacity = (f) => {
  if (!f.maxCount) return 0
  if (!f.slotMin) return f.maxCount
  const openMin = timeToMin(f.openTime)
  const closeMin = timeToMin(f.closeTime)
  if (closeMin <= openMin) return 0
  return Math.floor((closeMin - openMin) / f.slotMin) * f.maxCount
}

// 오늘 예약 비율 (0~100) — 점검중이거나 비활성이면 0
const getReservedRatio = (f) => {
  if (!f.isActive || f.isTodayBlocked) return 0
  const count = f.todayReservedCount ?? 0
  const total = getTotalDailyCapacity(f)
  if (!total) return 0
  return Math.min(Math.round((count / total) * 100), 100)
}

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

// ── 데이터 조회 ────────────────────────────────────────────────

// props.facilities가 있으면 부모에서 데이터를 받으므로 자체 조회 생략
const fetchAll = async () => {
  if (props.facilities !== null) return
  state.errorMessage = ''
  try {
    const result = await facilityStore.fetchAdminFacilities()
    state.list = normalizeFacilities(result)
  } catch (error) {
    console.error('시설 목록 조회 실패:', error)
    state.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '시설 목록을 불러오지 못했습니다.'
  }
}

// ── 필터 ───────────────────────────────────────────────────────

const resetFilters = () => {
  state.searchQuery = ''
  state.filterStatus = ''
  state.filterType = ''
  state.currentPage = 1
}

// ── 상세 모달 ──────────────────────────────────────────────────

const openDetail = async (f) => {
  try {
    const detail = await facilityStore.fetchAdminFacilityDetail(f.facilityId)
    detailModal.facility = detail
    seatState.list = []
    seatState.errorMessage = ''
    detailModal.show = true
    // SEAT 타입이면 좌석 목록 함께 조회
    if (isSeatFacility(detail)) {
      await fetchSeats(detail.facilityId)
    }
  } catch (error) {
    console.error('시설 상세 조회 실패:', error)
  }
}

const closeDetail = () => {
  detailModal.show = false
  detailModal.facility = null
  seatState.list = []
  seatState.errorMessage = ''
}

// 상세 모달 닫고 수정 화면으로 이동
const goEdit = (id) => {
  closeDetail()
  router.push(`/admin/facilities/${id}/edit`)
}

const goToPage = (page) => {
  state.currentPage = page
}

// ── 좌석 관리 ──────────────────────────────────────────────────

const fetchSeats = async (facilityId = detailModal.facility?.facilityId) => {
  if (!facilityId) return
  seatState.loading = true
  seatState.errorMessage = ''
  try {
    const result = await facilityStore.fetchFacilitySeats(facilityId)
    seatState.list = normalizeSeats(result)
  } catch (error) {
    console.error('시설 좌석 목록 조회 실패:', error)
    seatState.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '좌석 목록을 불러오지 못했습니다.'
  } finally {
    seatState.loading = false
  }
}

const openCreateSeatModal = () => {
  seatFormModal.mode = 'create'
  seatFormModal.seatId = ''
  seatFormModal.seatNo = ''
  seatFormModal.seatName = ''
  seatFormModal.isActive = true
  seatFormModal.errorMessage = ''
  seatFormModal.show = true
}

const openEditSeatModal = (seat) => {
  seatFormModal.mode = 'edit'
  seatFormModal.seatId = seat.seatId
  seatFormModal.seatNo = seat.seatNo
  seatFormModal.seatName = seat.seatName || ''
  seatFormModal.isActive = seat.isActive !== false
  seatFormModal.errorMessage = ''
  seatFormModal.show = true
}

const closeSeatFormModal = () => {
  seatFormModal.show = false
  seatFormModal.errorMessage = ''
}

// resultModal 오픈 헬퍼 (규칙 패턴)
const openResultModal = ({
  type = 'success', title, subtitle = '', desc = '',
  itemName = '', time = '', actionLabel = '', actor = '', afterConfirm = null,
} = {}) => {
  Object.assign(resultModal, { show: true, type, title, subtitle, desc, itemName, time, actionLabel, actor, afterConfirm })
}

// 확인 클릭 후 afterConfirm 콜백 실행
const handleResultConfirm = async () => {
  const callback = resultModal.afterConfirm
  resultModal.show = false
  resultModal.afterConfirm = null
  if (typeof callback === 'function') await callback()
}

const submitSeatForm = async () => {
  seatFormModal.errorMessage = ''

  if (seatFormModal.mode === 'create' && !seatFormModal.seatNo) {
    seatFormModal.errorMessage = '좌석 번호를 입력해주세요.'
    return
  }

  seatFormModal.loading = true
  try {
    if (seatFormModal.mode === 'create') {
      await facilityStore.createFacilitySeat(detailModal.facility.facilityId, {
        seatNo: Number(seatFormModal.seatNo),
        seatName: String(seatFormModal.seatName || '').trim(),
        isActive: !!seatFormModal.isActive,
      })
      openResultModal({
        type: 'success',
        title: '좌석이 등록되었습니다.',
        itemName: `${seatFormModal.seatNo}번 좌석`,
        actionLabel: '좌석 등록',
        time: getCurrentTimeText(),
        actor: getCurrentActorName(),
        afterConfirm: () => fetchSeats(),
      })
    } else {
      // 백엔드 수정 API는 좌석 번호 변경을 지원하지 않으므로 이름·활성 여부만 전송
      await facilityStore.updateFacilitySeat(seatFormModal.seatId, {
        seatName: String(seatFormModal.seatName || '').trim(),
        isActive: !!seatFormModal.isActive,
      })
      openResultModal({
        type: 'success',
        title: '좌석이 수정되었습니다.',
        itemName: `${seatFormModal.seatNo}번 좌석`,
        actionLabel: '좌석 수정',
        time: getCurrentTimeText(),
        actor: getCurrentActorName(),
        afterConfirm: () => fetchSeats(),
      })
    }
    closeSeatFormModal()
  } catch (error) {
    seatFormModal.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      '좌석 저장에 실패했습니다.'
    openResultModal({
      type: 'danger',
      title: '좌석 저장에 실패했습니다.',
      subtitle: seatFormModal.errorMessage,
    })
  } finally {
    seatFormModal.loading = false
  }
}

onMounted(() => {
  fetchAll()
})
</script>

<template>
  <div class="facility-manage-view">

    <!-- ── 필터 바 ── -->
    <div class="filter-bar">
      <div class="search-wrap">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="state.searchQuery"
          class="search-input"
          placeholder="시설명 검색"
          @input="state.currentPage = 1"
        />
      </div>
      <select v-model="state.filterStatus" class="filter-select" @change="state.currentPage = 1">
        <option value="">운영 상태</option>
        <option value="active">운영 중</option>
        <option value="inactive">중단</option>
      </select>
      <select v-model="state.filterType" class="filter-select" @change="state.currentPage = 1">
        <option value="">예약 방식</option>
        <option value="SEAT">좌석형</option>
        <option value="COUNT">정원형</option>
        <option value="APPROVAL">승인형</option>
      </select>
      <button class="btn-reset" type="button" @click="resetFilters">초기화</button>
    </div>

    <div class="table-section">
      <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

      <!-- ── 시설 카드 그리드 ── -->
      <div class="facility-grid">
        <div
          v-for="f in pagedList"
          :key="f.facilityId"
          class="facility-card"
          :class="{ inactive: !f.isActive, 'maintenance-card': f.isTodayBlocked && f.isActive }"
          @click="openDetail(f)"
        >
          <!-- 카드 헤더 -->
          <div class="card-header">
            <div class="card-title-wrap">
              <div class="card-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <div>
                <div class="card-name">{{ f.name }}</div>
                <div class="card-id">ID #{{ f.facilityId }}</div>
              </div>
            </div>
            <span :class="['status-badge', statusClass(f)]">{{ statusLabel(f) }}</span>
          </div>

          <!-- 카드 본문 -->
          <div class="card-body">
            <!-- 공통: 운영 시간 + 최대 인원 -->
            <div class="card-info-row">
              <div class="card-info">
                <span class="info-label">운영 시간</span>
                <span class="info-value">{{ formatTime(f.openTime) }} ~ {{ formatTime(f.closeTime) }}</span>
              </div>
              <div v-if="f.maxCount" class="card-info">
                <span class="info-label">최대 인원</span>
                <span class="info-value">{{ f.maxCount }}명</span>
              </div>
            </div>

            <!-- SEAT / COUNT: 예약 단위 + 요금 + stacked bar -->
            <template v-if="f.reservationType !== 'APPROVAL'">
              <div class="card-info-row">
                <div v-if="f.reservationUnitLabel || f.slotMin" class="card-info">
                  <span class="info-label">예약 단위</span>
                  <span class="info-value">{{ f.reservationUnitLabel || (f.slotMin ? f.slotMin + '분' : '-') }}</span>
                </div>
                <div v-if="f.baseFee != null" class="card-info">
                  <span class="info-label">기본 요금</span>
                  <span class="info-value">{{ formatPrice(f.baseFee) }}</span>
                </div>
              </div>

              <!-- 오늘 예약율 stacked bar (점검중·비활성이면 회색) -->
              <div class="stacked-bar-wrap">
                <div class="stacked-bar">
                  <div
                    class="bar-segment bar-reserved"
                    :style="{
                      width: (f.isActive && !f.isTodayBlocked) ? getReservedRatio(f) + '%' : '0%',
                      background: getBarColor(getReservedRatio(f)),
                    }"
                  ></div>
                  <div
                    class="bar-segment bar-remaining"
                    :style="{
                      width: (f.isActive && !f.isTodayBlocked) ? (100 - getReservedRatio(f)) + '%' : '100%',
                      background: (f.isActive && !f.isTodayBlocked) ? getRemainingColor(getReservedRatio(f)) : '#E2E8F0',
                    }"
                  ></div>
                </div>
                <div class="stacked-bar-legend">
                  <template v-if="f.isTodayBlocked && f.isActive">
                    <span class="legend-item">
                      <span class="legend-dot" style="background: #A0AEC0"></span>
                      점검 중 (예약 차단)
                    </span>
                  </template>
                  <template v-else>
                    <span class="legend-item">
                      <span class="legend-dot" :style="{ background: f.isActive ? getBarColor(getReservedRatio(f)) : '#A0AEC0' }"></span>
                      오늘 예약 {{ f.isActive ? (f.todayReservedCount ?? 0) : 0 }}건 ({{ f.isActive ? getReservedRatio(f) : 0 }}%)
                    </span>
                    <span class="legend-item">
                      <span class="legend-dot" :style="{ background: f.isActive ? getRemainingColor(getReservedRatio(f)) : '#E2E8F0' }"></span>
                      잔여 {{ f.isActive ? 100 - getReservedRatio(f) : 0 }}%
                    </span>
                  </template>
                </div>
              </div>
            </template>

            <!-- APPROVAL: 안내 배지 -->
            <template v-else>
              <div class="approval-notice">
                <span class="approval-badge">승인형 예약</span>
              </div>
            </template>
          </div>

          <!-- 상세 모달에서 수정 진행하므로 카드 액션 없음 -->
        </div>

        <div v-if="pagedList.length === 0" class="empty">등록된 시설이 없습니다.</div>
      </div>

      <AppPagination
        :currentPage="state.currentPage"
        :maxPage="maxPage"
        :totalAll="facilityList.length"
        :totalFiltered="filteredList.length"
        unit="개"
        @change="goToPage"
      />
    </div>

    <!-- ── 시설 상세 모달 ── -->
    <BaseModal
      class="facility-detail-modal"
      :visible="detailModal.show"
      title="시설 상세 정보"
      :subtitle="detailModal.facility ? 'ID #' + detailModal.facility.facilityId : ''"
      @close="closeDetail"
    >
      <div class="detail-modal-content">

        <!-- 히어로: 상태 배지 + 시설명 -->
        <div class="detail-hero">
          <span :class="['detail-status-badge', statusClass(detailModal.facility)]">
            {{ statusLabel(detailModal.facility) }}
          </span>
          <h2 class="detail-title">{{ detailModal.facility?.name }}</h2>
          <p class="detail-sub">시설 정보</p>
        </div>

        <div class="detail-divider"></div>

        <!-- 기본 정보 그리드 -->
        <div class="detail-grid">
          <div class="detail-cell">
            <span class="detail-cell-label">시설 ID</span>
            <span class="detail-cell-value">#{{ detailModal.facility?.facilityId }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">등록일</span>
            <span class="detail-cell-value">{{ detailModal.facility?.createdAt?.slice(0, 10) ?? '-' }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">예약 방식</span>
            <span class="detail-cell-value">{{ reservationTypeLabel(detailModal.facility?.reservationType) }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">운영 시간</span>
            <span class="detail-cell-value">
              {{ formatTime(detailModal.facility?.openTime) }} ~ {{ formatTime(detailModal.facility?.closeTime) }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">최대 인원</span>
            <span class="detail-cell-value">
              {{ detailModal.facility?.maxCount ? detailModal.facility.maxCount + '명' : '-' }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">예약 단위</span>
            <span class="detail-cell-value">
              {{ detailModal.facility?.reservationUnitLabel || (detailModal.facility?.slotMin ? detailModal.facility.slotMin + '분' : '-') }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">기본 요금</span>
            <span class="detail-cell-value">
              {{ detailModal.facility?.baseFee != null ? formatPrice(detailModal.facility.baseFee) : '-' }}
            </span>
          </div>
          <div v-if="detailModal.facility?.maxReservationCount != null" class="detail-cell">
            <span class="detail-cell-label">예약 제한</span>
            <span class="detail-cell-value">{{ detailModal.facility.maxReservationCount }}건</span>
          </div>
        </div>

        <!-- 시설 설명 (있을 때만 노출) -->
        <template v-if="detailModal.facility?.description">
          <div class="detail-divider"></div>
          <div class="detail-desc-section">
            <span class="detail-cell-label">시설 설명</span>
            <p class="detail-desc-text">{{ detailModal.facility.description }}</p>
          </div>
        </template>

        <!-- 좌석 관리 (SEAT 타입만 노출) -->
        <template v-if="isSeatFacility(detailModal.facility)">
          <div class="detail-divider"></div>

          <section class="seat-section">
            <div class="seat-section__header">
              <div class="detail-section-title">좌석 관리</div>
              <button class="btn-submit" type="button" @click="openCreateSeatModal">
                + 좌석 추가
              </button>
            </div>

            <div v-if="seatState.errorMessage" class="error-box seat-section__error">
              {{ seatState.errorMessage }}
            </div>
            <div v-if="seatState.loading" class="seat-section__loading">좌석 조회 중...</div>
            <div v-else-if="seatState.list.length === 0" class="detail-empty">등록된 좌석이 없습니다.</div>
            <div v-else class="seat-list-scroll">
              <div v-for="seat in seatState.list" :key="seat.seatId" class="seat-row">
                <div class="seat-avatar">{{ seat.seatNo }}</div>
                <div class="seat-info">
                  <span class="seat-name">{{ seat.seatName || `${seat.seatNo}번 좌석` }}</span>
                  <span class="seat-contact">좌석 번호 #{{ seat.seatNo }}</span>
                </div>
                <span :class="['seat-tag', seatStatusClass(seat.isActive)]">
                  {{ seatStatusLabel(seat.isActive) }}
                </span>
                <button class="btn-card-action" type="button" @click.stop="openEditSeatModal(seat)">수정</button>
              </div>
            </div>
          </section>
        </template>
      </div>

      <template #footer>
        <button class="btn-cancel" type="button" @click="closeDetail">닫기</button>
        <button class="btn-submit" @click="goEdit(detailModal.facility?.facilityId)">수정하기</button>
      </template>
    </BaseModal>

    <!-- ── 좌석 등록·수정 모달 ── -->
    <BaseModal
      :visible="seatFormModal.show"
      :title="seatFormModal.mode === 'create' ? '좌석 등록' : '좌석 수정'"
      :subtitle="detailModal.facility?.name || ''"
      @close="closeSeatFormModal"
    >
      <div class="seat-form">
        <label class="seat-form__field">
          <span class="seat-form__label">좌석 번호</span>
          <input
            v-model="seatFormModal.seatNo"
            class="seat-form__input"
            type="number"
            min="1"
            :disabled="seatFormModal.mode === 'edit'"
            placeholder="예: 1"
          />
          <small v-if="seatFormModal.mode === 'edit'" class="seat-form__help">
            좌석 번호 변경은 수정 API에서 지원하지 않아 읽기 전용입니다.
          </small>
        </label>
        <label class="seat-form__field">
          <span class="seat-form__label">좌석명</span>
          <input v-model="seatFormModal.seatName" class="seat-form__input" type="text" placeholder="예: 창가 1번 좌석" />
        </label>
        <label class="seat-form__toggle">
          <input v-model="seatFormModal.isActive" type="checkbox" />
          <span>활성 좌석으로 운영</span>
        </label>
        <p v-if="seatFormModal.errorMessage" class="seat-form__error">{{ seatFormModal.errorMessage }}</p>
      </div>
      <template #footer>
        <button class="btn-cancel" type="button" @click="closeSeatFormModal">취소</button>
        <button class="btn-submit" type="button" :disabled="seatFormModal.loading" @click="submitSeatForm">
          {{ seatFormModal.loading ? '저장 중...' : '저장' }}
        </button>
      </template>
    </BaseModal>

    <!-- ── 처리 결과 모달 ── -->
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
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.facility-manage-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'Noto Sans KR', sans-serif;
  color: #333;
}

/* ── 필터 바 ── */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.search-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 7px 12px;
  gap: 6px;
  background: #f5f6f8;
}
.search-icon { color: #a0aec0; flex-shrink: 0; }
.search-input {
  border: none;
  background: transparent;
  font-size: 13px;
  outline: none;
  color: #333;
  width: 150px;
}
.search-input::placeholder { color: #cbd5e0; }
.filter-select {
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 0 28px 0 12px;
  font-size: 13px;
  color: #333;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 10px center;
  appearance: none;
  cursor: pointer;
  outline: none;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-reset {
  height: 36px;
  padding: 0 14px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-reset:hover { background: #f5f6f8; }

/* ── 목록 섹션 ── */
.table-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.error-box {
  margin: 20px 20px 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
}

/* ── 카드 그리드 ── */
.facility-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding: 20px;
}
.facility-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.facility-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-color: #2b3a55;
}
.facility-card.inactive {
  background: #ebf0f6;
  opacity: 0.85;
}
.empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px;
  color: #a0aec0;
  font-size: 13px;
}

/* ── 카드 헤더 ── */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
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
.card-title-wrap > div { min-width: 0; overflow: hidden; }
.card-name {
  font-size: 15px;
  font-weight: 700;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-id {
  font-size: 11px;
  color: #687282;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.status-badge.active { background: #ebf5ee; color: #4d8b5a; }
.status-badge.inactive { background: #e0e0e0; color: #4a5568; }
.status-badge.maintenance { background: #fef3cd; color: #b7791f; }

/* 점검중 카드 테두리 강조 */
.facility-card.maintenance-card {
  border-color: #f6d860;
  background: #fffdf0;
}

/* ── 카드 본문 ── */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.card-info-row {
  display: flex;
  gap: 12px 20px;
  flex-wrap: wrap;
}
.card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
  min-width: 80px;
}
.info-label { font-size: 11px; color: #687282; white-space: nowrap; }
.info-value {
  font-size: 13px;
  font-weight: 600;
  color: #1a202c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 승인형 안내 ── */
.approval-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}
.approval-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: #ebf4ff;
  color: #3182ce;
}

/* ── stacked bar ── */
.stacked-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stacked-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: #e2e8f0;
}
.bar-segment {
  transition: width 0.4s ease, background 0.4s ease;
}
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

/* ── 카드 액션 ── */
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding-top: 2px;
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
.btn-card-action:hover { background: #f5f6f8; }

/* ── 시설 상세 모달 ── */
.facility-detail-modal :deep(.base-modal__content) {
  display: flex;
  flex-direction: column;
  width: min(860px, calc(100vw - 40px));
  max-height: calc(100vh - 48px);
  overflow: hidden;
  border-radius: 22px;
}
.facility-detail-modal :deep(.base-modal__header) {
  flex-shrink: 0;
  padding: 34px 36px 14px;
  border-bottom: 1px solid #e2e8f0;
}
.facility-detail-modal :deep(.base-modal__title) {
  color: #2d3748;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.facility-detail-modal :deep(.base-modal__subtitle) {
  margin-top: 6px;
  color: #6b7a90;
  font-size: 13px;
  font-weight: 600;
}
.facility-detail-modal :deep(.base-modal__close) {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #f3f6fa;
  color: transparent;
  font-size: 0;
  position: relative;
}
.facility-detail-modal :deep(.base-modal__close::before),
.facility-detail-modal :deep(.base-modal__close::after) {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22px;
  height: 2.5px;
  border-radius: 999px;
  background: #64748b;
}
.facility-detail-modal :deep(.base-modal__close::before) {
  transform: translate(-50%, -50%) rotate(45deg);
}
.facility-detail-modal :deep(.base-modal__close::after) {
  transform: translate(-50%, -50%) rotate(-45deg);
}
.facility-detail-modal :deep(.base-modal__body) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 22px 36px 26px;
}
.facility-detail-modal :deep(.base-modal__footer) {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 28px;
  border-top: 1px solid #e2e8f0;
  background: #fff;
}

/* ── 모달 내부 콘텐츠 ── */
.detail-modal-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.detail-hero { margin-bottom: 14px; }
.detail-status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
}
.detail-status-badge.active { background: #c6f6d5; color: #276749; }
.detail-status-badge.inactive { background: #e5e7eb; color: #718096; }
.detail-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 4px;
}
.detail-sub { font-size: 13px; color: #687282; }
.detail-divider { height: 1px; background: #e2e8f0; margin: 16px 0; }
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}
.detail-cell { display: flex; flex-direction: column; gap: 4px; }
.detail-cell-label { font-size: 12px; color: #687282; }
.detail-cell-value { font-size: 14px; font-weight: 500; color: #1a202c; }

/* ── 시설 설명 ── */
.detail-desc-section { display: flex; flex-direction: column; gap: 6px; }
.detail-desc-text { font-size: 13px; color: #4a5568; line-height: 1.7; }

/* ── 좌석 섹션 ── */
.seat-section { display: flex; flex-direction: column; gap: 0; }
.seat-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.detail-section-title { font-size: 13px; font-weight: 600; color: #687282; }
.seat-section__error { margin: 0; }
.seat-section__loading {
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #687282;
  font-size: 13px;
  text-align: center;
}
.detail-empty { font-size: 13px; color: #687282; text-align: center; padding: 16px 0; }
.seat-list-scroll {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 12px;
}
.seat-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f6f8;
}
.seat-row:last-child { border-bottom: none; }
.seat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2b3a55;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.seat-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.seat-name { font-size: 14px; font-weight: 600; color: #1a202c; }
.seat-contact { font-size: 12px; color: #687282; }
.seat-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}
.seat-tag.active { color: #276749; background: #c6f6d5; }
.seat-tag.inactive { color: #4a5568; background: #e2e8f0; }

/* ── 좌석 폼 ── */
.seat-form { display: flex; flex-direction: column; gap: 14px; }
.seat-form__field { display: flex; flex-direction: column; gap: 6px; }
.seat-form__label { color: #4a5568; font-size: 12px; font-weight: 700; }
.seat-form__input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  color: #1a202c;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
}
.seat-form__input:disabled { background: #f5f6f8; color: #718096; }
.seat-form__help { color: #a0aec0; font-size: 11px; }
.seat-form__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a5568;
  font-size: 13px;
  font-weight: 600;
}
.seat-form__error { margin: 0; color: #e53e3e; font-size: 12px; }

/* ── 공통 버튼 ── */
.btn-cancel {
  padding: 9px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-cancel:hover { background: #f5f6f8; }
.btn-submit {
  padding: 9px 24px;
  background: #2b3a55;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
.btn-submit:hover { background: #1e2a3e; }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── 반응형 ── */
@media (max-width: 1100px) {
  .facility-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .facility-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .facility-detail-modal :deep(.base-modal__content) {
    width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
  }
  .detail-grid { grid-template-columns: 1fr; }
  .seat-section__header { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 480px) {
  .facility-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
