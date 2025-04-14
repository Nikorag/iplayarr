<template>
  <SettingsPageToolbar :icons="['delete']" delete-label="Remove" @delete-queue-item="deleteItems" />
  <div class="inner-content scroll-x">
    <QueueTable ref="queueTable" :queue="queue" :history="history" />
  </div>
</template>

<script setup>
import { inject, ref } from 'vue';

import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';

import dialogService from '@/lib/dialogService';

import QueueTable from '../components/queue/QueueTable.vue';

const {queue, editQueue} = inject('queue');
const {history, editHistory} = inject('history');

const queueTable = ref(null);

const deleteItems = async () => {
    const queueItems = queueTable.value.selectedQueue;
    const historyItems = queueTable.value.selectedHistory;
    if (queueItems.length == 0 && historyItems.length == 0) {
        return;
    }
    const count = queueItems.length + historyItems.length;
    if (await dialogService.confirm('Remove From Queue', `Are you sure you want to remove these ${count} items?`)){
        for (const { pid } of queueItems) {
            await editQueue.delete(pid);
        }

        for (const { pid } of historyItems) {
            await editHistory.delete(pid);
        }
    }
}
</script>