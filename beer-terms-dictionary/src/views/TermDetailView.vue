<template>
  <div class="p-8">
    <!-- TermDetail component will be placed here -->
    <TermDetail :term-id="termId" @edit="editTerm" @back="goBack" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TermDetail from '@/components/terms/TermDetail.vue'

const route = useRoute()
const router = useRouter()

const termId = ref(route.params.id as string)

const goBack = () => {
  router.push('/')
}

const editTerm = (term: any) => {
  // For now, log to console. We will implement the edit page later.
  console.log('Editing term:', term)
  router.push(`/term/${term.id}/edit`)
}
</script>
