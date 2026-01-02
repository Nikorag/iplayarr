<template>
    <IPlayarrModal
        :title="`${action} Synonym`"
        :show-close="true"
        close-label="Cancel"
        :show-confirm="true"
        confirm-label="Save"
        @confirm="saveSynonym"
    >
        <TextInput
            v-model="form.from"
            name="From"
            tooltip="Incoming term from *arr"
            placeholder="Apprentice UK"
            icon-button="history"
            button-tooltip="Look at Search History"
            @action="openSearchHistory"
        />
        <TextInput v-model="form.target" name="To" tooltip="Outgoing search to iPlayer" placeholder="Apprentice" />
        <TextInput
            v-model="form.filenameOverride"
            name="Filename Override"
            tooltip="Optional Text for the filename"
            placeholder="The Apprentice UK"
            :brand-button="searchApp.type ? searchApp.type : undefined"
            :button-tooltip="searchApp.type ? `Lookup on ${searchApp.name}` : ''"
            @action="openArrLookup"
        />
        <TextInput
            v-model="form.exemptions"
            name="Exemptions"
            tooltip="Exemptions (comma separated)"
            placeholder="You're Fired!"
        />
    </IPlayarrModal>
</template>

<script setup>
import { defineEmits, defineProps, onMounted, ref } from 'vue';
import { useModal } from 'vue-final-modal';

import dialogService from '@/lib/dialogService';

import TextInput from '../common/form/TextInput.vue';
import ArrLookupDialog from './ArrLookupDialog.vue';
import IPlayarrModal from './IPlayarrModal.vue';
import SearchHistoryDialog from './SearchHistoryDialog.vue';

const emit = defineEmits(['save']);

const props = defineProps({
    inputObj: {
        type: Object,
        required: false,
        default: () => {},
    },

    action: {
        type: String,
        required: false,
        default: 'Create',
    },

    inputApp: Object,
});

const form = ref({
    id: undefined,
    from: '',
    target: '',
    exemptions: '',
});

const searchApp = ref({});

onMounted(() => {
    form.value = {
        ...form.value,
        ...props.inputObj,
    };

    if (props.inputApp) {
        searchApp.value = props.inputApp;
    }
});

const saveSynonym = () => {
    if (form.value.from && form.value.target) {
        if (form.value.filenameOverride == '') {
            delete form.value.filenameOverride;
        }
        emit('save', form.value);
        form.value = {
            id: undefined,
            from: '',
            target: '',
            exemptions: '',
            filenameOverride: undefined,
        };
    } else {
        dialogService.alert('Can\'t Save', 'Please fill in a To and From');
    }
};

const openSearchHistory = () => {
    const formModal = useModal({
        component: SearchHistoryDialog,
        attrs: {
            onSelect: ({ history, app }) => {
                form.value.from = history.term;
                searchApp.value = app || {};
                formModal.close();
            },
        },
    });
    formModal.open();
};

const openArrLookup = () => {
    const formModal = useModal({
        component: ArrLookupDialog,
        attrs: {
            app: searchApp.value,
            term: form.value.from,
            onError: (err) => {
                dialogService.alert(
                    `Error from ${searchApp.value.name}`,
                    `Unable to lookup ${form.value.from}`,
                    err.message
                );
            },
            onSelect: (result) => {
                form.value.filenameOverride = result.title;
                formModal.close();
            },
        },
    });
    formModal.open();
};
</script>
