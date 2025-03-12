<template>
    <legend>Create Cache Definition</legend>
    <SettingsTextInput name="Name" tooltip="Name for the Cache Definition" v-model="form.name" placeholder="Red Dwarf"/>
    <SettingsTextInput name="URL" tooltip="iPlayer URL" v-model="form.url" placeholder="https://www.bbc.co.uk/iplayer/episodes/b008ncn6/red-dwarf"/>
    <div class="button-container">
        <button @click="saveCacheDefinition">Save</button>
    </div>
</template>

<script setup>
    import SettingsTextInput from './SettingsTextInput.vue';
    import {ref, defineEmits} from 'vue';

    const emit = defineEmits(['save']);

    const form = ref({
        name : "",
        url : ""
    });

    const saveCacheDefinition = () => {
        emit('save', form.value);
        form.value = {
            from : "",
            target : ""
        };
    }
</script>

<style lang="less" scoped>
.button-container {
    justify-content: flex-end;
    text-align: right;
    max-width: 650px;

    button {
        background-color: @settings-button-background-color;
        border: 1px solid @settings-button-border-color;
        padding: 6px 16px;
        font-size: 14px;
        color: @primary-text-color;
        border-radius: 4px;

        &:hover {
            border-color: @settings-button-hover-border-color;;
            background-color: @settings-button-hover-background-color;
        }
    }
}
</style>