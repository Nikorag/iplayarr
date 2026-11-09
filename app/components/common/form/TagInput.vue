<template>
    <FormField :name="name" :tooltip="tooltip" :error="error" :advanced="advanced" :input-id="inputId">
        <div class="tag-input" @click="focusInput">
            <span v-for="tag of localValue" :key="tag" class="pill success tag-chip">
                {{ tag }}
                <button type="button" class="tag-remove" :aria-label="`Remove tag ${tag}`" @click.stop="removeTagByName(tag)">
                    <font-awesome-icon :icon="['fas', 'xmark']" />
                </button>
            </span>
            <input
                :id="inputId"
                ref="inputEl"
                v-model="tagInput"
                type="text"
                :placeholder="localValue.length ? '' : placeholder"
                :aria-describedby="tooltip ? `${inputId}-hint` : undefined"
                spellcheck="false"
                @keydown.enter.prevent="addTag"
                @keydown="onKeydown"
                @blur="addTag"
            />
        </div>
    </FormField>
</template>

<script setup>
import { defineEmits, defineExpose, defineProps, ref, useId, watch } from 'vue';

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
    modelValue: {
        type: Array,
        default: () => [],
    },
    error: {
        type: String,
        required: false,
        default: undefined,
    },
    placeholder: {
        type: String,
        default: 'Type a tag and press Enter',
    },
    advanced: {
        type: Boolean,
        required: false,
        default: false,
    },
});

const emit = defineEmits(['update:modelValue']);

const inputId = `field-${useId()}`;
const inputEl = ref(null);
const localValue = ref([...(props.modelValue ?? [])]);
const tagInput = ref('');

const update = (tags) => {
    localValue.value = tags;
    emit('update:modelValue', tags);
};

// Adds whatever has been typed, ignoring blanks and duplicates (case-insensitive, like the *arr tag API)
const addTag = () => {
    const tag = tagInput.value.trim();
    tagInput.value = '';
    if (tag && !localValue.value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
        update([...localValue.value, tag]);
    }
};

const removeTagByName = (tag) => {
    update(localValue.value.filter((t) => t !== tag));
};

const onKeydown = (event) => {
    if (event.key === ',') {
        event.preventDefault();
        addTag();
    } else if (event.key === 'Backspace' && tagInput.value === '' && localValue.value.length) {
        update(localValue.value.slice(0, -1));
    }
};

const focusInput = () => inputEl.value?.focus();

defineExpose({ addTag });

watch(
    () => props.modelValue,
    (newValue) => {
        localValue.value = [...(newValue ?? [])];
    }
);
</script>

<style lang="less">
.tag-input {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    box-sizing: border-box;
    min-height: 35px;
    padding: 3px 8px;
    border: 1px solid @input-border-color;
    border-radius: 4px;
    background-color: @input-background-color;
    box-shadow: inset 0 1px 1px @primary-box-shadow;
    cursor: text;

    &:focus-within {
        border-color: @primary-color;
        box-shadow: 0 0 0 2px rgba(93, 156, 236, 0.35);
    }

    // The nested input is borderless, the wrapper draws the field chrome
    .form-group .inputBox & input {
        flex: 1 1 80px;
        width: auto;
        min-width: 80px;
        height: 28px;
        padding: 0 4px;
        border: 0;
        background: transparent;
        box-shadow: none;

        &:focus-visible {
            box-shadow: none;
        }
    }

    .tag-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 4px 3px 8px;
        font-size: 13px;
    }

    .tag-remove {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: inherit;
        cursor: pointer;

        &:hover,
        &:focus-visible {
            background-color: rgba(0, 0, 0, 0.3);
            outline: none;
        }
    }
}
</style>
