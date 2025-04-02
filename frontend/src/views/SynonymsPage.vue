<template>
  <SettingsPageToolbar :icons="['arrImport']" @arr-import="openImportWizard" />
  <div class="inner-content">
    <legend>Synonyms</legend>
    <p>iPlayer don't save their videos in an *arr friendly way. You can use synonyms to help you bridge the gap</p>
    <ListEditor v-slot="{ item }" :items="synonyms" :actions="[['trash', removeSynonym]]" @create="openForm">
      <div class="major" @click="openForm(item)">
        {{ item.from }}
      </div>
      <div class="minor" @click="openForm(item)">
        {{ item.target }}
      </div>
      <div class="featureList">
        <span v-if="item.filenameOverride" :class="['pill', 'success']">
          {{ item.filenameOverride }}
        </span>
        <template v-if="item.exemptions">
          <span v-for="exemption in item.exemptions.split(',')" :key="exemption" :class="['pill', 'error']">
            {{ exemption.trim() }}
          </span>
        </template>
      </div>
    </ListEditor>
    <div class="block-reset" />
  </div>
</template>

<script setup>
import { inject } from 'vue';
import { useModal } from 'vue-final-modal'

import ListEditor from '@/components/common/ListEditor.vue';
import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';
import AppSelectDialog from '@/components/modals/AppSelectDialog.vue';
import ArrLookupDialog from '@/components/modals/ArrLookupDialog.vue';
import SynonymForm from '@/components/modals/SynonymForm.vue';
import dialogService from '@/lib/dialogService';
import { deepCopy, getCleanSceneTitle } from '@/lib/utils';

const {synonyms, refreshSynonyms, editSynonyms} = inject('synonyms');

const openForm = (synonym, inputApp) => {
    const formModal = useModal({
        component: SynonymForm,
        attrs: {
            inputObj: deepCopy(synonym),
            inputApp,
            action: synonym ? 'Edit' : 'Create',
            onSave(synonym) {
                saveSynonym(synonym);
                formModal.close();
            }
        }
    });
    formModal.open();
}

const saveSynonym = async (synonym) => {
    const method = synonym.id ? editSynonyms.update : editSynonyms.create;
    await method(synonym);
    refreshSynonyms();
}

const removeSynonym = async ({ id }) => {
    if (await dialogService.confirm('Delete Synonym', 'Are you sure you want to delete this Synonym?')) {
        await editSynonyms.delete(id);
        refreshSynonyms();
    }
}

const openImportWizard = async () => {
    const formModal = useModal({
        component: AppSelectDialog,
        attrs: {
            onSelectApp: (app) => {
                openArrItemList(app);
                formModal.close();
            },
            onClose: () => {
                formModal.close();
            }
        }
    });
    formModal.open();
}

const openArrItemList = async (app) => {
    const formModal = useModal({
        component: ArrLookupDialog,
        attrs: {
            app,
            showFilter: true,
            onError: (err) => {
                dialogService.alert(`Error from ${app.name}`, err.message);
            },
            onSelect: async (result) => {
                let options = [result.title];
                if (result.alternateTitles && result.alternateTitles.length > 0) {
                    options = [...options, ...result.alternateTitles.map(({ title }) => title)]
                }
                formModal.close();
                let from = await dialogService.select(result.title, 'Select a search Term', undefined, options);
                
                if (from !== false){
                    from = getCleanSceneTitle(from);
                    openForm({
                        from,
                        filenameOverride: result.title
                    }, app);
                }
            }
        }
    });
    formModal.open();
}
</script>

<style lang="less" scoped>
.featureList {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
}
</style>
