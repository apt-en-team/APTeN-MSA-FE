<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { useComplexStore } from '@/stores/useComplexStore'

const route = useRoute()
const router = useRouter()
const complexStore = useComplexStore()

onMounted(() => {
  const complexId = complexStore.selectedComplex?.complexId
  if (complexId) {
    router.replace(`/resident/${complexId}/home`)
  } else {
    router.replace('/admin/master')
  }
})
</script>

<template>
  <div />
</template>
