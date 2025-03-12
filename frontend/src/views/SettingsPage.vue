<template>
    <SettingsPageToolbar @save="saveConfig" @toggle-advanced="toggleAdvanced" :save-enabled="saveEnabled"
        :icons="['save', 'advanced']" />
    <div class="inner-content" v-if="!loading">
        <legend>iPlayarr</legend>
        <SettingsTextInput name="Api Key" tooltip="API Key for access from *arr apps." v-model="config.API_KEY"
            :error="validationErrors.config?.API_KEY" />
        <SettingsTextInput name="Download Directory" tooltip="Directory for in-progress Downloads."
            v-model="config.DOWNLOAD_DIR" :error="validationErrors.config?.DOWNLOAD_DIR" />
        <SettingsTextInput name="Complete Directory" tooltip="Directory for completed Downloads."
            v-model="config.COMPLETE_DIR" :error="validationErrors.config?.COMPLETE_DIR" />
        <SettingsTextInput name="Download Limit" tooltip="The number of simultaneous downloads." type-override="number"
            v-model="config.ACTIVE_LIMIT" :error="validationErrors.config?.ACTIVE_LIMIT" />
        <SettingsSelectInput name="Video Quality" tooltip="Maximum video quality (Where available)"
            v-model="config.VIDEO_QUALITY" :error="validationErrors.config?.ACTIVE_LIMIT" :options="qualityProfiles" />

        <template v-if="showAdvanced">
            <SettingsTextInput :advanced="true" name="Refresh Schedule" tooltip="Cron Expression for schedule refresh."
                v-model="config.REFRESH_SCHEDULE" :error="validationErrors.config?.REFRESH_SCHEDULE" />
            <SettingsTextInput :advanced="true" name="TV Filename Template"
                tooltip="Template for TV Filenames, {title, season, episode, quality}."
                v-model="config.TV_FILENAME_TEMPLATE" :error="validationErrors.config?.TV_FILENAME_TEMPLATE" />
            <SettingsTextInput :advanced="true" name="Movie Filename Template"
                tooltip="Template for Movie Filenames, {title, quality}." v-model="config.MOVIE_FILENAME_TEMPLATE"
                :error="validationErrors.config?.MOVIE_FILENAME_TEMPLATE" />
            <SettingsTextInput :advanced="true" name="Additional Download Parameters"
                tooltip="Extra parameters to pass to get_iplayer for download"
                v-model="config.ADDITIONAL_IPLAYER_DOWNLOAD_PARAMS"
                :error="validationErrors.config?.ADDITIONAL_IPLAYER_DOWNLOAD_PARAMS" />
                <NZBSettings @config-updated="processNZBUpdate" :validationErrors="validationErrors"/>
        </template>

        

        <legend class="sub">Authentication</legend>
        <SettingsTextInput name="Username" tooltip="The Login Username." v-model="config.AUTH_USERNAME"
            :error="validationErrors.config?.AUTH_USERNAME" />
        <SettingsTextInput name="Password" tooltip="The Login Password." type-override="password"
            v-model="config.AUTH_PASSWORD" :error="validationErrors.config?.AUTH_PASSWORD" />

        <ArrSettings name="Sonarr" v-model="sonarrConfig" />
        <ArrSettings name="Radarr" v-model="radarrConfig" />
    </div>
    <LoadingIndicator v-if="loading" />
</template>

<script setup>
import SettingsPageToolbar from '@/components/SettingsPageToolbar.vue';
import SettingsTextInput from '@/components/SettingsTextInput.vue';
import ArrSettings from '@/components/ArrSettings.vue';
import LoadingIndicator from '@/components/LoadingIndicator.vue';

import { onMounted, ref, watch, computed } from 'vue';
import { ipFetch } from '@/lib/ipFetch';
import SettingsSelectInput from '@/components/SettingsSelectInput.vue';
import { onBeforeRouteLeave } from 'vue-router';
import NZBSettings from '@/components/NZBSettings.vue';

const loading = ref(false);

const config = ref({});
const configChanges = ref(false);
const sonarrConfig = ref({
    download_client: {},
    indexer: {}
});
const sonarrChanges = ref(false);
const radarrConfig = ref({
    download_client: {},
    indexer: {}
});
const radarrChanges = ref(false);
const showAdvanced = ref(false);

const validationErrors = ref({
    config: {},
    sonarr: {},
    radarr: {}
});

const qualityProfiles = ref([]);

const saveEnabled = computed(() => {
    return configChanges.value || sonarrChanges.value || radarrChanges.value;
})

onMounted(async () => {
    const [configResponse, sonarrConfigResponse, radarrConfigResponse, qpResponse] = await Promise.all([
        ipFetch('json-api/config'),
        ipFetch(`json-api/arr/sonarr`),
        ipFetch(`json-api/arr/radarr`),
        ipFetch('json-api/config/qualityProfiles')
    ]);

    config.value = configResponse.data;
    sonarrConfig.value = sonarrConfigResponse.data;
    radarrConfig.value = radarrConfigResponse.data;
    qualityProfiles.value = qpResponse.data.map(({ id, name, quality }) => ({ "key": id, "value": `${name} (${quality})` }));

    watch(config, () => { configChanges.value = true }, { deep: true });
    watch(sonarrConfig, () => { sonarrChanges.value = true }, { deep: true });
    watch(radarrConfig, () => { radarrChanges.value = true }, { deep: true })
});

const saveConfig = async () => {
    loading.value = true;
    if (configChanges.value || sonarrChanges.value || radarrChanges.value) {
        validationErrors.value.config = {};

        const configResponse = await ipFetch(`json-api/config`, 'PUT', config.value);

        if (!configResponse.ok) {
            const errorData = configResponse.data;
            validationErrors.value.config = errorData.invalid_fields;
        } else {
            alert("Config saved OK");
            configChanges.value = false;
        }
    }

    if (sonarrChanges.value) {
        const sonarrResponse = await ipFetch('json-api/arr/sonarr', 'PUT', sonarrConfig.value);

        if (!sonarrResponse.ok) {
            const errorData = sonarrResponse.data;
            alert(errorData.message);
        } else {
            alert("Sonarr Config saved OK");
            sonarrChanges.value = false;
        }
    }

    if (radarrChanges.value) {
        const radarrResponse = await ipFetch('json-api/arr/radarr', 'PUT', radarrConfig.value);

        if (!radarrResponse.ok) {
            const errorData = radarrResponse.data;
            alert(errorData.message);
        } else {
            alert("Radarr Config saved OK");
            radarrChanges.value = false;
        }
    }
    loading.value = false;
}

const toggleAdvanced = () => {
    showAdvanced.value = !showAdvanced.value;
}

const processNZBUpdate = ((update) => {
    config.value = {
        ...config.value,
        ...update
    }
});

onBeforeRouteLeave((_, __, next) => {
    if (saveEnabled.value) {
        if (confirm("You have unsaved changes. If you leave this page they will be lost.")) {
            next();
        } else {
            next(false);
        }
    }
    next();
});
</script>

<style lang="less">
.button-container {
    justify-content: flex-end;
    text-align: right;
    max-width: 650px;

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
            width: 115px;
        }
    }
}
</style>
