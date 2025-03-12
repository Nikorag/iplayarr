<template>
    <SettingsPageToolbar :icons="['filter']" :filter-options="availableFilters" :selected-filter="filter" :filter-enabled="filter != 'All'" @select-filter="selectFilter"/>
    <div class="inner-content scroll-x" v-if="!loading">
        <table class="resultsTable">
            <thead>
                <tr>
                    <th>#</th>
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
                <tr v-for="result of filteredResults" v-bind:key="result.pid">
                    <td>{{ result.number }}</td>
                    <td>
                        <span :class="['pill', result.type]">
                            {{ result.type }}
                        </span>
                    </td>
                    <td class="clickable" @click="download(result)">{{ result.title }}</td>
                    <td class="clickable" @click="download(result)">{{ result.nzbName }}</td>
                    <td>{{ formatStorageSize(result.size) }}</td>
                    <td>
                        <span :class="['pill', result.channel.replaceAll(' ', '')]">
                            {{ result.channel }}
                        </span>
                    </td>
                    <td>{{ result.pid }}</td>
                    <td>
                        <font-awesome-icon :class="['clickable', result.downloading ? 'downloading' : '']" :icon="['fas', 'cloud-download']" @click="immediateDownload(result)"/>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <LoadingIndicator v-if="loading"/>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, watch, computed } from 'vue';
import { ipFetch } from '@/lib/ipFetch';
import SettingsPageToolbar from '@/components/SettingsPageToolbar.vue';
import LoadingIndicator from '@/components/LoadingIndicator.vue';
import { formatStorageSize } from '@/lib/utils';

const route = useRoute();
const router = useRouter();

const searchResults = ref([]);
const searchTerm = ref("");
const loading = ref(true);
const availableFilters = ref(['All', 'TV', 'Movie']);
const filter = ref('All');

const filteredResults = computed(() => {
    return filter.value == 'All' ? searchResults.value : searchResults.value.filter(({type}) => type == filter.value.toUpperCase());
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

const download = async(searchResult) => {
    router.push({ name : 'download', query : {json : JSON.stringify(searchResult)}});
}

const immediateDownload = async({pid, nzbName, type}) => {
    const response = await ipFetch(`json-api/download?pid=${pid}&nzbName=${nzbName}&type=${type}`);
    if (response.ok){
        router.push("/queue");
    }
}

const selectFilter = (option) => {
    filter.value = option;
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
