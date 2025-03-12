<template>
    <ul ref="logView">
        <li v-for="log in filteredLogs" :key="`${log.id}_${log.timestamp}`">
            <pre :class="log.level">[ {{ log.id }} ] - {{ log.timestamp }} - {{ log.message.trim() }}</pre>
        </li>
    </ul>
</template>

<script setup>
import { ref, inject, nextTick, computed, defineProps, watch } from 'vue';

const logs = inject('logs');
const logView = ref(null);

const props = defineProps({
    filter: {
        type: String,
        required: false
    },

    follow: {
        type: Boolean,
        required: true
    }
});

const filteredLogs = computed(() =>
    props.filter == null ? logs.value : logs.value.filter(log => props.filter == log.id)
);

watch(filteredLogs, () => {
    if (props.follow) {
        scrollToBottom();
    }
}, { deep: true });

const scrollToBottom = () => {
  nextTick(() => {
    if (logView.value) {
      logView.value.scrollTop = logView.value.scrollHeight;
    }
  });
};
</script>

<style lang="less" scoped>
ul {
  list-style: none;
  font-family: monospace;
  margin-left: auto;
  margin-right: auto;
  background-color: @logs-background-color;
  padding: 2rem;
  line-break: loose;
  max-height: 75vh;
  overflow-y: auto;
  max-width: 80%;

  pre {
    margin: 0px;
    white-space: pre-wrap; /* Ensure text wraps inside pre, but still scroll horizontally when necessary */
    word-wrap: break-word; /* Prevent long words from breaking the layout */

    &.INFO {
      color: @success-color;
    }

    &.DEBUG {
      color: @warn-color;
    }

    &.ERROR {
      color: @error-color;
    }
  }
}
</style>