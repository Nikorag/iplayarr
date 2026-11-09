<template>
    <div :class="['form-group', advanced ? 'advanced' : '']">
        <label v-if="name">{{ name }}</label>
        <div class="inputBox">
            <div :class="['inputWithButton', error ? 'error' : '']">
                <input v-model="localValue" :type="typeOverride" :placeholder="placeholder" />
                <button v-if="iconButton" :title="buttonTooltip" @click="emit('action')">
                    <font-awesome-icon :icon="['fas', iconButton]" />
                </button>
                <button v-if="brandButton" :title="buttonTooltip" @click="emit('action')">
                    <img class="brand" :src="`/img/${brandButton.toLowerCase()}.svg`" />
                </button>
            </div>
            <div v-if="error" class="error">
                {{ error }}
            </div>
            <div class="tooltip">
                {{ tooltip }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineEmits, defineProps, ref, watch } from 'vue';

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    tooltip: {
        type: String,
        required: true,
    },
    modelValue: {
        type: String,
        required: true,
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
    },
    advanced: {
        type: Boolean,
        required: false,
        default: false,
    },
    iconButton: String,
    brandButton: String,
    buttonTooltip: String,
});

const emit = defineEmits(['update:modelValue', 'action']);

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

        .error {
            font-size: 14px;
            color: @error-color;
        }

        .inputWithButton {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;

            button {
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                background-color: @settings-button-hover-background-color;
                border: none;
                cursor: pointer;
                padding: 9px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid @input-border-color;

                .brand {
                    width: 15px;
                }

                &:hover {
                    background-color: @input-background-color;
                }
            }

            input {
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

                input {
                    border-color: @error-color;
                }
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
