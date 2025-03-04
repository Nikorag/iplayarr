<template>
    <div class="logs-content">
      <p v-if="filter.length > 0">
          Applied Filters: {{ filter.join(",")}}
      </p>
      <div>
        <label for="follow">Follow?</label>
        <input type="checkbox" id="follow" v-model="followlog"/>
      </div>
      <ul ref="logView">
          <li v-for="log in filteredLogs" :key="`${log.id}_${log.timestamp}`">
              [ {{ log.id }} ] - {{ log.timestamp }} - {{ log.message }}
          </li>
      </ul>
    </div>
</template>

<script setup>
import { inject, computed, ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';

const logs = inject('logs');
const route = useRoute();
const logView = ref(null);
const followlog = ref(true);

const filter = ref([]);

// Update filter when the route query changes
watch(() => route.query.filter, (newFilter) => {
    filter.value = newFilter ? newFilter.split(',') : [];
}, { immediate: true });

const filteredLogs = computed(() => 
    filter.value.length === 0 
        ? logs.value 
        : logs.value.filter(log => filter.value.includes(log.id))
);

const scrollToBottom = () => {
  nextTick(() => {
    if (logView.value) {
      logView.value.scrollTop = logView.value.scrollHeight;
    }
  });
};

watch(filteredLogs, () => {
    if (followlog.value) {
      scrollToBottom();
    }
}, { deep: true });

</script>

<style scoped>
.logs-content {
  padding: 1rem;
}

ul {
    list-style: none;
    font-family: monospace;
    margin-left: auto;
    margin-right: auto;
    background-color: black;
    padding: 2rem;
    line-break: loose;
    max-height: 75vh;
    overflow-y: auto;
    max-width: 80%;
}
</style>
