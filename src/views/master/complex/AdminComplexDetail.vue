<script setup>
// TODO: MASTER가 단지 상세를 확인하고 선택 단지로 전환할 수 있는 페이지입니다.
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const router = useRouter()
const complexStore = useComplexStore()

// 현재 단지 코드는 라우트 파라미터에서 읽습니다.
const complexCode = computed(() => route.params.code)

// 상세 데이터가 없을 때도 안전하게 표시합니다.
const complexDetail = computed(() => complexStore.complexDetail || {})

// 단지 상세 데이터를 조회합니다.
const fetchComplexDetail = async () => {
  await complexStore.fetchMasterComplexDetail(complexCode.value)
}

// 현재 상세 단지를 선택 단지로 저장하고 관리자 화면으로 이동합니다.
const handleSelectComplex = () => {
  complexStore.setSelectedComplex(complexDetail.value)
  router.push('/admin/dashboard')
}

// 단지 수정 화면으로 이동합니다.
const goToEdit = () => {
  router.push(`/admin/master/complexes/${complexCode.value}/edit`)
}

// 단지 관리자 배정 화면으로 이동합니다.
const goToAdmins = () => {
  router.push(`/admin/master/complexes/${complexCode.value}/admins`)
}

// 입주민 미리보기 화면으로 이동합니다.
const goToResidentPreview = () => {
  router.push(`/admin/complexes/${complexCode.value}/resident-preview`)
}

// 페이지 진입 시 단지 상세를 조회합니다.
onMounted(fetchComplexDetail)
</script>

<template>
  <section class="page-container">
    <div class="master-complex-detail__header">
      <div>
        <h1 class="page-title">단지 상세</h1>
        <p class="master-complex-detail__description">현재 단지 정보를 확인한 뒤 관리자 화면으로 전환할 수 있습니다.</p>
      </div>
      <div class="master-complex-detail__actions">
        <button type="button" class="master-complex-detail__secondary-button" @click="goToEdit">
          수정
        </button>
        <button type="button" class="master-complex-detail__secondary-button" @click="goToAdmins">
          관리자 배정
        </button>
        <button type="button" class="master-complex-detail__primary-button" @click="handleSelectComplex">
          이 단지로 관리자 화면 보기
        </button>
        <button type="button" class="master-complex-detail__secondary-button" @click="goToResidentPreview">
          입주민 미리보기
        </button>
      </div>
    </div>

    <div class="card-section master-complex-detail__grid">
      <div class="master-complex-detail__item">
        <span class="master-complex-detail__label">단지명</span>
        <strong>{{ complexDetail.name || complexDetail.complexName || '-' }}</strong>
      </div>
      <div class="master-complex-detail__item">
        <span class="master-complex-detail__label">코드</span>
        <strong>{{ complexDetail.code || '-' }}</strong>
      </div>
      <div class="master-complex-detail__item">
        <span class="master-complex-detail__label">상태</span>
        <strong>{{ complexDetail.status || '-' }}</strong>
      </div>
      <div class="master-complex-detail__item">
        <span class="master-complex-detail__label">주소</span>
        <strong>{{ complexDetail.address || '-' }}</strong>
      </div>
    </div>
  </section>
</template>

<style scoped>
.master-complex-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.master-complex-detail__description {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.master-complex-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.master-complex-detail__primary-button,
.master-complex-detail__secondary-button {
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-8);
  font: inherit;
  cursor: pointer;
}

.master-complex-detail__primary-button {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.master-complex-detail__secondary-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}

.master-complex-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.master-complex-detail__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
}

.master-complex-detail__label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}
</style>
