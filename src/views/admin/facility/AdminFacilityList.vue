<script setup>
import { onMounted, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useFacilityStore } from "@/stores/useFacilityStore.js";

import BaseModal from "@/components/common/BaseModal.vue";
import ActionResultModal from "@/components/common/ActionResultModal.vue";
import Pagination from "@/components/common/AppPagination.vue";
import { toList } from "@/utils/apiResponse";

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

// 상세 모달 상태 — visible prop 방식으로 관리
const detailModal = reactive({ show: false, facility: null });

// 좌석 관리는 SEAT 시설 상세 모달 안에서만 노출
const seatState = reactive({
  list: [],
  loading: false,
  errorMessage: "",
});

const seatFormModal = reactive({
  show: false,
  mode: "create",
  loading: false,
  errorMessage: "",
  seatId: "",
  seatNo: "",
  seatName: "",
  isActive: true,
});

const resultModal = reactive({
  show: false,
  type: "success",
  title: "",
  subtitle: "",
});

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
    reservationType: normalizeReservationType(f.reservationType),
  }))
);

// 운영 상태 표시
const statusLabel = (f) => (f?.isActive ? "운영 중" : "운영 중단");
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

const isSeatFacility = (facility) =>
  normalizeReservationType(facility?.reservationType) === "SEAT";

// 예약 방식 한글 표시
const reservationTypeLabel = (type) => {
  return { SEAT: "좌석형", COUNT: "정원형", APPROVAL: "승인형" }[type] || type || "-";
};

const seatStatusLabel = (isActive) => (isActive ? "활성" : "비활성");
const seatStatusClass = (isActive) => (isActive ? "active" : "inactive");

// 필터 없이 전체 목록 반환 (추후 필터 추가 가능)
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
    seatState.list = [];
    seatState.errorMessage = "";
    detailModal.show = true;
    // SEAT 타입이면 좌석 목록 함께 조회
    if (isSeatFacility(detail)) {
      await fetchSeats(detail.facilityId);
    }
  } catch (error) {
    console.error("시설 상세 조회 실패:", error);
  }
};

const closeDetail = () => {
  detailModal.show = false;
  detailModal.facility = null;
  seatState.list = [];
  seatState.errorMessage = "";
};

// 상세 모달 닫고 수정 화면으로 이동
const goEdit = (id) => {
  closeDetail();
  router.push(`/admin/facilities/${id}/edit`);
};

const goToPage = (page) => {
  state.currentPage = page;
};

const normalizeSeats = (response) =>
  toList(response).map((seat) => ({
    ...seat,
    id: seat.seatId ?? seat.id,
    seatId: seat.seatId ?? seat.id,
    seatNo: seat.seatNo ?? "",
    seatName: seat.seatName ?? "",
    isActive: seat.isActive !== false,
  }));

const fetchSeats = async (facilityId = detailModal.facility?.facilityId) => {
  if (!facilityId) return;
  seatState.loading = true;
  seatState.errorMessage = "";
  try {
    const result = await facilityStore.fetchFacilitySeats(facilityId);
    seatState.list = normalizeSeats(result);
  } catch (error) {
    console.error("시설 좌석 목록 조회 실패:", error);
    seatState.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      "좌석 목록을 불러오지 못했습니다.";
  } finally {
    seatState.loading = false;
  }
};

const openCreateSeatModal = () => {
  seatFormModal.mode = "create";
  seatFormModal.seatId = "";
  seatFormModal.seatNo = "";
  seatFormModal.seatName = "";
  seatFormModal.isActive = true;
  seatFormModal.errorMessage = "";
  seatFormModal.show = true;
};

const openEditSeatModal = (seat) => {
  seatFormModal.mode = "edit";
  seatFormModal.seatId = seat.seatId;
  seatFormModal.seatNo = seat.seatNo;
  seatFormModal.seatName = seat.seatName || "";
  seatFormModal.isActive = seat.isActive !== false;
  seatFormModal.errorMessage = "";
  seatFormModal.show = true;
};

const closeSeatFormModal = () => {
  seatFormModal.show = false;
  seatFormModal.errorMessage = "";
};

const openResultModal = (type, title, subtitle) => {
  resultModal.type = type;
  resultModal.title = title;
  resultModal.subtitle = subtitle;
  resultModal.show = true;
};

const closeResultModal = () => {
  resultModal.show = false;
};

const submitSeatForm = async () => {
  seatFormModal.errorMessage = "";

  if (seatFormModal.mode === "create" && !seatFormModal.seatNo) {
    seatFormModal.errorMessage = "좌석 번호를 입력해주세요.";
    return;
  }

  seatFormModal.loading = true;
  try {
    if (seatFormModal.mode === "create") {
      await facilityStore.createFacilitySeat(detailModal.facility.facilityId, {
        seatNo: Number(seatFormModal.seatNo),
        seatName: String(seatFormModal.seatName || "").trim(),
        isActive: !!seatFormModal.isActive,
      });
      openResultModal("success", "좌석이 등록되었습니다.", "입주민 좌석 예약에 사용할 수 있습니다.");
    } else {
      // 백엔드 수정 DTO는 좌석 번호 변경을 지원하지 않으므로 이름과 활성 여부만 전송
      await facilityStore.updateFacilitySeat(seatFormModal.seatId, {
        seatName: String(seatFormModal.seatName || "").trim(),
        isActive: !!seatFormModal.isActive,
      });
      openResultModal("success", "좌석이 수정되었습니다.", "좌석 정보가 목록에 반영되었습니다.");
    }
    closeSeatFormModal();
    await fetchSeats();
  } catch (error) {
    seatFormModal.errorMessage =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      "좌석 저장에 실패했습니다.";
    openResultModal("danger", "좌석 저장에 실패했습니다.", seatFormModal.errorMessage);
  } finally {
    seatFormModal.loading = false;
  }
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
                <span class="info-value">{{ formatTime(f.openTime) }} ~ {{ formatTime(f.closeTime) }}</span>
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

    <!-- ✅ 핵심 수정: v-if 제거하고 :visible prop 방식으로 변경 -->
    <BaseModal
      class="facility-detail-modal"
      :visible="detailModal.show"
      title="시설 상세 정보"
      :subtitle="detailModal.facility ? 'ID #' + detailModal.facility.facilityId : ''"
      @close="closeDetail"
    >
      <div class="detail-modal-content">

        <!-- 히어로: 상태 배지 + 시설명 + 소제목 -->
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
            <span class="detail-cell-value">{{ detailModal.facility?.createdAt?.slice(0, 10) ?? "-" }}</span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">시설 타입</span>
            <span class="detail-cell-value">{{ detailModal.facility?.typeName || "-" }}</span>
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
              {{ detailModal.facility?.slotMin ? detailModal.facility.slotMin + '분' : '-' }}
            </span>
          </div>
          <div class="detail-cell">
            <span class="detail-cell-label">기본 요금</span>
            <span class="detail-cell-value">
              {{ detailModal.facility?.baseFee != null ? Number(detailModal.facility.baseFee).toLocaleString() + '원' : '-' }}
            </span>
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
            <div v-else-if="seatState.list.length === 0" class="detail-empty">
              등록된 좌석이 없습니다.
            </div>
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
                <button class="btn-card-action" type="button" @click.stop="openEditSeatModal(seat)">
                  수정
                </button>
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

    <!-- 좌석 등록/수정 모달 -->
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
          <input
            v-model="seatFormModal.seatName"
            class="seat-form__input"
            type="text"
            placeholder="예: 창가 1번 좌석"
          />
        </label>
        <label class="seat-form__toggle">
          <input v-model="seatFormModal.isActive" type="checkbox" />
          <span>활성 좌석으로 운영</span>
        </label>
        <p v-if="seatFormModal.errorMessage" class="seat-form__error">
          {{ seatFormModal.errorMessage }}
        </p>
      </div>
      <template #footer>
        <button class="btn-cancel" type="button" @click="closeSeatFormModal">취소</button>
        <button
          class="btn-submit"
          type="button"
          :disabled="seatFormModal.loading"
          @click="submitSeatForm"
        >
          {{ seatFormModal.loading ? "저장 중..." : "저장" }}
        </button>
      </template>
    </BaseModal>

    <ActionResultModal
      :visible="resultModal.show"
      :type="resultModal.type"
      :title="resultModal.title"
      :subtitle="resultModal.subtitle"
      @close="closeResultModal"
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

/* ─── 시설 상세 모달 ─────────────────────────────── */
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
  content: "";
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

/* ─── 모달 내부 콘텐츠 ───────────────────────────── */
.detail-modal-content {
  display: flex;
  flex-direction: column;
  gap: 0;
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
  margin-bottom: 10px;
}
.detail-status-badge.active {
  background: #c6f6d5;
  color: #276749;
}
.detail-status-badge.inactive {
  background: #e5e7eb;
  color: #718096;
}
.detail-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 4px;
}
.detail-sub {
  font-size: 13px;
  color: #687282;
}
.detail-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 16px 0;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}
.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-cell-label {
  font-size: 12px;
  color: #687282;
}
.detail-cell-value {
  font-size: 14px;
  font-weight: 500;
  color: #1a202c;
}

/* ─── 시설 설명 ────────────────────────────────── */
.detail-desc-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.detail-desc-text {
  font-size: 13px;
  color: #4a5568;
  line-height: 1.7;
}

/* ─── 좌석 섹션 ────────────────────────────────── */
.seat-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.seat-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.detail-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #687282;
}
.seat-section__error {
  margin: 0;
}
.seat-section__loading {
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #687282;
  font-size: 13px;
  text-align: center;
}
.detail-empty {
  font-size: 13px;
  color: #687282;
  text-align: center;
  padding: 16px 0;
}
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
.seat-row:last-child {
  border-bottom: none;
}
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
.seat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.seat-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}
.seat-contact {
  font-size: 12px;
  color: #687282;
}
.seat-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}
.seat-tag.active {
  color: #276749;
  background: #c6f6d5;
}
.seat-tag.inactive {
  color: #4a5568;
  background: #e2e8f0;
}

/* ─── 좌석 폼 ───────────────────────────────────── */
.seat-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.seat-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.seat-form__label {
  color: #4a5568;
  font-size: 12px;
  font-weight: 700;
}
.seat-form__input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  color: #1a202c;
  font-family: "Noto Sans KR", sans-serif;
  font-size: 13px;
}
.seat-form__input:disabled {
  background: #f5f6f8;
  color: #718096;
}
.seat-form__help {
  color: #a0aec0;
  font-size: 11px;
}
.seat-form__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a5568;
  font-size: 13px;
  font-weight: 600;
}
.seat-form__error {
  margin: 0;
  color: #e53e3e;
  font-size: 12px;
}

/* ─── 공통 버튼 ────────────────────────────────── */
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
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .facility-detail-modal :deep(.base-modal__content) {
    width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .seat-section__header {
    flex-direction: column;
    align-items: flex-start;
  }
  .facility-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>