<script setup>
import { onBeforeUnmount, onMounted, reactive, computed, inject } from "vue";
import { useRouter } from "vue-router";
import { useFacilityStore } from "@/stores/useFacilityStore.js";

import StatsCards from "@/components/admin/StatsCards.vue";
import FilterBar from "@/components/admin/AdminFilterBar.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import Pagination from "@/components/common/AppPagination.vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import ActionResultModal from "@/components/common/ActionResultModal.vue";

const router = useRouter();
const facilityStore = useFacilityStore();
const registerOpenModal = inject("registerOpenModal", null);

// 시설 목록 화면 상태
const state = reactive({
  list: [],
  filterStatus: "",
  filterSlot: "",
  searchQuery: "",
  currentPage: 1,
  pageSize: 8,
  submitting: false,
});

// 상세 모달 상태
const detailModal = reactive({ show: false, facility: null });

// API 응답 데이터 정규화
const normalizeFacilities = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.data?.content)) return response.data.content;
  return [];
};

// 시설 카드 데이터 구성
const facilityList = computed(() =>
  state.list.map((f) => ({
    ...f,
    facilityId: f.facilityId ?? f.facilityUid ?? f.id,
    typeId: f.typeId ?? f.facilityTypeId ?? f.type?.id,
    typeName: f.typeName ?? f.type?.name ?? "-",
    maxCount: f.maxCount ?? f.maxCapacity ?? 0,
    slotMin: f.slotMin ?? f.slotDuration ?? 0,
    todayReserved: f.todayReserved ?? 0,
  }))
);

// 통계 카드 데이터
const activeCount = computed(() => facilityList.value.filter((f) => f.isActive).length);
const inactiveCount = computed(() => facilityList.value.filter((f) => f.isActive === false).length);

const statsCards = computed(() => [
  {
    label: "전체 시설",
    value: facilityList.value.length,
    unit: "개",
    desc: `운영 중 ${activeCount.value}개`,
  },
  {
    label: "운영 중",
    value: activeCount.value,
    unit: "개",
    desc: "예약 가능",
    descClass: "success",
  },
  {
    label: "운영 중단",
    value: inactiveCount.value,
    unit: "개",
    desc: "비활성 상태",
    descClass: "warning",
  },
  {
    label: "좌석형",
    value: facilityList.value.filter((f) => f.reservationType === "SEAT").length,
    unit: "개",
    desc: "좌석 단위 예약",
  },
]);

// 운영 상태 표시
const statusLabel = (f) => (f?.isActive ? "운영 중" : "중단");
const statusClass = (f) => (f?.isActive ? "active" : "inactive");

// 시간 표시
const formatTime = (t) => (t ? t.slice(0, 5) : "-");

// 예약 방식 표시
const reservationTypeLabel = (type) => {
  return {
    SEAT: "좌석형",
    COUNT: "정원형",
    APPROVAL: "승인형",
  }[type] || type || "-";
};

// 예약 비율 계산
const getReservedRatio = (f) => {
  if (!f.isActive || !f.maxCount) return 0;
  return Math.min(Math.round(((f.todayReserved ?? 0) / f.maxCount) * 100), 100);
};

// 예약 비율 색상
const getBarColor = (ratio) => {
  if (ratio >= 80) return "#E53E3E";
  if (ratio >= 40) return "#ED8936";
  return "#48BB78";
};

// 잔여 비율 색상
const getRemainingColor = (ratio) => {
  if (ratio >= 80) return "#FED7D7";
  if (ratio >= 50) return "#FEEBC8";
  return "#C6F6D5";
};

// 필터 조건 적용
const filteredList = computed(() =>
  facilityList.value.filter((f) => {
    const matchStatus =
      !state.filterStatus ||
      (state.filterStatus === "active" && f.isActive) ||
      (state.filterStatus === "inactive" && !f.isActive);
    const matchSlot = !state.filterSlot || String(f.slotMin) === state.filterSlot;
    const matchSearch =
      !state.searchQuery ||
      f.name?.includes(state.searchQuery) ||
      f.typeName?.includes(state.searchQuery);
    return matchStatus && matchSlot && matchSearch;
  })
);

// 페이지 목록 계산
const pagedList = computed(() => {
  const start = (state.currentPage - 1) * state.pageSize;
  return filteredList.value.slice(start, start + state.pageSize);
});

const maxPage = computed(
  () => Math.ceil(filteredList.value.length / state.pageSize) || 1
);

// 시설 목록 조회
const fetchAll = async () => {
  const result = await facilityStore.fetchAdminFacilities();
  state.list = normalizeFacilities(result);
};

// 상세 모달 열기
const openDetail = async (f) => {
  try {
    const detail = await facilityStore.fetchAdminFacilityDetail(f.facilityId)

    detailModal.facility = detail
    detailModal.show = true
  } catch (error) {
    console.error('시설 상세 조회 실패:', error)
  }
};

// 상세 모달 닫기
const closeDetail = () => {
  detailModal.show = false;
  detailModal.facility = null;
};

// 수정 화면 이동
const goEdit = (id) => {
  closeDetail();
  router.push(`/admin/facilities/${id}/edit`);
};

// 등록 화면 이동
const goCreate = () => {
  router.push("/admin/facilities/create");
};

// 필터 조건 초기화
const resetFilters = () => {
  state.filterStatus = "";
  state.filterSlot = "";
  state.searchQuery = "";
  state.currentPage = 1;
};

// 페이지 이동
const goToPage = (page) => {
  state.currentPage = page;
};

let searchTimer = null;

// 검색어 입력 처리
const onSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.currentPage = 1;
  }, 300);
};

// 초기 데이터 조회
onMounted(() => {
  if (typeof registerOpenModal === "function") {
    registerOpenModal(goCreate);
  }

  fetchAll();
});

// 상단 액션 등록 해제
onBeforeUnmount(() => {
  if (typeof registerOpenModal === "function") {
    registerOpenModal(null);
  }
});
</script>

<template>
  <div class="facility-manage-view">

    <StatsCards :stats="statsCards" />

    <div class="table-section">
      <FilterBar @reset="resetFilters">
        <div class="search-wrap">
          <svg
            class="search-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="state.searchQuery"
            class="search-input"
            placeholder="시설명 검색"
            @input="onSearch"
          />
        </div>
        <select
          v-model="state.filterStatus"
          class="filter-select"
          @change="state.currentPage = 1"
        >
          <option value="">운영 상태</option>
          <option value="active">운영 중</option>
          <option value="inactive">중단</option>
        </select>
        <select
          v-model="state.filterSlot"
          class="filter-select"
          @change="state.currentPage = 1"
        >
          <option value="">예약 단위</option>
          <option value="30">30분</option>
          <option value="60">60분</option>
          <option value="90">90분</option>
          <option value="120">120분</option>
        </select>
      </FilterBar>

      <div class="facility-grid">
        <div
          v-for="f in pagedList"
          :key="f.facilityId"
          class="facility-card"
          :class="{ inactive: !f.isActive }"
          @click="openDetail(f)"
        >
          <div class="card-header">
            <div class="card-title-wrap">
              <div class="card-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
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

          <div class="card-body">
            <div class="card-info-row">
              <!-- <div class="card-info">
                <span class="info-label">시설 타입</span>
                <span class="info-value">{{ f.typeName }}</span>
              </div> -->
              <div class="card-info">
                <span class="info-label">예약 방식</span>
                <span class="info-value">{{ reservationTypeLabel(f.reservationType) }}</span>
              </div>
            </div>
            <div class="card-info-row">
              <!-- <div class="card-info">
                <span class="info-label">최대 인원</span>
                <span class="info-value">{{ f.maxCount }}명</span>
              </div> -->
              <!-- <div class="card-info">
                <span class="info-label">예약 단위</span>
                <span class="info-value">{{ f.slotMin }}분</span>
              </div> -->
            </div>
            <div class="card-info-row">
              <div class="card-info">
                <span class="info-label">운영 시간</span>
                <span class="info-value"
                  >{{ formatTime(f.openTime) }} ~ {{ formatTime(f.closeTime) }}</span
                >
              </div>
              <div class="card-info">
                <span class="info-label">오늘 예약</span>
                <span class="info-value">
                  {{ f.isActive ? (f.todayReserved ?? 0) + " / " + f.maxCount + "명" : "운영 중단" }}
                </span>
              </div>
            </div>
            <div class="stacked-bar-wrap">
              <div class="stacked-bar">
                <div
                  class="bar-segment bar-reserved"
                  :style="{
                    width: f.isActive ? getReservedRatio(f) + '%' : '0%',
                    background: getBarColor(getReservedRatio(f)),
                  }"
                ></div>
                <div
                  class="bar-segment bar-remaining"
                  :style="{
                    width: f.isActive ? 100 - getReservedRatio(f) + '%' : '100%',
                    background: f.isActive ? getRemainingColor(getReservedRatio(f)) : '#E2E8F0',
                  }"
                ></div>
              </div>
              <div class="stacked-bar-legend">
                <span class="legend-item">
                  <span
                    class="legend-dot"
                    :style="{ background: f.isActive ? getBarColor(getReservedRatio(f)) : '#A0AEC0' }"
                  ></span>
                  예약 완료 {{ f.isActive ? getReservedRatio(f) : 0 }}%
                </span>
                <span class="legend-item">
                  <span
                    class="legend-dot"
                    :style="{ background: f.isActive ? getRemainingColor(getReservedRatio(f)) : '#E2E8F0' }"
                  ></span>
                  잔여 {{ f.isActive ? 100 - getReservedRatio(f) : 0 }}%
                </span>
              </div>
            </div>
          </div>

          <div class="card-actions" @click.stop>
            <button class="btn-card-action" type="button" @click="goEdit(f.facilityId)">수정</button>
          </div>
        </div>

        <div v-if="pagedList.length === 0" class="empty">등록된 시설이 없습니다.</div>
      </div>

      <Pagination
        :currentPage="state.currentPage"
        :maxPage="maxPage"
        :totalAll="facilityList.length"
        :totalFiltered="filteredList.length"
        unit="개"
        @change="goToPage"
      />
    </div>

    <BaseModal
      v-if="detailModal.show"
      title="시설 상세 정보"
      :subtitle="'ID #' + detailModal.facility?.facilityId"
      @close="closeDetail"
    >
      <div class="detail-hero">
        <span :class="['detail-status-badge', statusClass(detailModal.facility)]">
          {{ statusLabel(detailModal.facility) }}
        </span>
        <h2 class="detail-title">{{ detailModal.facility?.name }}</h2>
        <p class="detail-sub">{{ detailModal.facility?.description ?? "-" }}</p>
      </div>
      <div class="detail-divider"></div>
      <div class="detail-grid">
        <div class="detail-cell">
          <span class="detail-label">시설 ID</span>
          <span class="detail-value">#{{ detailModal.facility?.facilityId }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">시설명</span>
          <span class="detail-value">{{ detailModal.facility?.name }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">최대 인원</span>
          <span class="detail-value">{{ detailModal.facility?.maxCount }}명</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">예약 단위</span>
          <span class="detail-value">{{ detailModal.facility?.slotMin }}분</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">시설 타입</span>
          <span class="detail-value">{{ detailModal.facility?.typeName || "-" }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">예약 방식</span>
          <span class="detail-value">{{
            reservationTypeLabel(detailModal.facility?.reservationType)
          }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">운영 시작</span>
          <span class="detail-value">{{
            formatTime(detailModal.facility?.openTime)
          }}</span>
        </div>
        <div class="detail-cell">
          <span class="detail-label">운영 종료</span>
          <span class="detail-value">{{
            formatTime(detailModal.facility?.closeTime)
          }}</span>
        </div>
          <div class="detail-cell">
            <span class="detail-label">기본 이용료</span>
            <span class="detail-value">
              {{ detailModal.facility?.baseFee > 0 ? Number(detailModal.facility.baseFee).toLocaleString() + '원' : '무료' }}
            </span>
          </div>
        <div class="detail-cell">
          <span class="detail-label">등록일</span>
          <span class="detail-value">{{
            detailModal.facility?.createdAt?.slice(0, 10) ?? "-"
          }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-submit" @click="goEdit(detailModal.facility?.facilityId)">
          수정하기
        </button>
      </template>
    </BaseModal>

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
  gap: 20px;
  font-family: "Noto Sans KR", sans-serif;
  color: #333;
}
.table-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
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
.search-icon {
  color: #a0aec0;
  flex-shrink: 0;
}
.search-input {
  border: none;
  background: transparent;
  font-size: 13px;
  outline: none;
  color: #333;
  width: 150px;
  font-family: "Noto Sans KR", sans-serif;
}
.search-input::placeholder {
  color: #cbd5e0;
}
.filter-select {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 7px 28px 7px 12px;
  font-size: 13px;
  color: #333;
  background: #fff
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")
    no-repeat right 10px center;
  appearance: none;
  cursor: pointer;
  outline: none;
  font-family: "Noto Sans KR", sans-serif;
}

.facility-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
.card-name {
  font-size: 15px;
  font-weight: 700;
  color: #333333;
}
.card-id {
  font-size: 11px;
  color: #687282;
  margin-top: 2px;
}
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.status-badge.active {
  background: #ebf5ee;
  color: #4d8b5a;
}
.status-badge.inactive {
  background: #e0e0e0;
  color: #4a5568;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.card-info-row {
  display: flex;
  gap: 24px;
}
.card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.info-label {
  font-size: 11px;
  color: #687282;
}
.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}

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
.bar-reserved {
  border-radius: 4px;
}
.bar-remaining {
  border-radius: 0 4px 4px 0;
}
.bar-reserved:only-child {
  border-radius: 4px;
}
.bar-remaining:first-child {
  border-radius: 4px;
}
.stacked-bar-legend {
  display: flex;
  gap: 12px;
}
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
.card-actions {
  display: flex;
  flex-wrap: wrap;
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
  font-family: "Noto Sans KR", sans-serif;
}
.btn-card-action:hover {
  background: #f5f6f8;
}
.btn-card-action.danger {
  color: #e53e3e;
}

.detail-hero {
  margin-bottom: 14px;
}
.detail-status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  width: fit-content;
}
.detail-status-badge.active {
  background: #ebf5ee;
  color: #4d8b5a;
}
.detail-status-badge.inactive {
  background: #f5f5f5;
  color: #718096;
}
.detail-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 2px;
  margin-top: 8px;
}
.detail-sub {
  font-size: 13px;
  color: #a0aec0;
}
.detail-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 14px 0;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-label {
  font-size: 12px;
  color: #a0aec0;
}
.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}
.btn-cancel {
  padding: 9px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-cancel:hover {
  background: #f5f6f8;
}
.btn-submit {
  padding: 9px 24px;
  background: #2b3a55;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-submit:hover {
  background: #1e2a3e;
}
</style>
