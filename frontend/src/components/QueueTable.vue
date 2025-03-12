<template>
  <table class='queueTable' summary='Hed'>
      <thead>
          <tr>
              <th></th>
              <th>Filename</th>
              <th>Type</th>
              <th>Start</th>
              <th>Size</th>
              <th class='progress-column'>Progress</th>
              <th>ETA</th>
              <th>Speed</th>
              <th class='center'><font-awesome-icon :icon="['fas', 'cog']" /></th>
          </tr>
      </thead>
      <tbody>
          <QueueTableRow v-for="item in queue" :key="item.id" :item="item" :history="false"/>
          <QueueTableRow v-for="item in history" :key="item.id" :item="item" :history="true"/>
      </tbody>
  </table>
</template>

<script setup>
    import QueueTableRow from './QueueTableRow.vue';

    import {defineProps} from 'vue';

    defineProps({
        queue : {
            type : Array,
            required : true
        },

        history : {
            type : Array,
            required : true
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
      }
    }

    .progress-column {
      min-width: 75px;
    }
  }
</style>
