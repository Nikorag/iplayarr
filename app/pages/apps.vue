<template>
    <div class="inner-content">
        <legend>Apps</legend>
        <p class="mb-0">Manage your integrations with Apps (including Arr and NZB Clients) here</p>
        <InfoBar clazz="warning">
            In order for NZB Forwarding to work successfully, your NZB Client needs the category "iplayer"
        </InfoBar>
        <div class="block-reset" />
        <AppsList :apps="apps" @create="openForm" />
        <ListEditor v-slot="{ item }" :items="apps" :actions="[['trash', deleteApp, 'Delete app']]" add-label="Add app" @create="openForm">
            <a @click="openForm(item)">
                <div class="major">
                    <img class="appImg" :src="assetUrl(`/img/${item.type.toLowerCase()}.svg`)" />
                    <span class="appName">
                        {{ item.name }}
                    </span>
                </div>
                <div class="sub">
                    {{ item.url }}
                </div>
                <div class="featureList">
                    <span
                        v-if="
                            hasFeature(item.type, 'download_client') ||
                            hasFeature(item.type, 'prowlarr_download_client')
                        "
                        :class="['pill', item.download_client?.id ? 'success' : 'error']"
                    >
                        Download Client
                    </span>
                    <span
                        v-if="hasFeature(item.type, 'indexer') || hasFeature(item.type, 'prowlarr_indexer')"
                        :class="['pill', item.indexer?.id ? 'success' : 'error']"
                    >
                        Indexer
                    </span>
                    <span v-if="hasFeature(item.type, 'priority')" :class="['pill', 'grey']">
                        Priority: {{ item.priority }}
                    </span>
                </div>
            </a>
        </ListEditor>
        <div class="block-reset" />
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useModal } from 'vue-final-modal';

import InfoBar from '@/components/common/InfoBar.vue';
import ListEditor from '@/components/common/ListEditor.vue';
import AppForm from '@/components/modals/AppForm.vue';
import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';
import toastService from '@/lib/toastService';
import { assetUrl, deepCopy } from '@/lib/utils';

const apps = ref([]);
const features = ref([]);

const refreshApps = async () => {
    try {
        const [appsResponse, typesResponse] = await Promise.all([ipFetch('json-api/apps'), ipFetch('json-api/apps/types')]);
        if (!appsResponse.ok || !typesResponse.ok) {
            throw new Error(appsResponse.data?.message || typesResponse.data?.message || 'The server returned an error');
        }
        apps.value = appsResponse.data;
        features.value = typesResponse.data;
    } catch (err) {
        toastService.error(`Unable to load apps: ${err.message || 'the server could not be reached'}`);
    }
};

onMounted(refreshApps);

const openForm = (app) => {
    const formModal = useModal({
        component: AppForm,
        attrs: {
            action: app ? 'Edit' : 'Create',
            inputObj: deepCopy(app),
            onSaved: async () => {
                formModal.close();
                await refreshApps();
            },
        },
    });
    formModal.open();
};

const deleteApp = async ({ id, name }) => {
    if (
        await dialogService.confirm(
            'Delete App',
            `Are you sure you want to delete ${name}`,
            'Indexers and Download Clients in the target Arr, will NOT be deleted',
            { confirmLabel: 'Delete', confirmVariant: 'danger' }
        )
    ) {
        try {
            const { ok, data } = await ipFetch('json-api/apps', 'DELETE', { id });
            if (!ok) {
                toastService.error(`Failed to delete ${name}: ${data.message ?? 'unknown error'}`);
            }
        } catch (err) {
            toastService.error(`Failed to delete ${name}: ${err.message}`);
        }
        await refreshApps();
    }
};

const hasFeature = (itemType, type) => {
    return features.value[itemType] && features.value[itemType].includes(type);
};
</script>

<style lang="less" scoped>
.major {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;

    .appImg {
        width: 25px;
    }
}

.featureList {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 6px;
}
</style>
