<template>
  <SettingsPageToolbar :icons="['filter', 'download']" :filter-options="availableFilters" :selected-filter="filter" :filter-enabled="filter != 'All'" @download="multipleImmediateDownload" @select-filter="selectFilter" />
  <div v-if="!loading" class="inner-content scroll-x">
    <table class="resultsTable">
      <thead>
        <tr>
          <th>
            <CheckInput v-model="allChecked" />
          </th>
          <th>Type</th>
          <th>Title</th>
          <th>Calculated Filename</th>
          <th>Est. Size</th>
          <th>Channel</th>
          <th>PID</th>
          <th>
            <font-awesome-icon :icon="['fas', 'gears']" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="result of filteredResults" :key="result.pid">
          <td>
            <CheckInput v-model="result.checked" />
          </td>
          <td>
            <span :class="['pill', result.type]">
              {{ result.type }}
            </span>
          </td>
          <td class="clickable" @click="download(result)">
            {{ result.title }}
          </td>
          <td class="clickable" @click="download(result)">
            {{ result.nzbName }}
          </td>
          <td>{{ formatStorageSize(result.size) }}</td>
          <td>
            <span :class="['pill', result.channel.replaceAll(' ', '')]">
              {{ result.channel }}
            </span>
          </td>
          <td>{{ result.pid }}</td>
          <td>
            <font-awesome-icon :class="['clickable', result.downloading ? 'downloading' : '']" :icon="['fas', 'cloud-download']" @click="immediateDownload(result)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <LoadingIndicator v-if="loading" />
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CheckInput from '@/components/common/form/CheckInput.vue';
import LoadingIndicator from '@/components/common/LoadingIndicator.vue';
import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';
import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';
import { formatStorageSize } from '@/lib/utils';

const route = useRoute();
const router = useRouter();

const searchResults = ref([]);
const searchTerm = ref('');
const loading = ref(true);
const availableFilters = ref(['All', 'TV', 'Movie']);
const filter = ref('All');
const allChecked = ref(false);

const filteredResults = computed(() => {
    return filter.value == 'All' ? searchResults.value : searchResults.value.filter(({ type }) => type == filter.value.toUpperCase());
})

watch(() => route.query.searchTerm, async (newSearchTerm) => {
    if (newSearchTerm) {
        filter.value = 'All';
        loading.value = true;
        searchResults.value = [];
        searchTerm.value = newSearchTerm;
        searchResults.value = (await ipFetch(`json-api/search?q=${searchTerm.value}`)).data;
        loading.value = false;
    }
}, { immediate: true });

const download = async (searchResult) => {
    router.push({ name: 'download', query: { json: JSON.stringify(searchResult) } });
}

const immediateDownload = async ({ pid, nzbName, type }) => {
    const response = await ipFetch(`json-api/download?pid=${pid}&nzbName=${nzbName}&type=${type}`);
    if (response.ok) {
        router.push('/queue');
    }
}

const multipleImmediateDownload = async() => {
    const selectedResults = filteredResults.value.filter((result) => result.checked);
    if (selectedResults.length > 0) {
        if (await dialogService.confirm('Download', `Do you want to download ${selectedResults.length} items?`)){
            loading.value = true;
            for (const item of selectedResults){
                await immediateDownload(item);
            }
        }
    }
}

const selectFilter = (option) => {
    filter.value = option;
}

watch(allChecked, (newValue) => {
    filteredResults.value.forEach((result) => {
        result.checked = newValue;
    });
}, { immediate: true });
</script>

<style lang="less" scoped>
.resultsTable {
    max-width: 100%;
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    color: @table-text-color;

    thead {
        th {
            padding: 8px;
            border-bottom: 1px solid @table-border-color;
            text-align: left;
            font-weight: bold;
        }
    }

    tbody {
        tr {
            transition: background-color 500ms;

            &:hover {
                background-color: @table-row-hover-color;
            }

            td {
                padding: 8px;
                border-top: 1px solid @table-border-color;
                line-height: 1.52857143;
            }
        }
    }
}

.pill {
    &.BBCOne {
        background-color: @error-color;
        border-color: @error-color;
        color: @error-text-color;
    }

    &.BBCTwo {
        background-color: @primary-color;
        border-color: @primary-color;
        color: @primary-text-color;
    }

    &.BBCThree {
        background-color: @brand-color;
        border-color: @brand-color;
        color: @primary-text-color;
    }

    &.CBeebies {
        background-color: @complete-color;
        border-color: @complete-color;
        color: @primary-text-color;
    }

    &.CBBC {
        background-color: @success-color;
        border-color: @success-color;
        color: @primary-text-color;
    }
}
</style>
