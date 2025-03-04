<template>
    <SettingsPageToolbar :enabled="false"/>
    <div class="synonym-container">
        <legend>Synonyms</legend>
        <p>BBC don't save their videos in an *arr friendly way. You can use synonyms to help you bridge the gap</p>
        <SynonymsList @create-synonym="openForm" @remove-synonym="removeSynonym" :synonyms="synonyms"/>
        <div class="block-reset"></div>
        <SynonymForm v-if="create" @save="newSynonym"/>
    </div>
</template>

<script setup>
    import SettingsPageToolbar from '@/components/SettingsPageToolbar.vue';
    import SynonymsList from '@/components/SynonymsList.vue';
    import SynonymForm from '@/components/SynonymForm.vue';

    const host = process.env.NODE_ENV != 'production' ? `http://${window.location.hostname}:4404` : '';

    import {ref, onMounted} from 'vue';

    const create = ref(false);
    const synonyms = ref([]);

    const refreshSynonyms = async () => {
        const synonymResponse = await fetch(`${host}/json-api/synonym`);
        synonyms.value = await synonymResponse.json();
    }

    onMounted(refreshSynonyms);

    const openForm = () => {
        create.value = true;
    }

    const newSynonym = async (synonym) => {
        create.value = false;
        await fetch(`${host}/json-api/synonym`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(synonym),
        });
        refreshSynonyms();
    }

    const removeSynonym = async (id) => {
        await fetch(`${host}/json-api/synonym`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({id}),
        });
        refreshSynonyms();
    }
</script>

<style>
    .synonym-container {
        padding: 1rem;
    }
</style>