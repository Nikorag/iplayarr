<template>
  <table class="queueTable" summary="Hed">
    <thead>
      <tr>
        <th />
        <th>Filename</th>
        <th>Type</th>
        <th>Start</th>
        <th>Size</th>
        <th>App</th>
        <th class="progress-column">
          Progress
        </th>
        <th>ETA</th>
        <th>Speed</th>
        <th class="center">
          <font-awesome-icon :icon="['fas', 'cog']" />
        </th>
      </tr>
    </thead>
    <tbody>
      <QueueTableRow v-for="item in queue" :key="item.id" :item="item" />
      <QueueTableRow v-for="item in history" :key="item.id" :item="item" />
    </tbody>
  </table>
</template>

<script setup>
import { defineProps } from 'vue';

import QueueTableRow from './QueueTableRow.vue';

defineProps({
    queue: {
        type: Array,
        required: true
    },

    history: {
        type: Array,
        required: true
    }
});
</script>

<style lang="less">
.queueTable {
  max-width: 100%;
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: @table-text-color;

  thead {
    th {
      padding: 8px;
      text-align: left;
      font-weight: bold;
      border-bottom: 1px solid @table-border-color;
    }
  }

  tbody {
    tr {
      transition: background-color 500ms;

      &:hover {
        background-color: @table-row-hover-color;
      }
    }

    td {
      padding: 8px;
      border-top: 1px solid @table-border-color;
      line-height: 1.5;

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

  .progress-column {
    min-width: 75px;
  }
}
</style>
