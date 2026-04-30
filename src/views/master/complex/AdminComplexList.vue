<script setup>
// TODO: MASTER가 단지를 선택하고 관리자 화면 또는 입주민 미리보기로 이동하는 화면입니다.
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import { getComplexStatusLabel } from '@/constants/complexCodes'
import { useComplexStore } from '@/stores/useComplexStore'

const router = useRouter()
const complexStore = useComplexStore()

const state = reactive({
  filters: {
    keyword: '',
  },
  selectedCode: '',
  modal: {
    visible: false,
    title: '',
    subtitle: '',
  },
})

// 선택 드롭다운과 표에서 함께 사용할 단지 목록을 정리합니다.
const complexRows = computed(() => {
  const source = complexStore.masterComplexPage?.content

  if (!Array.isArray(source)) {
    return []
  }

  return source
})

// 삭제 상태 단지는 드롭다운에서 제외해 선택 UX를 단순하게 유지합니다.
const selectableComplexRows = computed(() => {
  return complexRows.value.filter((complex) => getComplexStatusLabel(complex?.status) !== '삭제')
})

// 현재 선택된 단지 정보를 화면에 표시합니다.
const selectedComplex = computed(() => {
  if (complexStore.selectedComplex?.code) {
    return complexStore.selectedComplex
  }

  return selectableComplexRows.value.find((complex) => complex.code === state.selectedCode) || null
})

// 단지 상태를 code와 value 혼합 응답에도 안전하게 표시합니다.
const formatStatus = (status) => {
  return getComplexStatusLabel(status)
}

// 등록일은 날짜 부분만 잘라서 표시합니다.
const formatDate = (dateValue) => {
  if (!dateValue) {
    return '-'
  }

  return String(dateValue).slice(0, 10)
}

// alert 대신 모달로 사용자에게 처리 결과를 안내합니다.
const openNoticeModal = (title, subtitle) => {
  state.modal.visible = true
  state.modal.title = title
  state.modal.subtitle = subtitle
}

// 단지 목록을 조회한다.
const loadComplexes = async () => {
  try {
    const page = await complexStore.fetchMasterComplexes({
      keyword: state.filters.keyword || undefined,
      page: 0,
      size: 20,
    })

    if (!state.selectedCode && complexStore.selectedComplex?.code) {
      state.selectedCode = complexStore.selectedComplex.code
    }

    if (!state.selectedCode && Array.isArray(page?.content) && page.content.length === 1) {
      state.selectedCode = page.content[0].code || ''
    }
  } catch (error) {
    console.error(error)
  }
}

// 검색 조건으로 단지 목록 재조회
const handleSearch = async () => {
  await loadComplexes()
}

// 선택한 단지를 새로고침 후에도 유지하기 위해 store와 localStorage에 저장한다.
const handleSelectChange = async () => {
  if (!state.selectedCode) {
    complexStore.clearSelectedComplex()
    return
  }

  try {
    await complexStore.selectComplexForMaster(state.selectedCode)
  } catch (error) {
    console.error(error)

    const fallbackComplex = selectableComplexRows.value.find((complex) => complex.code === state.selectedCode)

    if (fallbackComplex) {
      complexStore.setSelectedComplex(fallbackComplex)
    }
  }
}

// 관리자 바로가기 전 단지 선택 여부 확인
const ensureSelectedComplex = () => {
  if (selectedComplex.value?.code) {
    return true
  }

  openNoticeModal('단지를 먼저 선택해주세요.', '단지를 선택한 뒤 관리자 화면 또는 미리보기를 사용할 수 있습니다.')
  return false
}

// 선택 단지를 저장하고 MASTER 전용 대시보드로 이동합니다.
const handleSelectComplex = async (complex) => {
  state.selectedCode = complex?.code || ''

  try {
    await complexStore.selectComplexForMaster(state.selectedCode)
  } catch (error) {
    console.error(error)
    complexStore.setSelectedComplex(complex)
  }

  router.push(`/admin/master/complexes/${state.selectedCode}/dashboard`)
}

// 입주민 미리보기 전 단지 선택 여부 확인
const goToResidentPreview = () => {
  if (!ensureSelectedComplex()) {
    return
  }

  router.push(`/admin/complexes/${selectedComplex.value.code}/resident-preview`)
}

// MASTER 전용 대시보드 진입
const goToAdminDashboard = () => {
  if (!ensureSelectedComplex()) {
    return
  }

  router.push(`/admin/master/complexes/${selectedComplex.value.code}/dashboard`)
}

// 선택된 단지의 수정 화면으로 이동합니다.
const goToEdit = () => {
  if (!ensureSelectedComplex()) {
    return
  }

  router.push(`/admin/master/complexes/${selectedComplex.value.code}/edit`)
}

// 단지 상세 화면 이동
const goToDetail = (code) => {
  router.push(`/admin/master/complexes/${code}`)
}

// 단지 관리자 배정 화면 이동
const goToAdmins = (code) => {
  router.push(`/admin/master/complexes/${code}/admins`)
}

// 단지 등록 화면 이동
const goToCreate = () => {
  router.push('/admin/master/complexes/create')
}

// 선택 단지 복구
onMounted(async () => {
  complexStore.restoreSelectedComplex()

  if (complexStore.selectedComplex?.code) {
    state.selectedCode = complexStore.selectedComplex.code
  }

  await loadComplexes()
})
</script>

<template>
  <section class="master-complex-list page-container">
    <div class="master-complex-list__hero">
      <p class="master-complex-list__eyebrow">MASTER</p>
      <h1 class="master-complex-list__title">아파트엔 마스터</h1>
      <p class="master-complex-list__description">
        관리할 단지를 선택하면 해당 단지 기준 관리자 화면과 입주민 미리보기로 이동할 수 있습니다.
      </p>

      <div class="master-complex-list__selector-row">
        <select
          v-model="state.selectedCode"
          class="master-complex-list__select"
          @change="handleSelectChange"
        >
          <option value="">단지를 선택해주세요.</option>
          <option
            v-for="complex in selectableComplexRows"
            :key="complex.code"
            :value="complex.code"
          >
            {{ complex.name || complex.complexName || complex.code }}
          </option>
        </select>

        <button type="button" class="master-complex-list__secondary-button" @click="goToEdit">
          수정
        </button>
        <button type="button" class="master-complex-list__primary-button" @click="goToCreate">
          등록
        </button>
      </div>

      <p v-if="selectedComplex?.name" class="master-complex-list__selected">
        현재 선택 단지: <strong>{{ selectedComplex.name }}</strong>
      </p>

      <div class="master-complex-list__cards">
        <button type="button" class="master-complex-list__card" @click="goToResidentPreview">
          <span class="master-complex-list__card-kicker">PREVIEW</span>
          <strong class="master-complex-list__card-title">입주민 미리보기</strong>
          <span class="master-complex-list__card-copy">
            선택한 단지의 입주민 화면 구조를 조회 전용으로 확인합니다.
          </span>
        </button>

        <button type="button" class="master-complex-list__card" @click="goToAdminDashboard">
          <span class="master-complex-list__card-kicker">ADMIN</span>
          <strong class="master-complex-list__card-title">관리자 바로가기</strong>
          <span class="master-complex-list__card-copy">
            MASTER 전용 단지 대시보드에서 관리자 운영 흐름을 이어서 확인합니다.
          </span>
        </button>
      </div>
    </div>

    <div class="card-section master-complex-list__filter">
      <input
        v-model="state.filters.keyword"
        type="text"
        class="master-complex-list__input"
        placeholder="단지명 또는 코드 검색"
      />
      <button type="button" class="master-complex-list__secondary-button" @click="handleSearch">
        조회
      </button>
    </div>

    <div class="card-section">
      <p v-if="complexStore.loading" class="master-complex-list__feedback">
        단지 목록을 불러오는 중입니다.
      </p>
      <p
        v-else-if="complexStore.error"
        class="master-complex-list__feedback master-complex-list__feedback--error"
      >
        {{ complexStore.error?.message || '단지 목록을 불러오지 못했습니다.' }}
      </p>

      <div class="master-complex-list__table-wrap">
        <table class="master-complex-list__table">
          <thead>
            <tr>
              <th>단지명</th>
              <th>코드</th>
              <th>주소</th>
              <th>상태</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!complexStore.loading && complexRows.length === 0">
              <td colspan="6" class="master-complex-list__empty">조회된 단지가 없습니다.</td>
            </tr>
            <tr v-for="complex in complexRows" :key="complex.code || complex.id">
              <td>{{ complex.name || complex.complexName || '-' }}</td>
              <td>{{ complex.code || '-' }}</td>
              <td>{{ complex.address || '-' }}</td>
              <td>{{ formatStatus(complex.status) }}</td>
              <td>{{ formatDate(complex.createdAt || complex.createdDate) }}</td>
              <td>
                <div class="master-complex-list__actions">
                  <button
                    type="button"
                    class="master-complex-list__text-button"
                    @click="goToDetail(complex.code)"
                  >
                    상세
                  </button>
                  <button
                    type="button"
                    class="master-complex-list__text-button"
                    @click="goToAdmins(complex.code)"
                  >
                    관리자 배정
                  </button>
                  <button
                    type="button"
                    class="master-complex-list__primary-button"
                    @click="handleSelectComplex(complex)"
                  >
                    이 단지로 대시보드 보기
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal
      :visible="state.modal.visible"
      :title="state.modal.title"
      :subtitle="state.modal.subtitle"
      @close="state.modal.visible = false"
    />
  </section>
</template>

<style scoped>
.master-complex-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.master-complex-list__hero {
  padding: 40px 32px;
  border-radius: var(--radius-12);
  background: linear-gradient(135deg, rgba(30, 42, 62, 0.98), rgba(43, 58, 85, 0.94));
  color: var(--color-white);
  text-align: center;
}

.master-complex-list__eyebrow {
  margin: 0 0 8px;
  color: rgba(255, 255, 255, 0.72);
  font-size: var(--font-size-label);
  letter-spacing: 0.12em;
}

.master-complex-list__title {
  margin: 0;
  font-size: var(--font-size-heading-1);
}

.master-complex-list__description {
  margin: 12px auto 0;
  max-width: 720px;
  color: rgba(255, 255, 255, 0.82);
  font-size: var(--font-size-body);
}

.master-complex-list__selector-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
}

.master-complex-list__select,
.master-complex-list__input {
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  font: inherit;
}

.master-complex-list__select {
  min-width: 360px;
}

.master-complex-list__selected {
  margin: 16px 0 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: var(--font-size-body-sm);
}

.master-complex-list__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 28px;
}

.master-complex-list__card {
  display: flex;
  min-height: 168px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 10px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-white);
  text-align: left;
  cursor: pointer;
}

.master-complex-list__card-kicker {
  color: rgba(255, 255, 255, 0.64);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.master-complex-list__card-title {
  font-size: var(--font-size-heading-3);
}

.master-complex-list__card-copy {
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-body-sm);
  line-height: 1.6;
}

.master-complex-list__filter {
  display: flex;
  gap: 12px;
  align-items: center;
}

.master-complex-list__input {
  flex: 1;
}

.master-complex-list__table-wrap {
  overflow-x: auto;
}

.master-complex-list__feedback {
  margin: 0 0 16px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-complex-list__feedback--error {
  color: var(--color-danger);
}

.master-complex-list__table {
  width: 100%;
  border-collapse: collapse;
}

.master-complex-list__table th,
.master-complex-list__table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--color-table-line);
  text-align: left;
  font-size: var(--font-size-detail);
}

.master-complex-list__table th {
  background: var(--color-table-head-bg);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.master-complex-list__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.master-complex-list__primary-button,
.master-complex-list__secondary-button,
.master-complex-list__text-button {
  height: 40px;
  padding: 0 14px;
  border-radius: var(--radius-8);
  font: inherit;
  cursor: pointer;
}

.master-complex-list__primary-button {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.master-complex-list__secondary-button,
.master-complex-list__text-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}

.master-complex-list__empty {
  text-align: center;
  color: var(--color-text-secondary);
}

@media (max-width: 960px) {
  .master-complex-list__selector-row,
  .master-complex-list__filter {
    flex-direction: column;
    align-items: stretch;
  }

  .master-complex-list__select {
    min-width: 0;
    width: 100%;
  }

  .master-complex-list__cards {
    grid-template-columns: 1fr;
  }
}
</style>
