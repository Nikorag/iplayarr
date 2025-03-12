<template>
    <SettingsPageToolbar :icons="['follow', 'delete']" @toggle-follow="toggleFollow" :follow-status="followlog" :download-details="item.details" @delete-queue-item="deleteQueueItem"/>
    <MediaInfoHero :title="item.nzbName" :pid="item.pid" :type="item.type"/>
    <div class="inner-content">
        <LogPanel :filter="item.pid" :follow="followlog" />
    </div>
</template>

<script setup>
import SettingsPageToolbar from '@/components/SettingsPageToolbar.vue';
import { ipFetch } from '@/lib/ipFetch';
import { useRoute, useRouter } from 'vue-router';
import { ref, watch } from 'vue';
import MediaInfoHero from '@/components/MediaInfoHero.vue';
import LogPanel from '@/components/LogPanel.vue';

const route = useRoute();
const router = useRouter();

const item = ref({});
const followlog = ref(true);

watch(() => route.query.item, async (newJson) => {
    item.value = JSON.parse(newJson);
}, { immediate: true });

const toggleFollow = () => {
  followlog.value = !followlog.value
}

const deleteQueueItem = async () => {
    if (confirm("Are you sure you want to cancel this download?")) {
        ipFetch(`json-api/queue?pid=${item.value.pid}`, 'DELETE');
        router.push("/queue");
    }
}
</script>