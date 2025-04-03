<template>
  <SettingsPageToolbar :icons="['follow', 'delete']" :follow-status="followlog" :download-details="item.details" @toggle-follow="toggleFollow" @delete-queue-item="deleteQueueItem" />
  <MediaInfoHero :title="item.nzbName" :pid="item.pid" :type="item.type" />
  <div class="inner-content">
    <LogPanel :filter="item.pid" :follow="followlog" />
  </div>
</template>

<script setup>
import { ref, watch, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import MediaInfoHero from '@/components/common/MediaInfoHero.vue';
import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';
import LogPanel from '@/components/log/LogPanel.vue';
import dialogService from '@/lib/dialogService';

const route = useRoute();
const router = useRouter();

const item = ref({});
const followlog = ref(true);
const {editQueue} = inject('queue');

watch(() => route.query.item, async (newJson) => {
    item.value = JSON.parse(newJson);
}, { immediate: true });

const toggleFollow = () => {
    followlog.value = !followlog.value
}

const deleteQueueItem = async () => {
    if (await dialogService.confirm('Cancel', 'Are you sure you want to cancel this download?')) {
        editQueue.delete(item.value.pid);
        router.push('/queue');
    }
}
</script>