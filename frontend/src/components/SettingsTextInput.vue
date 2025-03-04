<template>
    <div class="form-group">
        <label>{{ name }}</label>
        <div :class="['inputBox', error ? 'error' : '']">
            <input :type="typeOverride" v-model="localValue" :placeholder="placeholder"/>
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
        default: "text"
    },
    error: {
        type: String,
        required: false,
        default: undefined
    },
    placeholder: {
        type: String,
        required: false
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

<style scoped>
.form-group {
        display: flex;
        max-width: 650px;
        margin-bottom: 1rem;
    }

    .form-group label {
        flex: 0 0 250px;
        display: flex;
        justify-content: flex-end;
        margin-right: 20px;
        padding-top: 8px;
        min-height: 35px;
        text-align: end;
        font-weight: bold;
        font-size: 14px;
        color: rgb(204, 204, 204);
    }

    @media (max-width: 768px) {
        .form-group label {
            flex: 0 0 80px;
        }
    }

    .form-group .inputBox {
        flex: 1 1 auto;
        box-sizing: border-box;
    }
    .form-group .inputBox input {
        box-sizing: border-box;
        padding: 6px 16px;
        width: 100%;
        height: 35px;
        border: 1px solid #dde6e9;
        border-radius: 4px;
        background-color: rgb(51, 51, 51);
        box-shadow: inset 0 1px 1px rgba(0,0,0,0.075);
        color: white;
    }

    .form-group .inputBox.error input {
        border-color: red;
    }

    .form-group .tooltip {
        font-size: 14px;
        color: #909293;
    }

    .error {
        font-size: 14px;
        color: red;
    }
</style>