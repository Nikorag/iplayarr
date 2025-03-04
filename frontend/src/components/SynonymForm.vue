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

<style scoped>
.button-container {
    justify-content: flex-end;
    text-align: right;
    max-width: 650px;
}

button {
    background-color: #333;
    border: 1px solid #393f45;
    padding: 6px 16px;
    font-size: 14px;
    color: white;
    border-radius: 4px;
}

button:hover {
    border-color: #5a6265;
    background-color: #444;
}
</style>