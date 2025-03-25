<template>
  <IPlayarrModal :show-close="true" close-label="Cancel" title="Lookup">
    <LoadingIndicator v-if="loading" />
    <div v-if="!loading" class="arrLookup">
      <TextInput v-if="showFilter" v-model="filterText" placeholder="Filter" />
      <table class="resultsTable">
        <thead>
          <tr>
            <th>Result</th>
            <th>
              <font-awesome-icon :icon="['fas', 'gears']" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result of computedResults" :key="result.id">
            <td>{{ result.title }}</td>
            <td>
              <a class="clickable" @click="emit('select', result)">
                Select
              </a>
            </td>
          </tr>
        </tbody>
      </table>
      <template v-if="results.length == 0">
        <p>No Results Found</p>
      </template>
    </div>
  </IPlayarrModal>
</template>

<script setup>
import { computed, defineEmits, defineProps, onMounted, ref } from 'vue';

import { ipFetch } from '@/lib/ipFetch';

import TextInput from '../common/form/TextInput.vue';
import LoadingIndicator from '../common/LoadingIndicator.vue';
import IPlayarrModal from './IPlayarrModal.vue';

const results = ref([]);
const emit = defineEmits(['select', 'error'])
const props = defineProps({ app: Object, term: String, showFilter: { type: Boolean, required: false, default: false } });
const loading = ref(true);
const filterText = ref('');

onMounted(async () => {
    const response = await ipFetch(`json-api/synonym/lookup/${props.app.id}${props.term ? `?term=${props.term}` : ''}`);
    if (response.ok) {
        results.value = response.data;
        loading.value = false;
    } else {
        emit('error', response.data);
    }
});

const computedResults = computed(() => {
    if (filterText.value) {
        return results.value.filter(({ title }) => title.toLowerCase().includes(filterText.value.toLowerCase()));
    } else {
        return results.value;
    }
})
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