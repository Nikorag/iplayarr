<template>
    <div class="nzb-settings">
        <legend class="sub">NZB Passthrough</legend>
        <p>If your *arr client accidentally sends a real NZB, Where should it be forwarded?</p>
        <sub>In order for this to work successfully, your NZB Client needs the category "iplayer"</sub>
        <SettingsSelectInput name="NZB Client" tooltip="Which NZB Client to use" :advanced="true" :options="client_options" v-model="nzbOptions.NZB_TYPE" :error="validationErrors.config.NZB_TYPE"/>
        <SettingsTextInput name="NZB URL" tooltip="URL For NZB passthrough"
            :advanced="true" v-model="nzbOptions.NZB_URL" :error="validationErrors.config.NZB_URL"/>
        <SettingsTextInput name="NZB Api Key" tooltip="API Key for NZB passthrough"
            :advanced="true" v-model="nzbOptions.NZB_API_KEY" v-if="selectedClient && selectedClient.apiKey" :error="validationErrors.config.NZB_API_KEY"/>
        <SettingsTextInput name="NZB Username" tooltip="Username for NZB passthrough"
        :advanced="true" v-model="nzbOptions.NZB_USERNAME" v-if="selectedClient && selectedClient.username" :error="validationErrors.config.NZB_USERNAME"/>
        <SettingsTextInput name="NZB Password" tooltip="Password for NZB passthrough"
        :advanced="true" v-model="nzbOptions.NZB_PASSWORD" type-override="password" v-if="selectedClient && selectedClient.password" :error="validationErrors.config.NZB_PASSWORD"/>        
            <div class="button-container" v-if="selectedClient">
                <button class="test-button" @click="testNZB">
                    <template v-if="testStatus == 'INITIAL'">
                        Test {{ selectedClient.name }}
                    </template>
                    <template v-if="testStatus == 'PENDING'">
                        <font-awesome-icon class="test-pending" :icon="['fas', 'spinner']" />
                    </template>
                    <template v-if="testStatus == 'SUCCESS'">
                        <font-awesome-icon class="test-success" :icon="['fas', 'check']" />
                    </template>
                </button>
            </div>    
    </div>
</template>

<script setup>
    import SettingsTextInput from './SettingsTextInput.vue';
    import SettingsSelectInput from './SettingsSelectInput.vue';

    import {ref, onMounted, computed, defineEmits, watch, defineProps} from 'vue';
    import { ipFetch } from '@/lib/ipFetch';

    const emit = defineEmits(['configUpdated']);
    defineProps({
        validationErrors : {
            type : Object,
            required : true
        }
    })

    const nzbOptions = ref({
        NZB_URL : '',
        NZB_API_KEY : '',
        NZB_TYPE : '',
        NZB_USERNAME : '',
        NZB_PASSWORD : ''
    })
    const nzbClients = ref([]);
    const testStatus = ref('INITIAL');


    const client_options = computed(() => {
        return nzbClients.value.map(({id, name}) => ({key : id, value : name}));   
    });

    const selectedClient = computed(() => {
        return nzbClients.value.find(({id}) => id == nzbOptions.value.NZB_TYPE);
    });


    onMounted(async () => {
        nzbClients.value = (await ipFetch(`json-api/nzbClients`)).data;
        const configResponse = (await ipFetch('json-api/config')).data;
        nzbOptions.value = {
            NZB_URL : configResponse.NZB_URL || '',
            NZB_API_KEY : configResponse.NZB_API_KEY || '',
            NZB_TYPE : configResponse.NZB_TYPE || '',
            NZB_USERNAME : configResponse.NZB_USERNAME || '',
            NZB_PASSWORD : configResponse.NZB_PASSWORD || ''
        }
    });

    watch(nzbOptions, (newOptions) => {
        emit('configUpdated', newOptions);
    }, {immediate : true, deep: true});

    const testNZB = async () => {
        testStatus.value = "PENDING";
        const {data, ok} = await ipFetch('json-api/nzb/test', 'POST', nzbOptions.value);
        if (!ok){
            alert(`Error Connecting to NZB : ${data.message}`);
            testStatus.value = "INITIAL";
        } else {
            testStatus.value = "SUCCESS";
        }
    }
</script>

<style lang="less">
.nzb-settings {
    legend {
        color: @warn-color;
    }

    p {
        color: @warn-color;
        margin-bottom: 3px;
    }

    sub {
        margin-bottom: 1rem;
        display: block;
        color: @warn-color;
    }
}
</style>