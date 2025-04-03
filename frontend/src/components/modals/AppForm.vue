<template>
  <IPlayarrModal :title="`${action} App`" :show-close="true" close-label="Cancel" :show-confirm="true" :confirm-label="`${form.id ? 'Save' : 'Create'}`" @confirm="saveApp">
    <LoadingIndicator v-if="loading" />
    <template v-if="!loading">
      <TextInput v-model="form.name" name="Name" tooltip="App Name" :error="validationErrors?.name" />
      <SelectInput v-model="form.type" name="Type" tooltip="App Type" :options="types" />
      <template v-if="form.type">
        <TextInput v-model="form.url" name="URL" :tooltip="`URL for ${capitalize(form.type)}`" :error="validationErrors?.url" />

        <template v-if="showForm('api_key')">
          <TextInput v-model="form.api_key" name="API Key" :tooltip="`API KEY for ${capitalize(form.type)}`" :error="validationErrors?.api_key" />
          <div class="button-container">
            <AppTestButton ref="testButton" :app="form" />
          </div>
        </template>

        <template v-if="showForm('username_password')">
          <TextInput v-model="form.username" name="Username" :tooltip="`Username for ${capitalize(form.type)}`" :error="validationErrors?.username" />
          <TextInput v-model="form.password" name="Password" :tooltip="`Password for ${capitalize(form.type)}`" :error="validationErrors?.password" />
          <div class="button-container">
            <AppTestButton ref="testButton" :app="form" />
          </div>
        </template>

        <template v-if="showForm('priority')">
          <TextInput v-model="form.priority" name="Priority" placeholder="25" type-override="number" :tooltip="`NZB Client Priority, (lower number is first)`" :error="validationErrors?.priority" />
        </template>

        <template v-if="showForm('link')">
          <TextInput v-model="form.link" name="Link" :tooltip="`Link to service for users`" :error="validationErrors?.link" />
        </template>

        <template v-if="showForm('callback')">
          <InfoBar v-if="form.type == 'PROWLARR'" class="warning">
            Prowlarr cannot force download client affinity in downstream Arrs
          </InfoBar>
          <SelectInput v-model="form.iplayarr.useSSL" name="iPlayarr Protocol" :tooltip="`iPlayarr Protocol for connection from ${capitalize(form.type)}`" :options="[{ key: 'true', value: 'https' }, { key: 'false', value: 'http' }]" />
          <TextInput v-model="form.iplayarr.host" name="iPlayarr Host" :tooltip="`iPlayarr Host for connection from ${capitalize(form.type)}`" />
          <TextInput v-model="form.iplayarr.port" name="iPlayarr Port" type-override="number" :tooltip="`iPlayarr Port for connection from ${capitalize(form.type)}`" />
        </template>

        <template v-if="showForm('download_client') || showForm('prowlarr_download_client')">
          <legend class="sub">
            Download Client
          </legend>
          <InfoBar clazz="info">
            Leaving this blank will not create a Download Client
          </InfoBar>
          <TextInput v-model="form.download_client.name" name="Name" placeholder="iPlayarr" :tooltip="`Name for Download Client in ${capitalize(form.type)}`" :error="validationErrors?.download_client_name" />
        </template>

        <template v-if="showForm('indexer') || showForm('prowlarr_indexer')">
          <legend class="sub">
            Indexer
          </legend>
          <InfoBar clazz="info">
            Leaving this blank will not create an Indexer
          </InfoBar>
          <TextInput v-model="form.indexer.name" name="Name" placeholder="iPlayarr" :tooltip="`Name for Indexer in ${capitalize(form.type)}`" :error="validationErrors?.indexer_name" />
          <TextInput v-model="form.indexer.priority" name="Priority" placeholder="25" type-override="number" :tooltip="`Priority in ${capitalize(form.type)}`" :error="validationErrors?.indexer_priority" />
        </template>

        <template v-if="showForm('tags')">
          <legend class="sub">
            Download Client
          </legend>
          <TagInput ref="tagInput" v-model="form.tags" name="Tags" :tooltip="`Tags for Download Client & Indexer for ${capitalize(form.type)}`" :error="validationErrors?.tags" />
        </template>
      </template>
    </template>
  </IPlayarrModal>
</template>

<script setup>
import { computed, defineEmits, defineProps, onMounted, ref, watch } from 'vue';

import { ipFetch } from '@/lib/ipFetch';
import { capitalize } from '@/lib/utils';

import AppTestButton from '../apps/AppTestButton.vue';
import SelectInput from '../common/form/SelectInput.vue';
import TagInput from '../common/form/TagInput.vue';
import TextInput from '../common/form/TextInput.vue';
import InfoBar from '../common/InfoBar.vue';
import LoadingIndicator from '../common/LoadingIndicator.vue';
import IPlayarrModal from './IPlayarrModal.vue';

const props = defineProps({ action: String, inputObj: Object });
const emit = defineEmits(['saved']);

const defaultForm = {
    download_client: {},
    iplayarr: {
        useSSL: window.location.protocol == 'https:',
        host: window.location.hostname,
        port: window.location.port
    },
    indexer: {},
    priority: 5,
    tags : []
}

const [features, form] = [ref({}), ref(props.inputObj || defaultForm)];
const testButton = ref(null);
const validationErrors = ref({});
const loading = ref(false);
const tagInput = ref(null);

const types = computed(() => { return Object.keys(features.value).map((k) => ({ key: k, value: capitalize(k) })); });

onMounted(async () => {
    features.value = (await ipFetch('json-api/apps/types')).data;
});

const showForm = (type) => {
    if (form.value.type) {
        return features.value[form.value.type]?.includes(type);
    } else {
        return false;
    }
}

const resetForm = () => {
    form.value = {
        name: form.value.name,
        type: form.value.type,
        ...defaultForm
    }
}

watch(() => form.value.type, () => {
    if (testButton.value) {
        testButton.value.resetTest();
    }
    if (!form.value.id) {
        resetForm();
    }
}, { immediate: true });

const saveApp = async () => {
    if (tagInput.value){
        tagInput.value.addTag();
    }
    const method = form.value.id ? 'PUT' : 'POST';
    loading.value = true;
    const response = await ipFetch('json-api/apps', method, form.value);
    loading.value = false;
    if (response.ok) {
        emit('saved');
    } else {
        validationErrors.value = response.data.invalid_fields;
    }
}

</script>

<style lang="less">
.button-container {
  justify-content: flex-end;
  text-align: right;
  max-width: 650px;
  margin-bottom: 1rem;
}
</style>