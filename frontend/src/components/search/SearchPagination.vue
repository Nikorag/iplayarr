<template>
  <div class="pagination">
    <span @click="emit('changePage', 1)" class="clickable">&lt;&lt;</span>
    <span @click="emit('changePage', currentPage - 1)" class="clickable">&lt;</span>
    <span>Page {{ currentPage }} of {{ totalPages }}</span>
    <span @click="emit('changePage', currentPage + 1)" class="clickable">></span>
    <span @click="emit('changePage', totalPages)" class="clickable">>></span>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

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