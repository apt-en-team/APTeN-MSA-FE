<script setup>
import { onMounted, reactive, computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useFacilityStore } from "@/stores/useFacilityStore.js";
import { getFacilityPolicies } from "@/api/facilityApi.js";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import ActionResultModal from "@/components/common/ActionResultModal.vue";
import FacilitySeatTab from "@/components/admin/facility/FacilitySeatTab.vue";
import FacilityPolicyTab from "@/views/admin/facility/FacilityPolicyTab.vue";
import FacilityBlockTimeTab from "@/views/admin/facility/FacilityBlockTimeTab.vue";
import AdminGxProgramList from "@/views/admin/facility/AdminGxProgramList.vue";

const route = useRoute();
const router = useRouter();
const facilityStore = useFacilityStore();

const facilityId = computed(() => route.params.facilityId || route.params.id || "");
const isEdit = computed(() => !!facilityId.value);

const reservationTypeOptions = [
  { value: "SEAT", label: "좌석형" },
  { value: "COUNT", label: "정원형" },
  { value: "APPROVAL", label: "승인형" },
];

const normalizeReservationType = (value) => {
  const normalizedValue = String(value || "").trim();
  if (normalizedValue === "좌석형") return "SEAT";
  if (normalizedValue === "정원형") return "COUNT";
  if (normalizedValue === "승인형") return "APPROVAL";
  return normalizedValue || "COUNT";
};

const facilityTypeOptions = computed(() =>
  facilityStore.facilityTypes.filter((type) => type?.isActive !== false)
);

const selectedTypeCode = computed(() => {
  return facilityStore.facilityTypes.find(
    (t) => String(t.typeId) === String(state.typeId)
  )?.typeCode || "";
});

const isGxType = computed(() => selectedTypeCode.value === "GX");
const isSeatType = computed(() => state.reservationType === "SEAT");

const policySlotMin = ref(null);
const policyBaseFee = ref(null);

const activeTab = ref("info");

const visibleTabs = computed(() => {
  if (!isEdit.value) return [];
  const tabs = [{ key: "info", label: "시설 정보" }];
  if (isSeatType.value) tabs.push({ key: "seat", label: "좌석 관리" });
  tabs.push({ key: "policy", label: "예약 정책" });
  tabs.push({ key: "block-time", label: "차단 시간" });
  if (isGxType.value) tabs.push({ key: "gx", label: "GX 프로그램" });
  return tabs;
});

const state = reactive({
  typeId: "",
  name: "",
  description: "",
  reservationType: "COUNT",
  maxCount: "",
  openTime: "09:00",
  closeTime: "22:00",
  slotMin: null,
  baseFee: 0,
  isActive: true,
  createdAt: null,
  submitting: false,

  typeIdError: "",
  nameError: "",
  reservationTypeError: "",
  maxCountError: "",
  openTimeError: "",
  closeTimeError: "",
  slotMinError: "",
  baseFeeError: "",
  serverError: "",
});

const deleteModal = reactive({
  show: false,
  stage: "confirm",
  loading: false,
  resultType: "success",
  resultTitle: "",
  resultSubtitle: "",
});

const activeModal = reactive({
  show: false,
  loading: false,
  nextActive: null,
  resultShow: false,
  resultType: "success",
  resultTitle: "",
  resultSubtitle: "",
});

const getTypeNameById = (typeId) =>
  facilityStore.facilityTypes.find((type) => String(type.typeId) === String(typeId))?.typeName || "";

const getReservationTypeLabel = (type) =>
  reservationTypeOptions.find((item) => item.value === type)?.label || type || "-";

const resetErrors = () => {
  state.typeIdError = "";
  state.nameError = "";
  state.reservationTypeError = "";
  state.maxCountError = "";
  state.openTimeError = "";
  state.closeTimeError = "";
  state.slotMinError = "";
  state.baseFeeError = "";
  state.serverError = "";
};

const syncForm = (data) => {
  state.typeId = String(data.typeId ?? data.facilityTypeId ?? data.type?.id ?? "");
  state.name = data.name ?? "";
  state.description = data.description ?? "";
  state.reservationType = normalizeReservationType(data.reservationType);
  state.maxCount = data.maxCount ?? data.maxCapacity ?? "";
  state.openTime = data.openTime?.slice(0, 5) ?? "09:00";
  state.closeTime = data.closeTime?.slice(0, 5) ?? "22:00";
  state.slotMin = data.slotMin ?? data.slotDuration ?? null;
  state.baseFee = data.baseFee ?? data.price ?? 0;
  state.isActive = data.isActive ?? data.active ?? true;
  state.createdAt = data.createdAt ?? null;
};

const fetchFacility = async () => {
  try {
    const detail = await facilityStore.fetchAdminFacilityDetail(facilityId.value);
    syncForm(detail);
  } catch (e) {
    console.error("시설 조회 실패", e);
    state.serverError = e.response?.data?.message ?? e.message ?? "시설 조회에 실패했습니다.";
  }
};

const validateForm = () => {
  resetErrors();

  if (!state.typeId) {
    state.typeIdError = "시설 타입을 선택해주세요.";
    return false;
  }

  if (!state.name) {
    state.nameError = "시설명을 입력해주세요.";
    return false;
  }

  if (!state.reservationType) {
    state.reservationTypeError = "예약 방식을 선택해주세요.";
    return false;
  }

  if (!isSeatType.value && !isGxType.value && !state.maxCount) {
    state.maxCountError = "최대 인원을 입력해주세요.";
    return false;
  }

  if (!state.openTime) {
    state.openTimeError = "운영 시작 시간을 입력해주세요.";
    return false;
  }

  if (!state.closeTime) {
    state.closeTimeError = "운영 종료 시간을 입력해주세요.";
    return false;
  }

  return true;
};

const handleSubmitError = (error) => {
  const message =
    error.response?.data?.message ||
    error.response?.data?.resultMessage ||
    "저장 중 오류가 발생했습니다.";

  const fieldMap = {
    "시설 타입을 선택해주세요": "typeIdError",
    "시설명을 입력해주세요": "nameError",
    "최대 인원을 입력해주세요": "maxCountError",
    "시설 타입을 찾을 수 없습니다": "typeIdError",
    "시설을 찾을 수 없습니다": "serverError",
  };

  const field = fieldMap[message] || "serverError";
  state[field] = message;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    state.submitting = true;

    const submitData = {
      typeId: state.typeId,
      name: String(state.name).trim(),
      description: String(state.description || "").trim(),
      reservationType: isGxType.value ? "APPROVAL" : state.reservationType,
      maxCount: isSeatType.value || isGxType.value ? 0 : Number(state.maxCount),
      openTime: state.openTime,
      closeTime: state.closeTime,
      slotMin: isGxType.value ? null : (state.slotMin ? Number(state.slotMin) : null),
      baseFee: isGxType.value ? 0 : Number(state.baseFee || 0),
      isActive: !!state.isActive,
    };

    if (isEdit.value) {
      await facilityStore.updateFacility(facilityId.value, submitData);
    } else {
      await facilityStore.createFacility(submitData);
    }

    router.push("/admin/facilities");
  } catch (error) {
    handleSubmitError(error);
  } finally {
    state.submitting = false;
  }
};

const openDeleteModal = () => {
  deleteModal.stage = "confirm";
  deleteModal.show = true;
};

const closeDeleteConfirm = () => {
  deleteModal.show = false;
  deleteModal.stage = "confirm";
};

const closeDeleteResult = () => {
  deleteModal.show = false;
  deleteModal.stage = "confirm";
  if (deleteModal.resultType === "success") router.push("/admin/facilities");
};

const handleDelete = async () => {
  deleteModal.loading = true;
  try {
    await facilityStore.deleteFacility(facilityId.value);
    deleteModal.resultType = "success";
    deleteModal.resultTitle = "시설이 삭제되었습니다.";
    deleteModal.resultSubtitle = `${state.name} 시설이 삭제되었습니다.`;
  } catch (e) {
    const message =
      e.response?.data?.resultMessage ||
      e.response?.data?.message ||
      "잠시 후 다시 시도해주세요.";
    deleteModal.resultType = "danger";
    deleteModal.resultTitle = "삭제에 실패했습니다.";
    deleteModal.resultSubtitle = message;
  } finally {
    deleteModal.loading = false;
    deleteModal.stage = "result";
  }
};

const handleActiveChange = (event) => {
  if (!isEdit.value) {
    state.isActive = event.target.checked;
    return;
  }

  openActiveModal(event);
};

const openActiveModal = (event) => {
  activeModal.nextActive = event.target.checked;
  activeModal.show = true;
};

const closeActiveConfirm = () => {
  activeModal.show = false;
  activeModal.nextActive = null;
};

const closeActiveResult = () => {
  activeModal.resultShow = false;
  activeModal.nextActive = null;
};

const handleActiveToggle = async () => {
  if (activeModal.nextActive === null) return;

  activeModal.loading = true;

  try {
    await facilityStore.updateFacilityActive(facilityId.value, {
      isActive: activeModal.nextActive,
    });

    state.isActive = activeModal.nextActive;
    activeModal.show = false;
    activeModal.resultShow = true;
    activeModal.resultType = "success";
    activeModal.resultTitle = activeModal.nextActive
      ? "시설이 활성화되었습니다."
      : "시설이 비활성화되었습니다.";
    activeModal.resultSubtitle = `${state.name} 운영 상태를 변경했습니다.`;
  } catch (error) {
    activeModal.show = false;
    activeModal.resultShow = true;
    activeModal.resultType = "danger";
    activeModal.resultTitle = "상태 변경에 실패했습니다.";
    activeModal.resultSubtitle =
      error.response?.data?.resultMessage ||
      error.response?.data?.message ||
      "잠시 후 다시 시도해주세요.";
  } finally {
    activeModal.loading = false;
  }
};

watch(selectedTypeCode, async (typeCode) => {
  if (!typeCode) return;
  try {
    const res = await getFacilityPolicies({ facilityTypeCode: typeCode });
    const policies = Array.isArray(res) ? res : [];
    const policy = policies[0] || null;
    policySlotMin.value = policy?.slotMin ?? null;
    policyBaseFee.value = policy?.baseFee ?? null;
  } catch {
    policySlotMin.value = null;
    policyBaseFee.value = null;
  }
});

watch(isGxType, (isGx) => {
  if (isGx) state.reservationType = "APPROVAL";
});

watch(isSeatType, (isSeat) => {
  if (isSeat) {
    const seatTab = visibleTabs.value.find((t) => t.key === "seat");
    if (!seatTab && activeTab.value === "seat") activeTab.value = "info";
  }
});

onMounted(async () => {
  if (!facilityStore.facilityTypes.length) await facilityStore.fetchFacilityTypes();
  if (isEdit.value) await fetchFacility();
});
</script>

<template>
  <div class="facility-form-view">
    <nav v-if="isEdit && visibleTabs.length > 1" class="form-tab-bar" aria-label="시설 관리 탭">
      <button
        v-for="tab in visibleTabs"
        :key="tab.key"
        type="button"
        class="form-tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <FacilitySeatTab
      v-if="activeTab === 'seat' && isEdit"
      :facility-id="facilityId"
    />
    <FacilityPolicyTab v-else-if="activeTab === 'policy' && isEdit" />
    <FacilityBlockTimeTab v-else-if="activeTab === 'block-time' && isEdit" />
    <AdminGxProgramList v-else-if="activeTab === 'gx' && isEdit" />

    <div v-if="!isEdit || activeTab === 'info'" class="form-layout">
      <!-- 왼쪽: 입력폼 -->
      <div class="form-section">
        <h2 class="form-title">시설 정보 {{ isEdit ? "수정" : "입력" }}</h2>
        <p class="form-desc">모든 * 항목은 필수 입력입니다.</p>

        <div v-if="state.serverError" class="server-error">{{ state.serverError }}</div>

        <div class="form-group">
          <label class="form-label">시설 타입 *</label>
          <select
            v-model="state.typeId"
            class="form-select"
            :class="{ 'input-error': state.typeIdError }"
            @change="state.typeIdError = ''"
          >
            <option :value="null" disabled>타입 선택</option>
              <option v-for="t in facilityTypeOptions" :key="t.typeId" :value="t.typeId">
                {{ t.typeName }}
              </option>
            </select>
          <span v-if="state.typeIdError" class="error-msg">{{ state.typeIdError }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">시설명 *</label>
          <input
            v-model="state.name"
            class="form-input"
            :class="{ 'input-error': state.nameError }"
            placeholder="예: 헬스장"
          />
          <span v-if="state.nameError" class="error-msg">{{ state.nameError }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">시설 설명</label>
          <textarea
            v-model="state.description"
            class="form-textarea"
            placeholder="시설에 대한 간단한 설명을 입력해주세요."
            rows="4"
          />
        </div>

        <div class="form-row">
          <div v-if="!isSeatType && !isGxType" class="form-group">
            <label class="form-label">최대 인원 *</label>
            <div class="input-suffix-wrap">
              <input
                v-model="state.maxCount"
                class="form-input"
                :class="{ 'input-error': state.maxCountError }"
                type="number"
                placeholder="예: 30"
              />
              <span class="input-suffix">명</span>
            </div>
            <span v-if="state.maxCountError" class="error-msg">{{ state.maxCountError }}</span>
          </div>
          <div v-if="isSeatType && !isGxType" class="form-group" style="grid-column: 1 / -1;">
            <div class="info-note">
              좌석형 시설은 좌석 관리 탭에서 좌석을 등록한 후 운영합니다.
            </div>
          </div>
          <div v-if="!isGxType" class="form-group">
            <label class="form-label">예약 단위</label>
            <div class="input-suffix-wrap">
              <input
                v-model="state.slotMin"
                class="form-input"
                :class="{ 'input-error': state.slotMinError }"
                type="number"
                :placeholder="policySlotMin ? `정책 기본값: ${policySlotMin}분` : '예: 60'"
              />
              <span class="input-suffix">분</span>
            </div>
            <span v-if="state.slotMinError" class="error-msg">{{ state.slotMinError }}</span>
          </div>
        </div>

        <div v-if="!isGxType" class="form-group">
          <label class="form-label">기본 이용료</label>
          <div class="input-suffix-wrap">
            <input
              v-model="state.baseFee"
              class="form-input"
              :class="{ 'input-error': state.baseFeeError }"
              type="number"
              :placeholder="policyBaseFee !== null ? `정책 기본값: ${policyBaseFee}원` : '0'"
            />
            <span class="input-suffix">원</span>
          </div>
          <span v-if="state.baseFeeError" class="error-msg">{{ state.baseFeeError }}</span>
        </div>

        <div v-if="isGxType" class="form-group">
          <div class="info-note">
            GX 시설의 요금과 일정은 GX 프로그램 탭에서 관리합니다.
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">예약 방식 *</label>
          <template v-if="!isGxType">
            <select
              v-model="state.reservationType"
              class="form-select"
              :class="{ 'input-error': state.reservationTypeError }"
            >
              <option v-for="type in reservationTypeOptions" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
            <span v-if="state.reservationTypeError" class="error-msg">{{ state.reservationTypeError }}</span>
          </template>
          <template v-else>
            <div class="info-note">GX 시설은 승인형(APPROVAL)으로 고정됩니다.</div>
          </template>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">운영 시작 *</label>
            <input
              v-model="state.openTime"
              class="form-input"
              :class="{ 'input-error': state.openTimeError }"
              type="time"
            />
            <span v-if="state.openTimeError" class="error-msg">{{ state.openTimeError }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">운영 종료 *</label>
            <input
              v-model="state.closeTime"
              class="form-input"
              :class="{ 'input-error': state.closeTimeError }"
              type="time"
            />
            <span v-if="state.closeTimeError" class="error-msg">{{ state.closeTimeError }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">운영 여부</label>
          <div class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" :checked="state.isActive" @change="handleActiveChange" />
              <span class="slider"></span>
            </label>
            <span class="toggle-label" :class="{ active: state.isActive }">
              {{ state.isActive ? "운영 중" : "운영 중단" }}
            </span>
          </div>
          <p class="toggle-desc">
            {{
              state.isActive
                ? "활성화 시 예약이 가능합니다."
                : "비활성화 시 예약이 불가합니다."
            }}
          </p>
        </div>

        <div class="form-actions">
          <button v-if="isEdit" class="btn-delete" @click="openDeleteModal">삭제</button>
          <div class="form-actions-right">
            <button class="btn-cancel" @click="router.push('/admin/facilities')">
              취소
            </button>
            <button class="btn-submit" @click="handleSubmit">
              {{ isEdit ? "수정완료" : "등록하기" }}
            </button>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 미리보기 -->
      <div class="preview-section">
        <div class="preview-box">
          <h3 class="preview-title">{{ isEdit ? "현재 정보" : "미리보기" }}</h3>
          <div class="preview-card">
            <div class="preview-card-header">
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
              <div class="preview-name-wrap">
                <span class="preview-name">{{ state.name || "시설명" }}</span>
                <span class="preview-id">facility_id #{{ facilityId || "-" }}</span>
              </div>
              <span :class="['status-badge', state.isActive ? 'active' : 'inactive']">
                {{ state.isActive ? "운영 중" : "중단" }}
              </span>
            </div>
            <div class="preview-divider"></div>
            <div class="preview-info">
              <div class="preview-row">
                <span>시설 타입</span><span>{{ getTypeNameById(state.typeId) || "-" }}</span>
              </div>
              <div class="preview-row">
                <span>예약 방식</span><span>{{ getReservationTypeLabel(state.reservationType) }}</span>
              </div>
              <div class="preview-row">
                <span>최대 인원</span><span>{{ state.maxCount || "-" }}명</span>
              </div>
              <div class="preview-row">
                <span>예약 단위</span><span>{{ state.slotMin }}분</span>
              </div>
              <div class="preview-row">
                <span>운영 시간</span
                ><span>{{ state.openTime }} ~ {{ state.closeTime }}</span>
              </div>
              <div class="preview-row">
                <span>등록일</span
                ><span>{{
                  state.createdAt ? state.createdAt.slice(0, 10).replace(/-/g, ".") : "-"
                }}</span>
              </div>
              <div class="preview-row">
                <span>기본 이용료</span
                ><span>{{
                  state.baseFee > 0 ? Number(state.baseFee).toLocaleString() + "원" : "무료"
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="guide-box">
          <h3 class="guide-title">{{ isEdit ? "수정 주의사항" : "등록 안내" }}</h3>
          <div class="guide-divider"></div>
          <ul class="guide-list">
            <template v-if="!isEdit">
              <li>등록 즉시 시설 목록에 반영됩니다.</li>
              <li>운영 시간은 HH:MM 형식으로 입력하세요.</li>
              <li>예약 단위는 분 기준으로 설정됩니다.</li>
              <li>운영 여부는 언제든지 변경 가능합니다.</li>
              <li>시설 공간 정보만 등록하며 프로그램 운영 정보는 포함하지 않습니다.</li>
            </template>
            <template v-else>
              <li>수정 내용은 즉시 시설 정보에 반영됩니다.</li>
              <li>운영 시간 변경 시 예약 가능 시간에 영향을 줄 수 있습니다.</li>
              <li>정원 변경 시 이후 예약 가능 인원에 반영됩니다.</li>
              <li>이미 생성된 예약은 자동으로 취소되지 않습니다.</li>
            </template>
          </ul>
        </div>
      </div>
    </div>

    <!-- 1단계: 삭제 확인 → ConfirmModal -->
    <ConfirmModal
      :visible="deleteModal.show && deleteModal.stage === 'confirm'"
      title="시설을 삭제하시겠습니까?"
      subtitle="삭제 후에는 관리자 목록에서 더 이상 표시되지 않습니다."
      subtitle-color="#e53e3e"
      item-label="시설명"
      action-text="운영 시간"
      extra-label="최대 인원"
      :item-name="state.name"
      :action-label="`${state.openTime} ~ ${state.closeTime}`"
      :extra-value="`${state.maxCount}명`"
      confirm-text="삭제"
      confirm-type="danger"
      :loading="deleteModal.loading"
      @confirm="handleDelete"
      @cancel="closeDeleteConfirm"
    />

    <!-- 2단계: 삭제 결과 → ActionResultModal -->
    <ActionResultModal
      :visible="deleteModal.show && deleteModal.stage === 'result'"
      :type="deleteModal.resultType"
      :title="deleteModal.resultTitle"
      :subtitle="deleteModal.resultSubtitle"
      confirm-text="확인"
      @close="closeDeleteResult"
    />

    <ConfirmModal
      :visible="activeModal.show"
      :title="activeModal.nextActive ? '시설을 활성화하시겠습니까?' : '시설을 비활성화하시겠습니까?'"
      :subtitle="
        activeModal.nextActive
          ? '입주민이 다시 예약 가능한 상태로 전환합니다.'
          : '예약 접수를 중단하고 비활성 상태로 표시합니다.'
      "
      item-label="시설명"
      :item-name="state.name"
      :action-label="activeModal.nextActive ? '시설 활성화' : '시설 비활성화'"
      :action-text="activeModal.nextActive ? '예약을 다시 허용합니다.' : '예약 접수를 중단합니다.'"
      :confirm-text="activeModal.nextActive ? '활성화' : '비활성화'"
      :confirm-type="activeModal.nextActive ? 'primary' : 'danger'"
      :loading="activeModal.loading"
      @confirm="handleActiveToggle"
      @cancel="closeActiveConfirm"
    />

    <ActionResultModal
      :visible="activeModal.resultShow"
      :type="activeModal.resultType"
      :title="activeModal.resultTitle"
      :subtitle="activeModal.resultSubtitle"
      confirm-text="확인"
      @close="closeActiveResult"
    />
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.form-tab-bar {
  display: flex;
  gap: 8px;
  padding: 6px;
  margin-bottom: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
}

.form-tab-btn {
  min-height: 38px;
  padding: 0 18px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #687282;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  font-family: "Noto Sans KR", sans-serif;
}

.form-tab-btn:hover {
  background: #f5f6f8;
  color: #2b3a55;
}

.form-tab-btn.active {
  background: #1e2a3e;
  color: #ffffff;
}

.info-note {
  padding: 10px 14px;
  background: #f0f4ff;
  border: 1px solid #c3d0f0;
  border-radius: 7px;
  font-size: 13px;
  color: #2b3a55;
}

.facility-form-view {
  font-family: "Noto Sans KR", sans-serif;
  color: #333;
}
.form-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.form-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 32px;
}
.form-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 4px;
}
.form-desc {
  font-size: 12px;
  color: #a0aec0;
  margin-bottom: 28px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}
.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}
.form-input {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 13px;
  color: #333;
  outline: none;
  width: 100%;
  font-family: "Noto Sans KR", sans-serif;
}
.form-input:focus {
  border-color: #2b3a55;
}
.form-select {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 10px 32px 10px 14px;
  font-size: 13px;
  color: #333;
  background: #fff
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23A0AEC0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")
    no-repeat right 12px center;
  appearance: none;
  outline: none;
  width: 100%;
  font-family: "Noto Sans KR", sans-serif;
}
.form-textarea {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 13px;
  color: #333;
  outline: none;
  resize: none;
  width: 100%;
  font-family: "Noto Sans KR", sans-serif;
}
.form-textarea:focus {
  border-color: #2b3a55;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.input-suffix-wrap {
  position: relative;
}
.input-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #a0aec0;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}

.error-msg {
  font-size: 11px;
  color: #e53e3e;
  margin-top: 2px;
}
.input-error {
  border-color: #e53e3e !important;
}
.server-error {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 7px;
  padding: 10px 14px;
  font-size: 13px;
  color: #e53e3e;
  margin-bottom: 20px;
}

.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #e2e8f0;
  border-radius: 24px;
  transition: background 0.3s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: left 0.1s;
}
input:checked + .slider {
  background: #4d8b5a;
}
input:checked + .slider:before {
  transform: translateX(20px);
}
.toggle-label {
  font-size: 13px;
  font-weight: 600;
  color: #718096;
}
.toggle-label.active {
  color: #4d8b5a;
}
.toggle-desc {
  font-size: 12px;
  color: #a0aec0;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}
.form-actions-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}
.btn-cancel {
  padding: 10px 24px;
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
  padding: 10px 28px;
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
.btn-delete {
  padding: 10px 24px;
  background: #fee2e2;
  color: #e53e3e;
  border: 1px solid #fecaca;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: "Noto Sans KR", sans-serif;
}
.btn-delete:hover {
  background: #fecaca;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.preview-box {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}
.preview-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 14px;
}
.preview-card {
  padding: 4px;
}
.preview-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.card-icon {
  width: 32px;
  height: 32px;
  background: #f0f4ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2b3a55;
  flex-shrink: 0;
}
.preview-name-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.preview-name {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
}
.preview-id {
  font-size: 11px;
  color: #a0aec0;
  margin-top: 2px;
}
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  width: fit-content;
}
.status-badge.active {
  background: #c6f6d5;
  color: #276749;
}
.status-badge.inactive {
  background: #f5f5f5;
  color: #718096;
}
.preview-divider {
  height: 1px;
  background: #e2e8f0;
  margin-bottom: 12px;
}
.preview-info {
  display: flex;
  flex-direction: column;
}
.preview-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}
.preview-row:last-child {
  border-bottom: none;
}
.preview-row span:first-child {
  color: #718096;
}
.preview-row span:last-child {
  font-weight: 600;
  color: #1a202c;
}

.guide-box {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}
.guide-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 12px;
}
.guide-divider {
  height: 1px;
  background: #e2e8f0;
  margin-bottom: 12px;
}
.guide-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.guide-list li {
  font-size: 12px;
  color: #718096;
  padding-left: 14px;
  position: relative;
}
.guide-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #ed8936;
}
</style>
