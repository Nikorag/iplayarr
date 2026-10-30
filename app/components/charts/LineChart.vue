<template>
    <apexchart type="line" height="350" :options="options" :series="series" />
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
    title: String,
    data: Object // expected as { 'YYYY-MM-DD': Number }
});


const series = computed(() => {
    const series = [
        {
            name: props.title || 'Series',
            data: Object.entries(props.data).map(([date, value]) => ({
                x: date,
                y: value
            }))
        }
    ];
    return series;
});

const options = computed(() => ({
    chart: {
        type: 'line',
        background: 'transparent',
        zoom: { enabled: false },
        toolbar: {
            show: false
        }
    },
    title: {
        text: props.title,
        style: {
            fontSize: '20px',
            color: '#ffffff'
        }
    },
    theme: {
        mode: 'dark'
    },
    xaxis: {
        type: 'datetime',
        labels: {
            style: {
                colors: '#ffffff'
            }
        }
    },
    yaxis: {
        min: 0,
        labels: {
            style: {
                colors: '#ffffff'
            }
        }
    },
    stroke: {
        curve: 'straight'
    },
    colors: ['#F12D7F'],
    tooltip: {
        theme: 'dark',
        x: {
            format: 'yyyy-MM-dd'
        }
    },
    dataLabels: {
        enabled: false
    },
    grid: {
        borderColor: '#444'
    }
}));
</script>
