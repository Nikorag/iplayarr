<template>
  <SettingsPageToolbar :icons="['custom_filter', 'download']" :filter-enabled="filtersApplied" @download="multipleImmediateDownload" @show-filter="showFilter" />
  <div v-if="!loading" class="inner-content scroll-x">
    <SearchPagination :current-page="currentPage" :total-pages="searchResults.pagination.totalPages" @change-page="changePage" />
    <table class="resultsTable">
      <thead>
        <tr>
          <th>
            <CheckInput v-model="allChecked" />
          </th>
          <th>Type</th>
          <th>Title</th>
          <th>Episode</th>
          <th>Filename</th>
          <th>Est. Size</th>
          <th>Channel</th>
          <th>First Broadcast</th>
          <th>
            <font-awesome-icon :icon="['fas', 'gears']" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="result of filteredResults" :key="result.pid" class="clickable">
          <td>
            <CheckInput v-model="result.checked" />
          </td>
          <td @click="download(result)">
            <span :class="['pill', result.type]">
              {{ result.type }}
            </span>
          </td>
          <td @click="download(result)">
            {{ result.title }}
          </td>
          <td @click="download(result)">
            {{ result.episode ? `Series ${result.series}, Episode ${result.episode}` : result.episodeTitle }}
          </td>
          <td class="wrap" @click="download(result)">
            {{ result.nzbName }}
          </td>
          <td @click="download(result)">
            {{ formatStorageSize(result.size) }}
          </td>
          <td @click="download(result)">
            <span :class="['pill', result.channel.replaceAll(' ', '')]">
              {{ result.channel }}
            </span>
          </td>
          <td @click="download(result)">
            {{ formatDate(result.pubDate) }}
          </td>
          <td @click="immediateDownload(result)">
            <font-awesome-icon :class="['clickable', result.downloading ? 'downloading' : '']" :icon="['fas', 'cloud-download']" />
          </td>
        </tr>
      </tbody>
    </table>
    <SearchPagination :current-page="currentPage" :total-pages="searchResults.pagination.totalPages" @change-page="changePage" />
  </div>
  <LoadingIndicator v-if="loading" />
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useModal } from 'vue-final-modal'
import { useRoute, useRouter } from 'vue-router';

import CheckInput from '@/components/common/form/CheckInput.vue';
import LoadingIndicator from '@/components/common/LoadingIndicator.vue';
import SettingsPageToolbar from '@/components/common/SettingsPageToolbar.vue';
import SearchFiltersDialog from '@/components/modals/SearchFiltersDialog.vue';
import SearchPagination from '@/components/search/SearchPagination.vue';
import dialogService from '@/lib/dialogService';
import { ipFetch } from '@/lib/ipFetch';
import { formatDate, formatStorageSize } from '@/lib/utils';

const route = useRoute();
const router = useRouter();

const emptySearchResponse = {
    pagination: {
        page: 1,
        totalPages: 1,
        totalResults: 0
    },
    results: []
};

const searchResults = ref(emptySearchResponse);
const searchTerm = ref('');
const loading = ref(true);
const filter = ref('All');
const allChecked = ref(false);
const currentPage = ref(1);

const filteredResults = computed(() => {
    return searchResults.value.results;
});

const getAppliedFacets = (facets) => {
    return facets.reduce((acc, { title, values }) => {
        const applied = values.filter(v => v.applied).map(v => v.label);
        if (applied.length) {
            acc[title] = applied;
        }
        return acc;
    }, {});
}

watch(() => route.query.searchTerm, async (newSearchTerm) => {
    if (newSearchTerm) {
        currentPage.value = 1;
        filter.value = 'All';
        loading.value = true;
        searchResults.value = emptySearchResponse;
        searchTerm.value = newSearchTerm;
        searchResults.value = (await ipFetch(`json-api/search?page=${currentPage.value}&q=${searchTerm.value}`)).data;
        loading.value = false;
    }
}, { immediate: true });

const changePage = async (newPage) => {
    if (newPage > searchResults.value.pagination.totalPages) newPage = searchResults.value.pagination.totalPages;
    if (newPage < 1) newPage = 1;

    currentPage.value = newPage;
    loading.value = true;
    const facets = searchResults.value.facets;
    searchResults.value = emptySearchResponse;
    searchResults.value = (await ipFetch(`json-api/search?page=${currentPage.value}&q=${searchTerm.value}&facets=${JSON.stringify(getAppliedFacets(facets))}`)).data;
    searchResults.value.facets = facets;
    loading.value = false;
}

const applyFacets = async (facets) => {
    loading.value = true;
    searchResults.value = emptySearchResponse;
    searchResults.value = (await ipFetch(`json-api/search?page=${currentPage.value}&q=${searchTerm.value}&facets=${JSON.stringify(getAppliedFacets(facets))}`)).data;
    searchResults.value.facets = facets;
    loading.value = false;
}

const download = async (searchResult) => {
    router.push({ name: 'download', query: { json: JSON.stringify(searchResult) } });
}

const immediateDownload = async ({ pid, nzbName, type }) => {
    const response = await ipFetch(`json-api/download?pid=${pid}&nzbName=${nzbName}&type=${type}`);
    if (response.ok) {
        router.push('/queue');
    }
}

const multipleImmediateDownload = async () => {
    const selectedResults = filteredResults.value.filter((result) => result.checked);
    if (selectedResults.length > 0) {
        if (await dialogService.confirm('Download', `Do you want to download ${selectedResults.length} items?`)) {
            loading.value = true;
            for (const item of selectedResults) {
                await immediateDownload(item);
            }
        }
    }
}

watch(allChecked, (newValue) => {
    filteredResults.value.forEach((result) => {
        result.checked = newValue;
    });
}, { immediate: true });

const showFilter = () => {
    const formModal = useModal({
        component: SearchFiltersDialog,
        attrs: {
            allFacets: searchResults.value.facets,
            onApplyFacets: (facets) => {
                applyFacets(facets);
                formModal.close();
            }
        }
    });
    formModal.open();
}
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
                
                &.wrap {
                  word-break: break-word;
                }
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
