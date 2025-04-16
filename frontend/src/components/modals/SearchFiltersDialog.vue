<template>
    <IPlayarrModal title="Apply Filters" :show-close="true" close-label="Close" :show-confirm="true" confirm-label="Filter" @confirm="applyFacets">
        <h2>Categories</h2>
        <ul class="facetList">
            <li class="facet" v-for="category of allFacets.categories" v-bind:key="category">
                <CheckInput v-model="appliedFacets.categories[category]"/>
                <span>{{ category }}</span>
            </li>
        </ul>

        <h2>Channels</h2>
        <ul class="facetList">
            <li class="facet" v-for="channel of allFacets.channels" v-bind:key="channel">
                <CheckInput v-model="appliedFacets.channels[channel]"/>
                <span>{{ channel }}</span>
            </li>
        </ul>

        <h2>Type</h2>
        <ul class="facetList">
            <li class="facet" v-for="type of allFacets.types" v-bind:key="type">
                <CheckInput v-model="appliedFacets.types[type]"/>
                <span>{{ type }}</span>
            </li>
        </ul>
    </IPlayarrModal>
  </template>

  <script setup>
    import CheckInput from '../common/form/CheckInput.vue';
    import IPlayarrModal from './IPlayarrModal.vue';
    import { deepCopy } from '@/lib/utils';

    import { defineProps, ref, defineEmits } from 'vue';

    const emit = defineEmits(['applyFacets']);

    const props = defineProps({
        allFacets : Object,
        initiallyApplied : Object
    });

    const appliedFacets = ref(deepCopy(props.initiallyApplied));

    const applyFacets = () => {
        emit('applyFacets', appliedFacets.value);
    }
</script>

<style lang="less" scoped>
    .facetList {
        list-style: none;

        .facet {
            display: flex;
            justify-content: flex-start;
            align-items: center;

            div {
                flex: 1
            }

            span {
                flex: 2
            }
        }
    }
</style>