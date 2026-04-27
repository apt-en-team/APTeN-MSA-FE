<script setup>
// TODO: MASTER 전용 입주민 화면 미리보기 레이아웃입니다.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 현재 미리보기 대상 단지 코드를 표시합니다.
const complexCode = computed(() => route.params.code || '-')

// 단지 상세로 돌아갑니다.
const goToComplexDetail = () => {
  router.push(`/admin/master/complexes/${complexCode.value}`)
}

// 전체 단지 목록으로 돌아갑니다.
const goToComplexList = () => {
  router.push('/admin/master/complexes')
}
</script>

<template>
  <div class="resident-preview-layout theme-resident theme-page-bg">
    <header class="resident-preview-layout__banner">
      <div>
        <p class="resident-preview-layout__kicker">MASTER 입주민 화면 미리보기</p>
        <h1 class="resident-preview-layout__title">단지 코드: {{ complexCode }}</h1>
        <p class="resident-preview-layout__description">조회 전용 미리보기입니다.</p>
      </div>
      <div class="resident-preview-layout__actions">
        <button type="button" class="resident-preview-layout__secondary-button" @click="goToComplexDetail">
          단지 상세로 돌아가기
        </button>
        <button type="button" class="resident-preview-layout__primary-button" @click="goToComplexList">
          전체 단지 목록
        </button>
      </div>
    </header>

    <section class="resident-preview-layout__content">
      <div class="resident-preview-layout__frame">
        <h2>입주민 화면 미리보기</h2>
        <p>실제 USER API 호출 없이 구조만 확인하는 조회 전용 shell 입니다.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.resident-preview-layout {
  min-height: 100vh;
  padding: 24px;
}

.resident-preview-layout__banner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px 24px;
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-small);
}

.resident-preview-layout__kicker {
  margin: 0 0 6px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-label);
}

.resident-preview-layout__title {
  margin: 0;
  font-size: var(--font-size-heading-3);
}

.resident-preview-layout__description {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
}

.resident-preview-layout__actions {
  display: flex;
  gap: 8px;
}

.resident-preview-layout__primary-button,
.resident-preview-layout__secondary-button {
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-8);
  font: inherit;
  cursor: pointer;
}

.resident-preview-layout__primary-button {
  border: none;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}

.resident-preview-layout__secondary-button {
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  color: var(--color-text-primary);
}

.resident-preview-layout__content {
  display: flex;
  justify-content: center;
}

.resident-preview-layout__frame {
  width: 100%;
  max-width: 430px;
  min-height: 720px;
  padding: 24px;
  border-radius: var(--radius-12);
  background-color: var(--color-card-bg);
  box-shadow: var(--shadow-medium);
}

.resident-preview-layout__frame h2,
.resident-preview-layout__frame p {
  margin: 0;
}

.resident-preview-layout__frame p {
  margin-top: 8px;
  color: var(--color-text-secondary);
}
</style>
