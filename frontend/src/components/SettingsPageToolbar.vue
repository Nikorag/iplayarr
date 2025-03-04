<template>
    <div class="SettingsPageToolbar">
        <button class="SettingsPageToolbar-button clickable" @click="save" :disabled="!enabled">
            <font-awesome-icon :icon="['fas', 'floppy-disk']" />
            <div class="SettingsPageToolbar-label">
                {{enabled ? 'Save' : 'No'}} Changes
            </div>
        </button>
    </div>
</template>

<script setup>
    import { defineEmits, defineProps } from 'vue';

    const emit = defineEmits(['save']);

    defineProps({
        enabled : {
            type : Boolean,
            requiered: true
        }
    })

    const save = () => {
        emit('save');
    }
</script>

<style>
    .SettingsPageToolbar {
        height: 60px;
        background-color: rgb(38, 38, 38);
    }

    .SettingsPageToolbar-button {
        padding-top: 4px;
        min-width: 60px;
        width: min-content;
        text-align: center;
        background-color: rgba(0, 0, 0, 0);
        border: 0px;
        height: 100%;
    }

    .SettingsPageToolbar:hover svg {
        color: rgb(225, 31, 119);
    }

    .SettingsPageToolbar-button svg {
        color: rgb(153, 153, 153);
        height: 21px;
    }

    .SettingsPageToolbar-label {
        color: rgb(229, 229, 229);
        font-size: 11px;
    }
</style>