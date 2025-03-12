<template>
    <SettingsPageToolbar :icons="['download']" @download="download"/>
    <MediaInfoHero :pid="searchResult.pid" :type="searchResult.type" :title="`${searchResult.title}${searchResult.episode ? ` - Series ${searchResult.series || 'Unknown'}, Episode ${searchResult.episode}` : ''}`"/>
    <div class="inner-content">
        <SettingsTextInput name="Filename" tooltip="Filename to Download as (extension will be added automatically)" v-model="searchResult.nzbName"/>
    </div>
</template>

<script setup>
import SettingsPageToolbar from '@/components/SettingsPageToolbar.vue';
import SettingsTextInput from '@/components/SettingsTextInput.vue';
import MediaInfoHero from '@/components/MediaInfoHero.vue';
import { ipFetch } from '@/lib/ipFetch';
import {watch, ref} from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const searchResult = ref({});

watch(() => route.query.json, async (newJson) => {
    searchResult.value = JSON.parse(newJson);
}, { immediate: true })


const download = async () => {
    const response = await ipFetch(`json-api/download?pid=${searchResult.value.pid}&nzbName=${searchResult.value.nzbName}&type=${searchResult.value.type}`);
    if (response.ok){
        router.push("/queue");
    }
}
</script>