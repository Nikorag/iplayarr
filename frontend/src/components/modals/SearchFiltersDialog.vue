<template>
  <IPlayarrModal title="Apply Filters" :show-close="true" close-label="Close" :show-confirm="true" confirm-label="Filter" @confirm="applyFacets">
    <template v-for="(facet, facetIndex) of facets" :key="facet.title">
      <h2>{{ facet.title }}</h2>
      <ul class="facetList">
        <li v-for="(value, valueIndex) of facet.values" :key="value" class="facet">
          <CheckInput v-model="facets[facetIndex].values[valueIndex].applied"/>
          <span>{{ value.label }} ({{ value.total }})</span>
        </li>
      </ul>
    </template>
  </IPlayarrModal>
</template>

<script setup>
import { defineEmits,defineProps, ref } from 'vue';

import { deepCopy } from '@/lib/utils';

import CheckInput from '../common/form/CheckInput.vue';
import IPlayarrModal from './IPlayarrModal.vue';

const emit = defineEmits(['applyFacets']);

const props = defineProps({
    allFacets : Object
});

const facets = ref(deepCopy(props.allFacets));

const applyFacets = () => {
    emit('applyFacets', facets.value);
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