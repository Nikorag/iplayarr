<template>
    <table class="queueTable" summary="Hed">
        <thead>
            <tr>
                <th>
                    <CheckInput v-model="allChecked" />
                </th>
                <th />
                <th>Filename</th>
                <th>Type</th>
                <th>Start</th>
                <th>Size</th>
                <th>App</th>
                <th class="progress-column">Progress</th>
                <th>ETA</th>
                <th>Speed</th>
                <th class="center">
                    <font-awesome-icon :icon="['fas', 'cog']" />
                </th>
            </tr>
        </thead>
        <tbody>
            <QueueTableRow v-for="item in filteredQueue" :key="item.id" ref="queueRows" :item="item" />
            <QueueTableRow v-for="item in filteredHistory" :key="item.id" ref="historyRows" :item="item" />
        </tbody>
    </table>
</template>

<script setup>
import { computed, defineExpose, defineProps, ref, watch } from 'vue';

import CheckInput from '../common/form/CheckInput.vue';
import QueueTableRow from './QueueTableRow.vue';

const props = defineProps({
    queue: {
        type: Array,
        required: true,
    },

    history: {
        type: Array,
        required: true,
    },

    filter: {
        type: String,
        required: false,
        default: 'All',
    },
});

const filteredQueue = computed(() => {
    if (props.filter === 'In Progress') return props.queue.filter(({ status }) => status === 'Downloading');
    if (props.filter === 'Queued') return props.queue.filter(({ status }) => status === 'Queued');
    if (props.filter === 'Complete') return [];
    return props.queue;
});

const filteredHistory = computed(() => {
    if (props.filter === 'All' || props.filter === 'Complete') return props.history;
    return [];
});

const allChecked = ref(false);

const queueRows = ref([]);
const historyRows = ref([]);

const selectedHistory = computed(() => {
    return historyRows.value.filter((row) => row.checked).map((row) => row.item);
});

const selectedQueue = computed(() => {
    return queueRows.value.filter((row) => row.checked).map((row) => row.item);
});

defineExpose({
    selectedHistory,
    selectedQueue,
});

watch(
    allChecked,
    (newValue) => {
        queueRows.value.forEach((row) => {
            row.checked = newValue;
        });
        historyRows.value.forEach((row) => {
            row.checked = newValue;
        });
    },
    { immediate: true }
);
</script>

<style lang="less">
.queueTable {
    max-width: 100%;
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    color: @table-text-color;

    thead {
        th {
            padding: 8px;
            text-align: left;
            font-weight: bold;
            border-bottom: 1px solid @table-border-color;
        }
    }

    tbody {
        tr {
            transition: background-color 500ms;

            &:hover {
                background-color: @table-row-hover-color;
            }
        }

        td {
            padding: 8px;
            border-top: 1px solid @table-border-color;
            line-height: 1.5;

            .appDisplay {
                display: flex;
                align-items: center;
                gap: 6px;
                height: 30px;

                .appImg {
                    width: 15px;
                }
            }
        }
    }

    .progress-column {
        min-width: 75px;
    }
}
</style>
