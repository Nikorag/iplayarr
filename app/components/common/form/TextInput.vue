<template>
    <FormField
        :name="name"
        :tooltip="tooltip"
        :error="error"
        :advanced="advanced"
        :required="required"
        :input-id="inputId"
    >
        <div class="inputWithButton">
            <input
                :id="inputId"
                v-model="localValue"
                :type="inputType"
                :placeholder="placeholder"
                :required="required"
                :disabled="disabled"
                :autocomplete="secret ? 'new-password' : 'off'"
                :aria-invalid="error ? 'true' : undefined"
                :aria-describedby="describedBy"
                spellcheck="false"
            />
            <button
                v-if="secret"
                type="button"
                class="input-addon"
                :title="revealed ? 'Hide' : 'Show'"
                :aria-label="revealed ? `Hide ${name}` : `Show ${name}`"
                :aria-pressed="revealed"
                @click="revealed = !revealed"
            >
                <font-awesome-icon :icon="['fas', revealed ? 'eye-slash' : 'eye']" />
            </button>
            <button
                v-if="copyable"
                type="button"
                class="input-addon"
                title="Copy to clipboard"
                :aria-label="`Copy ${name}`"
                @click="copy"
            >
                <font-awesome-icon :icon="['fas', copied ? 'check' : 'copy']" />
            </button>
            <button
                v-if="iconButton"
                type="button"
                class="input-addon"
                :title="buttonTooltip"
                :aria-label="buttonTooltip || `${name} action`"
                @click="emit('action')"
            >
                <font-awesome-icon :icon="['fas', iconButton]" />
            </button>
            <button
                v-if="brandButton"
                type="button"
                class="input-addon"
                :title="buttonTooltip"
                :aria-label="buttonTooltip || `${name} lookup`"
                @click="emit('action')"
            >
                <img class="brand" :src="assetUrl(`/img/${brandButton.toLowerCase()}.svg`)" alt="" />
            </button>
        </div>
    </FormField>
</template>

<script setup>
import { computed, defineEmits, defineProps, ref, useId, watch } from 'vue';

import toastService from '@/lib/toastService';
import { assetUrl } from '@/lib/utils';

import FormField from './FormField.vue';

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    tooltip: {
        type: String,
        default: undefined,
    },
    // Settings can still be loading (undefined) when the control first renders
    modelValue: {
        type: [String, Number],
        default: '',
    },
    typeOverride: {
        type: String,
        required: false,
        default: 'text',
    },
    error: {
        type: String,
        required: false,
        default: undefined,
    },
    placeholder: {
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
    // Masks the value, with a button to reveal it. Implied by type-override="password".
    secret: {
        type: Boolean,
        default: false,
    },
    // Adds a button that copies the value to the clipboard
    copyable: {
        type: Boolean,
        default: false,
    },
    iconButton: { type: String, default: undefined },
    brandButton: { type: String, default: undefined },
    buttonTooltip: { type: String, default: undefined },
});

const emit = defineEmits(['update:modelValue', 'action']);

const inputId = `field-${useId()}`;
const revealed = ref(false);
const copied = ref(false);
const secret = computed(() => props.secret || props.typeOverride === 'password');
const inputType = computed(() => (secret.value ? (revealed.value ? 'text' : 'password') : props.typeOverride));
const describedBy = computed(
    () => [props.error ? `${inputId}-error` : '', props.tooltip ? `${inputId}-hint` : ''].filter(Boolean).join(' ') || undefined
);

const copy = async () => {
    try {
        await navigator.clipboard.writeText(String(localValue.value ?? ''));
        copied.value = true;
        setTimeout(() => (copied.value = false), 1500);
    } catch {
        // Clipboard access needs a secure context (https or localhost)
        toastService.error('Unable to copy. Select the text and copy it manually.');
    }
};

const localValue = ref(props.modelValue);

watch(localValue, (newValue) => {
    emit('update:modelValue', newValue);
});

watch(
    () => props.modelValue,
    (newValue) => {
        localValue.value = newValue;
    }
);
</script>

<style lang="less">
.inputWithButton {
    display: flex;
    align-items: stretch;
    width: 100%;

    // Controls attached to the end of the input share its border and sit flush against it
    input {
        flex: 1 1 auto;
        min-width: 0;
    }

    input:not(:last-child) {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }

    .input-addon {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 35px;
        padding: 0 10px;
        margin-left: -1px;
        border: 1px solid @input-border-color;
        border-radius: 0;
        background-color: @settings-button-hover-background-color;
        color: @primary-text-color;
        cursor: pointer;

        &:last-child {
            border-radius: 0 4px 4px 0;
        }

        &:hover {
            background-color: @input-background-color;
            color: @brand-color;
        }

        &:focus-visible {
            outline: none;
            position: relative;
            border-color: @primary-color;
            box-shadow: 0 0 0 2px rgba(93, 156, 236, 0.35);
        }

        .brand {
            width: 15px;
        }

        @media (max-width: @mobile-breakpoint) {
            height: 40px;
            min-width: 44px;
        }
    }
}
</style>
