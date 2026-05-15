<script setup>
import { onMounted, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useFacilityStore } from "@/stores/useFacilityStore.js";

import BaseModal from "@/components/common/BaseModal.vue";
import Pagination from "@/components/common/AppPagination.vue";

const props = defineProps({
  facilities: {
    type: Array,
    default: null,
  },
});

const router = useRouter();
const facilityStore = useFacilityStore();

// 목록 및 페이지 상태
const state = reactive({
  list: [],
  currentPage: 1,
  pageSize: 8,
  errorMessage: "",
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
const sourceList = computed(() => props.facilities ?? state.list);

const facilityList = computed(() =>
  sourceList.value.map((f) => ({
    ...f,
    facilityId: f.facilityId ?? f.facilityUid ?? f.id,
    typeId: f.typeId ?? f.facilityTypeId ?? f.type?.id,
    typeName: f.typeName ?? f.type?.name ?? "-",
    maxCount: f.maxCount ?? f.maxCapacity ?? 0,
    slotMin: f.slotMin ?? f.slotDuration ?? 0,
    todayReserved: f.todayReserved ?? 0,
    reservationType: normalizeReservationType(f.reservationType),
  }))
);

// 운영 상태 표시
const statusLabel = (f) => (f?.isActive ? "운영 중" : "중단");
const statusClass = (f) => (f?.isActive ? "active" : "inactive");

// 시간 표시
const formatTime = (t) => (t ? t.slice(0, 5) : "-");

const normalizeReservationType = (type) => {
  const value = String(type || "").trim();
  if (value === "좌석형") return "SEAT";
  if (value === "정원형") return "COUNT";
  if (value === "승인형") return "APPROVAL";
  return value;
};

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

// 현재는 별도 필터 없이 전체 목록 반환
const filteredList = computed(() => facilityList.value);

// 현재 페이지에 표시할 슬라이스
const pagedList = computed(() => {
  const start = (state.currentPage - 1) * state.pageSize;
  return filteredList.value.slice(start, start + state.pageSize);
});

const maxPage = computed(
  () => Math.ceil(filteredList.value.length / state.pageSize) || 1
);

// 시설 목록 API 조회 후 정규화하여 state에 저장
const fetchAll = async () => {
  if (props.facilities !== null) return;

  state.errorMessage = "";

  try {
    const result = await facilityStore.fetchAdminFacilities();
    state.list = normalizeFacilities(result);
  } catch (error) {
    console.error("시설 목록 조회 실패:", error);
    state.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      "시설 목록을 불러오지 못했습니다.";
  }
};

// 카드 클릭 시 상세 API 조회 후 모달 표시
const openDetail = async (f) => {
  try {
    const detail = await facilityStore.fetchAdminFacilityDetail(f.facilityId);
    detailModal.facility = detail;
    detailModal.show = true;
  } catch (error) {
    console.error('시설 상세 조회 실패:', error);
  }
};

const closeDetail = () => {
  detailModal.show = false;
  detailModal.facility = null;
};

// 모달 닫은 후 수정 화면으로 이동
const goEdit = (id) => {
  closeDetail();
  router.push(`/admin/facilities/${id}/edit`);
};

const goToPage = (page) => {
  state.currentPage = page;
};

onMounted(() => {
  fetchAll();
});
</script>

<template>
  <div class="facility-manage-view">
    <div class="table-section">
      <div v-if="state.errorMessage" class="error-box">{{ state.errorMessage }}</div>

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
              <div class="card-info">
                <span class="info-label">예약 방식</span>
                <span class="info-value">{{ reservationTypeLabel(f.reservationType) }}</span>
              </div>
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

.error-box {
  margin: 20px 20px 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff5f5;
  color: #e53e3e;
  font-size: 13px;
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
