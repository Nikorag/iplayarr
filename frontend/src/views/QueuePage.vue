<template>
    <div class="inner-content scroll-x">
        <QueueTable :queue="queue" :history="history" />
    </div>
</template>

<script setup>
    import QueueTable from '../components/QueueTable.vue';

    import {inject} from 'vue';

    const queue = inject('queue');
    const history = inject('history');
</script>