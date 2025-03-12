<template>
    <div class="inner-content">
        <legend>Off Schedule</legend>
        <p>By default, only media broadcast in the last 30 days is returned, to extend this, you need to index specific iPlayer URLs</p>
        <OffScheduleList @create-cache-definition="openForm" @remove-cache-definition="remove" :cacheDefinitions="cacheDefinitions" @refresh-def="refreshCacheDefinition"/>
        <div class="block-reset"></div>
        <OffScheduleForm v-if="create" @save="newCacheDefinition"/>
    </div>
</template>

<script setup>
    import OffScheduleForm from '@/components/OffScheduleForm.vue';
    import OffScheduleList from '@/components/OffScheduleList.vue';
    import { ipFetch } from '@/lib/ipFetch';
    import {ref, onMounted} from 'vue';
    import { useRouter } from 'vue-router';

    const router = useRouter();

    const cacheDefinitions = ref([]);
    const create = ref(false);

    const refreshCacheDefinitions = async () => {
        cacheDefinitions.value = (await ipFetch(`json-api/offSchedule`)).data;
    }

    onMounted(refreshCacheDefinitions);

    const openForm = () => {
        create.value = true;
    }

    const remove = async (id) => {
        await ipFetch(`json-api/offSchedule`, 'DELETE', {id});
        refreshCacheDefinitions();
    }

    const newCacheDefinition = async (form) => {
        create.value = false;
        await ipFetch('json-api/offSchedule', 'POST', form);
        refreshCacheDefinitions();
    }

    const refreshCacheDefinition = async (def) => {
        if (confirm(`Are you sure you want to refresh the cache for ${def.name}?`)) {
        await ipFetch('json-api/offSchedule/refresh', 'POST', def);
        if (confirm("Cache Refresh Started, Would you like to view the logs?")) {
            router.push("/logs");
        }
    }

}
</script>