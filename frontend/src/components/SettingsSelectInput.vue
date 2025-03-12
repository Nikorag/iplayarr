<template>
    <div :class="['form-group', advanced ? 'advanced' : '']">
        <label>{{ name }}</label>
        <div :class="['inputBox', error ? 'error' : '']">
            <select v-model="localValue">
                <option v-for="option of options" v-bind:key="option.key" :value="option.key">
                    {{ option.value }}
                </option>
            </select>
            <div class="error" v-if="error">
                {{ error }}
            </div>
            <div class="tooltip">
                {{ tooltip }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    options: {
        type: Array,
        required: true
    },
    tooltip: {
        type: String,
        required: true,
    },
    modelValue: {
        type: String,
        required: true,
    },
    error: {
        type: String,
        required: false,
        default: undefined
    },
    advanced: {
        type: Boolean,
        required: false,
        default: false
    }
})

const emit = defineEmits(['update:modelValue']);

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

<style lang="less" scoped>
.form-group {
    display: flex;
    max-width: 650px;
    margin-bottom: 1rem;

    label {
        flex: 0 0 250px;
        display: flex;
        justify-content: flex-end;
        margin-right: 20px;
        padding-top: 8px;
        min-height: 35px;
        text-align: end;
        font-weight: bold;
        font-size: 14px;
        color: @table-text-color;

        @media (max-width: @mobile-breakpoint) {
            flex: 0 0 80px;
        }
    }

    .inputBox {
        flex: 1 1 auto;
        box-sizing: border-box;

        select {
            box-sizing: border-box;
            padding: 6px 16px;
            width: 100%;
            height: 35px;
            border: 1px solid @input-border-color;
            border-radius: 4px;
            background-color: @input-background-color;
            box-shadow: inset 0 1px 1px @primary-box-shadow;
            color: @input-text-color;
        }

        &.error {
            font-size: 14px;
            color: @error-color;

            select {
                border-color: @error-color;
            }
        }
    }

    .tooltip {
        font-size: 14px;
        color: @subtle-text-color;
    }

    &.advanced {
        label {
            color: @warn-color;
        }

        .tooltip {
            color: @warn-color;
        }
    }
}
</style>