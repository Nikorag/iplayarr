<template>
    <tr class=''>
        <td class='text' data-title='Filename'>
            <RouterLink :to="{ path: '/logs', query: { filter: item.pid } }">{{ item.nzbName }}</RouterLink>
        </td>
        <td class='desktopOnly' data-title='Start'>{{ item.details.start }}</td>
        <td class='desktopOnly' data-title='Size'>{{ formatStorageSize(item.details.size) }}</td>
        <td class='' data-title='Progress'>
            <ProgressBar :progress="item.details.progress" :history="history" :idle="item.status == 'Idle'"/>
        </td>
        <td class='mobileOnly mobileInline' data-title='Start'>{{ item.details.start }}</td>
        <td class='mobileOnly mobileInline' data-title='Size'>{{ formatStorageSize(item.details.size) }}</td>
        <td class='mobileInline' data-title='ETA'>{{ item.details.eta }}</td>
        <td class='mobileInline' data-title='Speed'>{{ item.details.speed }} {{ item.details.speed != '' ? 'MB/s' : '' }}</td>
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
import ProgressBar from './ProgressBar.vue';
import { defineProps } from 'vue';

const host = process.env.NODE_ENV != 'production' ? `http://${window.location.hostname}:4404` : '';

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
        await fetch(`${host}/json-api/history?pid=${pid}`, { method: 'DELETE' });
    }
}

const cancel = async (pid) => {
    if (confirm("Are you sure you want to cancel this download?")) {
        await fetch(`${host}/json-api/queue?pid=${pid}`, { method: 'DELETE' });
    }
}

const formatStorageSize = (mb) => {
    if (mb){
        if (mb >= 1024) {
            return (mb / 1024).toFixed(2) + " GB";
        }
        return mb.toFixed(2) + " MB";
    }
    return;
}
</script>

<style scoped>
a {
    color: rgb(229, 229, 229);
    text-decoration: none;
}

a:hover {
    font-weight: bold;
}

td {
    padding: 0.8rem 0.5rem;
}

@media (min-width: 768px) {
    .actionCol {
        text-align: center;
    }
}

@media (max-width: 768px) {
  td:not(.desktopOnly) {
    display: block;
    padding: 0.5em;
  }

  td.mobileInline {
    display: inline-block;
    padding: 0.5em;
  }

  td.text {
    word-break: break-word; /* For modern browsers */
    overflow-wrap: anywhere; /* Ensures long words wrap */
  }

  .actionCol span {
    position: relative;
    left: calc(100% - 16px);
  }
}
</style>