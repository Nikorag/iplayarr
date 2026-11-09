<template>
    <SettingsPageToolbar :icons="['download']" @download="download" />
    <MediaInfoHero
        :pid="searchResult.pid"
        :type="searchResult.type"
        :title="`${searchResult.title}${searchResult.series && searchResult.episode ? ` - Series ${searchResult.series}, Episode ${searchResult.episode}` : ''}`"
        :subtitle="searchResult.episodeTitle"
    />
    <div class="inner-content">
        <TextInput
            v-model="searchResult.nzbName"
            name="Filename"
            tooltip="Filename to Download as (extension will be added automatically)"
        />
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import TextInput from '@/components/common/form/TextInput.vue';
import MediaInfoHero from '@/components/common/MediaInfoHero.vue';
import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';
import { ipFetch } from '@/lib/ipFetch';

const route = useRoute();
const router = useRouter();

const searchResult = ref({});

watch(
    () => route.query.json,
    async (newJson) => {
        searchResult.value = JSON.parse(newJson);
    },
    { immediate: true }
);

const download = async () => {
    const response = await ipFetch(
        `json-api/download?pid=${searchResult.value.pid}&nzbName=${searchResult.value.nzbName}&type=${searchResult.value.type}`
    );
    if (response.ok) {
        router.push('/queue');
    }
};
</script>
