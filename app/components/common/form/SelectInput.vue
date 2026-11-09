<template>
    <FormField
        :name="name"
        :tooltip="tooltip"
        :error="error"
        :advanced="advanced"
        :required="required"
        :input-id="inputId"
    >
        <select
            :id="inputId"
            v-model="localValue"
            :required="required"
            :disabled="disabled"
            :aria-invalid="error ? 'true' : undefined"
            :aria-describedby="describedBy"
        >
            <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
            <option v-for="option of options" :key="option.key" :value="option.key">
                {{ option.value }}
            </option>
        </select>
    </FormField>
</template>

<script setup>
import { computed, defineEmits, defineProps, ref, useId, watch } from 'vue';

import FormField from './FormField.vue';

const props = defineProps({
    name: {
        type: String,
        default: undefined,
    },
    options: {
        type: Array,
        required: true,
    },
    tooltip: {
        type: String,
        default: undefined,
    },
    // Settings can still be loading (undefined) when the control first renders
    modelValue: {
        type: [String, Boolean, Number],
        default: '',
    },
    // Shown (and not selectable) while nothing has been chosen yet
    placeholder: {
        type: String,
        default: undefined,
    },
    error: {
        type: String,
        required: false,
        default: undefined,
    },
    advanced: {
        type: Boolean,
        required: false,
        default: false,
    },
    required: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update:modelValue']);

const inputId = `field-${useId()}`;
const describedBy = computed(
    () => [props.error ? `${inputId}-error` : '', props.tooltip ? `${inputId}-hint` : ''].filter(Boolean).join(' ') || undefined
);

const localValue = ref(props.modelValue);

watch(localValue, (newValue) => {
    // Find the original 'key' and use its value, preserving type
    const option = props.options.find((o) => String(o.key) === String(newValue));
    emit('update:modelValue', option ? option.key : newValue);
});

watch(
    () => props.modelValue,
    (newValue) => {
        localValue.value = newValue;
    }
);
</script>
