<template>
    <SettingsPageToolbar
        :icons="['follow', 'filter']"
        :follow-status="followlog"
        :filter-enabled="filter != null"
        :filter-options="availableFilters"
        :selected-filter="selectedFilter"
        @toggle-follow="toggleFollow"
        @select-filter="selectFilter"
    />
    <div class="inner-content">
        <LogPanel :filter="filter" :follow="followlog" />
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';
import LogPanel from '@/components/log/LogPanel.vue';

const route = useRoute();

const followlog = ref(true);

const filter = ref(null);
const defaultAvailableFilter = ['ALL', 'INFO', 'DEBUG', 'ERROR'];
const availableFilters = ref(defaultAvailableFilter);

watch(
    () => route.query.filter,
    (newFilter) => {
        availableFilters.value = defaultAvailableFilter;
        if (newFilter) {
            availableFilters.value.push(newFilter);
            filter.value = newFilter;
        } else {
            filter.value = null;
        }
    },
    { immediate: true }
);

const selectedFilter = computed(() => {
    return filter.value == null ? 'ALL' : filter.value;
});

const toggleFollow = () => {
    followlog.value = !followlog.value;
};

const selectFilter = (option) => {
    filter.value = option == 'ALL' ? null : option;
};
</script>
