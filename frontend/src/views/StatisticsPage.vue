<template>
    <div class="inner-content">
        <legend>Server</legend>
        <div class="chartRow">
            <div class="textDisplay">
                <h2>Uptime</h2>
                <span class="textValue">
                    {{ msToTime(uptime.uptime) }}
                </span>
            </div>
            <div class="textDisplay">
                <h2>Search Cache Size</h2>
                <span class="textValue">
                    {{ cacheSizes.search }}MB
                </span>
            </div>
            <div class="textDisplay">
                <h2>Schedule Cache Size</h2>
                <span class="textValue">
                    {{ cacheSizes.schedule }}MB
                </span>
            </div>
        </div>
        <legend>Search Statistics</legend>
        <div class="chartRow">
            <PieChart :data="termSeries" title="Search Terms" />
            <PolarArea :data="appSearchSeries" title="Search Sources" />
            <LineChart :data="searchOverTimeSeries" title="Searchs" />
        </div>
        <legend>Grab Statistics</legend>
        <div class="chartRow">
            <PolarArea :data="appGrabSeries" title="Grab Sources" />
            <LineChart :data="grabOverTimeSeries" title="Grabs" />
            <PieChart :data="typeSeries" title="Grab Types" />
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

import LineChart from '@/components/charts/LineChart.vue';
import PieChart from '@/components/charts/PieChart.vue';
import PolarArea from '@/components/charts/PolarArea.vue';
import { ipFetch } from '@/lib/ipFetch';

const uptime = ref({ uptime: 0 });
const cacheSizes = ref([]);
const searchHistory = ref([]);
const grabHistory = ref([]);
const apps = ref([]);

onMounted(async () => {
    updateStats();

    setInterval(() => {
        uptime.value.uptime += 1000
    }, 1000);

    setInterval(updateStats, 180000);
});

async function updateStats() {
    searchHistory.value = (await ipFetch('json-api/stats/searchHistory')).data;
    grabHistory.value = (await ipFetch('json-api/stats/grabHistory')).data;
    apps.value = (await ipFetch('json-api/apps')).data;
    uptime.value = (await ipFetch('json-api/stats/uptime')).data;
    cacheSizes.value = (await ipFetch('json-api/stats/cacheSizes')).data;
}

const termSeries = computed(() => {
    return searchHistory.value
        .map((search) => ({ ...search, term: search.term == '*' ? 'RSS Feed' : search.term }))
        .reduce((acc, { term }) => {
            acc[term] = (acc[term] || 0) + 1;
            return acc;
        }, {})
});

const typeSeries = computed(() => {
    return grabHistory.value.reduce((acc, { type }) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {})
})

const appSearchSeries = computed(() => {
    return createAppSourceSeries(searchHistory.value)
});

const appGrabSeries = computed(() => {
    return createAppSourceSeries(grabHistory.value)
});

const searchOverTimeSeries = computed(() => {
    return createOverTimeSeries(searchHistory.value);
});

const grabOverTimeSeries = computed(() => {
    return createOverTimeSeries(grabHistory.value);
});

function createAppSourceSeries(entries) {
    return entries.reduce((acc, { appId }) => {
        let appName = 'No App';
        if (appId) {
            const app = apps.value.find(({ id }) => id == appId);
            appName = app?.name ?? 'No App';
        }
        acc[appName] = (acc[appName] || 0) + 1;
        return acc;
    }, {})
}

function createOverTimeSeries(entries) {
    // Step 1: Build date-count map
    const counts = entries
        .filter(({ time }) => time != undefined)
        .sort(({ time: timea }, { time: timeb }) => timea - timeb)
        .reduce((acc, { time }) => {
            const date = new Date(toMilliseconds(time)).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

    // Step 2: Get min and max dates
    const dates = Object.keys(counts);
    if (dates.length === 0) return {};

    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);

    // Step 3: Fill missing days with 0
    const full = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().split('T')[0];
        full[iso] = counts[iso] || 0;
    }

    return full;
}

function toMilliseconds(timestamp) {
    // If timestamp looks like seconds (less than 10^12), convert to ms
    if (timestamp < 1e12) {
        return timestamp * 1000;
    }
    // Otherwise, assume it's already milliseconds
    return timestamp;
}

function msToTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}


</script>

<style lang="less">
.chartRow {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2rem;

    >div {
        flex: 1 1 300px; // base size, but flexible
        max-width: 30%; // up to 3 in a row
        min-width: 280px;
        margin: 1rem 0;

        @media (max-width: @mobile-breakpoint) {
            max-width: 100%;
        }
&.textDisplay {
    .textValue {
        font-size: 60px;
        font-weight: 300;
    }
}
    }
}
</style>