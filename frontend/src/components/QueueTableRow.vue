<template>
    <tr>
        <td>
            <font-awesome-icon :class="[history ? 'complete' : '', item.status]" :icon="['fas', history ? 'download' : (item.status == 'Queued' ? 'cloud' : 'cloud-download')]"/>
        </td>
        <td class='text' data-title='Filename'>
            <RouterLink :to="{ path: '/info', query: { item : JSON.stringify(item) } }">{{ item.nzbName }}</RouterLink>
        </td>
        <td>
            <span :class="['pill', item.type]">
                {{ item.type }}
            </span>
        </td>
        <td data-title='Start'>{{ item.details.start }}</td>
        <td data-title='Size'>{{ formatStorageSize(item.details.size) }}</td>
        <td class='progress-column' data-title='Progress'>
            <ProgressBar :progress="item.details.progress" :history="history" :idle="item.status == 'Queued'"/>
        </td>
        <td data-title='ETA'>{{ item.details.eta }}</td>
        <td data-title='Speed'>{{ item.details.speed }} {{ item.details.speed != '' ? 'MB/s' : '' }}</td>
        <td class='actionCol' data-title='Action'>
            <span v-if="history">
                <font-awesome-icon class="clickable" :icon="['fas', 'trash']" @click="trash(item.pid)" />
            </span>
            <span v-if="!history">
                <font-awesome-icon class="clickable" :icon="['fas', 'xmark']" @click="cancel(item.pid)" />
            </span>
        </td>
    </tr>
</template>

<script setup>
import { ipFetch } from '@/lib/ipFetch';
import ProgressBar from './ProgressBar.vue';
import { defineProps } from 'vue';
import { formatStorageSize } from '@/lib/utils';

defineProps({
    item: {
        type: Object,
        required: true
    },

    history: {
        type: Boolean,
        require: true
    }
});

const trash = async (pid) => {
    if (confirm("Are you sure you want to delete this history item?")) {
        ipFetch(`json-api/history?pid=${pid}`, 'DELETE');
    }
}

const cancel = async (pid) => {
    if (confirm("Are you sure you want to cancel this download?")) {
        ipFetch(`json-api/queue?pid=${pid}`, 'DELETE');
    }
}
</script>

<style lang="less" scoped>
    .complete {
        color: @complete-color;
    }
</style>