<template>
  <div class="inner-content">
    <legend>Apps</legend>
    <p class="mb-0">
      Manage your integrations with Apps (including Arr and NZB Clients) here
    </p>
    <InfoBar clazz="warning">
      In order for NZB Forwarding to work successfully, your NZB Client needs the category "iplayer"
    </InfoBar>
    <div class="block-reset" />
    <ListEditor v-slot="{ item }" :items="apps" :actions="[['trash', deleteApp]]" @create="openForm">
      <a @click="openForm(item)">
        <div class="major">
          <img class="appImg" :src="`/img/${item.type.toLowerCase()}.svg`">
          <span class="appName">
            {{ item.name }}
          </span>
        </div>
        <div class="sub">
          {{ item.url }}
        </div>
        <div class="featureList">
          <span v-if="hasFeature(item.type, 'download_client') || hasFeature(item.type, 'prowlarr_download_client')" :class="['pill', item.download_client?.id ? 'success' : 'error']">
            Download Client
          </span>
          <span v-if="hasFeature(item.type, 'indexer') || hasFeature(item.type, 'prowlarr_indexer')" :class="['pill', item.indexer?.id ? 'success' : 'error']">
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
import { inject } from 'vue';
import { useModal } from 'vue-final-modal'

import InfoBar from '@/components/common/InfoBar.vue';
import ListEditor from '@/components/common/ListEditor.vue';
import AppForm from '@/components/modals/AppForm.vue';
import dialogService from '@/lib/dialogService';
import { deepCopy } from '@/lib/utils';

const {apps, editApps, refreshApps, types : features} = inject('apps');

const openForm = (app) => {
    const formModal = useModal({
        component: AppForm,
        attrs: {
            action: app ? 'Edit' : 'Create',
            inputObj: deepCopy(app),
            onSaved: async () => {
                formModal.close();
                await refreshApps();
            }
        }
    });
    formModal.open();
}

const deleteApp = async ({ id, name }) => {
    if (await dialogService.confirm('Delete App', `Are you sure you want to delete ${name}`, 'Indexers and Download Clients in the target Arr, will NOT be deleted')) {
        await editApps.delete(id);
        await refreshApps();
    }
}

const hasFeature = (itemType, type) => {
    return features.value[itemType] && features.value[itemType].includes(type);
}
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