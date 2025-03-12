<template>
    <legend>Create Synonym</legend>
    <SettingsTextInput name="From" tooltip="Incoming term from *arr" v-model="form.from" placeholder="Apprentice UK"/>
    <SettingsTextInput name="To" tooltip="Outgoing search to iPlayer" v-model="form.target" placeholder="Apprentice"/>
    <SettingsTextInput name="Exemptions" tooltip="Exemptions (comma seperated)" v-model="form.exemptions" placeholder="You're Fired!"/>
    <div class="button-container">
        <button @click="saveSynonym">Save</button>
    </div>
</template>

<script setup>
    import SettingsTextInput from './SettingsTextInput.vue';
    import {ref, defineEmits} from 'vue';

    const emit = defineEmits(['save']);

    const form = ref({
        from : "",
        target : ""
    });

    const saveSynonym = () => {
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