<template>
  <SettingsPageToolbar v-if="false" :icons="['filter']" :filter-options="filterOptions" :selected-filter="filter" :filter-enabled="filter != 'All'" />
  <div class="inner-content scroll-x">
    <QueueTable :queue="queue" :history="history" />
  </div>
</template>

<script setup>
import { inject, ref } from 'vue';

import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';

import QueueTable from '../components/queue/QueueTable.vue';

const filterOptions = ref([
    'ALL',
    'COMPLETE',
    'IN PROGRESS',
    'QUEUED'
]);
const filter = ref('ALL');

const queue = inject('queue');
const history = inject('history');

</script>