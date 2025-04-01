<template>
  <IPlayarrModal title="Updating Apps" :show-close="true" close-label="Close">
    <table class="resultsTable">
      <thead>
        <tr>
          <th>App</th>
          <th>Status</th>
          <th>
            <font-awesome-icon :icon="['fas', 'book-open']" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="app of apps" :key="app.id">
          <td>
            <div class="appDisplay">
              <img class="appImg" :src="`/img/${app.type.toLowerCase()}.svg`">
              <span class="appName">
                {{ app.name }}
              </span>
            </div>
          </td>
          <td v-if="appStatus[app.id]">
            <span :class="['pill', getPillColor(appStatus[app.id].status)]">{{ appStatus[app.id].status }}</span>
          </td>
          <td v-if="appStatus[app.id]">
            {{ appStatus[app.id].message }}
          </td>
        </tr>
      </tbody>
    </table>
  </IPlayarrModal>
</template>

<script setup>
import { defineEmits, inject, onBeforeUnmount, onMounted, ref } from 'vue';

import { ipFetch } from '@/lib/ipFetch';

import IPlayarrModal from './IPlayarrModal.vue';

const apps = ref([]);
const features = ref([]);
const socket = inject('socket');

const appStatus = ref({});

const emit = defineEmits(['close'])

onMounted(async () => {
    apps.value = (await ipFetch('json-api/apps')).data;
    features.value = (await ipFetch('json-api/apps/types')).data;

    apps.value = apps.value.filter(({ type }) => features.value[type].includes('callback'));

    if (apps.value.length == 0) {
        emit('close');
        return;
    }

    appStatus.value = apps.value.reduce((acc, { id }) => {
        acc[id] = { status: 'Pending', message: '' };
        return acc;
    }, {});

    socket.value.on('app_update_status', ({ id, status, message }) => {
        appStatus.value[id] = { status, message };
    });

    ipFetch('json-api/apps/updateApiKey', 'POST', {});
});

onBeforeUnmount(() => {
    socket.value.off('app_update_status');
});

const getPillColor = (status) => {
    switch (status) {
    default:
        return 'grey';
    case 'In Progress':
        return 'error';
    case 'Complete':
        return 'success';
    case 'Error':
        return 'error';
    }
}
</script>

<style lang="less">
.resultsTable {
  max-width: 100%;
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: @table-text-color;
  margin-bottom: 2rem;

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
</style>