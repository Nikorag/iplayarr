<template>
    <div class="inner-content">
        <legend>Synonyms</legend>
        <p>BBC don't save their videos in an *arr friendly way. You can use synonyms to help you bridge the gap</p>
        <SynonymsList @create-synonym="openForm" @remove-synonym="removeSynonym" :synonyms="synonyms"/>
        <div class="block-reset"></div>
        <SynonymForm v-if="create" @save="newSynonym"/>
    </div>
</template>

<script setup>
    import SynonymsList from '@/components/SynonymsList.vue';
    import SynonymForm from '@/components/SynonymForm.vue';

    import {ref, onMounted} from 'vue';
    import { ipFetch } from '@/lib/ipFetch';

    const create = ref(false);
    const synonyms = ref([]);

    const refreshSynonyms = async () => {
        synonyms.value = (await ipFetch(`json-api/synonym`)).data;
    }

    onMounted(refreshSynonyms);

    const openForm = () => {
        create.value = true;
    }

    const newSynonym = async (synonym) => {
        create.value = false;
        await ipFetch('json-api/synonym', 'POST', synonym);
        refreshSynonyms();
    }

    const removeSynonym = async (id) => {
        await ipFetch(`json-api/synonym`, 'DELETE', {id});
        refreshSynonyms();
    }
</script>