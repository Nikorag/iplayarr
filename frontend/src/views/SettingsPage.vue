<template>
    <SettingsPageToolbar
        :save-enabled="saveEnabled"
        :icons="['save', 'advanced']"
        @save="saveConfig"
        @toggle-advanced="toggleAdvanced"
    />
    <div v-if="!loading" class="inner-content">
        <legend>iPlayarr</legend>
        <TextInput
            v-model="config.API_KEY"
            name="Api Key"
            tooltip="API Key for access from *arr apps."
            :error="validationErrors.config?.API_KEY"
            icon-button="qrcode"
            @action="generateApiKey"
        />
        <TextInput
            v-model="config.DOWNLOAD_DIR"
            name="Download Directory"
            tooltip="Directory for in-progress Downloads."
            :error="validationErrors.config?.DOWNLOAD_DIR"
        />
        <TextInput
            v-model="config.COMPLETE_DIR"
            name="Complete Directory"
            tooltip="Directory for completed Downloads."
            :error="validationErrors.config?.COMPLETE_DIR"
        />
        <TextInput
            v-model="config.ACTIVE_LIMIT"
            name="Download Limit"
            tooltip="The number of simultaneous downloads."
            type-override="number"
            :error="validationErrors.config?.ACTIVE_LIMIT"
        />
        <SelectInput
            v-model="config.VIDEO_QUALITY"
            name="Video Quality"
            tooltip="Maximum video quality (Where available)"
            :error="validationErrors.config?.ACTIVE_LIMIT"
            :options="qualityProfiles"
        />
        <SelectInput
            v-model="config.NATIVE_SEARCH"
            name="Native Search"
            tooltip="Native search (experimental) allows searching beyond 30 days"
            :error="validationErrors.config?.NATIVE_SEARCH"
            :options="trueOrFalse"
        />

        <template v-if="showAdvanced">
            <TextInput
                v-model="config.REFRESH_SCHEDULE"
                :advanced="true"
                name="Refresh Schedule"
                tooltip="Cron Expression for schedule refresh."
                :error="validationErrors.config?.REFRESH_SCHEDULE"
            />
            <TextInput
                v-model="config.RSS_FEED_HOURS"
                :advanced="true"
                type-override="number"
                name="Hours in RSS Feed"
                tooltip="RSS feed includes content from the past N hours."
                :error="validationErrors.config?.RSS_FEED_HOURS"
            />
            <TextInput
                v-model="config.TV_FILENAME_TEMPLATE"
                :advanced="true"
                name="TV Filename Template"
                tooltip="Template for TV Filenames, {title, synonym, season, episode, episodeTitle, quality}."
                :error="validationErrors.config?.TV_FILENAME_TEMPLATE"
            />
            <TextInput
                v-model="config.MOVIE_FILENAME_TEMPLATE"
                :advanced="true"
                name="Movie Filename Template"
                tooltip="Template for Movie Filenames, {title, synonym, quality}."
                :error="validationErrors.config?.MOVIE_FILENAME_TEMPLATE"
            />
            <TextInput
                v-model="config.ADDITIONAL_IPLAYER_DOWNLOAD_PARAMS"
                :advanced="true"
                name="Additional Download Parameters"
                tooltip="Extra parameters to pass to get_iplayer for download"
                :error="validationErrors.config?.ADDITIONAL_IPLAYER_DOWNLOAD_PARAMS"
            />
            <SelectInput
                v-model="config.ARCHIVE_ENABLED"
                :advanced="true"
                name="Archive Downloads?"
                tooltip="Archive Downloads for record-keeping"
                :error="validationErrors.config?.ARCHIVE_ENABLED"
                :options="trueOrFalse"
            />
            <SelectInput
                v-model="config.DOWNLOAD_CLIENT"
                :advanced="true"
                name="Download Client?"
                tooltip="Which Download Client to use"
                :error="validationErrors.config?.DOWNLOAD_CLIENT"
                :options="downloadClients"
            />

            <SelectInput
                v-model="config.OUTPUT_FORMAT"
                :advanced="true"
                name="Output Format?"
                tooltip="Which Output Format to use"
                :error="validationErrors.config?.OUTPUT_FORMAT"
                :options="outputFormats"
            />

            <InfoBar>
                Looking for NZB Passthrough? Check the <RouterLink to="/apps"> Apps </RouterLink> section
            </InfoBar>
        </template>

        <legend class="sub">Authentication</legend>
        <SelectInput
                v-model="config.AUTH_TYPE"
                :advanced="false"
                name="Authentication Enabled?"
                tooltip="Enable Authentication for iPlayarr."
                :error="validationErrors.config?.AUTH_TYPE"
                :options="authTypes"
            />
        <template v-if="config.AUTH_TYPE == 'form'">
            <TextInput
                v-model="config.AUTH_USERNAME"
                name="Username"
                tooltip="The Login Username."
                :error="validationErrors.config?.AUTH_USERNAME"
            />
            <TextInput
                v-model="config.AUTH_PASSWORD"
                name="Password"
                tooltip="The Login Password."
                type-override="password"
                :error="validationErrors.config?.AUTH_PASSWORD"
            />
        </template>
        <template v-if="config.AUTH_TYPE == 'oidc'">
            <InfoBar>
                OIDC Callback URL must be set to: <strong>{{ config.OIDC_CALLBACK_HOST }}/auth/oidc/callback</strong>
            </InfoBar>
            <TextInput
                v-model="config.OIDC_CONFIG_URL"
                name="OIDC Configuration URL"
                tooltip="The OIDC Configuration URL."
                :error="validationErrors.config?.OIDC_CONFIG_URL"
            />
            <TextInput
                v-model="config.OIDC_CALLBACK_HOST"
                name="OIDC Callback Host"
                :tooltip="oidcCallbackTooltip"
                :error="validationErrors.config?.OIDC_CALLBACK_HOST"
            />
            <TextInput
                v-model="config.OIDC_CLIENT_ID"
                name="OIDC Client ID"
                tooltip="The OIDC Client ID."
                :error="validationErrors.config?.OIDC_CLIENT_ID"
            />
            <TextInput
                v-model="config.OIDC_CLIENT_SECRET"
                name="OIDC Client Secret"
                tooltip="The OIDC Client Secret."
                type-override="password"
                :error="validationErrors.config?.OIDC_CLIENT_SECRET"
            />
            <TextInput
                v-model="config.OIDC_ALLOWED_EMAILS"
                name="OIDC Allowed Emails"
                tooltip="Comma-separated list of allowed email addresses."
                :error="validationErrors.config?.OIDC_ALLOWED_EMAILS"
            />
            <div class="button-container">
                <button class="test-button" @click="testOIDC">
                    <span v-if="!oidcTested"> Test OIDC </span>
                    <span v-else><font-awesome-icon class="test-success" :icon="['fas', 'check']" /></span>
                </button>
            </div>
        </template>
    </div>
    <LoadingIndicator v-if="loading" />
</template>

<script setup>
import { v4 } from 'uuid';
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useModal } from 'vue-final-modal';
import { onBeforeRouteLeave } from 'vue-router';

import SelectInput from '@/components/common/form/SelectInput.vue';
import TextInput from '@/components/common/form/TextInput.vue';
import InfoBar from '@/components/common/InfoBar.vue';
import LoadingIndicator from '@/components/common/LoadingIndicator.vue';
import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';
import UpdateAppDialog from '@/components/modals/UpdateAppDialog.vue';
import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';
import { getHost } from '@/lib/utils';

const loading = ref(false);
let originalApiKey = undefined;

const config = ref({});
const configChanges = ref(false);
const showAdvanced = ref(false);
const refreshGlobalSettings = inject('refreshGlobalSettings');

const validationErrors = ref({
    config: {},
});

const qualityProfiles = ref([]);
const trueOrFalse = ref([
    { key: 'true', value: 'Enabled' },
    { key: 'false', value: 'Disabled' },
]);

const authTypes = ref([
    { key: 'form', value: 'Form' },
    { key: 'oidc', value: 'OpenID Connect (OIDC)' },
    { key: 'none', value: 'No Authentication' },
]);

const downloadClients = ref([
    { key: 'GET_IPLAYER', value: 'get_iplayer' },
    { key: 'YTDLP', value: 'yt-dlp (Experimental)' },
]);

const outputFormats = ref([
    { key: 'mp4', value: 'MP4' },
    { key: 'mkv', value: 'MKV' },
]);

const saveEnabled = computed(() => {
    return configChanges.value;
});

const oidcCallbackTooltip = computed(() => {
    return `${window.location.protocol}//${window.location.host}`;
});

const oidcTested = ref(false);
let oidcChannel;

onMounted(async () => {
    const [configResponse, qpResponse] = await Promise.all([
        ipFetch('json-api/config'),
        ipFetch('json-api/config/qualityProfiles'),
    ]);

    config.value = configResponse.data;
    originalApiKey = configResponse.data.API_KEY;
    qualityProfiles.value = qpResponse.data.map(({ id, name, quality }) => ({
        key: id,
        value: `${name} (${quality})`,
    }));

    watch(
        config,
        () => {
            configChanges.value = true;
            oidcTested.value = false;
        },
        { deep: true }
    );

    oidcChannel = new BroadcastChannel('oidc-test');
    oidcChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'oidc-test-result') {
            oidcTested.value = event.data.success;
            dialogService.alert(
                'OIDC Test Result',
                event.data.success ? `OIDC test succeeded for ${event.data.email}!` : `OIDC test failed: ${event.data.error || 'Unknown error'}`
            );
        }
    };
});

const saveConfig = async () => {
    if (config.value.AUTH_TYPE == 'oidc' && !oidcTested.value) {
        if (
            !(await dialogService.confirm(
                'OIDC Not Tested',
                'You have not tested your OIDC configuration. Are you sure you want to save without testing?'
            ))
        ) {
            return;
        }
    }
    loading.value = true;
    if (configChanges.value) {
        validationErrors.value.config = {};

        const configResponse = await ipFetch('json-api/config', 'PUT', config.value);

        if (!configResponse.ok) {
            const errorData = configResponse.data;
            validationErrors.value.config = errorData.invalid_fields;
            loading.value = false;
            return;
        } else {
            dialogService.alert('Success', 'Save Successful');
            configChanges.value = false;
            refreshGlobalSettings();
        }
    }

    loading.value = false;
    if (config.value.API_KEY != originalApiKey) {
        if (
            await dialogService.confirm('API Key Changed', 'Api Key Changed, do you want to update any relevant apps?')
        ) {
            const formModal = useModal({
                component: UpdateAppDialog,
                attrs: {
                    onClose: () => {
                        formModal.close();
                    },
                },
            });
            formModal.open();
        }
    }
    originalApiKey = config.value.API_KEY;
};

const toggleAdvanced = () => {
    showAdvanced.value = !showAdvanced.value;
};

const generateApiKey = async () => {
    if (
        await dialogService.confirm(
            'Regenerate API Key',
            'Are you sure you want to regenerate the API Key?',
            'API Key will not change until settings are saved'
        )
    ) {
        config.value.API_KEY = v4();
    }
};

onBeforeRouteLeave(async (_, __, next) => {
    if (saveEnabled.value) {
        if (
            await dialogService.confirm(
                'Unsaved Changes',
                'You have unsaved changes. If you leave this page they will be lost.'
            )
        ) {
            next();
        } else {
            next(false);
        }
    }
    next();
});

const testOIDC = () => {
    // Create a form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${getHost()}/auth/oidc/test`; // Change to your actual endpoint
    form.target = '_blank';

    // Add OIDC config fields as hidden inputs
    [
        'OIDC_CONFIG_URL',
        'OIDC_CALLBACK_HOST',
        'OIDC_CLIENT_ID',
        'OIDC_CLIENT_SECRET',
        'OIDC_ALLOWED_EMAILS'
    ].forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = config.value[key] || '';
        form.appendChild(input);
    });

    document.body.appendChild(form);

    // Use requestSubmit if available, fallback to submit
    form.submit();

    // Remove the form after a short delay to ensure the request is sent
    setTimeout(() => {
        document.body.removeChild(form);
    }, 1000);
};
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

        &:hover:not(:disabled) {
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
            min-width: 115px;
        }
    }
}
</style>
