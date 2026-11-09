<template>
    <IPlayarrModal
        :title="`${action} Cache Definition`"
        :show-close="true"
        close-label="Cancel"
        :show-confirm="true"
        confirm-label="Save"
        :confirm-loading="saving"
        :click-to-close="false"
        @confirm="submit"
    >
        <TextInput
            v-model="form.name"
            name="Search Term"
            tooltip="Search Term for the Cache Definition"
            placeholder="Red Dwarf"
            required
            :error="errors.name"
        />
        <TextInput
            v-model="form.url"
            name="URL"
            tooltip="Link to the programme's episode list on BBC iPlayer"
            placeholder="https://www.bbc.co.uk/iplayer/episodes/b008ncn6/red-dwarf"
            required
            :error="errors.url"
        />
    </IPlayarrModal>
</template>

<script setup>
import { defineEmits, defineProps, onMounted, ref, watch } from 'vue';

import { useModalForm } from '@/lib/useModalForm';

import TextInput from '../common/form/TextInput.vue';
import IPlayarrModal from './IPlayarrModal.vue';

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

    // Persists the cache definition and returns the ipFetch response ({ ok, data })
    save: {
        type: Function,
        required: true,
    },
});

const form = ref({
    id: undefined,
    name: '',
    url: '',
});

onMounted(() => {
    form.value = {
        ...form.value,
        ...props.inputObj,
    };
});

const validate = () => {
    const errors = {};
    if (!form.value.name?.trim()) errors.name = 'Enter the term to search for';
    if (!form.value.url?.trim()) {
        errors.url = 'Enter the iPlayer URL to index';
    } else if (!/^https?:\/\/.+/i.test(form.value.url.trim())) {
        errors.url = 'The URL must start with http:// or https://';
    }
    return errors;
};

const { errors, saving, submit, revalidate } = useModalForm({
    validate,
    save: () => props.save({ ...form.value, name: form.value.name.trim(), url: form.value.url.trim() }),
    onSaved: () => emit('saved'),
    failureMessage: 'The cache definition could not be saved',
});

watch(form, revalidate, { deep: true });
</script>
