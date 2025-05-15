<template>
    <apexchart type="donut" :options="options" :series="series"></apexchart>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({ title: String, data: Object });

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
            '#BE1E5A',
            '#AA1450',
            '#E63C6E',
            '#A00546',
            '#DC2864'
        ],
        theme: {
            mode: 'dark' // Enables dark mode
        },
        labels: Object.keys(props.data),
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

const series = computed(() => {
    return Object.values(props.data)
})
</script>