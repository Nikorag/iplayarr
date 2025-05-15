<template>
    <apexchart type="donut" :options="options" :series="processedData.series"></apexchart>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({ title: String, data: Object });

const MAX_ITEMS = 5;

const processedData = computed(() => {
    const entries = Object.entries(props.data)
        .sort((a, b) => b[1] - a[1]);
    const topItems = entries.slice(0, MAX_ITEMS);
    const otherSum = entries.slice(MAX_ITEMS).reduce((acc, [, val]) => acc + val, 0);

    if (otherSum > 0) {
        topItems.push(['Other', otherSum]);
    }

    return {
        labels: topItems.map(([label]) => label),
        series: topItems.map(([, val]) => val)
    };
});

const options = computed(() => {
    return {
        title: {
            text: props.title,
            align: 'center', // or 'left', 'right'
            style: {
                fontSize: '20px',
                color: '#ffffff' // Adjust for dark theme
            }
        },
        colors: [
            '#98003B',
            '#C90A5F',
            '#F12D7F',
            '#c2687b',
            '#ce8191',
            '#A6A6A6'
        ],
        theme: {
            mode: 'dark' // Enables dark mode
        },
        labels: processedData.value.labels,
        dataLabels: {
            enabled: false
        },
        chart: {
            background: 'transparent'
        },
        legend: {
            position: 'right',
            offsetY: 0,
            height: 230,
        }
    };
})
</script>