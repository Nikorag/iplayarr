<template>
    <button class="test-button" @click="test">
        <template v-if="testStatus == 'INITIAL'"> Test {{ capitalize(app.type) }} </template>
        <template v-if="testStatus == 'PENDING'">
            <font-awesome-icon class="test-pending" :icon="['fas', 'spinner']" />
        </template>
        <template v-if="testStatus == 'SUCCESS'">
            <font-awesome-icon class="test-success" :icon="['fas', 'check']" />
        </template>
    </button>
</template>

<script setup>
import { defineExpose, defineProps, ref } from 'vue';

import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';
import { capitalize } from '@/lib/utils';

const props = defineProps({
    app: Object,
});

const testStatus = ref('INITIAL');

const test = async () => {
    testStatus.value = 'PENDING';
    const { data, ok } = await ipFetch('json-api/apps/test', 'POST', props.app);
    if (!ok) {
        dialogService.alert('Connection Error', `Error Connecting to ${capitalize(props.app.type)} : ${data.message}`);
        testStatus.value = 'INITIAL';
    } else {
        testStatus.value = 'SUCCESS';
    }
};

const resetTest = () => {
    testStatus.value = 'INITIAL';
};

defineExpose({ resetTest, status: testStatus.value == 'SUCCESS' });
</script>

<style lang="less">
@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

button {
    background-color: @settings-button-background-color;
    border: 1px solid @settings-button-border-color;
    padding: 6px 16px;
    font-size: 14px;
    color: @primary-text-color;
    border-radius: 4px;

    &:hover {
        border-color: @settings-button-hover-border-color;
        background-color: @settings-button-hover-background-color;
    }

    .test-success {
        color: @success-color;
    }

    .test-pending {
        animation: spin 1.25s linear infinite;
    }

    &.test-button {
        min-width: 130px;
    }
}
</style>
