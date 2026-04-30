<script setup>
// TODO: MASTER가 드롭다운으로 단지를 선택하고 관리자형 화면으로 진입하는 홈 화면입니다.
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import { getComplexStatusLabel } from '@/constants/complexCodes'
import { useComplexStore } from '@/stores/useComplexStore'

const router = useRouter()
const complexStore = useComplexStore()

const state = reactive({
  selectedCode: '',
  modal: {
    visible: false,
    title: '',
    subtitle: '',
  },
})

// 단지 목록을 드롭다운용으로 조회합니다.
const complexOptions = computed(() => {
  const source = complexStore.masterComplexPage?.content

  if (!Array.isArray(source)) {
    return []
  }

  return source.filter((complex) => getComplexStatusLabel(complex?.status) !== '삭제')
})

// 현재 선택된 단지 정보를 드롭다운 기준으로 계산합니다.
const selectedComplex = computed(() => {
  if (complexStore.selectedComplex?.code === state.selectedCode) {
    return complexStore.selectedComplex
  }

  return complexOptions.value.find((complex) => complex.code === state.selectedCode) || null
})

// alert 대신 BaseModal을 사용합니다.
const openNoticeModal = (title, subtitle) => {
  state.modal.visible = true
  state.modal.title = title
  state.modal.subtitle = subtitle
}

// 단지 목록을 드롭다운용으로 조회
const loadComplexes = async () => {
  try {
    await complexStore.fetchMasterComplexes({
      page: 0,
      size: 100,
    })

    if (complexStore.selectedComplex?.code) {
      state.selectedCode = complexStore.selectedComplex.code
    }
  } catch (error) {
    console.error(error)
    openNoticeModal(
      '단지 목록을 불러오지 못했습니다.',
      error?.message || '잠시 후 다시 시도해주세요.',
    )
  }
}

// 단지 선택 저장
const handleSelectChange = async () => {
  if (!state.selectedCode) {
    complexStore.clearSelectedComplex()
    return
  }

  try {
    await complexStore.selectComplexForMaster(state.selectedCode)
  } catch (error) {
    console.error(error)

    const fallbackComplex = complexOptions.value.find((complex) => complex.code === state.selectedCode)

    if (fallbackComplex) {
      complexStore.setSelectedComplex(fallbackComplex)
    }
  }
}

// 단지 선택 전 카드 클릭 방지
const ensureSelectedComplex = () => {
  if (selectedComplex.value?.code) {
    return true
  }

  openNoticeModal(
    '단지를 먼저 선택해주세요.',
    '단지를 선택한 뒤 관리자 바로가기 또는 입주민 미리보기를 사용할 수 있습니다.',
  )
  return false
}

// 관리자 바로가기 이동
const goToDashboard = async () => {
  if (!ensureSelectedComplex()) {
    return
  }

  await handleSelectChange()
  router.push(`/admin/master/complexes/${selectedComplex.value.code}/dashboard`)
}

// 입주민 미리보기 이동
const goToResidentPreview = async () => {
  if (!ensureSelectedComplex()) {
    return
  }

  await handleSelectChange()
  router.push(`/admin/complexes/${selectedComplex.value.code}/resident-preview`)
}

// 선택 단지가 있을 때만 수정 화면으로 이동합니다.
const goToEdit = () => {
  if (!ensureSelectedComplex()) {
    return
  }

  router.push(`/admin/master/complexes/${selectedComplex.value.code}/edit`)
}

// 단지 등록 화면으로 이동합니다.
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
  <section class="master-home">
    <div class="master-home__hero">
      <p class="master-home__eyebrow">MASTER</p>
      <h1 class="master-home__title">아파트엔 마스터</h1>
      <p class="master-home__description">
        단지를 선택한 뒤 입주민 미리보기 또는 관리자 운영 화면으로 바로 이동할 수 있습니다.
      </p>

      <div class="master-home__selector-row">
        <select v-model="state.selectedCode" class="master-home__select" @change="handleSelectChange">
          <option value="">단지를 선택해주세요.</option>
          <option
            v-for="complex in complexOptions"
            :key="complex.code"
            :value="complex.code"
          >
            {{ complex.name || complex.complexName || complex.code }}
          </option>
        </select>

        <button type="button" class="master-home__secondary-button" @click="goToEdit">
          수정
        </button>
        <button type="button" class="master-home__primary-button" @click="goToCreate">
          등록
        </button>
      </div>

      <p v-if="selectedComplex?.name" class="master-home__selected">
        현재 선택 단지: <strong>{{ selectedComplex.name }}</strong>
      </p>

      <div class="master-home__cards">
        <button type="button" class="master-home__card" @click="goToResidentPreview">
          <span class="master-home__card-kicker">PREVIEW</span>
          <strong class="master-home__card-title">입주민 미리보기</strong>
          <span class="master-home__card-copy">
            선택한 단지의 입주민 모바일 구조를 조회 전용으로 확인합니다.
          </span>
        </button>

        <button type="button" class="master-home__card" @click="goToDashboard">
          <span class="master-home__card-kicker">ADMIN</span>
          <strong class="master-home__card-title">관리자 바로가기</strong>
          <span class="master-home__card-copy">
            MASTER 전용 단지 대시보드에서 관리자 운영 흐름을 이어서 확인합니다.
          </span>
        </button>
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
.master-home {
  width: min(100%, 1080px);
}

.master-home__hero {
  padding: 56px 48px;
  border-radius: 16px;
  background: var(--color-card-bg);
  box-shadow: var(--shadow-medium);
  text-align: center;
}

.master-home__eyebrow {
  margin: 0 0 8px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
  letter-spacing: 0.12em;
}

.master-home__title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 40px;
}

.master-home__description {
  margin: 16px auto 0;
  max-width: 620px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body);
  line-height: 1.7;
}

.master-home__selector-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}

.master-home__select {
  min-width: 420px;
  height: 46px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  font: inherit;
}

.master-home__selected {
  margin: 16px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-home__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 32px;
}

.master-home__card {
  display: flex;
  min-height: 190px;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-bg-app);
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
}

.master-home__card-kicker {
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.master-home__card-title {
  font-size: var(--font-size-heading-3);
}

.master-home__card-copy {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
  line-height: 1.7;
}

.master-home__primary-button,
.master-home__secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 18px;
  border-radius: 14px;
  font: inherit;
  cursor: pointer;
}

.master-home__primary-button {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.master-home__secondary-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}

@media (max-width: 960px) {
  .master-home__hero {
    padding: 40px 24px;
  }

  .master-home__selector-row {
    flex-direction: column;
    align-items: stretch;
  }

  .master-home__select {
    min-width: 0;
    width: 100%;
  }

  .master-home__cards {
    grid-template-columns: 1fr;
  }
}
</style>
