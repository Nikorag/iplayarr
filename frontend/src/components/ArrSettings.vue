<template>
    <legend>{{ name }}</legend>
    <SettingsTextInput name="URL" :tooltip="`${name} Hostname`" v-model="localValue.url" />
    <SettingsTextInput name="API Key" :tooltip="`${name} API Key`" v-model="localValue.api_key" />
    <div class="arrContainer">
        <div>
            <legend class="sub">Download Client</legend>
            <SettingsTextInput name="Name" :tooltip="`${name} Download Client Name`"
                v-model="localValue.download_client.name" />
            <SettingsTextInput name="IPlayarr Host" :tooltip="`Host for ${name} to reach IPlayarr`"
                v-model="localValue.download_client.host" />
            <SettingsTextInput name="IPlayarr Port" :tooltip="`Port for ${name} to reach IPlayarr`"
                v-model="localValue.download_client.port" />
            <div class="button-container">
                <button @click="unlinkDownload">Unlink Download Client</button>
            </div>    
        </div>
        <div>
            <legend class="sub">Indexer</legend>
            <SettingsTextInput name="Name" :tooltip="`${name} Indexer Name`" v-model="localValue.indexer.name" />
            <SettingsTextInput name="URL" :tooltip="`${name} iPlayerr URL`" v-model="localValue.indexer.url" />
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

const host = process.env.NODE_ENV != 'production' ? `http://${window.location.hostname}:4404` : '';
const router = useRouter();

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
        await fetch(`${host}/json-api/${props.name.toLowerCase()}/download_client`, { method: 'DELETE' });
        router.go(0);
    }
}

const unlinkIndexer = async () => {
    if (confirm(`Are you sure you want to unlink ${props.name} Indexer? All changes will be lost`)){
        await fetch(`${host}/json-api/${props.name.toLowerCase()}/indexer`, { method: 'DELETE' });
        router.go(0);
    }
}
</script>

<style scoped>
@media (min-width: 768px) {
    .arrContainer {
        display: flex;
    }

    .arrContainer div {
        flex: 1;
    }
}

.button-container {
    justify-content: flex-end;
    text-align: right;
    max-width: 650px;
}

button {
    background-color: #333;
    border: 1px solid #393f45;
    padding: 6px 16px;
    font-size: 14px;
    color: white;
    border-radius: 4px;
}

button:hover {
    border-color: #5a6265;
    background-color: #444;
}
</style>