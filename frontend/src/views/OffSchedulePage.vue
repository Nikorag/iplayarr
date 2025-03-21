<template>
  <div class="inner-content">
    <legend>Off Schedule</legend>
    <p>By default, only media broadcast in the last 30 days is returned, to extend this, you need to index specific iPlayer URLs</p>
    <ListEditor v-slot="{ item }" :items="offSchedule" :actions="[['refresh', refreshCacheDefinition], ['trash', remove]]" @create="openForm">
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
import { inject } from 'vue';
import { useModal } from 'vue-final-modal'
import { useRouter } from 'vue-router';

import ListEditor from '@/components/common/ListEditor.vue';
import OffScheduleForm from '@/components/modals/OffScheduleForm.vue';
import dialogService from '@/lib/dialogService';
import { deepCopy } from '@/lib/utils';

const router = useRouter();

const {offSchedule, deleteOffSchedule, createOffSchedule, updateOffSchedule, offScheduleRefresh} = inject('offSchedule');

const openForm = (cacheDef) => {
    const formModal = useModal({
        component: OffScheduleForm,
        attrs: {
            inputObj: deepCopy(cacheDef),
            action: cacheDef ? 'Edit' : 'Create',
            onSave: async (form, success) => {
                const result = await saveCacheDefinition(form);
                if (result) {
                    formModal.close();
                    success();
                }
            }
        }
    });
    formModal.open();
}

const remove = async ({id}) => {
    if (await dialogService.confirm('Delete Cache Definition', 'Are you sure you want to delete this Cache Definition?')) {
        await deleteOffSchedule(id);
    }
}

const saveCacheDefinition = async (form) => {
    const method = form.id ? updateOffSchedule : createOffSchedule;
    return new Promise((resolve) => {
        const response = method(form);
        if (response.ok){
            resolve(true);
        } else {
            dialogService.alert('Validation Error', response.data.invalid_fields?.url);
            resolve(false);
        }
    })
}

const refreshCacheDefinition = async (def) => {
    if (await dialogService.confirm('Refresh Cache', `Are you sure you want to refresh the cache for ${def.name}?`)) {
        await offScheduleRefresh(def);
        if (await dialogService.confirm('Cache Refreshing', 'Cache Refresh Started, Would you like to view the logs?')) {
            router.push('/logs');
        }
    }

}
</script>

<style lang="less">
.cacheDefinitionTarget {
    font-size: 10px;
}
</style>