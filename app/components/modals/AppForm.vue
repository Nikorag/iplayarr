<template>
    <IPlayarrModal
        :title="`${action} App`"
        :show-close="true"
        close-label="Cancel"
        :show-confirm="true"
        :confirm-label="`${form.id ? 'Save' : 'Create'}`"
        :confirm-loading="loading"
        :click-to-close="false"
        @confirm="saveApp"
    >
        <TextInput
            v-model="form.name"
            name="Name"
            tooltip="App Name"
            placeholder="e.g. Sonarr"
            required
            :error="validationErrors?.name"
        />
        <SelectInput
            v-model="form.type"
            name="Type"
            tooltip="App Type"
            placeholder="Select an app type…"
            required
            :options="types"
            :error="validationErrors?.type"
        />
        <template v-if="form.type">
            <TextInput
                v-model="form.url"
                name="URL"
                :tooltip="`URL for ${capitalize(form.type)}`"
                :placeholder="urlPlaceholder"
                required
                :error="validationErrors?.url"
            />

            <template v-if="showForm('api_key')">
                <TextInput
                    v-model="form.api_key"
                    name="API Key"
                    :tooltip="`API KEY for ${capitalize(form.type)}`"
                    secret
                    required
                    :error="validationErrors?.api_key"
                />
                <div class="button-container">
                    <AppTestButton ref="testButton" :app="form" />
                </div>
            </template>

            <template v-if="showForm('username_password')">
                <TextInput
                    v-model="form.username"
                    name="Username"
                    :tooltip="`Username for ${capitalize(form.type)}`"
                    :error="validationErrors?.username"
                />
                <TextInput
                    v-model="form.password"
                    name="Password"
                    :tooltip="`Password for ${capitalize(form.type)}`"
                    secret
                    :error="validationErrors?.password"
                />
                <div class="button-container">
                    <AppTestButton ref="testButton" :app="form" />
                </div>
            </template>

            <template v-if="showForm('priority')">
                <TextInput
                    v-model="form.priority"
                    name="Priority"
                    placeholder="25"
                    type-override="number"
                    :tooltip="`NZB Client Priority, (lower number is first)`"
                    :error="validationErrors?.priority"
                />
            </template>

            <template v-if="showForm('link')">
                <TextInput
                    v-model="form.link"
                    name="Link"
                    :tooltip="`Link to service for users`"
                    :error="validationErrors?.link"
                />
            </template>

            <template v-if="showForm('callback')">
                <InfoBar v-if="form.type == 'PROWLARR'" class="warning">
                    Prowlarr cannot force download client affinity in downstream Arrs
                </InfoBar>
                <SelectInput
                    v-model="form.iplayarr.useSSL"
                    name="iPlayarr Protocol"
                    :tooltip="`iPlayarr Protocol for connection from ${capitalize(form.type)}`"
                    :options="[
                        { key: true, value: 'https' },
                        { key: false, value: 'http' },
                    ]"
                />
                <TextInput
                    v-model="form.iplayarr.host"
                    name="iPlayarr Host"
                    :tooltip="`iPlayarr Host for connection from ${capitalize(form.type)}`"
                    :error="validationErrors?.iplayarr_host"
                />
                <InfoBar v-if="hostIsLoopback" clazz="warning">
                    <strong>{{ form.iplayarr.host }}</strong> only points back at {{ capitalize(form.type) }}
                    itself. Use the address or container name that {{ capitalize(form.type) }} can reach iPlayarr
                    on.
                </InfoBar>
                <TextInput
                    v-model="form.iplayarr.port"
                    name="iPlayarr Port"
                    type-override="number"
                    :tooltip="`iPlayarr Port for connection from ${capitalize(form.type)}`"
                />
            </template>

            <template v-if="showForm('download_client') || showForm('prowlarr_download_client')">
                <legend class="sub">Download Client</legend>
                <InfoBar clazz="info"> Leaving this blank will not create a Download Client </InfoBar>
                <TextInput
                    v-model="form.download_client.name"
                    name="Name"
                    placeholder="iPlayarr"
                    :tooltip="`Name for Download Client in ${capitalize(form.type)}`"
                    :error="validationErrors?.download_client_name"
                />
            </template>

            <template v-if="showForm('indexer') || showForm('prowlarr_indexer')">
                <legend class="sub">Indexer</legend>
                <InfoBar clazz="info"> Leaving this blank will not create an Indexer </InfoBar>
                <TextInput
                    v-model="form.indexer.name"
                    name="Name"
                    placeholder="iPlayarr"
                    :tooltip="`Name for Indexer in ${capitalize(form.type)}`"
                    :error="validationErrors?.indexer_name"
                />
                <TextInput
                    v-model="form.indexer.priority"
                    name="Priority"
                    placeholder="25"
                    type-override="number"
                    :tooltip="`Priority in ${capitalize(form.type)}`"
                    :error="validationErrors?.indexer_priority"
                />
            </template>

            <template v-if="showForm('tags')">
                <legend class="sub">Tags</legend>
                <TagInput
                    ref="tagInput"
                    v-model="form.tags"
                    name="Tags"
                    :tooltip="`Tags for Download Client & Indexer for ${capitalize(form.type)}`"
                    :error="validationErrors?.tags"
                />
            </template>
        </template>
    </IPlayarrModal>
</template>

<script setup>
import { computed, defineEmits, defineProps, nextTick, onMounted, ref, watch } from 'vue';

import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';
import toastService from '@/lib/toastService';
import { capitalize } from '@/lib/utils';

import AppTestButton from '../apps/AppTestButton.vue';
import SelectInput from '../common/form/SelectInput.vue';
import TagInput from '../common/form/TagInput.vue';
import TextInput from '../common/form/TextInput.vue';
import InfoBar from '../common/InfoBar.vue';
import IPlayarrModal from './IPlayarrModal.vue';

const props = defineProps({ action: String, inputObj: Object });
const emit = defineEmits(['saved']);

const defaultForm = {
    download_client: {},
    iplayarr: {
        useSSL: false,
        host: window.location.hostname,
        port: window.location.port,
    },
    indexer: {},
    priority: 5,
    tags: [],
};

const [features, form] = [ref({}), ref(props.inputObj || defaultForm)];
const testButton = ref(null);
const validationErrors = ref({});
const loading = ref(false);
const tagInput = ref(null);

const types = computed(() => {
    return Object.keys(features.value).map((k) => ({ key: k, value: capitalize(k) }));
});

onMounted(async () => {
    try {
        features.value = (await ipFetch('json-api/apps/types')).data;
    } catch (err) {
        dialogService.alert('Unable to load app types', err.message || 'The server could not be reached');
    }
});

const urlPlaceholder = computed(() => {
    const ports = { SONARR: 8989, RADARR: 7878, PROWLARR: 9696, SABNZBD: 8080, NZBGET: 6789 };
    return ports[form.value.type] ? `http://localhost:${ports[form.value.type]}` : undefined;
});

// A loopback host is only right when the *arr app runs on the same machine, not in another container
const hostIsLoopback = computed(() => ['localhost', '127.0.0.1', '::1'].includes(String(form.value.iplayarr?.host)));

// Field level checks that don't need a round trip. Returns true when the form can be submitted.
const validate = () => {
    const errors = {};
    if (!form.value.name?.trim()) errors.name = 'Enter a name for this app';
    if (!form.value.type) errors.type = 'Choose the type of app';
    if (form.value.type) {
        if (!form.value.url?.trim()) {
            errors.url = 'Enter the URL for this app';
        } else if (!/^https?:\/\/.+/i.test(form.value.url.trim())) {
            errors.url = 'The URL must start with http:// or https://';
        }
        if (showForm('api_key') && !form.value.api_key?.trim()) errors.api_key = 'Enter the API key';
        if (showForm('callback') && !String(form.value.iplayarr?.host ?? '').trim()) {
            errors.iplayarr_host = 'Enter the host this app can reach iPlayarr on';
        }
    }
    validationErrors.value = errors;
    return Object.keys(errors).length === 0;
};

// Once a submit has failed, clear each error as soon as the field is fixed rather than waiting for the next submit
watch(
    form,
    () => {
        if (Object.keys(validationErrors.value).length) {
            validate();
        }
    },
    { deep: true }
);

const focusFirstError = async () => {
    await nextTick();
    const field = document.querySelector('.iplayarr-modal-content .has-error');
    field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    field?.querySelector('input, select')?.focus({ preventScroll: true });
};

const showForm = (type) => {
    if (form.value.type) {
        return features.value[form.value.type]?.includes(type);
    } else {
        return false;
    }
};

const resetForm = () => {
    form.value = {
        name: form.value.name,
        type: form.value.type,
        ...defaultForm,
    };
};

watch(
    () => form.value.type,
    () => {
        if (testButton.value) {
            testButton.value.resetTest();
        }
        if (!form.value.id) {
            resetForm();
        }
    },
    { immediate: true }
);

const saveApp = async () => {
    if (loading.value) {
        return;
    }
    // Pick up a tag that has been typed but not confirmed with Enter yet
    tagInput.value?.addTag();
    form.value.tags = (form.value.tags ?? []).filter((tag) => tag !== '');

    if (!validate()) {
        await focusFirstError();
        return;
    }

    const method = form.value.id ? 'PUT' : 'POST';
    loading.value = true;
    try {
        const response = await ipFetch('json-api/apps', method, form.value);
        if (response.ok) {
            toastService.success(`${form.value.name} saved`);
            emit('saved');
        } else {
            const { invalid_fields: invalidFields, message } = response.data;
            validationErrors.value = invalidFields ?? {};
            // Plain validation failures are shown against their fields, anything else needs a modal
            if (message || !invalidFields) {
                dialogService.alert('Error Saving App', message || 'The app could not be saved');
            } else {
                await focusFirstError();
            }
        }
    } catch (err) {
        dialogService.alert('Error Saving App', err.message || 'The server could not be reached');
    } finally {
        loading.value = false;
    }
};
</script>

<style lang="less">
.button-container {
    justify-content: flex-end;
    text-align: right;
    max-width: 650px;
    margin-bottom: 1rem;
}
</style>
