<template>
    <div :class="['form-group', { advanced, 'has-error': !!error }]">
        <label v-if="name" :for="inputId">
            {{ name }}
            <span v-if="required" class="required" aria-hidden="true">*</span>
        </label>
        <div class="inputBox">
            <slot />
            <div v-if="error" :id="`${inputId}-error`" class="field-error" role="alert">
                <font-awesome-icon :icon="['fas', 'circle-exclamation']" />
                <span>{{ error }}</span>
            </div>
            <div v-if="tooltip" :id="`${inputId}-hint`" class="tooltip">
                {{ tooltip }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
    name: { type: String, default: undefined },
    tooltip: { type: String, default: undefined },
    error: { type: String, default: undefined },
    advanced: { type: Boolean, default: false },
    required: { type: Boolean, default: false },
    // Id of the form control inside the slot, so the label and the hint/error text are associated with it
    inputId: { type: String, required: true },
});
</script>

<style lang="less">
// Shared layout for every settings/modal form control. Wide screens keep the *arr style
// right-aligned label column, narrow screens stack the label above the control.
.form-group {
    display: flex;
    max-width: 650px;
    margin-bottom: 1rem;

    > label {
        flex: 0 0 250px;
        display: flex;
        justify-content: flex-end;
        align-items: flex-start;
        gap: 4px;
        margin-right: 20px;
        padding-top: 8px;
        min-height: 35px;
        text-align: end;
        font-weight: bold;
        font-size: 14px;
        color: @table-text-color;

        .required {
            color: @error-color;
        }
    }

    .inputBox {
        flex: 1 1 auto;
        min-width: 0;
        box-sizing: border-box;

        input:not([type='checkbox']),
        select,
        textarea {
            box-sizing: border-box;
            padding: 6px 12px;
            width: 100%;
            height: 35px;
            border: 1px solid @input-border-color;
            border-radius: 4px;
            background-color: @input-background-color;
            box-shadow: inset 0 1px 1px @primary-box-shadow;
            color: @input-text-color;
            font-size: 14px;
            transition:
                border-color 150ms ease,
                box-shadow 150ms ease;

            &:hover:not(:disabled) {
                border-color: @settings-button-hover-border-color;
            }

            &:focus-visible {
                outline: none;
                border-color: @primary-color;
                box-shadow: 0 0 0 2px rgba(93, 156, 236, 0.35);
            }

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        }

        select:required:invalid {
            color: @subtle-text-color;
        }
    }

    .field-error {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin-top: 4px;
        font-size: 14px;
        color: @error-color;
    }

    .tooltip {
        margin-top: 2px;
        font-size: 14px;
        color: @subtle-text-color;
    }

    &.has-error {
        .inputBox input:not([type='checkbox']),
        .inputBox select,
        .inputBox textarea {
            border-color: @error-color;
        }
    }

    &.advanced {
        > label,
        .tooltip {
            color: @warn-color;
        }
    }

    @media (max-width: @mobile-breakpoint) {
        flex-direction: column;
        max-width: none;

        > label {
            flex: 0 0 auto;
            justify-content: flex-start;
            margin: 0 0 4px;
            padding-top: 0;
            min-height: 0;
            text-align: start;
        }

        // 16px stops iOS zooming the page when a control is focused
        .inputBox input:not([type='checkbox']),
        .inputBox select,
        .inputBox textarea {
            height: 40px;
            font-size: 16px;
        }
    }
}
</style>
