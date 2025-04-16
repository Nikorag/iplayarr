<template>
  <div class="pagination">
    <span class="clickable" @click="emit('changePage', 1)">&lt;&lt;</span>
    <span class="clickable" @click="emit('changePage', currentPage - 1)">&lt;</span>
    <span>Page {{ currentPage }} of {{ totalPages }}</span>
    <span class="clickable" @click="emit('changePage', currentPage + 1)">></span>
    <span class="clickable" @click="emit('changePage', totalPages)">>></span>
  </div>
</template>

<script setup>
import { defineEmits,defineProps } from 'vue';

defineProps({
    currentPage : Number,
    totalPages : Number
});

const emit = defineEmits(['changePage']);
</script>

<style lang="less" scoped>
    .pagination {
        width: 100%;
        display: flex;
        justify-content: center;
        gap: 15px;
    }
</style>