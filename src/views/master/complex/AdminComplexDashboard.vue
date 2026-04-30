<script setup>
// TODO: MASTER가 선택한 단지의 운영 진입점을 확인하는 전용 대시보드입니다.
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import { getComplexStatusLabel } from '@/constants/complexCodes'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const router = useRouter()
const complexStore = useComplexStore()

const state = reactive({
  loading: false,
  modal: {
    visible: false,
    title: '',
    subtitle: '',
  },
})

// 현재 라우트의 단지 코드를 읽습니다.
const complexCode = computed(() => route.params.code)

// 현재 표시할 단지 정보를 store 기준으로 계산합니다.
const complexDetail = computed(() => {
  if (complexStore.selectedComplex?.code === complexCode.value) {
    return {
      ...complexStore.complexDetail,
      ...complexStore.selectedComplex,
    }
  }

  return complexStore.complexDetail || complexStore.selectedComplex || {}
})

// alert 대신 BaseModal로 안내합니다.
const openNoticeModal = (title, subtitle) => {
  state.modal.visible = true
  state.modal.title = title
  state.modal.subtitle = subtitle
}

// 선택 단지 복구
const restoreSelectedComplex = async () => {
  complexStore.restoreSelectedComplex()

  if (!complexCode.value) {
    // 선택 단지 없음 안내
    openNoticeModal('단지 정보를 확인할 수 없습니다.', '전체 단지 목록으로 돌아가 다시 선택해주세요.')
    return
  }

  if (complexStore.selectedComplex?.code === complexCode.value && complexStore.complexDetail?.code === complexCode.value) {
    return
  }

  state.loading = true

  try {
    const detail = await complexStore.fetchMasterComplexDetail(complexCode.value)
    complexStore.setSelectedComplex(detail)
  } catch (error) {
    console.error(error)
    openNoticeModal(
      '선택 단지를 복구하지 못했습니다.',
      error?.message || '목록으로 돌아가 다시 선택해주세요.',
    )
  } finally {
    state.loading = false
  }
}

// 관리자 현황 이동
const goToAdmins = () => {
  router.push(`/admin/master/complexes/${complexCode.value}/admins`)
}

// 입주민 미리보기 이동
const goToResidentPreview = () => {
  router.push(`/admin/complexes/${complexCode.value}/resident-preview`)
}

// 단지 정보 수정 화면으로 이동합니다.
const goToEdit = () => {
  router.push(`/admin/master/complexes/${complexCode.value}/edit`)
}

// 전체 단지 목록으로 이동합니다.
const goToList = () => {
  router.push('/admin/master/complexes')
}

// MASTER 전용 대시보드 진입
onMounted(async () => {
  await restoreSelectedComplex()
})
</script>

<template>
  <section class="master-complex-dashboard page-container">
    <div class="master-complex-dashboard__header">
      <div>
        <p class="master-complex-dashboard__eyebrow">MASTER DASHBOARD</p>
        <h1 class="page-title">
          {{ complexDetail.name || '선택 단지 대시보드' }}
        </h1>
        <p class="master-complex-dashboard__description">
          현재 MASTER가 선택한 단지의 관리자 운영 화면을 보고 있습니다.
        </p>
      </div>
      <button type="button" class="master-complex-dashboard__ghost-button" @click="goToList">
        전체 단지 목록
      </button>
    </div>

    <div class="card-section master-complex-dashboard__summary">
      <div class="master-complex-dashboard__summary-item">
        <span>단지명</span>
        <strong>{{ complexDetail.name || '-' }}</strong>
      </div>
      <div class="master-complex-dashboard__summary-item">
        <span>코드</span>
        <strong>{{ complexDetail.code || complexCode || '-' }}</strong>
      </div>
      <div class="master-complex-dashboard__summary-item">
        <span>상태</span>
        <strong>{{ getComplexStatusLabel(complexDetail.status) }}</strong>
      </div>
      <div class="master-complex-dashboard__summary-item">
        <span>주소</span>
        <strong>{{ complexDetail.address || '-' }}</strong>
      </div>
    </div>

    <p v-if="state.loading" class="master-complex-dashboard__feedback">
      선택 단지 정보를 불러오는 중입니다.
    </p>

    <div class="master-complex-dashboard__cards">
      <button type="button" class="master-complex-dashboard__card" @click="goToAdmins">
        <span class="master-complex-dashboard__card-kicker">ADMIN</span>
        <strong class="master-complex-dashboard__card-title">관리자 현황</strong>
        <span class="master-complex-dashboard__card-copy">
          단지 관리자 현황과 배정 화면으로 이동합니다.
        </span>
      </button>

      <button type="button" class="master-complex-dashboard__card" @click="goToResidentPreview">
        <span class="master-complex-dashboard__card-kicker">PREVIEW</span>
        <strong class="master-complex-dashboard__card-title">입주민 미리보기</strong>
        <span class="master-complex-dashboard__card-copy">
          선택 단지 기준으로 입주민 모바일 구조를 조회합니다.
        </span>
      </button>

      <button type="button" class="master-complex-dashboard__card" @click="goToEdit">
        <span class="master-complex-dashboard__card-kicker">EDIT</span>
        <strong class="master-complex-dashboard__card-title">단지 정보 수정</strong>
        <span class="master-complex-dashboard__card-copy">
          단지명과 설명을 수정하는 관리 화면으로 이동합니다.
        </span>
      </button>

      <button type="button" class="master-complex-dashboard__card" @click="goToList">
        <span class="master-complex-dashboard__card-kicker">LIST</span>
        <strong class="master-complex-dashboard__card-title">전체 단지 목록</strong>
        <span class="master-complex-dashboard__card-copy">
          다른 단지를 선택하거나 목록으로 돌아갑니다.
        </span>
      </button>
    </div>

    <BaseModal
      :visible="state.modal.visible"
      :title="state.modal.title"
      :subtitle="state.modal.subtitle"
      @close="state.modal.visible = false"
    >
      <template #footer>
        <button type="button" class="master-complex-dashboard__primary-button" @click="goToList">
          전체 단지 목록으로 이동
        </button>
      </template>
    </BaseModal>
  </section>
</template>

<style scoped>
.master-complex-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.master-complex-dashboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.master-complex-dashboard__eyebrow {
  margin: 0 0 8px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.master-complex-dashboard__description {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-complex-dashboard__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.master-complex-dashboard__summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
}

.master-complex-dashboard__summary-item span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.master-complex-dashboard__feedback {
  margin: 0;
  color: var(--color-text-secondary);
}

.master-complex-dashboard__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.master-complex-dashboard__card {
  display: flex;
  min-height: 168px;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-small);
}

.master-complex-dashboard__card-kicker {
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
  letter-spacing: 0.08em;
}

.master-complex-dashboard__card-title {
  font-size: var(--font-size-heading-3);
}

.master-complex-dashboard__card-copy {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
  line-height: 1.6;
}

.master-complex-dashboard__primary-button,
.master-complex-dashboard__ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-8);
  font: inherit;
  cursor: pointer;
}

.master-complex-dashboard__primary-button {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.master-complex-dashboard__ghost-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}

@media (max-width: 960px) {
  .master-complex-dashboard__header {
    flex-direction: column;
    align-items: stretch;
  }

  .master-complex-dashboard__summary,
  .master-complex-dashboard__cards {
    grid-template-columns: 1fr;
  }
}
</style>
