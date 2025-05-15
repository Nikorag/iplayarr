<template>
    <IPlayarrModal title="Search History" :show-close="true" close-label="Cancel">
        <table class="resultsTable">
            <thead>
                <tr>
                    <th>Search Term</th>
                    <th>Series</th>
                    <th>Episode</th>
                    <th>Results</th>
                    <th>App</th>
                    <th>
                        <font-awesome-icon :icon="['fas', 'gears']" />
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="history of searchHistory" :key="history.term">
                    <td>{{ history.term }}</td>
                    <td>{{ history.series }}</td>
                    <td>{{ history.episode }}</td>
                    <td>{{ history.results }}</td>
                    <td>
                        <template v-if="getAppForId(history.appId)">
                            <div class="appDisplay">
                                <img
                                    class="appImg"
                                    :src="`/img/${getAppForId(history.appId).type.toLowerCase()}.svg`"
                                />
                                <span class="appName">
                                    {{ getAppForId(history.appId).name }}
                                </span>
                            </div>
                        </template>
                    </td>
                    <td>
                        <a class="clickable" @click="select(history)"> Select </a>
                    </td>
                </tr>
            </tbody>
        </table>
    </IPlayarrModal>
</template>

<script setup>
import { defineEmits, onMounted, ref } from 'vue';

import { ipFetch } from '@/lib/ipFetch';

import IPlayarrModal from './IPlayarrModal.vue';

const searchHistory = ref([]);
const apps = ref([]);

const emit = defineEmits(['select']);

onMounted(async () => {
    searchHistory.value = (await ipFetch('json-api/stats/searchHistory?limit=10')).data;
    apps.value = (await ipFetch('json-api/apps')).data;
});

const getAppForId = (id) => {
    return apps.value.find(({ id: appId }) => id == appId);
};

const select = (history) => {
    emit('select', { history, app: getAppForId(history.appId) });
};
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

                .appDisplay {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    height: 30px;

                    .appImg {
                        width: 15px;
                    }
                }
            }
        }
    }
}

.floor {
    margin-top: 1rem;
}
</style>
