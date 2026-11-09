<template>
    <IPlayarrModal
        :title="`${action} Synonym`"
        :show-close="true"
        close-label="Cancel"
        :show-confirm="true"
        confirm-label="Save"
        :confirm-loading="saving"
        :click-to-close="false"
        @confirm="submit"
    >
        <TextInput
            v-model="form.from"
            name="From"
            tooltip="Incoming term from *arr"
            placeholder="Apprentice UK"
            required
            icon-button="history"
            button-tooltip="Look at Search History"
            :error="errors.from"
            @action="openSearchHistory"
        />
        <TextInput
            v-model="form.target"
            name="To"
            tooltip="Outgoing search to iPlayer"
            placeholder="Apprentice"
            required
            :error="errors.target"
        />
        <TextInput
            v-model="form.filenameOverride"
            name="Filename Override"
            tooltip="Optional Text for the filename"
            placeholder="The Apprentice UK"
            :brand-button="searchApp.type ? searchApp.type : undefined"
            :button-tooltip="searchApp.type ? `Lookup on ${searchApp.name}` : ''"
            :error="errors.filenameOverride"
            @action="openArrLookup"
        />
        <TagInput
            v-model="exemptions"
            name="Exemptions"
            tooltip="Titles to leave out of the results. Press Enter or comma after each one."
            placeholder="You're Fired!"
            :error="errors.exemptions"
        />
        <TextInput
            v-model="form.seasonOffset"
            name="Season Offset"
            tooltip="Added to the season number, for shows iPlayer numbers differently (a whole number, can be negative)"
            placeholder="0"
            type-override="number"
            :error="errors.seasonOffset"
        />
    </IPlayarrModal>
</template>

<script setup>
import { computed, defineEmits, defineProps, onMounted, ref, watch } from 'vue';
import { useModal } from 'vue-final-modal';

import dialogService from '@/lib/dialogService';
import { useModalForm } from '@/lib/useModalForm';

import TagInput from '../common/form/TagInput.vue';
import TextInput from '../common/form/TextInput.vue';
import ArrLookupDialog from './ArrLookupDialog.vue';
import IPlayarrModal from './IPlayarrModal.vue';
import SearchHistoryDialog from './SearchHistoryDialog.vue';

const emit = defineEmits(['saved']);

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

    // Persists the synonym and returns the ipFetch response ({ ok, data })
    save: {
        type: Function,
        required: true,
    },
});

const form = ref({
    id: undefined,
    from: '',
    target: '',
    filenameOverride: '',
    exemptions: '',
    seasonOffset: 0,
});

const searchApp = ref({});

// Exemptions are stored as one comma separated string but edited as individual tags
const exemptions = computed({
    get: () =>
        (form.value.exemptions || '')
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean),
    set: (tags) => {
        form.value.exemptions = tags.join(',');
    },
});

onMounted(() => {
    form.value = {
        ...form.value,
        ...props.inputObj,
    };

    if (props.inputApp) {
        searchApp.value = props.inputApp;
    }
});

const validate = () => {
    const errors = {};
    if (!form.value.from?.trim()) errors.from = 'Enter the term the *arr app searches for';
    if (!form.value.target?.trim()) errors.target = 'Enter the term to search iPlayer for';
    const offset = form.value.seasonOffset;
    if (offset !== '' && offset != null && !Number.isInteger(Number(offset))) {
        errors.seasonOffset = 'The season offset must be a whole number';
    }
    return errors;
};

const buildPayload = () => {
    const payload = { ...form.value, from: form.value.from.trim(), target: form.value.target.trim() };
    payload.seasonOffset = payload.seasonOffset === '' || payload.seasonOffset == null ? 0 : Number(payload.seasonOffset);
    if (!payload.filenameOverride) {
        delete payload.filenameOverride;
    }
    return payload;
};

const { errors, saving, submit, revalidate } = useModalForm({
    validate,
    save: () => props.save(buildPayload()),
    onSaved: () => emit('saved'),
    failureMessage: 'The synonym could not be saved',
});

watch(form, revalidate, { deep: true });

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
