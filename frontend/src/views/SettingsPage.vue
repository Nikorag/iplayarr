<template>
    <SettingsPageToolbar @save="saveConfig" :enabled="saveEnabled"/>
    <div class="settings-content">
        <legend>iPlayarr</legend>
        <SettingsTextInput name="Api Key" tooltip="API Key for access from *arr apps." v-model="config.API_KEY" :error="validationErrors.config?.API_KEY"/>
        <SettingsTextInput name="Download Directory" tooltip="Directory for in-progress Downloads." v-model="config.DOWNLOAD_DIR" :error="validationErrors.config?.DOWNLOAD_DIR"/>
        <SettingsTextInput name="Complete Directory" tooltip="Directory for completed Downloads." v-model="config.COMPLETE_DIR" :error="validationErrors.config?.COMPLETE_DIR"/>
        <SettingsTextInput name="Download Limit" tooltip="The number of simultaneous downloads." type-override="number" v-model="config.ACTIVE_LIMIT" :error="validationErrors.config?.ACTIVE_LIMIT"/>

        <ArrSettings name="Sonarr" v-model="sonarrConfig"/>
        <ArrSettings name="Radarr" v-model="radarrConfig"/>
    </div>
</template>

<script setup>
    import SettingsPageToolbar from '@/components/SettingsPageToolbar.vue';
    import SettingsTextInput from '@/components/SettingsTextInput.vue';
    import ArrSettings from '@/components/ArrSettings.vue';

    import { onMounted, ref, watch, computed } from 'vue';

    const config = ref({});
    const configChanges = ref(false);
    const sonarrConfig = ref({
        download_client : {},
        indexer : {}
    });
    const sonarrChanges = ref(false);
    const radarrConfig = ref({
        download_client : {},
        indexer : {}
    });
    const radarrChanges = ref(false);

    const validationErrors = ref({
        config : {},
        sonarr : {},
        radarr : {}
    })

    const saveEnabled = computed(() => {
        return configChanges.value || sonarrChanges.value || radarrChanges.value;
    })

    const host = process.env.NODE_ENV != 'production' ? `http://${window.location.hostname}:4404` : '';

    onMounted(async () => {
        const [configResponse, sonarrConfigResponse, radarrConfigResponse] = await Promise.all([
            fetch(`${host}/json-api/config`),
            fetch(`${host}/json-api/sonarr`),
            fetch(`${host}/json-api/radarr`)
        ]);
        
        config.value = await configResponse.json();
        sonarrConfig.value = await sonarrConfigResponse.json();
        radarrConfig.value = await radarrConfigResponse.json();

        watch(config, () => { configChanges.value = true }, { deep: true });
        watch(sonarrConfig, () => { sonarrChanges.value = true }, { deep: true });
        watch(radarrConfig, () => { radarrChanges.value = true }, { deep : true })
    });

    const saveConfig = async () => {
        if (configChanges.value){
            validationErrors.value.config = {};

            const configResponse = await fetch(`${host}/json-api/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config.value),
            });

            if (!configResponse.ok) {
                const errorData = await configResponse.json();
                validationErrors.value.config = errorData.invalid_fields;
            } else {
                alert("Config saved OK");
            }
        }

        if (sonarrChanges.value){
            const sonarrResponse = await fetch(`${host}/json-api/sonarr`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sonarrConfig.value),
            });

            if (!sonarrResponse.ok){
                const errorData = await sonarrResponse.json();
                alert(errorData.message);
            } else {
                alert("Sonarr Config saved OK");
            }
        }

        if (radarrChanges.value){
            const radarrResponse = await fetch(`${host}/json-api/radarr`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(radarrConfig.value),
            });

            if (!radarrResponse.ok){
                const errorData = await radarrResponse.json();
                alert(errorData.message);
            } else {
                alert("Radarr Config saved OK");
            }
        }
    }
</script>

<style scoped>
    .settings-content {
        padding: 1rem;
    }
</style>