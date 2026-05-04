<script setup>
// MASTER가 선택한 단지의 관리자형 진입 화면을 보여주는 페이지이다.
import { computed, onMounted, reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import { getComplexStatusLabel } from '@/constants/complexCodes'
import { useAuthStore } from '@/stores/useAuthStore'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const complexStore = useComplexStore()

const state = reactive({
  loading: false,
  modal: {
    visible: false,
    title: '',
    subtitle: '',
  },
})

// 현재 라우트의 단지 코드를 기준으로 화면을 구성한다.
const complexCode = computed(() => String(route.params.code || ''))

// 선택 단지 또는 상세 정보를 우선순위에 맞게 합쳐서 사용한다.
const currentComplex = computed(() => {
  if (complexStore.selectedComplex?.code === complexCode.value) {
    return {
      ...complexStore.complexDetail,
      ...complexStore.selectedComplex,
    }
  }

  return complexStore.complexDetail || complexStore.selectedComplex || {}
})

// legacy AdminLayout에 표시할 메뉴 그룹을 구성한다.
const navGroups = computed(() => [
  {
    label: 'MASTER ADMIN',
    items: [
      {
        label: '단지 대시보드',
        to: `/admin/master/complexes/${complexCode.value}/dashboard`,
      },
      {
        label: '관리자 관리',
        to: `/admin/master/complexes/${complexCode.value}/admins`,
      },
    ],
  },
])

// 레이아웃 프로필 영역에 표시할 사용자 이름을 계산한다.
const profileName = computed(() => {
  return authStore.name || authStore.user?.name || '마스터 관리자'
})

// 현재 라우트 활성 여부를 메뉴 강조에 사용한다.
function isMenuActive(targetPath) {
  return route.path === targetPath || route.path.startsWith(`${targetPath}/`)
}

// 선택 단지 정보가 없을 때는 안내 모달로 복구 실패를 알린다.
function openNoticeModal(title, subtitle) {
  state.modal.visible = true
  state.modal.title = title
  state.modal.subtitle = subtitle
}

// 선택 단지 복구
async function restoreSelectedComplex() {
  complexStore.restoreSelectedComplex()

  if (!complexCode.value) {
    openNoticeModal('단지 정보를 확인할 수 없습니다.', '단지 선택 홈으로 돌아가 다시 선택해주세요.')
    return
  }

  if (
    complexStore.selectedComplex?.code === complexCode.value &&
    complexStore.complexDetail?.code === complexCode.value
  ) {
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
      error?.message || '단지 선택 홈으로 돌아가 다시 시도해주세요.',
    )
  } finally {
    state.loading = false
  }
}

// 관리자 관리 메뉴로 이동한다.
function goToAdmins() {
  router.push(`/admin/master/complexes/${complexCode.value}/admins`)
}

// 입주민 미리보기 이동
function goToResidentPreview() {
  router.push(`/admin/complexes/${complexCode.value}/resident-preview`)
}

// 단지 정보 수정 화면으로 이동한다.
function goToEdit() {
  router.push(`/admin/master/complexes/${complexCode.value}/edit`)
}

// 단지 선택 홈으로 돌아간다.
function goToComplexList() {
  router.push('/admin/master')
}

// MASTER 전용 대시보드 진입 시 선택 단지 정보를 복구한다.
onMounted(async () => {
  await restoreSelectedComplex()
})
</script>

<template>
  <AdminLayout
    title="관리자 관리"
    subtitle="선택한 단지의 매니저와 스태프 계정을 관리합니다."
    :nav-groups="navGroups"
    :profile-name="profileName"
    profile-role="MASTER"
  >
    <template #nav="{ group }">
      <RouterLink
        v-for="item in group.items || []"
        :key="item.to"
        :to="item.to"
        class="layout-nav-link"
        :class="{ 'is-active': isMenuActive(item.to) }"
      >
        {{ item.label }}
      </RouterLink>
    </template>

    <template #header-actions>
      <button type="button" class="dashboard-button dashboard-button--ghost" @click="goToComplexList">
        단지 선택
      </button>
    </template>

    <section class="master-dashboard">
      <div class="master-dashboard__header">
        <div>
          <p class="master-dashboard__eyebrow">MASTER DASHBOARD</p>
          <h2 class="master-dashboard__title">
            {{ currentComplex.name || '선택 단지 대시보드' }}
          </h2>
          <p class="master-dashboard__description">
            현재 MASTER가 선택한 단지의 관리자 운영 화면을 보고 있습니다.
          </p>
        </div>
      </div>

      <div class="master-dashboard__summary">
        <div class="master-dashboard__summary-item">
          <span>단지명</span>
          <strong>{{ currentComplex.name || '-' }}</strong>
        </div>
        <div class="master-dashboard__summary-item">
          <span>코드</span>
          <strong>{{ currentComplex.code || complexCode || '-' }}</strong>
        </div>
        <div class="master-dashboard__summary-item">
          <span>상태</span>
          <strong>{{ getComplexStatusLabel(currentComplex.status) }}</strong>
        </div>
        <div class="master-dashboard__summary-item">
          <span>주소</span>
          <strong>{{ currentComplex.address || '-' }}</strong>
        </div>
      </div>

      <p v-if="state.loading" class="master-dashboard__feedback">
        선택 단지 정보를 불러오는 중입니다.
      </p>

      <div class="master-dashboard__cards">
        <button type="button" class="master-dashboard__card" @click="goToAdmins">
          <span class="master-dashboard__card-kicker">ADMIN</span>
          <strong class="master-dashboard__card-title">관리자 관리</strong>
          <span class="master-dashboard__card-copy">
            선택한 단지의 매니저와 스태프 계정을 관리합니다.
          </span>
        </button>

        <button type="button" class="master-dashboard__card" @click="goToResidentPreview">
          <span class="master-dashboard__card-kicker">PREVIEW</span>
          <strong class="master-dashboard__card-title">입주민 미리보기</strong>
          <span class="master-dashboard__card-copy">
            선택 단지 기준으로 입주민 모바일 구조를 조회합니다.
          </span>
        </button>

        <button type="button" class="master-dashboard__card" @click="goToEdit">
          <span class="master-dashboard__card-kicker">EDIT</span>
          <strong class="master-dashboard__card-title">단지 정보 수정</strong>
          <span class="master-dashboard__card-copy">
            단지명과 설명을 수정하는 관리 화면으로 이동합니다.
          </span>
        </button>

        <button type="button" class="master-dashboard__card" @click="goToComplexList">
          <span class="master-dashboard__card-kicker">LIST</span>
          <strong class="master-dashboard__card-title">단지 선택 홈</strong>
          <span class="master-dashboard__card-copy">
            다른 단지를 선택하거나 마스터 홈으로 돌아갑니다.
          </span>
        </button>
      </div>
    </section>

    <BaseModal
      :visible="state.modal.visible"
      :title="state.modal.title"
      :subtitle="state.modal.subtitle"
      @close="state.modal.visible = false"
    >
      <template #footer>
        <button type="button" class="dashboard-button dashboard-button--primary" @click="goToComplexList">
          단지 선택 홈으로 이동
        </button>
      </template>
    </BaseModal>
  </AdminLayout>
</template>

<style scoped>
.layout-nav-link {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 9px 10px;
  border-radius: 7px;
  color: #8B9AB0;
  font-size: 13px;
  text-decoration: none;
}

.layout-nav-link.is-active,
.layout-nav-link.router-link-active {
  background: #2B3A55;
  color: #FFFFFF;
}

.dashboard-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.dashboard-button--ghost {
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #1A202C;
}

.dashboard-button--primary {
  border: none;
  background: #2B3A55;
  color: #FFFFFF;
}

.master-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.master-dashboard__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.master-dashboard__eyebrow {
  margin: 0 0 8px;
  color: #687282;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.master-dashboard__title {
  margin: 0;
  color: #1A202C;
  font-size: 28px;
  font-weight: 700;
}

.master-dashboard__description {
  margin: 8px 0 0;
  color: #687282;
  font-size: 14px;
}

.master-dashboard__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.master-dashboard__summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  background: #FFFFFF;
}

.master-dashboard__summary-item span {
  color: #687282;
  font-size: 12px;
}

.master-dashboard__summary-item strong {
  color: #1A202C;
  font-size: 17px;
}

.master-dashboard__feedback {
  margin: 0;
  color: #687282;
  font-size: 13px;
}

.master-dashboard__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.master-dashboard__card {
  display: flex;
  min-height: 168px;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  background: #FFFFFF;
  color: #1A202C;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06);
}

.master-dashboard__card-kicker {
  color: #687282;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.master-dashboard__card-title {
  font-size: 20px;
}

.master-dashboard__card-copy {
  color: #687282;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .master-dashboard__summary,
  .master-dashboard__cards {
    grid-template-columns: 1fr;
  }
}
</style>
