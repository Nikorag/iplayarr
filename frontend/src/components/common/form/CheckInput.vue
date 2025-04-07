<template>
    <div class="CheckInput-container">
        <label class="CheckInput-label">
            <input class="CheckInput-checkbox" type="checkbox" v-model="localValue" />
            <div
                :class="{
                    'CheckInput-isChecked': localValue,
                    'CheckInput-isNotChecked': !localValue
                }"
                class="CheckInput-input">
                <font-awesome-icon :icon="['fas', 'check']" />
            </div>
        </label>
    </div>
</template>

<script setup>
import { defineProps, ref, watch, defineEmits } from 'vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true,
    }
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)

watch(localValue, (newValue) => {
    emit('update:modelValue', newValue)
})

watch(() => props.modelValue, (newVal) => {
    localValue.value = newVal
})
</script>

<style lang="less">
.CheckInput-container {
    position: relative;
    display: flex;
    flex: 1 1 65%;
    user-select: none;

    .CheckInput-label {
        display: flex;
        margin-bottom: 0;
        min-height: 21px;
        font-weight: normal;
        cursor: pointer;

        .CheckInput-checkbox {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            pointer-events: none;
        }

        .CheckInput-input {
            flex: 1 0 auto;
            margin-top: 7px;
            margin-right: 5px;
            width: 20px;
            height: 20px;
            border: 1px solid #ccc;
            border-radius: 2px;
            background-color: white;
            color: white;
            text-align: center;
            line-height: 20px;

            &.CheckInput-isChecked {
                border-color: @primary-color;
                background-color: @primary-color;
            }
        }
    }
}
</style>