<template>
    <div class="infoBanner" :style="{'background-image' : `url(${details.thumbnail})`}">
        <div class="infoContainer">
            <h1>{{ title }}</h1>
            <div class="seriesDetails" v-if="details.category">
                <span>{{ details.runtime }} Minutes</span>
                <span>{{ details.category }}</span>
                <span>{{ details.firstBroadcast }}</span>
            </div>
            <div class="seriesDetails" v-if="details.category">
                <span :class="['pill', 'grey']">
                    <font-awesome-icon :icon="['fas', type == 'TV' ? 'tv' : 'film' ]" />
                    {{ fixCasing(type) }}
                </span>
                <span :class="['pill', 'grey']" v-if="details.channel">
                    <font-awesome-icon :icon="['fas', 'tower-broadcast']" />
                    {{ details.channel }}
                </span>
                <span :class="['pill', 'grey']" v-if="details.link">
                    <a :href="details.link" target="_blank">
                        <font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" />Link
                    </a>
                </span>
            </div>
            <div class="seriesDetails" v-if="details.category">
                <span>{{ details.description }}</span>
            </div>
            <div class="seriesDetails downloadDetails" v-if="downloadDetails.progress">
                <span><font-awesome-icon :icon="['fas', 'bars-progress']" />{{ downloadDetails.progress }}%</span>
                <span><font-awesome-icon :icon="['fas', 'flag-checkered']" />{{ downloadDetails.eta }}</span>
                <span><font-awesome-icon :icon="['fas', 'gauge']" />{{ downloadDetails.speed }}MB/s</span>
            </div>
            <LoadingIndicator v-if="!details.category"/>
        </div>
    </div>
</template>

<script setup>
    import {ref, defineProps, watch, inject, computed} from 'vue';
    import { ipFetch } from '@/lib/ipFetch';
    import LoadingIndicator from './LoadingIndicator.vue';

    const details = ref({});
    const queue = inject('queue');
    const history = inject('history');

    const props = defineProps({
        pid :{
            type : String,
            required: true
        },
        title :{
            type : String,
            required: true
        },
        type :{
            type : String,
            required: true
        }
    });

    const downloadDetails = computed(() => {
        const historyItem = history.value.find(({pid}) => pid == props.pid);
        if (historyItem) return historyItem.details;
        const queueItem = queue.value.find(({pid}) => pid == props.pid);
        if (queueItem) return queueItem.details;
        return {};
    });

    watch(() => props.pid, async (newPid) => {
        details.value = {};
        if (newPid){
            details.value = (await ipFetch(`json-api/details?pid=${newPid}`)).data;
        }
    }, {immediate : true})

    const fixCasing = (str) => {
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
</script>

<style lang="less">
    .infoBanner {
        position: relative;
        width: 100%;
        height: 325px;
        background-size: cover;
        background-position: center;

        .infoContainer {
            position: absolute;
            width: 100%;
            height: 325px;
            background-color: rgba(0,0,0,0.6);
            padding: 2rem;
            box-sizing: border-box;

            .seriesDetails {
                margin-bottom: 8px;
                font-weight: 300;
                font-size: 20px;

                span {
                    margin-right: 15px;
                }

                &.downloadDetails {
                    svg {
                        margin-right: 10px;
                    }
                }
            }
        }

        h1 {
            text-wrap: balance;
            font-weight: 300;
            font-size: 50px;
            line-height: 50px;
            margin: 0px;

            @media (max-width: @mobile-breakpoint) {
                font-size: 30px;
                line-height: 30px;
            }
        }
    }

    .pill.grey {
        padding: 3px 7px;
        font-weight: 300;
        font-size: 17px;
        background-color: @grey-pill-background-color;
        color: @primary-text-color;

        svg {
            margin-right: 3px;
        }

        margin-right: 10px !important;
    }
</style>