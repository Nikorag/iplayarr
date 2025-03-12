<template>
    <legend>{{ name }}</legend>
    <SettingsTextInput name="URL" :tooltip="`${name} URL, including protocol & port`" v-model="localValue.url" />
    <SettingsTextInput name="API Key" :tooltip="`${name} API Key`" v-model="localValue.api_key" />
    <div class="button-container">
        <button class="test-button" @click="test">
            <template v-if="testStatus == 'INITIAL'">
                Test {{ name }}
            </template>
            <template v-if="testStatus == 'PENDING'">
                <font-awesome-icon class="test-pending" :icon="['fas', 'spinner']" />
            </template>
            <template v-if="testStatus == 'SUCCESS'">
                <font-awesome-icon class="test-success" :icon="['fas', 'check']" />
            </template>
        </button>
    </div>
    <div class="arrContainer">
        <div>
            <legend class="sub">Download Client</legend>
            <SettingsTextInput name="Name" :tooltip="`${name} Download Client Name`"
                v-model="localValue.download_client.name" placeholder="iPlayer"/>
            <SettingsTextInput name="IPlayarr Host" :tooltip="`Host for ${name} to reach IPlayarr`"
                v-model="localValue.download_client.host" :placeholder="placeholders.host"/>
            <SettingsTextInput name="IPlayarr Port" :tooltip="`Port for ${name} to reach IPlayarr`"
                v-model="localValue.download_client.port" :placeholder="placeholders.port"/>
            <div class="button-container">
                <button @click="unlinkDownload">Unlink Download Client</button>
            </div>    
        </div>
        <div>
            <legend class="sub">Indexer</legend>
            <SettingsTextInput name="Name" :tooltip="`${name} Indexer Name`" v-model="localValue.indexer.name" placeholder="iPlayer"/>
            <SettingsTextInput name="URL" :tooltip="`${name} iPlayerr URL`" v-model="localValue.indexer.url" :placeholder="`${placeholders.protocol}//${placeholders.host}:${placeholders.port}`"/>
            <div class="button-container">
                <button @click="unlinkIndexer">Unlink Indexer</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import SettingsTextInput from '@/components/SettingsTextInput.vue';
import { ipFetch } from '@/lib/ipFetch';

const router = useRouter();

const placeholders = ref({
    host : window.location.hostname,
    protocol : window.location.protocol,
    port : window.location.port
});

const testStatus = ref("INITIAL");

const props = defineProps({
    name: {
        type: String,
        required: true
    },
    modelValue: {
        type: String,
        required: true,
    },
});

const emit = defineEmits(['update:modelValue']);

const localValue = ref(props.modelValue);

watch(localValue, (newValue) => {
    emit('update:modelValue', newValue);
});

watch(
    () => props.modelValue,
    (newValue) => {
        localValue.value = newValue;
    },
    { deep: true }
);

const unlinkDownload = async () => {
    if (confirm(`Are you sure you want to unlink ${props.name} Download Client? All changes will be lost`)){
        await ipFetch(`json-api/${props.name.toLowerCase()}/download_client`, 'DELETE');
        router.go(0);
    }
}

const unlinkIndexer = async () => {
    if (confirm(`Are you sure you want to unlink ${props.name} Indexer? All changes will be lost`)){
        await ipFetch(`json-api/${props.name.toLowerCase()}/indexer`, 'DELETE');
        router.go(0);
    }
}

const test = async () => {
    testStatus.value = "PENDING";
    const {data, ok} = await ipFetch('json-api//arr/test', 'POST', {HOST : localValue.value.url, API_KEY : localValue.value.api_key});
    if (!ok){
        alert(`Error Connecting to ${props.name} : ${data.message}`);
        testStatus.value = "INITIAL";
    } else {
        testStatus.value = "SUCCESS";
    }
}
</script>

<style lang="less" scoped>
@media (min-width: 768px) {
    .arrContainer {
        display: flex;

        div {
            flex: 1
        }
    }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
