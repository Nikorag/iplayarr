<template>
  <IPlayarrModal title="Apply Filters" :show-close="true" close-label="Close" :show-confirm="true" confirm-label="Filter" @confirm="applyFacets">
    <h2>Categories</h2>
    <ul class="facetList">
      <li v-for="category of allFacets.categories" :key="category" class="facet">
        <CheckInput v-model="appliedFacets.categories[category]" />
        <span>{{ category }}</span>
      </li>
    </ul>

    <h2>Channels</h2>
    <ul class="facetList">
      <li v-for="channel of allFacets.channels" :key="channel" class="facet">
        <CheckInput v-model="appliedFacets.channels[channel]" />
        <span>{{ channel }}</span>
      </li>
    </ul>

    <h2>Type</h2>
    <ul class="facetList">
      <li v-for="type of allFacets.types" :key="type" class="facet">
        <CheckInput v-model="appliedFacets.types[type]" />
        <span>{{ type }}</span>
      </li>
    </ul>
  </IPlayarrModal>
</template>

<script setup>
import { defineEmits,defineProps, ref } from 'vue';

import { deepCopy } from '@/lib/utils';

import CheckInput from '../common/form/CheckInput.vue';
import IPlayarrModal from './IPlayarrModal.vue';

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