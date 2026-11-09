<template>
    <div class="inner-content">
        <legend>Off Schedule</legend>
        <p>
            By default, only media broadcast in the last 30 days is returned, to extend this, you need to index specific
            iPlayer URLs
        </p>
        <ListEditor
            v-slot="{ item }"
            :items="cacheDefinitions"
            :actions="[
                ['refresh', refreshCacheDefinition, 'Refresh cache'],
                ['trash', remove, 'Delete cache definition'],
            ]"
            add-label="Add cache definition"
            @create="openForm"
        >
            <div class="major">
                {{ item.name }}
            </div>
            <div class="cacheDefinitionTarget">
                {{ item.url }}
            </div>
            <div class="cacheDefinitionTarget">
                {{ item.cacheRefreshed }}
            </div>
        </ListEditor>
        <div class="block-reset" />
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useModal } from 'vue-final-modal';
import { useRouter } from 'vue-router';

import ListEditor from '@/components/common/ListEditor.vue';
import OffScheduleForm from '@/components/modals/OffScheduleForm.vue';
import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';
import toastService from '@/lib/toastService';
import { deepCopy } from '@/lib/utils';

const cacheDefinitions = ref([]);
const router = useRouter();

const refreshCacheDefinitions = async () => {
    try {
        const response = await ipFetch('json-api/offSchedule');
        if (!response.ok) {
            throw new Error(response.data?.message || 'The server returned an error');
        }
        cacheDefinitions.value = response.data;
    } catch (err) {
        toastService.error(`Unable to load cache definitions: ${err.message || 'the server could not be reached'}`);
    }
};

onMounted(refreshCacheDefinitions);

const openForm = (cacheDef) => {
    const formModal = useModal({
        component: OffScheduleForm,
        attrs: {
            inputObj: deepCopy(cacheDef),
            action: cacheDef ? 'Edit' : 'Create',
            save: saveCacheDefinition,
            onSaved: () => {
                formModal.close();
                refreshCacheDefinitions();
            },
        },
    });
    formModal.open();
};

const remove = async ({ id }) => {
    if (
        await dialogService.confirm('Delete Cache Definition', 'Are you sure you want to delete this Cache Definition?')
    ) {
        try {
            const { ok, data } = await ipFetch('json-api/offSchedule', 'DELETE', { id });
            if (!ok) {
                toastService.error(`Failed to delete: ${data?.message ?? 'unknown error'}`);
            }
        } catch (err) {
            toastService.error(`Failed to delete: ${err.message}`);
        }
        refreshCacheDefinitions();
    }
};

// Returns the response so the form can show what went wrong and stay open until the save works
const saveCacheDefinition = (form) => ipFetch('json-api/offSchedule', form.id ? 'PUT' : 'POST', form);

const refreshCacheDefinition = async (def) => {
    if (await dialogService.confirm('Refresh Cache', `Are you sure you want to refresh the cache for ${def.name}?`)) {
        try {
            const { ok, data } = await ipFetch('json-api/offSchedule/refresh', 'POST', def);
            if (!ok) {
                toastService.error(`Failed to refresh ${def.name}: ${data?.message ?? 'unknown error'}`);
                return;
            }
        } catch (err) {
            toastService.error(`Failed to refresh ${def.name}: ${err.message}`);
            return;
        }
        if (await dialogService.confirm('Show Results?', `Show Results for ${def.name}?`)) {
            router.push(`/search?searchTerm=${def.name}`);
        }
    }
};
</script>

<style lang="less">
.cacheDefinitionTarget {
    font-size: 10px;
}
</style>
