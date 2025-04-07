<template>
  <SettingsPageToolbar :icons="['delete']" delete-label="Remove" @delete-queue-item="deleteItems" />
  <div class="inner-content scroll-x">
    <QueueTable ref="queueTable" :queue="queue" :history="history" />
  </div>
</template>

<script setup>
import { inject, onMounted, provide, ref } from 'vue';

import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';
import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';

import QueueTable from '../components/queue/QueueTable.vue';

// const filterOptions = ref([
//     'ALL',
//     'COMPLETE',
//     'IN PROGRESS',
//     'QUEUED'
// ]);
// const filter = ref('ALL');

const queue = inject('queue');
const history = inject('history');

const queueTable = ref(null);

const apps = ref([]);
provide('apps', apps);

onMounted(async () => {
    apps.value = (await ipFetch('json-api/apps')).data;
});

const deleteItems = async () => {
    const queueItems = queueTable.value.selectedQueue;
    const historyItems = queueTable.value.selectedHistory;
    if (queueItems.length == 0 && historyItems.length == 0) {
        return;
    }
    const count = queueItems.length + historyItems.length;
    if (await dialogService.confirm('Remove From Queue', `Are you sure you want to remove these ${count} items?`)){
        for (const { pid } of queueItems) {
            await ipFetch(`json-api/queue/queue?pid=${pid}`, 'DELETE');
        }

        for (const { pid } of historyItems) {
            await ipFetch(`json-api/queue/history?pid=${pid}`, 'DELETE');
        }
    }
}
</script>